// load new url

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	// is updated tab active?
	if(tab.active && changeInfo.url) {
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
		timeTrack.endInterval();
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

	store: function(domain, from, till) {
		chrome.storage.local.get(domain, function(currentDomainEntry) {
			var currentIntervalEntries = currentDomainEntry[domain];
			var intervalEntries = currentIntervalEntries ? currentIntervalEntries : [];

			if(from) {
				// new entry
				intervalEntries.push({"from": from});
			}
			
			if(till) {
				// save interval end in last array entry
				intervalEntries[intervalEntries.length - 1]["till"] = till;
			}

			var domainEntry = {};
			domainEntry[domain] = intervalEntries;

			chrome.storage.local.set(domainEntry, function() {
			    // saved
			});
		});
	}

}
