function listenForCloakingStrategy() {
  document.addEventListener("click", (e) => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "cloak",
      });
    });
  });
}

//The intent here is to trigger the window into accessing storage to get the list of IDs it needs to block out of the gate
function loadInitialBlockedElements() {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    browser.tabs.sendMessage(tabs[0].id, {
      command: "load",
    });
  });
}

browser.tabs
  .executeScript({ file: "/content_scripts/cloaker.js" })
  .then(loadInitialBlockedElements)
  .then(listenForCloakingStrategy);
