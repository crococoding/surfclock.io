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
