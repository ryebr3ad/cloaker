(() => {
  if (window.hasRun) {
    return;
  }

  window.hasRun = true;
  window.isCloaked = false;

  function idAllElements(ids, func) {
    console.log("idAllElements called");
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
    let elem = getContainerElement(e.target);
    elem.style["visibility"] = "hidden";
    let storage = await browser.storage.local.get();
    storage[window.location.hostname].push(elem.id);
    browser.storage.local.set(storage);
  }

  function highlightElement(e) {
    e.target.classList.add("show-hover");
    let parEl = e.target.parentElement;
    while (parEl !== null) {
      parEl.classList.remove("show-hover");
      parEl = parEl.parentElement;
    }
  }

  function leaveElement(e) {
    e.target.classList.remove("show-hover");
  }

  async function digestMessage(message) {
    if (message.command === "cloak") {
      if (!window.isCloaked) {
        window.isCloaked = true;
        document.addEventListener("click", digestClick);
        document.addEventListener("mouseover", highlightElement);
        document.addEventListener("mouseout", leaveElement);
      } else {
        window.isCloaked = false;
        document.removeEventListener("click", digestClick);
        document.removeEventListener("mouseover", highlightElement);
        document.removeEventListener("mouseout", leaveElement);
      }
    } else if (message.command === "load") {
      window.console.log("executing 'load'");
      let storage = await browser.storage.local.get();
      if (!storage || !storage[window.location.hostname]) {
        let storage = {};
        storage[window.location.hostname] = [];
        browser.storage.local.set(storage);
      }
      cloakKnownElements(storage);
    }
  }

  async function cloakKnownElements(storage) {
    let ids = storage[window.location.hostname];
    idAllElements(ids, (elem) => {
      elem.style["visibility"] = "hidden";
    });
  }

  browser.runtime.onMessage.addListener(digestMessage);
})();
