let dbnc = false;

const ID = "__bgimgdwlndr";

const debounce =
  (func, duration) =>
  (...args) => {
    if (dbnc === false) {
      dbnc = true;
      func(...args);
      setTimeout(() => {
        dbnc = false;
      }, duration);
    }
  };

const kill = a => {
  setTimeout(() => {
    try {
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
    }
  }, 200);
};

const displayImage = url => {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("target", "_blank");
    a.click();
    kill(a);
  } catch (e) {
    console.error(e);
    alert(chrome.i18n.getMessage("uri_error"));
  }
};

const getBackgroundImageSrc = url => {
  // Match url() with double quotes, single quotes, or no quotes
  const match = url.match(/url\(['"]?([^'")\s]+)['"]?\)/);
  if (match && match[1]) {
    return match[1];
  }
  // Fallback to original logic if regex fails
  const snippetUrl = url
    .substring(url.indexOf('url("'), url.indexOf('")'))
    .replace(/(url\(\"|\"\))/gm, "");
  return snippetUrl;
};

const getImgSrcFromPrevNodes = e => {
  try {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const arr = elements.filter(
      i => i.tagName.toLocaleLowerCase() === "img" && !!i.src
    );
    if (!arr.length) return null;
    const { src } = arr[0];
    return src;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const getBackgroundSrcFromPrevNodes = e => {
  try {
    const elements = [
      ...document.elementsFromPoint(e.clientX, e.clientY),
      document.body
    ];

    const arr = elements
      .map(element => getComputedStyle(element))
      .filter(
        style =>
          style &&
          ((style.backgroundImage && style.backgroundImage !== "none") ||
            (style.background && style.background.indexOf("url(") > -1))
      );

    if (!arr.length) return null;

    const { backgroundImage, background } = arr[0];

    return getBackgroundImageSrc(
      backgroundImage && backgroundImage !== "none"
        ? backgroundImage
        : background
    );
  } catch (e) {
    return null;
  }
};

let currentElement = null;
let port = null;

const connectToRuntime = () => {
  try {
    if (!chrome.runtime) {
      console.error("Chrome runtime not available");
      return null;
    }

    const newPort = chrome.runtime.connect({ name: ID });

    newPort.onDisconnect.addListener(() => {
      console.log("Port disconnected, will reconnect on next send");
      port = null;
    });

    return newPort;
  } catch (e) {
    console.error("Failed to connect:", e);
    return null;
  }
};

let readyStateCheckInterval = setInterval(function () {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);

    // Initial connection
    port = connectToRuntime();
    if (!port) return;

    const onMessage = message => {
      if (!message) return;
      const { action, image } = message;
      switch (action) {
        case "copy": {
          navigator.clipboard.writeText(image);
          break;
        }
        case "display": {
          displayImage(image);
          break;
        }
      }
    };

    port.onMessage.addListener(onMessage);
    chrome.runtime.onMessage.addListener(onMessage);

    const send = backgroundImageSrc => {
      try {
        // Reconnect if port is disconnected
        if (!port) {
          port = connectToRuntime();
        }

        if (port) {
          port.postMessage({
            backgroundImageSrc
          });
        }
      } catch (e) {
        console.error("Failed to send message:", e);
        port = null;
      }
    };

    const handleMove = e => {
      try {
        currentElement = e.srcElement || document.body;
        const style = getComputedStyle(currentElement);
        let backgroundImageSrc = null;
        if (style?.backgroundImage && style.backgroundImage !== "none") {
          backgroundImageSrc = getBackgroundImageSrc(style.backgroundImage);
        } else if (style?.background?.indexOf("url(") > -1) {
          backgroundImageSrc = getBackgroundImageSrc(style.background);
        } else {
          backgroundImageSrc = getBackgroundSrcFromPrevNodes(e);
          if (!backgroundImageSrc) {
            backgroundImageSrc = getImgSrcFromPrevNodes(e);
          }
        }
        send(backgroundImageSrc);
      } catch (e) {
        console.error("ERROR: ", e);
      }
    };

    document.addEventListener("mousemove", debounce(handleMove, 50));
  }
}, 10);
