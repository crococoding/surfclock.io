// load new url

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
		// no window is focused -> Google Chrome inactive
		timeTrack.stopRecording();
	} else {
		// find active tab of newly focused window
		chrome.tabs.query({
			'active': true, 
			'windowId': windowId
		}, function(tabs) {
			var tab = tabs[0];
			timeTrack.handleUrl(tab.url);
		});
	}
});


// api

var storageApi = {
	
	// domain: null for get everything of chrome's storage (all domains)
	retrieve: function(domain) {
		chrome.storage.local.get(domain, function(result) {
		    alert(JSON.stringify(result));
		});
	},

	store: function(domain, intervalEntry) {
		chrome.storage.local.get(domain, function(currentDomainEntry) {
			var intervalEntries = [];
			if (JSON.stringify(currentDomainEntry) != "{}") {
				// keep current interval entries
				intervalEntries = currentDomainEntry[domain];
			}
			intervalEntries.push(intervalEntry);
			
			var domainEntry = {};
			domainEntry[domain] = intervalEntries;

			chrome.storage.local.set(domainEntry, function() {
			    // saved
			});
		});
	}

}
