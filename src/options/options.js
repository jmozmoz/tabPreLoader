function saveOptions(e) {
  e.preventDefault();
  browser.storage.local.set({
    leftOffset: document.querySelector("#leftOffset").value
  });
  browser.storage.local.set({
    rightOffset: document.querySelector("#rightOffset").value
  });
  browser.storage.local.set({
    preloadGracePeriode: document.querySelector("#preloadGracePeriode").value
  });
  browser.storage.local.set({
    debugLog: document.querySelector("#debugLog").value
  });
}

function restoreOptions() {

  function setPreloaderParameters(result) {
    document.querySelector("#leftOffset").value = result.leftOffset || 1;
    document.querySelector("#rightOffset").value = result.rightOffset || 2;
    document.querySelector("#preloadGracePeriode").value = result.preloadGracePeriode || 5;
    document.querySelector("#debugLog").value = result.debugLog || true;
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var getting = browser.storage.local.get("color");
  getting.then(setPreloaderParameters, onError);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);