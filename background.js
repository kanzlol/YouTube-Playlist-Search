
chrome.tabs.onActivated.addListener(function(activeInfo) {

  chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function (tabs) { 

    url = tabs[0].url;
    let currentUrl = url.match(/[&?]list=([^&]+)/i);

    if(currentUrl[1]) {
      chrome.pageAction.show(activeInfo.tabId);
    }
    else {
      chrome.pageAction.hide(activeInfo.tabId);
    }

  });


});

chrome.tabs.onUpdated.addListener(function(activeInfo) {
  console.log(activeInfo)

  chrome.tabs.query({'active': true, 'lastFocusedWindow': true, 'currentWindow': true}, function (tabs) { 

    url = tabs[0].url;
    let currentUrl = url.match(/[&?]list=([^&]+)/i);

    if(currentUrl[1]) {
      chrome.pageAction.show(activeInfo);
    }
    else {
      chrome.pageAction.hide(activeInfo);
    }

  });


});