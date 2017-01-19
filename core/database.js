var database = new function() {
	
	this.dexie = new Dexie("domain_db");
	this.dexie.version(1).stores({
		intervals: '++id,domain,from,till',
		domains: '++id,domain,color,faviconUrl'
	});

	this.dexie.open().catch(function(e) {
		alert("Open failed: " + e);
	});


	this.storeIntervalStart = function(domain, from) {
		database.dexie.intervals.add({
			'domain' : domain,
			'from' : from 
		}).catch(function(error) {
			alert("error:" + JSON.stringify(error))
		});
	}

	this.storeIntervalEnd = function(domain, till) {
		database.dexie.intervals.where("domain").equals(domain).last().then(function (item) {
			database.dexie.intervals.update(item.id, {'till' : till});
		}).catch(function(error) {
			//alert("error:" + JSON.stringify(error))
		});
	}

	this.retrieve = function(callback) {

		var data = {};

		database.dexie.intervals.each(function(item){

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
		});

	}

	this.remove = function(untilTime, callback) {
		if (untilTime) {
			// only remove until given time
			// TODO
		} else {
			// TODO startup again
			database.dexie.intervals.clear();
			callback();
		}
	}
}
