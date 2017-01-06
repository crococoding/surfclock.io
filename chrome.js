// cross browser

var timeTrack = {
	activeIdentifier: new Number(),

	handleUrl: function(url) {
		var domain = url.replace(/(((http)(s*):\/\/)(www\.)*)/,'').split(/[/?#]/)[0];
		alert("current domain: " + domain);
	}
}

// chrome specific

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active?
	if (changeInfo.url != null && tabId == timeTrack.activeIdentifier) {
		timeTrack.handleUrl(changeInfo.url);
	}
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
	timeTrack.activeIdentifier = activeInfo.tabId;
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		timeTrack.handleUrl(tab.url);
	});
});