const defaultSettings = {
    leftOffset: 1,
    rightOffset: 2,
    preloadGracePeriode: 5,
    debugLog: false
}

var currentSettings;

function onCreated(n) {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
}

function updateTab(tab) {
  if (currentSettings.debugLog) {
    console.log('reload tab: ', tab.index);
  }
  var updating = browser.tabs.reload(tab.id,
    {
    }
  );
}

function findNeighbours(senderID, tabs) {
  var sender;

  // get the current settings, then...
  browser.storage.local.get()
    .then((storedSettings) => {
      if (Object.keys(storedSettings).length === 0) {
        browser.storage.local.set(defaultSettings);
        currentSettings = defaultSettings;
      } else {
        currentSettings = storedSettings;
      }

      console.log("settings: ", currentSettings);
      if (currentSettings.debugLog) {
        console.log('senderID: ', senderID);
      }

      for (var tab of tabs) {
        if (tab.id == senderID) {
          sender = tab;
          break;
        }
      }

      for (var tab of tabs) {
        if ((
              ((tab.index - sender.index) >= -currentSettings.leftOffset) &&
              ((tab.index - sender.index) <= currentSettings.rightOffset)
            ) &&
            (tab.index != sender.index)
        ) {
              if (currentSettings.debugLog) {
                console.log('tab neighbor!');
                console.log('tab: ', tab);
                console.log('tab discarded: ', tab.discarded);
                console.log('tab url: ', tab.url);
              }
              if (tab.discarded) {
                  updateTab(tab);
              }
        }
      }

    })
    .catch(()=> {
      console.log("Error retrieving stored settings");
    });
}

browser.tabs.onActivated.addListener(function (activeInfo){
  var querying = browser.tabs.query({currentWindow: true});
  var senderID = activeInfo.tabId;
  querying.then(findNeighbours.bind(null, senderID));
  });
