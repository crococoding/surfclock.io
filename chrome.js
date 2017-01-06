chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active?
	if (changeInfo.url != null && tab.active == true) {
		timeTrack.handleUrl(changeInfo.url);
	}
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		timeTrack.handleUrl(tab.url);
	});
});