// load new tab

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active?
	if(tab.active && changeInfo.url != null) {
		timeTrack.startRecording(changeInfo.url);
	}
});

// switch tab

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab) {
		timeTrack.startRecording(tab.url);
	});
});

// switch window

chrome.windows.onFocusChanged.addListener(function(windowId) {
	if(windowId == chrome.windows.WINDOW_ID_NONE) {
		timeTrack.stopRecording();
	} else {
		chrome.tabs.query({
			'active': true, 
			'windowId': windowId
		}, function(tabs) {
			var tab = tabs[0];
			timeTrack.startRecording(tab.url);
		});
	}
});