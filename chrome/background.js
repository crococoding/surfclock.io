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
	port.onMessage.addListener(function(message) {
		// format of message: {command: "", content: ""}
		switch(message["command"]) {
			
			case "retrieveIntervals": 
				storageApi.retrieve(port, message["content"]);
				break;

			case "removeIntervals":
				storageApi.remove(port, message["content"]);
				break;

			default: // do nothing
		}
	});
});

var storageApi = {

	storageArea: chrome.storage.local,

	store: function(domain, from, till) {
		this.storageArea.get(domain, function(storedDomainEntry) {
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
	},

	retrieve: function(port, domain) {
		this.storageArea.get(domain, function(result) {
			port.postMessage(JSON.stringify(result));
		});
	},

	remove: function(port, untilTime) {
		if(untilTime) {// only remove until given time
			// TODO
		} else { // remove everything
			// stop possible running interval
			timeTrack.domain = null;
			this.storageArea.clear(function() {
				port.postMessage("cleared");
				timeTrack.handleUrl(timeTrack.url);
			});
		}
	}

}
