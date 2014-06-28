const simplePrefs = require("sdk/simple-prefs");
const tabs = require("sdk/tabs");
const tU = require("sdk/tabs/utils");
const wU = require("sdk/window/utils");
const system = require("sdk/system");
const timer = require("sdk/timers");

tabs.on("activate", preloadTabsActivate);


function debugLog(msg) {
  if (simplePrefs.prefs['debugLog']) {
    console.log(msg);
  }
}

function preloadTabsActivate(tab) {
  debugLog("tab activate");
  var activeXULWindow = wU.getMostRecentBrowserWindow();
  var currentXULTab = tU.getActiveTab(activeXULWindow);

  // if tab has already been loaded start preloading neighbors immediately
  tab.attach({
    contentScript: 'self.postMessage(document.readyState);',
    onMessage: function (readyState) {
      if (readyState == "complete") {
        debugLog("preload after complete");
        preloadTabs(activeXULWindow, currentXULTab);
      }
      else {
        timer.setTimeout(function() {
          debugLog("preload before complete");
          preloadTabs(activeXULWindow, currentXULTab);
        },
        simplePrefs.prefs['preloadGracePeriode'] * 1000);
      }
    }
  });
}

function preloadTabs(activeXULWindow, currentXULTab) {
  debugLog("preloadTabs");

  debugLog("activeXULWindow: " + activeXULWindow);

  if (!activeXULWindow) {
    debugLog("no XULWindow!");
    return;
  }

  var xulTabs = tU.getTabs(activeXULWindow);
  var currentTabIndex = 0;

  var foundActiveTab = false;
  // find current XUL tab
  for(var i = 0; i < xulTabs.length; i++) {
    var xt = xulTabs[i];
    if (xt == currentXULTab) {
      currentTabIndex = i;
      foundActiveTab = true;
      break;
    }
  }

  if (!foundActiveTab)
    return;

  if (simplePrefs.prefs['debugLog']) {
    for (var i = 0; i < xulTabs.length; i++) {
      var xt = xulTabs[i];
      var tb = tU.getBrowserForTab(xt);
      var window = tU.getTabContentWindow(xt);
      if (tb) {
        console.log(i + " pending: " + tb.hasAttribute("pending") +
                    " url: " + tU.getTabURL(xt));
      }
    }
  }

  var leftOffset  = simplePrefs.prefs['leftOffset'];
  var rightOffset = simplePrefs.prefs['rightOffset'];

  var startIndex = Math.max(0, currentTabIndex - leftOffset);
  var stopIndex  = Math.min(xulTabs.length, currentTabIndex + rightOffset + 1);

  for (var i = startIndex; i < stopIndex; i++) {
    var xt = xulTabs[i];
    var tb = tU.getBrowserForTab(xt);

    if (i != currentTabIndex && tb &&
         (tb.hasAttribute("pending")
          || (    (system.platform == "android")
               && (tU.getTabURL(xt) == "about:blank")
             )
         )
        ) {
      debugLog("reload: " + i + ", currentTab: " + currentTabIndex);

      var gBrowser = tU.getTabBrowserForTab(xt);
      var gBrowser2 = tU.getBrowserForTab(xt);
//      // normal case
      if (gBrowser) {
        gBrowser.reloadTab(xt);
      }
//      // fennec ?
      else if (gBrowser2) {
        var data = gBrowser2.__SS_data;
        if (data && data.entries && data.entries[0]){
          let activeIndex = (data.index || data.entries.length) - 1;
          var url = data.entries[activeIndex].url;
          tU.setTabURL(xt, url);
          xt.browser.reload();
          //tb.reload();
          delete gBrowser2.__SS_restore;
          gBrowser2.removeAttribute("pending");
          debugLog("tab reloaded: " + url);
        }
      }
    }
  }
}
