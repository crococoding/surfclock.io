// api

var storageApi = {

	retrieve: function(callback) {
		// null means whole storage (all domains)
		chrome.storage.local.get(null, function(data) {
			callback(data);
		});
	},

	remove: function(untilTime, callback) {
		if(untilTime) {
			// only remove until given time
			// TODO
		} else { 
			// remove everything
			chrome.storage.local.clear(function() {
				backgroundCommunication.reinstateDomain();
				callback();
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
