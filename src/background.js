const defaultSettings = {
    leftOffset: 1,
    rightOffset: 2,
    preloadGracePeriode: 5,
    debugLog: true
}

var _currentSettings = null;

function setupListeners() {

  // this will do the reload
  browser.alarms.onAlarm.addListener(handleAlarm);

  // make sure settings are initalized
  browser.storage.local.get().then((storedSettings) => {
    if (Object.keys(storedSettings).length === 0) {
      browser.storage.local.set(defaultSettings);
      _currentSettings = defaultSettings;
    } else {
      _currentSettings = storedSettings;
    }
    console.log("settings: " + JSON.stringify(_currentSettings));
  });

  // get changes in settings
  browser.storage.onChanged.addListener(changes => {
    browser.storage.local.get().then((storedSettings) => {
      if (Object.keys(storedSettings).length === 0) {
        browser.storage.local.set(defaultSettings);
        _currentSettings = defaultSettings;
      } else {
        _currentSettings = storedSettings;
      }
      _debugLog("settings: " + JSON.stringify(_currentSettings));
    });
  });

  // check for discarded neighbors, if tab is activated
  browser.tabs.onActivated.addListener(function (activeInfo){
    var querying = browser.tabs.query({currentWindow: true});
    var senderID = activeInfo.tabId;
    querying.then(
        findNeighbours.bind(null, senderID)
    );
  });
}

function  findNeighbours (senderID, tabs) {
  var sender;
  var status;

  for (var tab of tabs) {
    if (tab.id == senderID) {
      sender = tab;
      status = tab.status;
      break;
    }
  }

  _debugLog('senderID: ' + senderID);

  var getAlarm = browser.alarms.get(senderID.toString());
  getAlarm.then((alarm) => {
    _debugLog('alarm ' + JSON.stringify(alarm));
    if (typeof alarm == 'undefined') {
      if (status == 'complete') {
        _debugLog('load immediately ' + senderID.toString());
        browser.alarms.create(senderID.toString(), {
          delayInMinutes: 1.0/60.0 * 0.1
          });
      } else {
        _debugLog('delayed load ' + senderID.toString());
        browser.alarms.create(senderID.toString(), {
          delayInMinutes: 1.0/60.0 * _currentSettings.preloadGracePeriode
        });
      }
    } else {
      _debugLog('reload already initiated ' + JSON.stringify(alarm));
    }
  });
}

function updateTab(tab) {
  var gettingInfo = browser.runtime.getPlatformInfo();
  gettingInfo.then(function(info) {
    _debugLog('reload tab: ' + tab.index);
    _debugLog('android: ' + info.os);

    if (info.os == "android") {
      var updating = browser.tabs.reload(tab.id, {bypassCache: true});
    } else {
      var updating = browser.tabs.reload(tab.id, {});
    }
  }
  );
}

function _debugLog(msg) {
  if (_currentSettings.debugLog) {
    console.log(msg);
  }
}

function handleAlarm(alarmInfo) {
  _debugLog("on alarm: " + alarmInfo.name);

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
            ((tab.index - sender.index) >= -_currentSettings.leftOffset) &&
            ((tab.index - sender.index) <= _currentSettings.rightOffset)
          ) &&
          (tab.index != sender.index)
      ) {
        _debugLog('tab neighbor!');
        _debugLog('tab discarded: ' + tab.discarded);
        _debugLog('tab url: ' + tab.url);

        if (tab.discarded) {
            _debugLog('immediate reload: ' + tab.index);
            updateTab(tab)
        }
      }
    }
  });
}

setupListeners();
