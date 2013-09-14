require("sdk/simple-prefs").on("", preloadTabs);
require("sdk/tabs").on("activate", preloadTabsActivate);

function preloadTabsActivate(tab) {
  // wait until active tab is ready before loading neighboring tabs
  tab.on("ready", preloadTabs);
}

function preloadTabs() {
  var tU = require("tabs/utils");
  var wU = require("window/utils");

  var activeXULWindow = wU.getMostRecentBrowserWindow();
  var currentXULTab = tU.getActiveTab(activeXULWindow);
  
  var xulTabs = tU.getTabs(activeXULWindow);
  var currentTabIndex = 0;

  // find current XUL tab
  for(var i = 0; i < xulTabs.length; i++) {
    var xt = xulTabs[i];
    if (xt == currentXULTab) {
      currentTabIndex = i;
      break;
    }
  }

  var leftOffset  = require('sdk/simple-prefs').prefs['leftOffset'];
  var rightOffset = require('sdk/simple-prefs').prefs['rightOffset'];
  
  var startIndex = Math.max(0, currentTabIndex - leftOffset);
  var stopIndex  = Math.min(xulTabs.length, currentTabIndex + rightOffset + 1);
 
  for (var i = startIndex; i < stopIndex; i++) {
    var xt = xulTabs[i];
    if (i != currentTabIndex && xt && xt.hasAttribute("pending") && 
        !xt.hasAttribute("unread") 
      ) {
      // console.log("reload: " + i);
      tU.getTabBrowserForTab(xt).reloadTab(xt);
    }
  }
}
