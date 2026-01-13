// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

const id = "___dl:bg:img";
const idCopy = "__cp:bg:img";
const idDisplay = "__dpl:bg:img";
const ID = "__bgimgdwlndr";

const isPictureUrl = url => {
  if (!url || typeof url !== "string") return false;

  const imageExtRegex =
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|heic|avif|ico)(\?|#|$)/i;

  const queryHintRegex =
    /(dst-jpg|dst-jpeg|dst-png|dst-webp|format=jpe?g|format=png|format=webp)/i;

  const localhostRegex =
    /^((http|https)?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?\/.*\.(jpg|jpeg|png|gif|webp|svg|bmp|heic|avif|ico)(\?|#|$)/i;

  return (
    imageExtRegex.test(url) ||
    queryHintRegex.test(url) ||
    localhostRegex.test(url)
  );
};

const defaultDownloadMenu = {
  title: chrome.i18n.getMessage("download"),
  contexts: ["all", "page", "link", "frame"],
  enabled: false
};

const defaultCopyMenu = {
  title: chrome.i18n.getMessage("copy"),
  contexts: ["all", "page", "link", "frame"],
  enabled: false
};

const defaultDisplayMenu = {
  title: chrome.i18n.getMessage("display"),
  contexts: ["all", "page", "link", "frame"],
  enabled: false
};

const lastImageByTabId = new Map();

const handleInstalled = () => {
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

chrome.runtime.onInstalled.addListener(handleInstalled);

const handleClicked = (info, tab) => {
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
};

const handleConnect = port => {
  if (port.name === ID) {
    const run = msg => {
      try {
        const { backgroundImageSrc } = msg;
        const tabId = port.sender?.tab?.id || null;
        const enabled = backgroundImageSrc && isPictureUrl(backgroundImageSrc);

        if (enabled) {
          if (typeof tabId === "number") {
            lastImageByTabId.set(tabId, backgroundImageSrc);
          }

          chrome.contextMenus.update(id, {
            title: chrome.i18n.getMessage("download"),
            contexts: ["all", "page", "link", "frame"],
            enabled
          });

          chrome.contextMenus.update(idCopy, {
            title: chrome.i18n.getMessage("copy"),
            contexts: ["all", "page", "link", "frame"],
            enabled
          });

          chrome.contextMenus.update(idDisplay, {
            title: chrome.i18n.getMessage("display"),
            contexts: ["all", "page", "link", "frame"],
            enabled
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
        return;
      }
    };

    port.onMessage.addListener(run);
    port.onDisconnect.addListener(disconnection => {
      port.onMessage.removeListener(run);
    });
  }
};

chrome.contextMenus.onClicked.addListener(handleClicked);

chrome.runtime.onConnect.addListener(handleConnect);
