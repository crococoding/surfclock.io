window.onload = function() {
	// load data

	popup.updateChart();

	document.getElementById('reset').onclick = function(event) {
		// null means remove everything
		storageApi.remove(null, function() {
			popup.showResetSuccess();
		});
	};
}

var popup = {

	updateChart: function() {
		storageApi.retrieve(function(data) {
			popup.data = data;
			popup.showDomainDurationsChart(0, Date.now());
		});
	},

	showResetSuccess: function() {
		this.updateChart();
		// document.getElementById('chart').innerHTML = 'cleared';
	},

	chart: null,

	showChart: function(data, chartType) {

		// sort descending
		data.sort((x, y) => (y['value'] - x['value']));

		var keys = data.map((x) => x['key']);
		var values = data.map((x) => x['value']);

		var canvas = document.getElementById('chart');
		var context = canvas.getContext('2d');
		context.clearRect(0, 0, canvas.width, canvas.height);

		var colors = randomColor({
			count: values.length
		});

		if (this.chart) {
			this.chart.destroy();
		}

		this.chart = new Chart(context, {
			type: chartType,
			data: {
				labels: keys,
				datasets: [{
					data: values,
					backgroundColor: colors,
					hoverBackgroundColor: colors,
					borderWidth: Array.from({length: values.length}, () => 2),
					hoverBorderWidth: Array.from({length: values.length}, () => 2),
					hoverBorderColor: Array.from({length: values.length}, () => 'white')
				}]
			},
			options: {
				legend: {
					display: false
				},
				tooltips: {
					displayColors: false
					//bodyFontSize: 15,
					// custom: (function(tooltip) {
					// 	tooltip.text = ' milliseconds'
					// })
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
		var data = [];

		for (var domain in this.data) {
			var intervals = this.filterAndClipIntervals(this.data[domain], lowerBound, upperBound);
			var intervalDurations = intervals.map(this.getIntervalDuration);
			var domainDuration = intervalDurations.reduce((total, duration) => total + duration, 0);
			data.push({
				'key': domain,
				'value': domainDuration
			});
		}

		this.showChart(data, 'doughnut');
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
