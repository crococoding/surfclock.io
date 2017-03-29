var database = new function() {
	
	this.dexie = new Dexie('domain_db');

	//this.dexie.delete();
	//https://github.com/dfahlander/Dexie.js/wiki/Dexie.delete()

	this.dexie.version(1).stores({
		intervals: '++id,domain,from,till',
		domains: 'domain,color'
	});

	this.dexie.open().catch(function(error) {
		console.log('Open failed: ' + error);
	});




	// store a new interval for a domain
	this.storeInterval = function(domain) {

		console.log('trying to add interval');

		database.dexie.intervals.add({
			'domain' : domain,
			'from' : getTimestamp(),
			'till' : getTimestamp(), // Date.now(), will be updated later
		}).catch(function(error) {
			console.log('adding interval: ' + error);
		});
	}

	// update the end of the last interval of a given domain
	this.updateIntervalEnd = function(domain) {
		return new Promise(function(resolve, reject) {
			database.dexie.intervals.toCollection().last().then(function(lastInterval) {
				if (lastInterval.domain == domain) {
					// when a strange problem happens
					if (getTimestamp() - lastInterval.till > 10 * 1000) { // > 10 seconds
						return reject(new Error('Interval > 10secs'));
					}

					// update the last entry
					database.dexie.intervals.update(lastInterval.id, {'till' : getTimestamp()});
					return resolve();
				} else {
					return reject(new Error('lastInterval.domain != domain. lastInterval: ' + JSON.stringify(lastInterval) + '; domain: ' + domain));
				}
			}).catch(function(error) {
				return reject(new Error('database: ' + error));
			});
		});
	}

	// get start of first recorded entry
	this.getFirstIntervalStart = function() {
		return new Promise(function(resolve, reject) {
			database.dexie.intervals.toCollection().first().then(function(interval) {
				if(interval) {
					resolve(interval.from);
				} else {
					resolve(null);
				}
			}).catch(function(error) {
				reject(error);
			});
		});
	}

	// store color for a domain
	this.storeColor = function(domain, color) {
		database.dexie.domains.put({
			domain: domain, 
			color: color
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error));
		});
	}

	// get number of domain entries
	this.getNumberOfDomains = function() {
		return new Promise(function(resolve, reject) {
			database.dexie.domains.count().then(function(count) {
				resolve(count);
			}).catch(function(error) {
				reject(error);
			});
		});
	}

	// get all domain entries
	this.getDomains = function() {
		return new Promise(function(resolve, reject) {
			database.dexie.domains.toCollection().toArray(function(domains) {
				resolve(domains);
			}).catch(function(error) {
				reject(error);
			});
		});
	}

	// get duration of all intervals in a given observation period of a given domain summed up
	this.getDuration = function(domain, observationBounds) {
		return new Promise(function(resolve, reject) {
			database.dexie.intervals
			.where('domain').equals(domain)
			// filter
			.and(interval => observationBounds.from < interval.till && observationBounds.till > interval.from)
			.toArray(function(intervals) {
				
				// clip
				if(intervals.length > 0) {
					var indexFirst = 0;
					var indexLast = intervals.length - 1;
					intervals[indexFirst].from = Math.max(intervals[indexFirst].from, observationBounds.from);
					intervals[indexLast].till = Math.min(intervals[indexLast].till, observationBounds.till);
				}

				// calculate
				var duration = intervals
				.map(interval => interval.till - interval.from)
				.reduce((total, duration) => total + duration, 0);
				
				resolve(duration);
			}).catch(function(error) {
				reject(error);
			});
		});
	}

	// clear all entries
	this.remove = function(untilTime) {
		if (untilTime) {
			// only remove until given time
			// TODO
		} else {
			database.dexie.intervals.clear();
			database.dexie.domains.clear();
		}
	}
}
