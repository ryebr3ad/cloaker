(() => {
  if (window.hasRun) {
    return;
  }

  window.hasRun = true;

  const cloakerOverlay = `
  <div id="cloaker-overlay"> 
  </div>
  `;

  let currEl = null;

  function idAllElements(ids, func) {
    genIdAndTraverse(document.documentElement, ids, func);
  }

  async function genIdAndTraverse(elem, ids, func) {
    if (isContainerElement(elem) && elem.id === "") {
      let genId = await generateIdHash(elem);
      elem.setAttribute("id", genId);
      if (ids.filter((id) => id === genId).length) {
        func(elem);
      }
    }
    if (elem.children.length > 0) {
      for (let child of elem.children) {
        genIdAndTraverse(child, ids, func);
      }
    }
  }

  function getContainerElement(elem) {
    //bubble up to the closest container element
    while (!isContainerElement(elem)) {
      elem = elem.parentElement;
    }
    return elem;
  }

  function isContainerElement(elem) {
    return (
      elem.tagName.toUpperCase() === "DIV" ||
      elem.tagName.toUpperCase() === "ASIDE"
    );
  }

  async function generateIdHash(elem) {
    const clone = elem.cloneNode(true);
    clone.innerHTML = "";
    let stringToHash = clone.outerHTML + getElemPositionFromParent(elem);
    const textAsBuffer = new TextEncoder().encode(stringToHash);
    const hashBuffer = await window.crypto.subtle.digest(
      "SHA-256",
      textAsBuffer
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((item) => item.toString(16).padStart(2, "0")).join("");
  }

  function getElemPositionFromParent(elem) {
    const children = elem.parentElement.children;
    let i = 0;
    for (i; i < children.length; i++) {
      if (children[i] === elem) return i;
    }
    return -1;
  }

  async function digestClick(e) {
    let elem = currEl;
    elem.style["visibility"] = "hidden";
    let storage = await browser.storage.local.get();
    storage[window.location.hostname].push(elem.id);
    browser.storage.local.set(storage);
    currEl = null;
  }

  function leaveCloak(e) {
    currEl = null;
    document.querySelectorAll(".show-hover").forEach((e) => {
      e.classList.remove("show-hover");
    });
  }

  function applyHover(e) {
    document.querySelectorAll(".show-hover").forEach((e) => {
      if (e !== currEl) {
        e.classList.remove("show-hover");
      }
    });
    let elem = getElemAtPos(document.body, e.pageX, e.pageY);
    elem = getContainerElement(elem);
    elem.classList.add("show-hover");
    currEl = elem;
  }

  function getElemAtPos(elem, x, y) {
    //Check to see if the function exists, meaning that it even has a client rectangle to observe
    let candidateElem = elem;
    if (elem.children.length > 0) {
      for (let pos in elem.children) {
        let child = elem.children[pos];
        if (child.id !== "cloaker-overlay" && child.getBoundingClientRect) {
          let rect = child.getBoundingClientRect();
          if (
            rect.top < y &&
            rect.bottom > y &&
            rect.right > x &&
            rect.left < x
          ) {
            candidateElem = getElemAtPos(child, x, y);
          }
        }
      }
    }
    return candidateElem;
  }

  async function digestMessage(message) {
    if (message.command === "cloak") {
      let cloak = document.createElement("div");
      cloak.setAttribute("id", "cloaker-overlay");
      cloak.addEventListener("mouseout", leaveCloak);
      document.body.append(cloak);
      document.addEventListener("click", digestClick);
      document.addEventListener("mousemove", applyHover);
    } else if (message.command === "uncloak") {
      document.getElementById("cloaker-overlay").remove();
      document.removeEventListener("click", digestClick);
      document.removeEventListener("mousemove", applyHover);
    } else if (message.command === "load" || message.command === "clear") {
      let storage = await browser.storage.local.get();
      if (!storage || !storage[window.location.hostname]) {
        let storage = {};
        storage[window.location.hostname] = [];
        browser.storage.local.set(storage);
      }
      modifyKnownElements(storage, message.command);
      if (message.command === "clear") {
        let storage = {};
        storage[window.location.hostname] = [];
        browser.storage.local.set(storage);
      }
    }
  }

  async function implementInitialLoad() {
    let storage = await browser.storage.local.get();
    if (!storage || !storage[window.location.hostname]) {
      let storage = {};
      storage[window.location.hostname] = [];
      browser.storage.local.set(storage);
    }
    modifyKnownElements(storage);
  }

  async function modifyKnownElements(storage, command = "cloak") {
    let ids = storage[window.location.hostname];
    if (ids) {
      idAllElements(ids, (elem) => {
        elem.style["visibility"] = command === "cloak" ? "hidden" : "visible";
      });
    }
  }

  browser.runtime.onMessage.addListener(digestMessage);

  setInterval(implementInitialLoad, 1000);
})();
