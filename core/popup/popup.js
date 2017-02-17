window.onload = function() {

	popup.init();

}

var popup = {

	init: function() {
		popup.initResetControl();
		popup.initObservationControl()
		popup.initChart();
		popup.domain = getBackground().logger.domain;
		popup.update({
			'from' : 0,
			'till' : getBackground().getTimestamp()
		});
	},

	initObservationControl: function() {
		getBackground().database.getBeginning().then(function(beginning) {
			var now = getBackground().getTimestamp();
			const totalDuration = now - beginning;

			const minute = 1000 * 60;
			const hour = minute * 60;
			const day = hour * 24;
			const scales = [minute, hour, day];

			var scaleIndex = 0;
			if(totalDuration > 5 * day) {
				scaleIndex = 2;
			} else if(totalDuration > day) {
				scaleIndex = 1;
			}

			beginning = beginning - beginning % scales[scaleIndex]; // start at round number

			var slider = document.getElementById('observationControl');
			noUiSlider.create(slider, {
				start: [beginning, now],
				connect: true, // display a colored bar between the handles
				behaviour: 'drag',
				margin: scales[scaleIndex], // minimum between start and end
				step: scales[scaleIndex],
				pips: {
					mode: 'steps',
				},
				format: {
					from: Number,
					to: function(number) {
						return Math.round(number); // skip decimals
					}
				},
				range: {
					'min': beginning,
					'max': now
				},
			});
			
			// update preference and chart data when moving the slider is done
			slider.noUiSlider.on('change', function(values) {
				var preference = {
					'from' : values[0],
					'till' : values[1]
				}
				// setPreference('observationPeriod', preference);
		    	popup.update(preference);
			});
			
			// update slider duration while moving the slider
			slider.noUiSlider.on('slide', function(values) {
				var from = values[0];
				var till = values[1];
				popup.showObservationPeriod(from, till);
			});

			popup.showObservationPeriod(beginning, now);
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
				popup.showDurations();
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

	showObservationPeriod: function(from, till) {
		function displayTimestamp(milliseconds) {
			var date = new Date(milliseconds) + '';
			return date.substring(0, date.lastIndexOf(':'));
		}

		document.getElementById('text').innerHTML = displayTimestamp(from) + ' - ' + displayTimestamp(till) + ' (' + popup.getPrettyTime(till - from) + ')';
	},

	showDurations: function() {
		// total
		var totalDuration = popup.sumArray(popup.chart.data.datasets[0].data);
		document.getElementById('totalDuration').innerHTML = totalDuration ? popup.getPrettyTime(totalDuration) : '0 minutes';	

		// domain
		if(popup.domain && popup.chart.labels && totalDuration) {
			var index = popup.chart.labels.indexOf(popup.domain);
			var domainDuration = popup.getDomainDuration(index);
			
			document.querySelector('#info p:last-of-type').style.display = 'block';
			document.getElementById('domain').innerHTML = popup.domain;
			document.getElementById('domainDuration').innerHTML = domainDuration ? popup.getPrettyTime(domainDuration) : '0 minutes';
		} else {
			document.querySelector('#info p:last-of-type').style.display = 'none';
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
		var hours = parseInt((milliseconds/(1000*60*60))%24);
		var days = parseInt(milliseconds/(1000*60*60*24));

		if(days + hours + minutes == 0) {
			return '< 1 minute';
		} else {
			function getTimePartString(timePart, timePartName) {
				return timePart ? ' ' + popup.numerus(timePart, timePartName) : '';
			};

			var time = '';
			time += getTimePartString(days, 'day');
			time += getTimePartString(hours, 'hour');
			time += getTimePartString(minutes, 'minute');

			time = time.slice(1);

			return time;
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
