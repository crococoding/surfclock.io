window.onload = function() {

	popup.init();
	
}

var popup = {

	init: function() {
		popup.initObservationControl();
		popup.initResetControl();
		popup.initChart();

		popup.domain = getBackground().backgroundDataCollector.domain;
		popup.setObservationBounds(0, Date.now());
		popup.update();
	},

	initResetControl: function() {
		document.getElementById('resetControl').onclick = function(event) {
			// null means remove everything
			getBackground().database.remove(null, function() {
				getBackground().backgroundDataCollector.reinstateDomain();
			});
		};
	},

	initObservationControl: function() {

	},

	initChart: function() {
		if(popup.chart) {
			popup.chart.destroy();
		}

		var canvas = document.getElementById('chart');
		var context = canvas.getContext('2d');

		popup.chart = new Chart(context, {
			type: 'doughnut',
			data: {
				labels: [],
				datasets: [{
					data: [],
					backgroundColor: [],
					hoverBackgroundColor: [],
					borderWidth: 2,
					hoverBorderWidth: 2,
					hoverBorderColor: 'white',
				}]
			},
			options: {
				cutoutPercentage: 83,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false,
					displayColors: false,
				},
				animation: {
					duration: 1000,
					animateScale: true,
				},
				hover: {
					onHover: function(e) {
						var position = null;
						if (e[0]) {
							canvas.style.cursor = 'pointer';
							var index = e[0]._index;
							popup.domain = popup.chart.labels[index];
						} else {
							canvas.style.cursor = 'default';
						}
					},
				},
			}
		});

		Chart.pluginService.register({
			beforeRender: function (chart, easing) {
				popup.showDomainInfo();
			},
			afterDraw: function(chart, easing) {
				popup.showIndicator();
			},
		});
	},

	setObservationBounds: function(lower, upper) {
		popup.observationBounds = {
			'lower' : lower, 
			'upper' : upper
		};
	},

	update: function() {
		getBackground().database.retrieve(function(data) {
			var chartData = [];

			for (var domain in data) {
				var intervals = popup.filterAndClipIntervals(data[domain]);
				var intervalDurations = intervals.map(popup.getIntervalDuration);
				var domainDuration = popup.sumArray(intervalDurations);
				chartData.push({
					'domain' : domain,
					'duration' : domainDuration
				});
			}

			// sort descending
			chartData.sort((x, y) => (y['duration'] - x['duration']));

			var domains = chartData.map((x) => x['domain']);
			var durations = chartData.map((x) => x['duration']);
			var colors = randomColor({
				count: chartData.length
			});

			popup.chart.labels = domains;
			popup.chart.data.datasets[0].data = durations;
			popup.chart.data.datasets[0].backgroundColor = colors;
			popup.chart.data.datasets[0].hoverBackgroundColor = colors;

			// chart
			popup.chart.update();

			// headline
			var totalDuration = popup.sumArray(durations);
			document.getElementById('headerText').innerHTML = 'Total Time: ' + popup.getPrettyTime(totalDuration);
		});
	},

	showDomainInfo: function() {
		if(popup.domain && popup.chart.labels &&
			document.getElementById('name').innerHTML != popup.domain) {

			// var animateIn = 'zoomIn';
			// var animateOut = 'zoomOut';

			// document.getElementById('domainInfo').classList.remove(animateIn);
			// document.getElementById('domainInfo').classList.add(animateOut);

			// setTimeout(function() {
			// 	document.getElementById('domainInfo').classList.remove(animateOut);
			// 	document.getElementById('domainInfo').classList.add(animateIn);

				var index = popup.chart.labels.indexOf(popup.domain);

				// domain
				document.getElementById('name').innerHTML = popup.domain;

				// duration
				var domainDuration = popup.chart.data.datasets[0].data[index];
				document.getElementById('description').innerHTML = popup.getPrettyTime(domainDuration) + '<br>';

			// }, 200);
		}
	},

	showIndicator: function() {
		if(popup.domain && popup.chart.labels) {
			var index = popup.chart.labels.indexOf(popup.domain);
			var segment = popup.chart.getDatasetMeta(0).data[index]._view;

			var angleRad = (segment.startAngle + segment.endAngle) / 2.0;
			var angleDeg = angleRad * 180.0 / Math.PI;

			document.getElementById('indicator').style.display = 'block';
			document.getElementById('indicator').style.transform = 'rotate(' + angleDeg + 'deg)';
		} else {
			document.getElementById('indicator').style.display = 'none';
		}
	},

	// TODO: getIntervals() in database.js is going to replace this function
	filterAndClipIntervals: function(intervals) {
		var result = [];
		for(i in intervals) {
			var interval = intervals[i];
			var from = interval['from'];
			var till = interval['till'] ? interval['till'] : popup.observationBounds.upper;
			if(popup.observationBounds.lower < till && popup.observationBounds.upper > from) {
				result.push({
					'from' : Math.max(from, popup.observationBounds.lower),
					'till' : Math.min(till, popup.observationBounds.upper)
				});
			}
		}
		return result;
	},

	getIntervalDuration: function(interval) {
		return (interval['till'] - interval['from']);
	},

	getPrettyTime: function(milliseconds) {
		var seconds = parseInt((milliseconds/1000)%60);
		var minutes = parseInt((milliseconds/(1000*60))%60);
		var hours = parseInt(milliseconds/(1000*60*60));

		function getTimePartString(timePart, timePartName) {
			if(timePart > 0) {
				return ' ' + popup.numerus(timePart, timePartName);
			} else {
				return '';
			}
		};

		var time = '';
		time += getTimePartString(hours, 'hour');
		time += getTimePartString(minutes, 'minute');
		time += getTimePartString(seconds, 'second');
		time = time.slice(1);

		return time;
	},

	numerus: function(number, word) {
		return (number > 1) ? (number + ' ' + word + 's') : (number + ' ' + word);
	},

	sumArray: function(array) {
		return array.reduce((total, duration) => total + duration, 0);
	},

	observationBounds: {
		'lower' : null,
		'upper' : null
	},

	domain: null, // domain you chose to inspect details of
	
	chart: null

}
