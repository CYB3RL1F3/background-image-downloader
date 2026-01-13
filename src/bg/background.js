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
  enabled: false
};

const defaultCopyMenu = {
  title: chrome.i18n.getMessage("copy"),
  contexts: ["page"],
  enabled: false
};

const defaultDisplayMenu = {
  title: chrome.i18n.getMessage("display"),
  contexts: ["page"],
  enabled: false
};

const lastImageByTabId = new Map();

const createMenus = () => {
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
};

chrome.runtime.onInstalled.addListener(() => {
  createMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || typeof tab.id !== "number") return;
  const backgroundImageSrc = lastImageByTabId.get(tab.id);
  if (!backgroundImageSrc) return;

  if (info.menuItemId === id) {
    chrome.downloads.download({
      url: backgroundImageSrc
    });
    return;
  }

  if (info.menuItemId === idCopy || info.menuItemId === idDisplay) {
    chrome.tabs.sendMessage(tab.id, {
      image: backgroundImageSrc,
      action: info.menuItemId === idCopy ? "copy" : "display"
    });
  }
});

chrome.runtime.onConnect.addListener(port => {
  if (port.name === "__bgimgdwlndr") {
    const run = msg => {
      try {
        const { backgroundImageSrc } = msg;
        const tabId = port.sender && port.sender.tab ? port.sender.tab.id : null;
        if (backgroundImageSrc && isValidPicUrl(backgroundImageSrc)) {
          if (typeof tabId === "number") {
            lastImageByTabId.set(tabId, backgroundImageSrc);
          }
          chrome.contextMenus.update(id, {
            title: chrome.i18n.getMessage("download"),
            contexts: ["page"],
            enabled: true
          });
          chrome.contextMenus.update(idCopy, {
            title: chrome.i18n.getMessage("copy"),
            contexts: ["page"],
            enabled: true
          });
          chrome.contextMenus.update(idDisplay, {
            title: chrome.i18n.getMessage("display"),
            contexts: ["page"],
            enabled: true
          });
        } else {
          if (typeof tabId === "number") {
            lastImageByTabId.delete(tabId);
          }
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
