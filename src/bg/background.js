// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

const id = "___dl:bg:img";
const idCopy = "__cp:bg:img";
const defaultDownloadMenu = {
  title: chrome.i18n.getMessage("download"),
  contexts: ["page"],
  onclick: () => {},
  enabled: false
};
const defaultCopyMenu = {
  title: chrome.i18n.getMessage("copy"),
  contexts: ["page"],
  onclick: () => {},
  enabled: false
};
chrome.contextMenus.create({
  id,
  ...defaultDownloadMenu
});
chrome.contextMenus.create({
  id: idCopy,
  ...defaultCopyMenu
});

chrome.runtime.onConnect.addListener(port => {
  console.log(port);
  if (port.name === "__bgimgdwlndr") {
    const run = msg => {
      try {
        const { backgroundImageSrc } = msg;
        if (backgroundImageSrc) {
          chrome.contextMenus.update(id, {
            title: chrome.i18n.getMessage("download"),
            contexts: ["page"],
            onclick: () => {
              if (backgroundImageSrc) {
                port.postMessage({
                  download: backgroundImageSrc,
                  open: false
                });
              }
            },
            enabled: true
          });
          chrome.contextMenus.update(idCopy, {
            title: chrome.i18n.getMessage("copy"),
            contexts: ["page"],
            onclick: () => {
              if (backgroundImageSrc) {
                port.postMessage({
                  copy: backgroundImageSrc,
                  open: false
                });
              }
            },
            enabled: true
          });
        } else {
          chrome.contextMenus.update(id, defaultDownloadMenu);
          chrome.contextMenus.update(idCopy, defaultCopyMenu);
        }
      } catch (e) {
        console.log(e);
      }
    };
    port.onMessage.addListener(run);
    port.onDisconnect.addListener(disconnection => {
      port.onMessage.removeListener(run);
    });
  }
});
