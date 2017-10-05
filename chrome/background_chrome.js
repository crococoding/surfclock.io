// load new url

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active?
	const url = changeInfo.url;
	if(tab.active && url) {
		logger.handleUrl(url);
	}
});

// switch tab

chrome.tabs.onActivated.addListener(function(activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function(tab) {
		const url = tab.url
		logger.handleUrl(url);
	});
});

// switch window

chrome.windows.onFocusChanged.addListener(function(windowId) {
	if(windowId == chrome.windows.WINDOW_ID_NONE) {
		// no window is focused -> Google Chrome inactive
		console.log('inactive');
		logger.endInterval();
	} else {
		// find active tab of newly focused window
		chrome.tabs.query({
			'active': true, 
			'windowId': windowId
		}, function(tabs) {
			const tab = tabs[0];
			const url = tab.url;
			logger.handleUrl(url);
		});
	}
});

// regarding bug on Windows: fires endInterval() when all windows lost focus

setInterval(function() {
	chrome.windows.getCurrent(null, function(window) {
		if(!window.focused) {
			logger.endInterval();
		}
	});
}, 3000);
