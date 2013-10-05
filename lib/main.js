require("sdk/simple-prefs").on("", preloadTabs);
require("sdk/tabs").on("activate", preloadTabsActivate);
var tU = require("tabs/utils");
var wU = require("window/utils");

function preloadTabsActivate(tab) {
  if (require('sdk/simple-prefs').prefs['debugLog']) {
    console.log("tab activate");
  }
  var activeXULWindow = wU.getMostRecentBrowserWindow();
  var currentXULTab = tU.getActiveTab(activeXULWindow);

  // if tab has already been loaded start preloading neighbors immediately
  tab.attach({
    contentScript: 'self.postMessage(document.readyState);',
    onMessage: function (readyState) {
      if (readyState == "complete") {
        preloadTabs(activeXULWindow, currentXULTab);
      }
    }
  });

  // wait until active tab is ready before loading neighboring tabs
  tab.on("ready", function(tab) {
    preloadTabs(activeXULWindow, currentXULTab);
  });
  //  require("sdk/timers").setTimeout(preloadTabs, 100, activeXULWindow, currentXULTab);
}

function preloadTabs(activeXULWindow, currentXULTab) {
  if (require('sdk/simple-prefs').prefs['debugLog']) {
    console.log("tab preload");
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

  if (require('sdk/simple-prefs').prefs['debugLog']) {
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
  
  var leftOffset  = require('sdk/simple-prefs').prefs['leftOffset'];
  var rightOffset = require('sdk/simple-prefs').prefs['rightOffset'];
  
  var startIndex = Math.max(0, currentTabIndex - leftOffset);
  var stopIndex  = Math.min(xulTabs.length, currentTabIndex + rightOffset + 1);
 
  for (var i = startIndex; i < stopIndex; i++) {
    var xt = xulTabs[i];
    var tb = tU.getBrowserForTab(xt);

    if (i != currentTabIndex && tb && 
        tb.hasAttribute("pending")
        ) {
      if (require('sdk/simple-prefs').prefs['debugLog']) {
        console.log("reload: " + i + ", currentTab: " + currentTabIndex);
      }
      
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
          delete gBrowser2.__SS_restore;
          gBrowser2.removeAttribute("pending");
          if (require('sdk/simple-prefs').prefs['debugLog']) {
            console.log("tab reloaded: " + url);
          }
        }
      }
    }
  }
}
