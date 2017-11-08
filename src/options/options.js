function TabPreloaderOptions() {
  this.setupStateAndListeners();
}


TabPreloaderOptions.prototype = {
  setupStateAndListeners() {
    this._setupNumberOption("leftOffset", "leftOffset");
    this._setupNumberOption("rightOffset", "rightOffset");
    this._setupNumberOption("preloadGracePeriode", "preloadGracePeriode");
    this._setupCheckboxOption("debugLog", "debugLog");
  },
  _setupNumberOption(numberId, optionName) {
    const number = document.getElementById(numberId);
    browser.storage.local.get({
      [optionName]: 1
    }).then(prefs => {
      number.value = prefs[optionName];
    });
    number.addEventListener("change", e => {
      browser.storage.local.set({
        [optionName]: e.target.value
      });
    });
  },
  _setupCheckboxOption(checkboxId, optionName) {
    const checkbox = document.getElementById(checkboxId);
    browser.storage.local.get({
      [optionName]: false
    }).then(prefs => {
      checkbox.checked = prefs[optionName];
    });

    checkbox.addEventListener("change", e => {
      browser.storage.local.set({
        [optionName]: e.target.checked
      });
    });
  },
};

new TabPreloaderOptions();
