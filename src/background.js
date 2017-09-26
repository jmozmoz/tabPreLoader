const defaultSettings = {
    leftOffset: 1,
    rightOffset: 2,
    preloadGracePeriode: 5,
    debugLog: true
}

var currentSettings;


function updateTab(tab) {
  if (currentSettings.debugLog) {
    console.log('reload tab: ', tab.index);
  }
  var updating = browser.tabs.reload(tab.id,
    {
    }
  );
}

function debugLog(msg) {
  if (currentSettings.debugLog) {
    console.log(msg);
  }
}

function findNeighbours(senderID, tabs) {

  var sender;
  var status;

  for (var tab of tabs) {
    if (tab.id == senderID) {
      sender = tab;
      status = tab.status;
      break;
    }
  }

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
      debugLog('senderID: ' + senderID);


      var getAlarm = browser.alarms.get(senderID.toString());
      getAlarm.then((alarm) => {
        debugLog('alarm ' + JSON.stringify(alarm));
        if (typeof alarm == 'undefined') {
          if (status == 'complete') {
            debugLog('load immediately ' + senderID.toString());
            browser.alarms.create(senderID.toString(), {
              delayInMinutes: 1.0/60.0 * 0.1
              });
          } else {
            debugLog('delayed load ' + senderID.toString());
            browser.alarms.create(senderID.toString(), {
              delayInMinutes: 1.0/60.0 * currentSettings.preloadGracePeriode
            });
          }
        } else {
          debugLog('reload already initiated ' + JSON.stringify(alarm));
        }
      })

    })
//    .catch(()=> {
//      console.log("Error retrieving stored settings");
//    });
}

function handleAlarm(alarmInfo) {
  console.log("on alarm: " + alarmInfo.name);

  var sender;

  var querying = browser.tabs.query({currentWindow: true});
  querying.then((tabs) => {

    for (var tab of tabs) {
      if (tab.id == alarmInfo.name) {
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
            debugLog('tab neighbor!');
  //            debugLog('tab: ', tab);
            debugLog('tab discarded: ' + tab.discarded);
            debugLog('tab url: ' + tab.url);

            if (tab.discarded) {
                debugLog('immediate reload: ' + tab.index);
                updateTab(tab)
            }
      }
    }
  });
}

browser.alarms.onAlarm.addListener(handleAlarm);

browser.tabs.onActivated.addListener(function (activeInfo){
  var querying = browser.tabs.query({currentWindow: true});
  var senderID = activeInfo.tabId;
  querying.then(findNeighbours.bind(null, senderID));
  });
