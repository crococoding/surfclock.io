window.onload = function() {

	popup.init();

}

var popup = {

	init: function() {

		function initGraph() {
			popup.initResetControl();
			popup.initObservationControl();
			popup.initChart();
			popup.domain = getBackground().logger.domain;
			popup.update({
				'from' : 0,
				'till' : getBackground().getTimestamp()
			});
		}

		function initWelcomeScreen() {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', '../core/popup/welcome.html', true);
			xhr.onreadystatechange = function() {
				if(xhr.readyState !== 4) return;
				document.write(xhr.responseText);
				document.close();
			};
			xhr.send();
		}



		getBackground().database.countIntervals().then(function(count) {

			if (count > 5) {
				initGraph();
			} else {
				initWelcomeScreen();
			}

		}).catch(function(error) {
			alert("error counting intervals: " + error);
		});

		

		
	},

	initObservationControl: function() {
		getBackground().database.getBeginning().then(function(beginning) {
			const now = getBackground().getTimestamp();
			const totalDuration = now - beginning;

			const second = 1000;
			const minute = second * 60;
			const hour = minute * 60;
			const day = hour * 24;
			const scales = [second, minute, hour, day];

			var scaleIndex = 1;
			if(totalDuration > 3 * day) {
				scaleIndex = 3;
			} else if(totalDuration > 12 * hour) {
				scaleIndex = 2;
			}
			
			// subtract hour so that it starts at 00:00
			beginning = beginning - (beginning % scales[scaleIndex]) - hour; // start at round number

			var slider = document.getElementById('observationControl');

			// destroy the slider in case it already exists (necessary for Safari)
			if (slider.noUiSlider) {
				slider.noUiSlider.destroy();
			}

			noUiSlider.create(slider, {
				start: [beginning, now],
				connect: true, // display a colored bar between the handles
				behaviour: 'drag',
				// margin: scales[scaleIndex], // minimum between start and end
				// step: scales[scaleIndex],
				format: {
					from: Number,
					to: function(number) {
						return Math.round(number); // skip decimals
					}
				},
				range: {
					'min' : [beginning, scales[scaleIndex]],
					'75%' : [now - now % scales[scaleIndex], scales[scaleIndex - 1]],
					'max' : [now]
				},
			});
			
			// update preference and chart data when moving the slider is done
			slider.noUiSlider.on('change', function(values) {
		    	popup.update({
					'from' : values[0],
					'till' : values[1]
				});
			});
			
			// update slider duration while moving the slider
			slider.noUiSlider.on('slide', function(values) {
				const from = values[0];
				const till = values[1];
				popup.showObservationPeriod(from, till);
			});

			popup.showObservationPeriod(beginning, now);
		});
	},

	initResetControl: function() {
		document.getElementById('resetControl').onclick = function(e) {
			
			e.preventDefault();

			// delete entries from database
			// null means remove everything 
			getBackground().database.remove(null);

			// start a new interval
			getBackground().logger.reinstateDomain();

			// reload chart
			popup.update({
				'from' : 0,
				'till' : getBackground().getTimestamp()
			});
		};
	},

	initChart: function() {
		// destroy the chart in case it already exists (necessary for Safari)
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
		getBackground().database.getDomains().then(function(domains) {
			return domains.map(function(domain) {
				return new Promise(function(resolve, reject) {
					var entry = {
						'domain' : domain,
						'duration' : 0,
						'color' : '#EEEEEE',
					};
					// fetch color and duration in parallel
					Promise.all([
						// color
						new Promise(function(resolve, reject) {
							getBackground().database.getColor(domain).then(function(color) {
								entry.color = color ? color : '#EEEEEE';
								resolve();
							});
						}),
						// duration
						new Promise(function(resolve, reject) {
							getBackground().database.getDuration(domain, observationBounds).then(function(duration) {
								entry.duration = duration ? duration : 0;
								resolve();
							});
						})
					]).catch(function(error) {
						console.log(error);
					}).then(function() {
						resolve(entry);
					});
				});
			});
		}).then(function(promises) {
			Promise.all(promises).then(function(entries) {
				entries.sort((x, y) => y.duration - x.duration);
				entries = popup.handleSmallEntries(entries, 1.0);

				const domains = entries.map(x => x.domain);
				const durations = entries.map(x => x.duration);
				const colors = entries.map(x => x.color);

				popup.chart.labels = domains;
				popup.chart.data.datasets[0].data = durations;
				popup.chart.data.datasets[0].backgroundColor = colors;
				popup.chart.data.datasets[0].hoverBackgroundColor = colors;

				popup.chart.update();
			});
		});
	},

	// put everything smaller than x degrees into "other"; precondition: sorted
	handleSmallEntries: function(entries, thresholdDegrees) {
		const totalDuration = entries
		.map(x => x.duration)
		.reduce((total, duration) => total + duration, 0);

		var other = {
			'domain' : 'other',
			'duration' : 0,
			'color' : '#EEEEEE',
		};

		for (var i = entries.length - 1; i >= 0; i--) {;
			const entry = entries[i];
			if(entry.duration * 1.0 / totalDuration < thresholdDegrees / 360.0) {
				other.duration += entry.duration;
				entry.duration = 0;
			} else {
				break; // because we're iterating backwards, no smaller values will come
			}
		}

		entries.push(other);

		return entries;
	},

	showObservationPeriod: function(from, till) {
		moment.locale(window.navigator.userLanguage || window.navigator.language);

		// const start = moment(from).format('llll');
		// const end = moment(till).format('llll');

		const start = moment(from).calendar();
		const end = moment(till).calendar();

		const duration = popup.getPrettyTime(till - from);

		document.getElementById('text').innerHTML = '<b>' + start + ' - ' + end + '</b><br>' + duration + '';
	},

	showDurations: function() {
		// total
		const totalDuration = popup.chart.data.datasets[0].data.reduce((total, duration) => total + duration, 0);
		document.getElementById('totalDuration').innerHTML = totalDuration ? popup.getPrettyTime(totalDuration) : '0 minutes';	

		// domain
		if(popup.domain && popup.chart.labels && totalDuration) {
			const index = popup.chart.labels.indexOf(popup.domain);
			const domainDuration = popup.getDomainDuration(index);
			
			document.querySelector('#info p:last-of-type').style.display = 'block';
			document.getElementById('domain').innerHTML = popup.domain;
			document.getElementById('domainDuration').innerHTML = domainDuration ? popup.getPrettyTime(domainDuration) : '0 minutes';
		} else {
			document.querySelector('#info p:last-of-type').style.display = 'none';
		}
	},

	showIndicator: function() {
		if(popup.domain && popup.chart.labels) {
			const index = popup.chart.labels.indexOf(popup.domain);

			if(popup.getDomainDuration(index) > 0) {
				const arc = popup.chart.getDatasetMeta(0).data[index]._view;
				const angleRad = (arc.startAngle + arc.endAngle) / 2.0;
				const angleDeg = angleRad * 180.0 / Math.PI;

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
		const duration = moment.duration(milliseconds, 'milliseconds');

		const minutes = duration.minutes();
		const hours = duration.hours();
		const days = duration.days();

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

	domain: null, // domain you chose to inspect details of
	
	chart: null

}
