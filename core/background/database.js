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
		return database.dexie.intervals.toCollection().last().then(function(lastInterval) {
			if (lastInterval.domain != domain) return Promise.reject(new Error('lastInterval.domain != domain'));

			if (getTimestamp() - lastInterval.till > 10 * 1000) return Promise.reject(new Error('Interval > 10secs'));

			// update
			return database.dexie.intervals.update(lastInterval.id, {'till' : getTimestamp()});
		});
	}

	// get start of first recorded entry
	this.getFirstIntervalStart = function() {
		return database.dexie.intervals.toCollection().first().then(function(interval) {
			return interval ? interval.from : null;
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

	// get all domain entries
	this.getDomains = function() {
		return database.dexie.domains.toCollection().toArray();
	}

	// get duration of all intervals in a given observation period of a given domain summed up
	this.getDuration = function(domain, observationBounds) {
		return database.dexie.intervals
		.where('domain').equals(domain)
		// filter
		.and(interval => observationBounds.from < interval.till && observationBounds.till > interval.from)
		.toArray(function(intervals) {
			
			// clip
			if(intervals.length > 0) {
				const indexFirst = 0;
				const indexLast = intervals.length - 1;
				intervals[indexFirst].from = Math.max(intervals[indexFirst].from, observationBounds.from);
				intervals[indexLast].till = Math.min(intervals[indexLast].till, observationBounds.till);
			}

			// calculate
			return intervals
			.map(interval => interval.till - interval.from)
			.reduce((total, duration) => total + duration, 0);
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
