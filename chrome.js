// load new tab

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	chrome.windows.get(tab.windowId, null, function(window) {
		// is updated tab active and is its window active?
		if(tab.active && window.focused && changeInfo.url != null) {
			timeTrack.handleUrl(changeInfo.url);
		}
	});
});

// switch tab

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		timeTrack.handleUrl(tab.url);
	});
});

// switch window

// TODO