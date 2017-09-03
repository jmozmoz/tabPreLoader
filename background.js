function onCreated(n) {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  } else {
    console.log("Item created successfully");
  }
}

function updatedTab(tab) {
  var updating = browser.tabs.reload(tab.id,
    {
//      active: true,
    }
  );
//  updating.then(onUpdated, onError);
}
//
//function onUpdated(tab) {
//  console.log('Updated tab: ${tab.index}');
//}
//
//function onError(error) {
//  console.log('Error: ${error}');
//}

function findNeighbours(senderID, tabs) {
  var sender;
  console.log('senderID: ', senderID);
  for (var tab of tabs) {
    if (tab.id == senderID) {
      sender = tab;
      break;
    }
  }


  for (var tab of tabs) {

    if ((Math.abs(tab.index - sender.index) <= 1) &&
        (tab.index != sender.index)) {
          console.log('tab neighbor!');
          console.log('tab: ', tab);
          console.log('tab discarded: ', tab.discarded);
          console.log('tab url: ', tab.url);
          if (tab.discarded) {
            updatedTab(tab);
          }
    }
  }
//  updatetTab(sender);
}

browser.tabs.onActivated.addListener(function (activeInfo){
  var querying = browser.tabs.query({currentWindow: true});
  var senderID = activeInfo.tabId;
  querying.then(findNeighbours.bind(null, senderID));
  });
