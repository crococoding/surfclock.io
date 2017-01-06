// load new tab

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active and is its window active?
	if( tab.active && 
		tab.windowId == chrome.windows.WINDOW_ID_CURRENT && 
		changeInfo.url != null) {
		timeTrack.handleUrl(changeInfo.url);
	}
});

// switch tab

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		timeTrack.handleUrl(tab.url);
	});
});

// switch window

// TODO