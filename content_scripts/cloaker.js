(() => {
  setInterval(implementInitialLoad, 1000);

  if (window.hasRun) {
    return;
  }

  window.hasRun = true;

  const CLOAK_CLASS = "cloaker-cloak";
  const HOVER_CLASS = "show-hover";
  const OVELRAY_ID = "cloaker-overlay";

  let currEl = null;
  let cloakerActive = false;

  function idAllElements(ids, func) {
    genIdAndTraverse(document.documentElement, ids, func);
  }

  async function genIdAndTraverse(elem, ids, func) {
    if (isContainerElement(elem)) {
      let elemId = elem.id;
      if (elem.id === "") {
        elemId = await generateIdHash(elem);
        elem.setAttribute("id", elemId);
      }
      if (ids.filter((id) => id === elemId).length) {
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
    while (elem && !isContainerElement(elem)) {
      elem = elem.parentElement;
    }
    return elem;
  }

  function isContainerElement(elem) {
    return (
      elem &&
      (elem.tagName.toUpperCase() === "DIV" ||
        elem.tagName.toUpperCase() === "ASIDE")
    );
  }

  async function generateIdHash(elem) {
    const clone = elem.cloneNode(true);
    clone.innerHTML = "";

    const parentClone = elem.parentElement.cloneNode(true);
    parentClone.innerHTML = "";

    let stringToHash =
      clone.outerHTML +
      (parentClone ? parentClone.outerHTML : "") +
      getElemPositionFromParent(elem) +
      "|" +
      elem.parentElement.children.length;
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
    if (currEl) {
      let elem = currEl;
      let storage = await browser.storage.local.get();
      storage[window.location.hostname].push(elem.id);
      browser.storage.local.set(storage);

      elem.classList.add(CLOAK_CLASS);
    }
  }

  function leaveCloak(e) {
    currEl = null;
    document.querySelectorAll(`.${HOVER_CLASS}`).forEach((e) => {
      e.classList.remove(HOVER_CLASS);
    });
  }

  function applyHover(e) {
    document.querySelectorAll(`.${HOVER_CLASS}`).forEach((e) => {
      if (e !== currEl) {
        e.classList.remove(HOVER_CLASS);
      }
    });
    let elem = getElemAtPos(document.body, e.clientX, e.clientY);
    console.log(elem);
    elem = getContainerElement(elem);
    if (elem) {
      elem.classList.add(HOVER_CLASS);
      currEl = elem;
    }
  }

  function getElemAtPos(elem, x, y) {
    //Check to see if the function exists, meaning that it even has a client rectangle to observe
    let candidateElem = elem;
    let scrollX = x - window.scrollX;
    let scrollY = y - window.scrollY;
    if (elem.children.length > 0) {
      for (let pos in elem.children) {
        let child = elem.children[pos];
        if (
          child.id !== OVELRAY_ID &&
          child.getBoundingClientRect &&
          child.checkVisibility &&
          child.checkVisibility()
        ) {
          let rect = child.getBoundingClientRect();
          if (isBounded(rect, x, y)) {
            candidateElem = getElemAtPos(child, x, y);
          }
          //If an element wasn't found at the real x and y postion, check the scroll adjusted position
          if (candidateElem === elem) {
            if (isBounded(rect, scrollX, scrollY)) {
              candidateElem = getElemAtPos(child, x, y);
            }
          }
        }
      }
    }
    return candidateElem;
  }

  function isBounded(rect, x, y) {
    return rect.top < y && rect.bottom > y && rect.right > x && rect.left < x;
  }

  async function digestMessage(message) {
    if (message.command === "cloak" && !cloakerActive) {
      let cloak = document.createElement("div");
      cloak.setAttribute("id", OVELRAY_ID);
      cloak.addEventListener("mouseout", leaveCloak);
      document.body.append(cloak);
      document.addEventListener("click", digestClick);
      document.addEventListener("mousemove", applyHover);
      cloakerActive = true;
    } else if (message.command === "uncloak" && cloakerActive) {
      document.getElementById(OVELRAY_ID).remove();
      document.removeEventListener("click", digestClick);
      document.removeEventListener("mousemove", applyHover);
      cloakerActive = false;
    } else if (message.command === "load") {
      let storage = await browser.storage.local.get();
      if (!storage || !storage[window.location.hostname]) {
        let storage = {};
        storage[window.location.hostname] = [];
        browser.storage.local.set(storage);
      }
      modifyKnownElements(storage, message.command);
    } else if (message.command === "clear") {
      let storage = {};
      storage[window.location.hostname] = [];
      browser.storage.local.set(storage);
      document.querySelectorAll(`.${CLOAK_CLASS}`).forEach((elem) => {
        elem.classList.remove(CLOAK_CLASS);
      });
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
        elem.classList[command === "cloak" ? "add" : "remove"](CLOAK_CLASS);
      });
    }
  }

  browser.runtime.onMessage.addListener(digestMessage);
})();
