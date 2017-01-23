var database = new function() {
	
	this.dexie = new Dexie('domain_db');
	this.dexie.version(1).stores({
		intervals: '++id,domain,from,till',
		domains: '++id,domain,color,faviconUrl'
	});

	this.dexie.open().catch(function(error) {
		console.log('Open failed: ' + error);
	});


	this.storeIntervalStart = function(domain, from) {
		database.dexie.intervals.add({
			'domain' : domain,
			'from' : from 
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error))
		});
	}

	this.storeIntervalEnd = function(domain, till) {
		database.dexie.intervals.where('domain').equals(domain).last().then(function (item) {
			database.dexie.intervals.update(item.id, {'till' : till});
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error));
		});
	}

	this.retrieve = function(callback) {

		var data = {};

		database.dexie.intervals.each(function(item) {

			if (data[item.domain] == null) {
				data[item.domain] = [];
			} 

			var interval = {};
			if (item.from) {
				interval['from'] = item.from;
			}
			if (item.till) {
				interval['till'] = item.till;
			}
			data[item.domain].push(interval);

		}).then(function() {
			callback(data);
		}).catch(function(error) {
			console.log('error: ' + JSON.stringify(error));
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
			return from <= bounds.upper && till >= bounds.lower;
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
			callback();
		}
	}
}
