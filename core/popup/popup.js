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
			popup.setChartDefaults();
			popup.showDomainDurationsChart(0, Date.now());
		});
	},

	showResetSuccess: function() {
		// document.getElementById('chart').innerHTML = 'cleared';
		this.updateChart();
	},

	showChart: function(input, options, type) {
		var canvas = document.getElementById('chart');
		var context = canvas.getContext('2d');
		//context.clearRect(0, 0, canvas.width, canvas.height);

		if (this.chart) {
			this.chart.destroy();
		}

		this.chart = new Chart(context, {
			type: type,
			data: input,
			options: options
		});
	},

	showDomainDurationsChart: function(lowerBound, upperBound) {
		var data = [];

		for (var domain in this.data) {
			var intervals = this.filterAndClipIntervals(this.data[domain], lowerBound, upperBound);
			var intervalDurations = intervals.map(this.getIntervalDuration);
			var domainDuration = intervalDurations.reduce((total, duration) => total + duration, 0);
			data.push({
				'domain': domain,
				'duration': domainDuration
			});
		}

		// sort descending
		data.sort((x, y) => (y['duration'] - x['duration']));

		var domains = data.map((x) => x['domain']);
		var durations = data.map((x) => x['duration']);

		var colors = randomColor({
			count: data.length
		});

		var input = {
			labels: domains,
			datasets: [{
				data: durations,
				backgroundColor: colors,
				hoverBackgroundColor: colors,
				borderWidth: Array.from({length: data.length}, () => 2),
				hoverBorderWidth: Array.from({length: data.length}, () => 2),
				hoverBorderColor: Array.from({length: data.length}, () => 'white')
			}]
		}

		this.showChart(input, {}, 'doughnut');
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

	getHoursMinutes: function(milliseconds) {
		var seconds = parseInt((milliseconds/1000)%60);
		var minutes = parseInt((milliseconds/(1000*60))%60);
		var hours = parseInt((milliseconds/(1000*60*60))%24);

		hours = (hours < 10) ? "0" + hours : hours;
		minutes = (minutes < 10) ? "0" + minutes : minutes;
		seconds = (seconds < 10) ? "0" + seconds : seconds;

		return (hours + ":" + minutes);
	},

	setChartDefaults: function() {
		// global
		Chart.defaults.global.tooltips.displayColors = false;
		// doughnut
		Chart.defaults.doughnut.legend.display = false;
		Chart.defaults.doughnut.animation.animateScale = true;
	},

	data: null,

	chart: null

}
