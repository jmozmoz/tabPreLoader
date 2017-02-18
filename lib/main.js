const simplePrefs = require("sdk/simple-prefs");
const tabs = require("sdk/tabs");
const tU = require("sdk/tabs/utils");
const wU = require("sdk/window/utils");
const system = require("sdk/system");
const timer = require("sdk/timers");

var run_at_least_once = false;

tabs.on("activate", preloadTabsActivate);


function debugLog(msg) {
  if (simplePrefs.prefs['debugLog']) {
    console.log(msg);
  }
}

function preloadTabsActivate(tab) {
  debugLog("tab activate: " + tab);

  var activeXULWindow = wU.getMostRecentBrowserWindow();
  var currentXULTab = tU.getActiveTab(activeXULWindow);
  var tb = tU.getBrowserForTab(currentXULTab);

  debugLog("contentWindow2.location: " + tb.__SS_restoreState);
  let myTimer;
  tb.__TPL_isreloading = true;


  if (run_at_least_once) {
    if (typeof tb.__SS_restoreState == 'undefined') {
      debugLog("immediate reload");
      preloadTabs(activeXULWindow, currentXULTab);
    }
    else
    {
      myTimer = timer.setTimeout(function() {
          debugLog("reload by force timer");
          preloadTabs(activeXULWindow, currentXULTab);
        },
        simplePrefs.prefs['preloadGracePeriode'] * 1000
      );
      tab.on("pageshow", function() {
          debugLog("reload after pageshow");
          timer.clearTimeout(myTimer);
          preloadTabs(activeXULWindow, currentXULTab)
        }
      );
    }
  }
  else {
    run_at_least_once = true;
    let myFirstTimer = timer.setTimeout(function() {
      debugLog("reload by force timer");
      preloadTabs(activeXULWindow, currentXULTab);
    },
    simplePrefs.prefs['preloadGracePeriode'] * 1000
  );
  }
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

  var leftOffset  = simplePrefs.prefs['leftOffset'];
  var rightOffset = simplePrefs.prefs['rightOffset'];

  var startIndex = Math.max(0, currentTabIndex - leftOffset);
  var stopIndex  = Math.min(xulTabs.length, currentTabIndex + rightOffset + 1);

  for (var i = startIndex; i < stopIndex; i++) {
    var xt = xulTabs[i];
    var tb = tU.getBrowserForTab(xt);

    if (i != currentTabIndex && tb && tabIsPending(tb, xt)) {
      debugLog("reload: " + i + ", currentTab: " + currentTabIndex);
      tb.__TPL_isreloading = true;

      var gBrowser = tU.getTabBrowserForTab(xt);
      var gBrowser2 = tU.getBrowserForTab(xt);
//      // normal case
      if (gBrowser) {
        debugLog("call gBrowser.reloadTab");
        gBrowser.reloadTab(xt);
      }
      // fennec ?
      else if (gBrowser2) {
      	if (xt.unzombify) {
          xt.unzombify();
        } else {
          var data = gBrowser2.__SS_data;
          if (data && data.entries && data.entries[0]){
            let activeIndex = (data.index || data.entries.length) - 1;
            var url = data.entries[activeIndex].url;
            debugLog("call tU.setTabURL");
            tU.setTabURL(xt, url);
            debugLog("call xt.browser.reload");
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
}

function tabIsPending(tb, xt) {
  var pending = false;
  if (typeof tb.__TPL_isreloading == 'undefined') {
    tb.__TPL_isreloading = true;
    pending = true;
  }
  else {
    debugLog("trigger reload not necessary");
    return false;
  }

  pending = pending &&
    (
       tb.hasAttribute("pending") ||
       (
         (system.platform == "android")
          && (tU.getTabURL(xt) == "about:blank")
       )
    );
  return pending;

}