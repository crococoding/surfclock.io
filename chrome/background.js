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

chrome.extension.onConnect.addListener(function(port) {
	// format of message: {command: "", content: ""}
	port.onMessage.addListener(function(message) {
		if(message["command"] && message["command"] == "retrieveData") {
			storageApi.retrieve(message["content"], port);
		}
	});
});

var storageApi = {
	
	retrieve: function(domain, port) {
		chrome.storage.local.get(domain, function(result) {
			port.postMessage(JSON.stringify(result));
		});
	},

	store: function(domain, from, till) {
		chrome.storage.local.get(domain, function(storedDomainEntry) {
			var storedIntervals = storedDomainEntry[domain];
			var intervals = storedIntervals ? storedIntervals : [];

			if(from) {
				// new interval
				intervals.push({"from": from});
			}
			
			if(till) {
				// save interval end in last interval
				intervals[intervals.length - 1]["till"] = till;
			}

			var domainEntry = {};
			domainEntry[domain] = intervals;

			chrome.storage.local.set(domainEntry, function() {
			    // saved
			});
		});
	}

}
