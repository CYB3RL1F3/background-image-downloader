let dbnc = false;

const debounce = (func, duration) => (...args) => {
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
      console.log(e);
    }
  }, 100);
};

const displayImage = url => {
  try {
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("target", "_blank");
    a.click();
    kill(a);
  } catch (e) {
    console.log(e);
    alert(chrome.i18n.getMessage("uri_error"));
  }
};

const getBackgroundImageSrc = url => {
  const snippetUrl = url
    .substring(url.indexOf('url("'), url.indexOf('")'))
    .replace(/(url\(\"|\"\))/gm, "");
  return snippetUrl;
};

const getImgSrcFromPrevNodes = e => {
  try {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const arr = elements.filter(i => i.tagName === "img" && !!i.src);
    if (!arr.length) return null;
    const { src } = arr[0];
    return src;
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getBackgroundSrcFromPrevNodes = e => {
  try {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
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
    console.log(e);
    return null;
  }
};

let currentElement = null;
let currentUrl = null;
let readyStateCheckInterval = setInterval(function () {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);
    const port = chrome.runtime.connect({ name: "__bgimgdwlndr" });
    const onMessage = message => {
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
      port.postMessage({
        backgroundImageSrc
      });
    };

    document.addEventListener(
      "mousemove",
      debounce(e => {
        try {
          if (!e.srcElement && e.srcElement === currentElement && currentUrl)
            return;
          currentElement = e.srcElement;
          const style = getComputedStyle(currentElement);
          let backgroundImageSrc = null;
          if (
            style &&
            style.backgroundImage &&
            style.backgroundImage !== "none"
          ) {
            backgroundImageSrc = getBackgroundImageSrc(style.backgroundImage);
          } else if (
            style &&
            style.background &&
            style.background.indexOf("url(") > -1
          ) {
            backgroundImageSrc = getBackgroundImageSrc(style.background);
          } else {
            backgroundImageSrc = getBackgroundSrcFromPrevNodes(e);
            if (!backgroundImageSrc) {
              backgroundImageSrc = getImgSrcFromPrevNodes(e);
            }
          }
          currentUrl = backgroundImageSrc;
          send(backgroundImageSrc);
        } catch (e) {
          console.log("ERROR: ", e);
        }
      }, 100)
    );
  }
}, 10);

console.log("background image extension is up");
