var database = new function() {
	
	this.dexie = new Dexie('domain_db');

	//this.dexie.delete();
	//https://github.com/dfahlander/Dexie.js/wiki/Dexie.delete()

	this.dexie.version(1).stores({
		intervals: '++id,domain,from,till',
		domains: 'domain,color,faviconUrl'
	});

	this.dexie.open().catch(function(error) {
		console.log('Open failed: ' + error);
	});



	this.storeColor = function(domain, color, faviconUrl) {
		database.dexie.domains.put({
			domain: domain, 
			color: color, 
			faviconUrl: faviconUrl
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


	this.storeIntervalStart = function(domain, from) {
		database.dexie.intervals.add({
			'domain' : domain,
			'from' : from 
		}).then(function() {
			// alert('start ' + domain);
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error))
		});
	}

	this.storeIntervalEnd = function(domain, till) {
		database.dexie.intervals.where('domain').equals(domain).last().then(function (item) {
			database.dexie.intervals.update(item.id, {'till' : till});
			// alert('end ' + domain);
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error));
		});
	}

	this.retrieve = function() {

		var data = {};

		return new Promise(function(resolve, reject) {
			database.dexie.intervals.each(function(item) {

				if (data[item.domain] == null) {
					data[item.domain] = [];
				} 

				data[item.domain].push(item);

			}).then(function() {
				resolve(data);
			}).catch(function(error) {
				reject(error);
			});
		});
	}

	// intervals for specified domain cut according to the specified bounds
	this.getIntervals = function(domain, bounds, callback) {
		var intervals = [];

		database.dexie.intervals
		.where('domain').equals(domain)
		.and(function(interval) {
			var from = interval.from;
			var till = interval.till ? interval.till : bounds.upper;
			return from < bounds.upper && till > bounds.lower;
		}).each(function(interval) {
			intervals.push({
				'from' : interval.from,
				'till' : interval.till ? interval.till : bounds.upper
			});
		}).then(function() {
			if(intervals.length > 0) {
				index_first = 0;
				index_last = intervals.length - 1;

				intervals[index_first]['from'] = Math.max(intervals[index_first]['from'], bounds.lower);
				intervals[index_last]['till'] = Math.min(intervals[index_last]['till'], bounds.upper);
			}
			// console.log(JSON.stringify(intervals));
			callback(intervals);
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error));
		});
	}

	this.remove = function(untilTime, callback) {
		if (untilTime) {
			// only remove until given time
			// TODO
		} else {
			database.dexie.intervals.clear();
			database.dexie.domains.clear();
			callback();
		}
	}
}
