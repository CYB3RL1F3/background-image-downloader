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

const downloadImage = async url => {
  try {
    const filename = url.split("/").pop();
    const content = await fetch(url);
    const blob = await content.blob();
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.setAttribute("download", filename);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
      } catch (e) {
        console.log(e);
      }
    }, 100);
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

const getBackgroundSrcFromPrevNodes = e => {
  try {
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const arr = elements.filter(
      i =>
        i.style &&
        (i.style.backgroundImage ||
          (i.style.background && i.style.background.indexOf("url(" > -1)))
    );
    if (!arr.length) return null;
    const { backgroundImage, background } = arr[0].style;
    return getBackgroundImageSrc(backgroundImage || background);
  } catch (e) {
    console.log(e);
    return null;
  }
};

let currentElement = null;
let readyStateCheckInterval = setInterval(function() {
  if (document.readyState === "complete") {
    clearInterval(readyStateCheckInterval);
    const port = chrome.runtime.connect({ name: "__bgimgdwlndr" });
    const run = message => {
      if (!!message.download) {
        downloadImage(message.download);
      }
      if (!!message.copy) {
        navigator.clipboard.writeText(message.copy);
      }
    };
    port.onMessage.addListener(run);
    const send = backgroundImageSrc => {
      port.postMessage({
        backgroundImageSrc
      });
    };
    document.addEventListener(
      "mousemove",
      debounce(e => {
        try {
          if (!!e.srcElement && e.srcElement === currentElement) return; // optim
          currentElement = e.srcElement;
          const { style } = currentElement;
          let backgroundImageSrc = null;
          if (style && style.backgroundImage) {
            backgroundImageSrc = getBackgroundImageSrc(style.backgroundImage);
          } else if (
            style &&
            style.background &&
            style.background.indexOf("url(") > -1
          ) {
            backgroundImageSrc = getBackgroundImageSrc(style.background);
          } else {
            backgroundImageSrc = getBackgroundSrcFromPrevNodes(e);
          }
          send(backgroundImageSrc);
        } catch (e) {
          console.log(e);
        }
      }, 150)
    );
  }
}, 10);

console.log("background image extension is up");
