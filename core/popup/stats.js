let stats = {

	init: function() {
		stats.initResetControl();
		stats.initObservationControl();
		stats.initChart();
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
			let now = getBackground().getTimestamp();
			now = now - now % scales.minute;

			scale = getScale(now - start);

			// left end of slider is starting time, but only scale-exact
			start -= start % scale[0];
			if(scale[0] == scales.day) {
				// subtract one hour if it is not daylight savings time
				if (!moment(start).isDST()) {
					start -= scales.hour;
				}
				// subtract utc offset (in minutes)
				start -= moment(start).utcOffset() * scales.minute;
			}
			
			steps = {
				'min' : [start, scale[0]],
				'max' : [now]
			};
			if(scale[1]) {
				// additional stop to get more exact stats for last day
				let stop = now - now % scale[0];
				
				// subtract utc offset (in minutes)
				if (scale[0] == scales.day) {	
					stop -= moment(now).utcOffset() * scales.minute;
				}

				steps['75%'] = [stop, scale[1]];
			}
			
			let slider = document.querySelector('#observationControl .rangeSlider');

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

	initChart: function() {
		// destroy the chart in case it already exists (necessary for Safari)
		if(stats.chart) {
			stats.chart.destroy();
		}

		let canvas = document.querySelector('#chart canvas');
		let context = canvas.getContext('2d');

		stats.chart = new Chart(context, {
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
							// canvas.style.cursor = 'pointer';
							const index = e[0]._index;
							stats.domain = stats.chart.labels[index];
						} else {
							// canvas.style.cursor = 'default';
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
	},

	update: function(observationBounds) {
		getBackground().database.getDomains().then(function(domainEntries) {
			return domainEntries.map(function(domainEntry) {
				return getBackground().database.getDuration(domainEntry.domain, observationBounds).then(function(duration) {
					return {
						'domain' : domainEntry.domain,
						'duration' : duration ? duration : 0,
						'color' : domainEntry.color ? domainEntry.color : '#EEEEEE',
					};
				});
			});
		}).then(function(promises) {
			Promise.all(promises).then(function(entries) {
				entries.sort((x, y) => y.duration - x.duration);
				
				stats.data = entries;

				entries = stats.handleSmallEntries(entries, 1.0);

				const domains = entries.map(x => x.domain);
				const durations = entries.map(x => x.duration);
				const colors = entries.map(x => x.color);

				stats.chart.labels = domains;
				stats.chart.data.datasets[0].data = durations;
				stats.chart.data.datasets[0].backgroundColor = colors;
				stats.chart.data.datasets[0].hoverBackgroundColor = colors;

				stats.chart.update();
			});
		}).catch(function(error) {
			console.log(error);
		});
	},

	// put everything smaller than x degrees into "other"; precondition: sorted
	handleSmallEntries: function(entries, thresholdDegrees) {
		const totalDuration = entries
		.map(x => x.duration)
		.reduce((total, duration) => total + duration, 0);

		let other = {
			'domain' : 'other',
			'durationOriginal' : 0,
			'color' : '#EEEEEE',
		};

		for (let i = entries.length - 1; i >= 0; i--) {;
			const entry = entries[i];
			entry.durationOriginal = entry.duration;
			if(entry.duration * 1.0 / totalDuration < thresholdDegrees / 360.0) {
				other.durationOriginal += entry.duration;
				entry.duration = 0;
			}
		}

		other.duration = other.durationOriginal;

		entries.push(other);

		return entries;
	},

	showObservationPeriod: function(from, till) {
		moment.locale(window.navigator.userLanguage || window.navigator.language);

		document.getElementById('observationStart').innerHTML = moment(from).calendar();
		document.getElementById('observationEnd').innerHTML = moment(till).calendar();
		document.getElementById('observationDuration').innerHTML = stats.getPrettyTime(till - from);
	},

	showDurations: function() {
		// total
		const totalDuration = stats.getOriginalDurations().reduce((total, duration) => total + duration, 0);
		document.getElementById('totalDuration').innerHTML = totalDuration ? stats.getPrettyTime(totalDuration) : '0 minutes';	

		// domain
		if(stats.domain && stats.chart.labels && totalDuration) {
			const index = stats.getDomains().indexOf(stats.domain);
			const domainDuration = stats.getOriginalDurations()[index];

			document.querySelector('#info p:last-of-type').style.display = 'block';
			document.getElementById('domain').innerHTML = stats.domain + (stats.inOther(index) ? ' (in other)' : '');
			document.getElementById('domainDuration').innerHTML = domainDuration ? stats.getPrettyTime(domainDuration) : '0 minutes';
		} else {
			document.querySelector('#info p:last-of-type').style.display = 'none';
		}
	},

	// true if duration is so small that it is found in the part "other" of the graph
	inOther: function(index) {
		return stats.chart.data.datasets[0].data[index] == 0 && stats.getOriginalDurations()[index] != 0;
	},

	showIndicator: function() {
		if(stats.domain && stats.chart.labels) {
			let index = stats.getDomains().indexOf(stats.domain);
			const indexOther = stats.chart.labels.length - 1;
			index = stats.inOther(index) ? indexOther : index;

			if(stats.getOriginalDurations()[index] > 0) {
				const arc = stats.chart.getDatasetMeta(0).data[index]._view;
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

			let time = '';
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

	getOriginalDurations: function() {
		return stats.data ? stats.data.map(x => x.durationOriginal) : null;
	},

	getDomains: function() {
		return stats.data ? stats.data.map(x => x.domain) : null;
	},

	domain: null, // domain you chose to inspect details of
	
	data: null,

	chart: null

};


// safari
function viewLoaded() {
	stats.init(); 
}

// init chart after loading this JS file in popup.js
stats.init();