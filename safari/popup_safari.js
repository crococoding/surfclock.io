// api

var storageApi = {

	retrieve: function(callback) {
		// null means whole storage (all domains)
		// chrome.storage.local.get(null, function(data) {
		// 	callback(data);
		// });
		// 
		// 
		var data = {};

		for(var i=0, len=localStorage.length; i<len; i++) {
			var key = localStorage.key(i);
			var value = JSON.parse(localStorage[key]);

			data[key] = value;
		}

		callback(data);
	},

	remove: function(untilTime, callback) {
		if(untilTime) {
			// only remove until given time
			// TODO
		} else { 

			localStorage.clear();
			callback();
			// remove everything
			// chrome.storage.local.clear(function() {
			// 	backgroundCommunication.reinstateDomain();
			// 	callback();
			// });
		}
	}

}


function popoverHandler(event) {
	popup.updateChart();
}

safari.application.addEventListener("popover", popoverHandler, true);

// messaging with background page