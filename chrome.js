// load new tab

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active?
	if(tab.active && changeInfo.url != null) {
		timeTrack.handleUrl(changeInfo.url);
	}
});

// switch tab

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab) {
		timeTrack.handleUrl(tab.url);
	});
});

// switch window

chrome.windows.onFocusChanged.addListener(function(windowId) {
	if(windowId == chrome.windows.WINDOW_ID_NONE) {
		// TODO: No window is focused -> Google Chrome inactive
	} else {
		chrome.tabs.query({
			'active': true, 
			'windowId': windowId
		}, function(tabs) {
			var tab = tabs[0];
			if(tab != null) {
				timeTrack.handleUrl(tab.url);
			}
		});
	}
});