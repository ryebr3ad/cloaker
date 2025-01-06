function listenForCloakingStrategy() {
  document.addEventListener("click", (e) => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "cloak",
      });
    });
  });
}

function loadInitialBlockedElements() {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, {
      command: "load",
    });
  });
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs
  .executeScript({ file: "/content_scripts/cloaker.js" })
  .then(loadInitialBlockedElements)
  .then(listenForCloakingStrategy);
