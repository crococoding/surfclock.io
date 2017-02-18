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

	this.storeUserActivity = function(domain) {
		database.dexie.intervals.add({
			'domain' : domain,
			'from' : getTimestamp(),
			'till' : getTimestamp(), // Date.now(), will be updated later
		}).catch(function(error) {
			console.log('ERROR adding activity' + error);
		});
	}


	this.updateIntervalEnd = function(domain) {
		// get last domain entry from DB to make sure we don't change some old value
		database.dexie.intervals.toCollection().last().then(function(lastInverval) {
			if (lastInverval.domain == domain) {
				// update the last entry
				//DEBUG
				if (getTimestamp() - lastInverval.till > 1 * 68 * 60 * 1000) { // > 1h
					alert('INTERVAL > 1h!! domain: ' + domain + 'getTimestamp: ' + getTimestamp() + 'lastDomain.till: ' + lastInverval.till);
				}

				database.dexie.intervals.update(lastInverval.id, {'till' : getTimestamp()});
			} else {
				alert('unexpected behavior. //TODO further investigation');
			}
		});

		// console.log('updated activity');
	}



	this.storeColor = function(domain, color) {
		database.dexie.domains.put({
			domain: domain, 
			color: color
		}).then(function() {
			 
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error));
		});
	}


	this.getColor = function(domain) {
		return new Promise(function(resolve, reject) {
			database.dexie.domains.where('domain').equals(domain).first().then(function(val) {
				resolve(val.color);
			}).catch(function(error) {
				//TODO: error handling
				resolve(null);
				//console.log('error: ' + JSON.stringify(error));
			});
		});
	}

	this.getDomains = function() {
		return new Promise(function(resolve, reject) {
			database.dexie.domains.toCollection().toArray(function(domains) {
				resolve(domains.map(x => x.domain));
			});
		});
	}

	this.getDuration = function(domain, observationBounds) {
		return new Promise(function(resolve, reject) {
			database.dexie.intervals
			.where('domain').equals(domain)
			// filter
			.and((interval) => observationBounds.from < interval.till && observationBounds.till > interval.from)
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
				.map(interval => (interval.till - interval.from))
				.reduce((total, duration) => (total + duration, 0));
				
				resolve(duration);
			}).catch(function(error) {
				resolve(0);
			});
		});
	}

	this.retrieve = function() {

		var data = {};

		// console.log('did call retrieve');

		return new Promise(function(resolve, reject) {
			database.dexie.intervals.each(function(item) {

				if (data[item.domain] == null) {
					data[item.domain] = [];
				} 

				data[item.domain].push(item);

				//console.log(item);

			}).then(function() {
				resolve(data);
			}).catch(function(error) {
				reject(error);
			});
		});
	}

	this.getBeginning = function() {
		return new Promise(function(resolve, reject) {
			database.dexie.intervals.toCollection().first().then(function(interval) {
				if(interval) {
					resolve(interval.from);
				} else {
					resolve(null);
				}
				
			});
		});
	}

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
