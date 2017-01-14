window.onload = function() {
	// load data
	// 
	// 
	
	//alert("onload");

	storageApi.retrieve(function(data) {
		popup.data = data;
		popup.showDomainDurationsChart(0, Date.now());
	});

	document.getElementById('reset').onclick = function(event) {
		// null means remove everything
		storageApi.remove(null, function() {
			popup.showResetSuccess();
		});
	};
}

var popup = {

	showResetSuccess: function() {
		document.getElementById('chart').innerHTML = 'cleared';
	},

	showChart: function(keys, values) {
		document.getElementById('chart').innerHTML = '<p>DOMAINS:<br>' + keys.join('<br>') + '</p>';
		document.getElementById('chart').innerHTML += '<p>DURATIONS:<br>' + values.join('<br>') + '</p>';
	},

	showDomainDurationsChart: function(lowerBound, upperBound) {
		var keys = [];
		var values = [];

		for (var domain in this.data) {
			var intervals = this.filterAndClipIntervals(this.data[domain], lowerBound, upperBound);
			var intervalDurations = intervals.map(this.getIntervalDuration);
			var domainDuration = intervalDurations.reduce((a, b) => a + b, 0);

			keys.push(domain);
			values.push(domainDuration);
		}

		this.showChart(keys, values);
	},

	filterAndClipIntervals: function(intervals, lowerBound, upperBound) {
		var result = [];
		for(i in intervals) {
			var interval = intervals[i];
			var from = interval['from'];
			var till = interval['till'] ? interval['till'] : upperBound;
			if(lowerBound < till && upperBound > from) {
				result.push({
					'from': Math.max(from, lowerBound),
					'till': Math.min(till, upperBound)
				});
			}
		}
		return result;
	},

	getIntervalDuration: function(interval) {
		return (interval['till'] - interval['from']);
	},

	data: null

}
