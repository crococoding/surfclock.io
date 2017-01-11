// api

var storageApi = {

	retrieve: function() {
		// null means whole storage (all domains)
		chrome.storage.local.get(null, function(data) {
			timeTrack.data = data;
			timeTrack.showInitialChart();
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
				timeTrack.showResetSuccess();
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
