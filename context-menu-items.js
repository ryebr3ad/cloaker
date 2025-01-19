function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
}

browser.menus.create(
  {
    id: "separator-1",
    type: "separator",
    contexts: ["all"],
  },
  onCreated
);

browser.menus.create(
  {
    id: "toggle-cloaker",
    title: "Toggle Cloaker",
    contexts: ["all"],
  },
  onCreated
);

browser.menus.create(
  {
    id: "disable-cloaker",
    title: "Disable Cloaker",
    contexts: ["all"],
  },
  onCreated
);

browser.menus.create(
  {
    id: "make-all-visible",
    title: "Make All Visible",
    contexts: ["all"],
  },
  onCreated
);

browser.menus.onClicked.addListener((info, tab) => {
  console.log(browser.tabs);
  switch (info.menuItemId) {
    case "toggle-cloaker":
      browser.tabs.sendMessage(tab.id, {
        command: "cloak",
      });
      break;
    case "disable-cloaker":
      browser.tabs.sendMessage(tab.id, {
        command: "uncloak",
      });
      break;
    case "make-all-visible":
      browser.tabs.sendMessage(tab.id, {
        command: "clear",
      });
      break;
  }
});
