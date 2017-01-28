window.onload = function() {

	popup.init();

}

var popup = {

	init: function() {
		popup.initObservationControl();
		popup.initResetControl();
		popup.initChart();

		popup.domain = getBackground().logger.domain;
		popup.update();
	},

	initObservationControl: function() {
		// save preferences on click
		var observationPeriods = document.querySelectorAll('#observationControlGroup label');
		for(i in observationPeriods) {
			observationPeriods[i].onclick = function(event) {
				setPreference('observationPeriod', this.getAttribute('for'), function() {
					popup.update();
				});
			};	
		}

		// highlight control according to saved preference
		getPreference('observationPeriod', function(preference) {
			document.getElementById(preference ? preference : 'all').checked = true;	
		});
	},

	initResetControl: function() {
		document.querySelector('#resetControlGroup a').onclick = function(event) {
			// null means remove everything
			getBackground().database.remove(null, function() {
				getBackground().logger.reinstateDomain();
			});
		};
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
					hoverBorderColor: 'white',
				}],
			},
			options: {
				cutoutPercentage: 83,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false,
				},
				hover: {
					onHover: function(e) {
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

	update: function() {
		function getIntervalDuration(interval) {
			return (interval['till'] - interval['from']);
		}

		function sumArray(array) {
			return array.reduce((total, duration) => total + duration, 0);
		}

		function filterAndClipIntervals(intervals, observationBounds) {
			var result = [];
			for(i in intervals) {
				var interval = intervals[i];
				var from = interval['from'];
				var till = interval['till'] ? interval['till'] : observationBounds.upper;
				if(observationBounds.lower < till && observationBounds.upper > from) {
					result.push({
						'from' : Math.max(from, observationBounds.lower),
						'till' : Math.min(till, observationBounds.upper)
					});
				}
			}
			return result;
		}

		popup.getObservationBounds(function(observationBounds) {
			getBackground().database.retrieve(function(data) {
				var chartData = [];

				for (var domain in data) {
					var intervals = filterAndClipIntervals(data[domain], observationBounds);
					var intervalDurations = intervals.map(getIntervalDuration);
					var domainDuration = sumArray(intervalDurations);
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
				var totalDuration = popup.getPrettyTime(sumArray(durations));
				if(totalDuration) {
					document.querySelector('#header p').innerHTML = 'Total Time: ' + totalDuration;
				}
			});
		});
	},

	showDomainInfo: function() {
		if(popup.domain && popup.chart.labels) {
			var index = popup.chart.labels.indexOf(popup.domain);
			var duration = popup.getDomainDuration(index);

			// var animateIn = 'zoomIn';
			// var animateOut = 'zoomOut';

			// document.getElementById('domainInfo').classList.remove(animateIn);
			// document.getElementById('domainInfo').classList.add(animateOut);

			// setTimeout(function() {
			// 	document.getElementById('domainInfo').classList.remove(animateOut);
			// 	document.getElementById('domainInfo').classList.add(animateIn);

				document.querySelector('#domainInfo h2').innerHTML = popup.domain;

				if(duration > 0) {
					document.querySelector('#domainInfo p').innerHTML = popup.getPrettyTime(duration);
				} else {
					document.querySelector('#domainInfo p').innerHTML = 'hasn\'t been visited in this time period';
				}

			// }, 200);
		} else {
			document.querySelector('#domainInfo p').innerHTML = 'Hover over an arc to inspect it';
		}
	},

	showIndicator: function() {
		if(popup.domain && popup.chart.labels) {
			var index = popup.chart.labels.indexOf(popup.domain);

			if(popup.getDomainDuration(index) > 0) {
				var arc = popup.chart.getDatasetMeta(0).data[index]._view;
				var angleRad = (arc.startAngle + arc.endAngle) / 2.0;
				var angleDeg = angleRad * 180.0 / Math.PI;

				// show
				document.getElementById('indicator').style.display = 'block';
				document.getElementById('indicator').style.transform = 'rotate(' + angleDeg + 'deg)';
				document.querySelector('#indicator div').style.background = arc.backgroundColor;
				
				return;
			}
		}
		
		// hide
		document.getElementById('indicator').style.display = 'none';
	},

	getDomainDuration(index) {
		return popup.chart.data.datasets[0].data[index];
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

	getObservationBounds: function(callback) {
		getPreference('observationPeriod', function(preference) {
			var now = getBackground().logger.getTimestamp();
			var difference = now;
			switch (preference) {
				case 'hour'  : difference =              60 * 60 * 1000; break;
				case 'day'   : difference =         24 * 60 * 60 * 1000; break;
				case 'week'  : difference =     7 * 24 * 60 * 60 * 1000; break;
				case 'month' : difference = 4 * 7 * 24 * 60 * 60 * 1000; break;
				default		 : difference = now;
			}

			callback({
				'lower' : now - difference,
				'upper' : now
			});
		});
	},

	domain: null, // domain you chose to inspect details of
	
	chart: null

}
