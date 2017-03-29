var stats = {

	init: function() {
		stats.initResetControl();
		stats.initObservationControl();
		stats.chart = new DoughnutChart(document.querySelector('#chart canvas'));
		stats.domain = getBackground().logger.domain;
		stats.update({
			'from' : 0,
			'till' : getBackground().getTimestamp()
		});
	},

	initObservationControl: function() {
		getBackground().database.getFirstIntervalStart().then(function(start) {
			const scales = {
				'second' : 1000,
				'minute' : 1000 * 60,
				'hour'	 : 1000 * 60 * 60,
				'day'	 : 1000 * 60 * 60 * 24,
			};
			/* returns the observation slider scale: 
			   second element for the last quarter if it's special */
			function getScale(duration) {
				if(duration > 3 * scales.day) {
					return [scales.day, scales.hour];
				} else if(duration > 12 * scales.hour) {
					return [scales.hour];
				} else {
					return [scales.minute];
				}
			};

			// right end of slider is current time, but only minute-exact
			var now = getBackground().getTimestamp();
			now = now - now % scales.minute;

			scale = getScale(now - start);

			// left end of slider is starting time, but only scale-exact
			start = start - start % scale[0];
			if(scale[0] == scales.day && !moment(start).isDST()) {
				// subtract one hour if it is not daylight savings time
				start -= scales.hour;
			}
			
			steps = {
				'min' : [start, scale[0]],
				'max' : [now]
			};
			if(scale[1]) {
				// add additional stop to get hour-exact stats for last day
				steps['75%'] = [now - now % scale[0], scale[1]];
			}
			
			var slider = document.querySelector('#observationControl .rangeSlider');

			// destroy the slider in case it already exists (necessary for Safari)
			if (slider.noUiSlider) {
				slider.noUiSlider.destroy();
			}

			noUiSlider.create(slider, {
				start: [start, now],
				connect: true, // display a colored bar between the handles
				behaviour: 'drag',
				format: {
					from: Number,
					to: function(number) {
						return Math.round(number); // skip decimals
					}
				},
				range: steps,
			});
			
			// update preference and chart data when moving the slider is done
			slider.noUiSlider.on('change', function(values) {
		    	stats.update({
					'from' : values[0],
					'till' : values[1]
				});
			});
			
			// update slider duration while moving the slider
			slider.noUiSlider.on('slide', function(values) {
				const from = values[0];
				const till = values[1];
				stats.showObservationPeriod(from, till);
			});

			stats.showObservationPeriod(start, now);
		}).catch(function(error) {
			console.log(error);
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

			// come back to welcome view
			popup.loadView('welcome');
		};
	},

	update: function(observationBounds) {
		getBackground().database.getDomains().then(function(domainEntries) {
			return domainEntries.map(function(domainEntry) {
				return new Promise(function(resolve, reject) {
					// fetch duration
					getBackground().database.getDuration(domainEntry.domain, observationBounds).then(function(duration) {
						resolve({
							'domain' : domainEntry.domain,
							'duration' : duration ? duration : 0,
							'color' : domainEntry.color ? domainEntry.color : '#EEEEEE',
						});
					}).catch(function(error) {
						reject(error);
					});
				});
			});
		}).then(function(promises) {
			Promise.all(promises).then(function(entries) {
				entries.sort((x, y) => y.duration - x.duration);
				stats.data = entries;
				stats.chart.update();
			});
		}).catch(function(error) {
			console.log(error);
		});
	},

	showObservationPeriod: function(from, till) {
		moment.locale(window.navigator.userLanguage || window.navigator.language);

		document.getElementById('observationStart').innerHTML = moment(from).calendar();
		document.getElementById('observationEnd').innerHTML = moment(till).calendar();
		document.getElementById('observationDuration').innerHTML = stats.getPrettyTime(till - from);
	},

	showDurations: function() {
		// total
		const totalDuration = stats.data.map(x => x.duration).reduce((total, duration) => total + duration, 0);
		document.getElementById('totalDuration').innerHTML = totalDuration ? stats.getPrettyTime(totalDuration) : '0 minutes';	

		// domain
		if(stats.domain && stats.data.map(x => x.domain) && totalDuration) {
			const index = stats.data.map(x => x.domain).indexOf(stats.domain);
			const domainDuration = stats.getDomainDuration(index);
			
			document.querySelector('#info p:last-of-type').style.display = 'block';
			document.getElementById('domain').innerHTML = stats.domain;
			document.getElementById('domainDuration').innerHTML = domainDuration ? stats.getPrettyTime(domainDuration) : '0 minutes';
		} else {
			document.querySelector('#info p:last-of-type').style.display = 'none';
		}
	},

	showIndicator: function() {
		if(stats.domain && stats.chart.chart.labels) {
			const index = stats.chart.chart.labels.indexOf(stats.domain);

			if(stats.getDomainDuration(index) > 0) {
				const arc = stats.chart.chart.getDatasetMeta(0).data[index]._view;
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
		return stats.data.map(x => x.duration)[index];
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
				return timePart ? ' ' + stats.numerus(timePart, timePartName) : '';
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

	data: null,

	chart: null
}


class DoughnutChart {

	constructor(canvas) {
		// destroy the chart in case it already exists (necessary for Safari)
		if(this.chart) {
			this.chart.destroy();
		}

		var context = canvas.getContext('2d');

		this.chart = new Chart(context, {
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
							stats.domain = stats.data.map(x => x.domain)[index];
						} else {
							canvas.style.cursor = 'default';
						}
					},
				},
			}
		});

		Chart.pluginService.register({
			beforeRender: function (chart, easing) {
				stats.showDurations();
			},
			afterDraw: function(chart, easing) {
				stats.showIndicator();
			},
		});
	}

	update() {
		const entries = this.handleSmallEntries(stats.data, 1.0);
		const domains = entries.map(x => x.domain);
		const durations = entries.map(x => x.duration);
		const colors = entries.map(x => x.color);

		this.chart.labels = domains;
		this.chart.data.datasets[0].data = durations;
		this.chart.data.datasets[0].backgroundColor = colors;
		this.chart.data.datasets[0].hoverBackgroundColor = colors;

		this.chart.update();
	}

	// put everything smaller than x degrees into "other"; precondition: sorted
	handleSmallEntries(entries, thresholdDegrees) {
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
	}

};


// safari
function viewLoaded() {
	stats.init(); 
}

// init chart after loading this JS file in popup.js
stats.init();