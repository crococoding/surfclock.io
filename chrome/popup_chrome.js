// api

var storageApi = {

	retrieve: function(domain) {
		chrome.storage.local.get(domain, function(result) {
			timeTrack.displayJsonResult(result);
		});
	},

	remove: function(untilTime) {
		if(untilTime) {
			// only remove until given time
			// TODO
		} else { 
			// remove everything
			chrome.storage.local.clear(function() {
				backgroundCommunication.reinstateDomain();
				timeTrack.displayClearedSuccess();
			});
		}
	}

}


// messaging with background page

var port = chrome.extension.connect({
	name: 'TimeTrack Communication'
});

var backgroundCommunication = {

	reinstateDomain: function() {
		port.postMessage('reinstateDomain');
	}

}
