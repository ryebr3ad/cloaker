(() => {
  if (window.hasRun) {
    return;
  }

  window.hasRun = true;
  window.isCloaked = false;

  function getContainerElement(elem) {
    //bubble up to the closest div element
    while (
      elem.localName.toUpperCase() !== "DIV" &&
      elem.localName.toUpperCase() !== "ASIDE"
    ) {
      elem = elem.parentElement;
    }
    return elem;
  }

  async function digestClick(e) {
    let elem = getContainerElement(e.target);
    const clone = elem.cloneNode(true);
    clone.innerHTML = "";
    const textAsBuffer = new TextEncoder().encode(clone.outerHTML);
    const hashBuffer = await window.crypto.subtle.digest(
      "SHA-256",
      textAsBuffer
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
      .map((item) => item.toString(16).padStart(2, "0"))
      .join("");
    if (elem.id === "") {
      elem.id = hash;
    }
    elem.style["visibility"] = "hidden";
    let storage = await browser.storage.local.get();
    storage[window.location.hostname].push(hash);
    console.log(storage);
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
    }
  }

  browser.runtime.onMessage.addListener(digestMessage);
})();
