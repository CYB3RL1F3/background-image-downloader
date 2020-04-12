// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

const id = "___dl:bg:img";
const idCopy = "__cp:bg:img";
const idDisplay = "__dpl:bg:img";

const isValidPicUrl = url =>
  /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|webp)/gim.test(url);

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
const defaultDisplayMenu = {
  title: chrome.i18n.getMessage("display"),
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
chrome.contextMenus.create({
  id: idDisplay,
  ...defaultDisplayMenu
});

chrome.runtime.onConnect.addListener(port => {
  if (port.name === "__bgimgdwlndr") {
    const run = msg => {
      try {
        const { backgroundImageSrc } = msg;
        if (backgroundImageSrc && isValidPicUrl(backgroundImageSrc)) {
          chrome.contextMenus.update(id, {
            title: chrome.i18n.getMessage("download"),
            contexts: ["page"],
            onclick: () => {
              if (backgroundImageSrc) {
                chrome.downloads.download({
                  url: backgroundImageSrc
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
                  image: backgroundImageSrc,
                  action: "copy"
                });
              }
            },
            enabled: true
          });
          chrome.contextMenus.update(idDisplay, {
            title: chrome.i18n.getMessage("display"),
            contexts: ["page"],
            onclick: () => {
              if (backgroundImageSrc) {
                port.postMessage({
                  image: backgroundImageSrc,
                  action: "display"
                });
              }
            },
            enabled: true
          });
        } else {
          chrome.contextMenus.update(id, defaultDownloadMenu);
          chrome.contextMenus.update(idCopy, defaultCopyMenu);
          chrome.contextMenus.update(idDisplay, defaultDisplayMenu);
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
