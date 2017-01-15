var storageApi = {

	store: function(domain, from, till) {
		chrome.storage.local.get(domain, function(storedDomainEntry) {
			var storedIntervals = storedDomainEntry[domain];
			var intervals = storedIntervals ? storedIntervals : [];

			if(from) {
				// new interval
				intervals.push({'from': from});
			}
			
			if(till) {
				// save interval end in last interval
				intervals[intervals.length - 1]['till'] = till;
			}

			var domainEntry = {};
			domainEntry[domain] = intervals;

			chrome.storage.local.set(domainEntry, function() {
				if(chrome.runtime.lastError) {
					console.warn("Whoops.. " + chrome.runtime.lastError.message);
					// TODO: probably (give user option to) remove older intervals
				} else {
					// saved
				}
			});
		});
	},

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
