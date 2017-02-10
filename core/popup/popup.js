window.onload = function() {

	popup.init();

}

var popup = {

	init: function() {
		popup.initResetControl();
		popup.initObservationControl().then(function(observationBounds) {
			popup.initChart();
			popup.domain = getBackground().logger.domain;
			popup.update(observationBounds);
		});
	},

	initObservationControl: function() {
		return new Promise(function(resolve, reject) {
			getPreference('observationPeriod').then(function(preference) {
				getBackground().database.getBeginning().then(function(beginning) {
					var threshold = 1000*60*60; // hour: bewtween start and end
					var now = getBackground().getTimestamp();
					var observationPeriod = {
						'from' : beginning,
						'till' : now
					};

					if(preference) {
						observationPeriod = {
							'from' : preference.from,
							'till' : now - beginning > threshold ? preference.till : now
						}
					} else {
						setPreference('observationPeriod', observationPeriod);
					}

					var slider = document.getElementById('observationControl');
					noUiSlider.create(slider, {
						start: [observationPeriod.from, observationPeriod.till],
						connect: true, // display a colored bar between the handles
						margin: threshold,
						behaviour: 'drag',
						tooltips: [true, false],
						range: {
							'min': beginning,
							'max': now
						},
						format: {
							from: Number,
							to: function(milliseconds) {
								var dateTime = new Date(milliseconds);

						    	var date = dateTime.toDateString();
						    	date = date.substring(0, date.lastIndexOf(' '));
						    	var time = dateTime.toTimeString();
						    	time = time.substring(0, time.lastIndexOf(':'));

						        return date + ', ' + time;
							}
						},
					});
					slider.noUiSlider.on('change', function(formattedValues, handle, unencodedValues) {
						var preference = {
							'from' : unencodedValues[0],
							'till' : unencodedValues[1]
						}
						setPreference('observationPeriod', preference);
				    	popup.update(preference);
					});
					slider.noUiSlider.on('slide', function(formattedValues, handle, unencodedValues) {
						var from = unencodedValues[0];
						var till = unencodedValues[1];
						document.querySelector('.noUi-connect').innerHTML = popup.getPrettyTime(till - from);
					});

					document.querySelector('.noUi-connect').innerHTML = popup.getPrettyTime(observationPeriod.till - observationPeriod.from);
					resolve(observationPeriod);
				});
			});
		});
		
	},

	initResetControl: function() {
		document.getElementById('resetControl').onclick = function(event) {
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

	update: function(observationBounds) {
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
					var till = interval['till'] ? interval['till'] : observationBounds['till'];
					if(observationBounds['from'] < till && observationBounds['till'] > from) {
						result.push({
							'from' : Math.max(from, observationBounds['from']),
							'till' : Math.min(till, observationBounds['till'])
						});
					}
				}
				return result;
			}
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

			document.querySelector('#domainInfo h2').innerHTML = popup.domain;
			document.querySelector('#domainInfo p').innerHTML = duration;
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
