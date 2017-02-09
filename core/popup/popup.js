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
		var observationPeriods = document.querySelectorAll('#observationControl label');
		for(i in observationPeriods) {
			observationPeriods[i].onclick = function(event) {
				setPreference('observationPeriod', this.getAttribute('for')).then(function() {
					popup.update();
				}).catch(function(error) {
					console.log('could not save observaion period: ' + error);
				});
			};	
		}

		// highlight control according to saved preference
		getPreference('observationPeriod').then(function(preference) {
			document.getElementById(preference ? preference : 'all').checked = true;	
		});
	},

	initResetControl: function() {
		document.querySelector('#resetControlGroup a').onclick = function(event) {
			// null means remove everything
			getBackground().database.remove(null);
			getBackground().logger.reinstateDomain();
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
				popup.showTotalInfo();
			},
			afterDraw: function(chart, easing) {
				popup.showIndicator();
			},
		});
	},

	update: function() {
		getPreference('observationPeriod').then(function(preference) {
			var now = getBackground().getTimestamp();
			var difference = now;
			switch (preference) {
				case 'hour'  : difference =              60 * 60 * 1000; break;
				case 'day'   : difference =         24 * 60 * 60 * 1000; break;
				case 'week'  : difference =     7 * 24 * 60 * 60 * 1000; break;
				case 'month' : difference = 4 * 7 * 24 * 60 * 60 * 1000; break;
				default		 : difference = now;
			}

			return {
				'lower' : now - difference,
				'upper' : now
			};

		}).then(function(observationBounds) {
			return new Promise(function(resolve, reject) {
				var promises = [];

				getBackground().database.retrieve().then(function(data) {
					for (var domain in data) {
						promises.push(someFunction(data, domain));
					}

					resolve(promises);
				
				}).catch(function(error) {
					reject(error);
				});
			});

			function someFunction(dataA, domain) {
				return new Promise(function(resolve, reject) {
					getBackground().database.getColor(domain).then(function(color) {
						var intervals = filterAndClipIntervals(dataA[domain], observationBounds);
						var intervalDurations = intervals.map(getIntervalDuration);
						var domainDuration = popup.sumArray(intervalDurations);
						
						var someData = {
							'domain' : domain,
							'duration' : domainDuration,
							'color' : (color ? color : '#EEEEEE'),
						}

						resolve(someData);
					});
				});

				function getIntervalDuration(interval) {
					return (interval['till'] - interval['from']);
				}
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

		}).catch(function(error) {
			console.log('database retrieve error: ' + JSON.stringify(error));
		}).then(function(promises) {
			Promise.all(promises).then(function(chartData) {
				chartData.sort((x, y) => (y['duration'] - x['duration']));

				var domains = chartData.map((x) => x['domain']);
				var durations = chartData.map((x) => x['duration']);
				var colors = chartData.map((x) => x['color']);

				popup.chart.labels = domains;
				popup.chart.data.datasets[0].data = durations;
				popup.chart.data.datasets[0].backgroundColor = colors;
				popup.chart.data.datasets[0].hoverBackgroundColor = colors;

				//console.log(chartData);

				popup.chart.update();
			});
		});
	},

	showTotalInfo: function() {
		var durations = popup.chart.data.datasets[0].data;
		var totalDuration = popup.getPrettyTime(popup.sumArray(durations));
		if(totalDuration) {
			document.querySelector('#totalInfo h2').innerHTML = 'total';
			document.querySelector('#totalInfo p').innerHTML = totalDuration;
		} else {
			document.querySelector('#totalInfo h2').innerHTML = '';
			document.querySelector('#totalInfo p').innerHTML = '';
		}
	},

	showDomainInfo: function() {
		if(popup.domain && popup.chart.labels) {
			var index = popup.chart.labels.indexOf(popup.domain);
			var duration = popup.getPrettyTime(popup.getDomainDuration(index));

			// var animateIn = 'zoomIn';
			// var animateOut = 'zoomOut';

			// document.getElementById('domainInfo').classList.remove(animateIn);
			// document.getElementById('domainInfo').classList.add(animateOut);

			// setTimeout(function() {
			// 	document.getElementById('domainInfo').classList.remove(animateOut);
			// 	document.getElementById('domainInfo').classList.add(animateIn);

				document.querySelector('#domainInfo h2').innerHTML = popup.domain;
				document.querySelector('#domainInfo p').innerHTML = duration;

			// }, 200);
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
		//var seconds = parseInt((milliseconds/1000)%60);
		var minutes = parseInt((milliseconds/(1000*60))%60);
		var hours = parseInt(milliseconds/(1000*60*60));

		if(hours + minutes == 0) {
			return '< 1 minute';
		} else {
			function getTimePartString(timePart, timePartName) {
				return timePart > 0 ? popup.numerus(timePart, timePartName) : '';
			};

			var time = [];
			time.push(getTimePartString(hours, 'hour'));
			time.push(getTimePartString(minutes, 'minute'));

			return time.join(' ');
		}
	},

	numerus: function(number, word) {
		return (number > 1) ? (number + ' ' + word + 's') : (number + ' ' + word);
	},

	sumArray: function(array) {
		return array.reduce((total, duration) => total + duration, 0);
	},

	domain: null, // domain you chose to inspect details of
	
	chart: null

}
