window.onload = function() {
	// load data

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
		// document.getElementById('chart').innerHTML = 'cleared';
	},

	showChart: function(keys, values, chartType) {

		var context = document.getElementById('chart').getContext('2d');
		
		var colors = randomColor({
			count: values.length
		});

		var chart = new Chart(context, {
			type: chartType,
			data: {
				labels: keys,
				datasets: [{
					data: values,
					backgroundColor: colors
				}]
			},
			options: {
				legend: {
					display: false
				},
				tooltips: {
					displayColors: false,
					custom: null // TODO: custom tooltips
				},
				animation: {
					animateScale: true
				}
			}
		});

		// document.getElementById('chart').innerHTML = '';

		// for(var i=0, len=keys.length; i<len; i++) {
		// 	var domain = keys[i];
		// 	var duration = values[i];

		// 	var milliseconds = parseInt((duration%1000)/100)
		// 			, seconds = parseInt((duration/1000)%60)
		// 			, minutes = parseInt((duration/(1000*60))%60)
		// 			, hours = parseInt((duration/(1000*60*60))%24);

		// 	hours = (hours < 10) ? "0" + hours : hours;
		// 	minutes = (minutes < 10) ? "0" + minutes : minutes;
		// 	seconds = (seconds < 10) ? "0" + seconds : seconds;

		// 	var duration_string =  hours + ":" + minutes + ":" + seconds + "." + milliseconds;

		// 	document.getElementById('chart').innerHTML += '<p>' + domain + ': ' + duration_string + '</p>';
			
		// }
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

		this.showChart(keys, values, 'doughnut');
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
