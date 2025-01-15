function listenForCloakingStrategy() {
  function cloak(tabs) {
    browser.tabs.insertCSS({ code: "" }).then(() => {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "cloak",
      });
    });
  }

  function uncloak(tabs) {
    browser.tabs.removeCSS({ code: "" }).then(() => {
      browser.tabs.sendMessage(tabs[0].id, {
        command: "uncloak",
      });
    });
  }

  function clearMemory(tabs) {
    browser.tabs.sendMessage(tabs[0].id, {
      command: "clear",
    });
  }

  document.addEventListener("click", (e) => {
    if (e.target.id === "start-button") {
      browser.tabs.query({ active: true, currentWindow: true }).then(cloak);
    }

    if (e.target.id === "end-button") {
      browser.tabs.query({ active: true, currentWindow: true }).then(uncloak);
    }

    if (e.target.id === "clear-memory") {
      browser.tabs
        .query({ active: true, currentWindow: true })
        .then(clearMemory);
    }
  });
}

browser.tabs.getCurrent().then(listenForCloakingStrategy);
