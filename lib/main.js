require("sdk/simple-prefs").on("", preloadTabs);
require("sdk/tabs").on("activate", preloadTabsActivate);
var tU = require("tabs/utils");
var wU = require("window/utils");

function preloadTabsActivate(tab) {
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

//  var activeXULWindow = wU.getMostRecentBrowserWindow();
//  var currentXULTab = tU.getActiveTab(activeXULWindow);
  
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
