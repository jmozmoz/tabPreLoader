const defaultSettings = {
    leftOffset: 1,
    rightOffset: 2,
    preloadGracePeriode: 5,
    debugLog: true
}

var _currentSettings = null;
var _tabActivated = {};
var _tabTimerCounter = {};


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
        tabActivated
    );
  });
}

function tabActivated() {
  var sender;
  var status;

  browser.tabs.query({currentWindow: true, active: true}).then(
  (tabs) => {
    senderID = tabs[0].id;
    status = tabs[0].status;
    _debugLog('senderID: ' + senderID);
    var senderIDstr = senderID.toString();

    if (!_tabActivated.hasOwnProperty(senderIDstr)) {
      _tabActivated[senderIDstr] = true;
      _debugLog('check alarm for senderID: ' + senderID);

      var getAlarm = browser.alarms.get(senderIDstr);
      getAlarm.then((alarm) => {
        _debugLog('alarm ' + JSON.stringify(alarm));
        if (typeof alarm == 'undefined') {
          if (status == 'complete') {
            _tabTimerCounter[senderIDstr] = parseInt(_currentSettings.preloadGracePeriode) * 0.5;
            _debugLog('load immediately ' + senderIDstr);
            browser.alarms.create(senderIDstr, {
              delayInMinutes: 1.0/60.0 * 0.1
              });
          } else {
            _debugLog('delayed load ' + senderIDstr);
            _tabTimerCounter[senderIDstr] = 1;
            browser.alarms.create(senderIDstr, {
              delayInMinutes: 1.0/60.0
            });
          }
        } else {
          _debugLog('reload already initiated ' + JSON.stringify(alarm));
        }
      });
      }
    }
  );
}

function reloadTab(tab) {
  var gettingInfo = browser.runtime.getPlatformInfo();
  gettingInfo.then(function(info) {
    _debugLog('reload tab: ' + tab.index);
    _debugLog('os: ' + info.os);

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
  senderID = alarmInfo.name;
  browser.tabs.get(parseInt(senderID)).then(
    (sender) => {
      _debugLog('status of senderID after alarm: ' + sender.status);
      _debugLog('timecounter after alarm: ' + _tabTimerCounter[senderID]);
      _debugLog('grace periode: ' + _currentSettings.preloadGracePeriode);

      if (_tabTimerCounter[senderID] >= parseInt(_currentSettings.preloadGracePeriode)) {
        findAllNeighbours(senderID);
      }
      else {
        _tabTimerCounter[senderID] = _tabTimerCounter[senderID] + 1;

        if (sender.status == 'complete' ||
            (_tabTimerCounter[senderID] >= parseInt(_currentSettings.preloadGracePeriode) * 0.5)) {
          findNeighbours(senderID, 1, 1);
        }

        browser.alarms.create(senderID, {
          delayInMinutes: 1.0/60.0
        });
      }
    }
  );
}

function findAllNeighbours(senderID) {

  _debugLog('findAllNeighbours');

  var clearAlarm = browser.alarms.clear(senderID);
  clearAlarm.then();

  findNeighbours(senderID,
      parseInt(_currentSettings.leftOffset),
      parseInt(_currentSettings.rightOffset));

}


function findNeighbours(senderID, leftOffset, rightOffset) {

  _debugLog('findNeighbours: ' + leftOffset + ", " + rightOffset);

  var querying = browser.tabs.query({currentWindow: true});
  querying.then((tabs) => {

    browser.tabs.get(parseInt(senderID)).then(
      (sender) => {
        _debugLog('status of senderID after alarm at reload: ' + sender.status);
        for (var tab of tabs) {
          if ((
                ((tab.index - sender.index) >= -leftOffset) &&
                ((tab.index - sender.index) <= rightOffset)
              ) &&
              (tab.index != sender.index)
          ) {
            _debugLog('tab neighbor!');
            _debugLog('tab discarded: ' + tab.discarded);
            _debugLog('tab url: ' + tab.url);

            if (tab.discarded) {
                _debugLog('immediate reload: ' + tab.index);
                reloadTab(tab);
            }
          }
        }
      }
    );
  });
}


setupListeners();
