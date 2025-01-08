function listenForCloakingStrategy() {
  document.addEventListener("click", (e) => {
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "cloak",
      });
    });
  });
}

browser.tabs.getCurrent().then(listenForCloakingStrategy);
