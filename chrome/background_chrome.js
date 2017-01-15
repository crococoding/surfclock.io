// load new url

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active?
	if(tab.active && changeInfo.url) {
		backgroundDataCollector.handleUrl(changeInfo.url);
	}
});

// switch tab

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab) {
		backgroundDataCollector.handleUrl(tab.url);
	});
});

// switch window

chrome.windows.onFocusChanged.addListener(function(windowId) {
	if(windowId == chrome.windows.WINDOW_ID_NONE) {
		// no window is focused -> Google Chrome inactive
		backgroundDataCollector.endInterval();
	} else {
		// find active tab of newly focused window
		chrome.tabs.query({
			'active': true, 
			'windowId': windowId
		}, function(tabs) {
			var tab = tabs[0];
			backgroundDataCollector.handleUrl(tab.url);
		});
	}
});


// messaging from popup page

chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(message) {
		switch(message) {
			
			case 'reinstateDomain': 
				backgroundDataCollector.reinstateDomain();
				break;

			default: // do nothing
		}
	});
});
