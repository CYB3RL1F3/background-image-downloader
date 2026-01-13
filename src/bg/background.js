// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

const id = "___dl:bg:img";
const idCopy = "__cp:bg:img";
const idDisplay = "__dpl:bg:img";
const ID = "__bgimgdwlndr";

const isPictureUrl = url =>
  /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|webp|gif|svg|bmp)/gim.test(
    url
  ) ||
  /localhost:\d+([/|.|\w|\s|-])*\.(?:jpg|gif|png|jpeg|webp|gif|svg|bmp)/gim.test(
    url
  );

const defaultDownloadMenu = {
  title: chrome.i18n.getMessage("download"),
  contexts: ["page", "link", "frame"],
  enabled: false
};

const defaultCopyMenu = {
  title: chrome.i18n.getMessage("copy"),
  contexts: ["page", "link", "frame"],
  enabled: false
};

const defaultDisplayMenu = {
  title: chrome.i18n.getMessage("display"),
  contexts: ["page", "link", "frame"],
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
        console.log("MSG => ", msg);
        const { backgroundImageSrc } = msg;
        const tabId = port.sender?.tab?.id || null;
        const enabled = backgroundImageSrc && isPictureUrl(backgroundImageSrc);
        console.log("ENABLED => ", enabled, backgroundImageSrc);

        if (enabled) {
          console.log("TABID => ", tabId);
          if (typeof tabId === "number") {
            lastImageByTabId.set(tabId, backgroundImageSrc);
          }

          console.log("Updating context menus to enabled...");
          chrome.contextMenus.update(
            id,
            {
              title: chrome.i18n.getMessage("download"),
              contexts: ["page", "link", "frame"],
              enabled
            },
            () => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Error updating download menu:",
                  chrome.runtime.lastError
                );
              } else {
                console.log("Download menu updated successfully");
              }
            }
          );

          chrome.contextMenus.update(
            idCopy,
            {
              title: chrome.i18n.getMessage("copy"),
              contexts: ["page", "link", "frame"],
              enabled
            },
            () => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Error updating copy menu:",
                  chrome.runtime.lastError
                );
              }
            }
          );

          chrome.contextMenus.update(
            idDisplay,
            {
              title: chrome.i18n.getMessage("display"),
              contexts: ["page", "link", "frame"],
              enabled
            },
            () => {
              if (chrome.runtime.lastError) {
                console.log(
                  "Error updating display menu:",
                  chrome.runtime.lastError
                );
              }
            }
          );
        } else {
          if (typeof tabId === "number") {
            lastImageByTabId.delete(tabId);
          }

          chrome.contextMenus.update(id, defaultDownloadMenu);
          chrome.contextMenus.update(idCopy, defaultCopyMenu);
          chrome.contextMenus.update(idDisplay, defaultDisplayMenu);
        }
      } catch (e) {
        console.log("ERROR => ", e);
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
