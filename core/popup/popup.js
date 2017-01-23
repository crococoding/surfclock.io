window.onload = function() {

	popup.init();
	
}

var popup = {

	init: function() {
		popup.initObservationControl();
		popup.initResetControl();
		popup.setChartLayout();

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

	setChartLayout: function() {
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
					hoverBorderColor: 'white'
				}]
			},
			options: {
				cutoutPercentage: 83,
				legend: {
					display: false
				},
				tooltips: {
					//enabled: false,
					displayColors: false
				},
				animation: {
		            duration: 1000,
		            animateScale: true,
		            //easing: 'easeOutBounce',
		            onProgress: function(animation) {
		                //if(animation.animationObject.currentStep == 1) {
		            		popup.showDomainInfo();
		            	//}
		            }
		        },
		        hover: {
		        	onHover: function(e) {
		        		var position = null;
		        		if (e[0]) {
		        			canvas.style.cursor = 'pointer';
		        			var index = e[0]._index;
		        			//position = e[0].tooltipPosition();
							popup.domain = popup.chart.labels[index];
		        		} else {
		        			canvas.style.cursor = 'default';
		        		}
		        		//popup.showDomainInfo();
		        	}
		        }
			}
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
			popup.domain != document.getElementById('name').innerHTML) {
			
			//getBackground().database.getIntervals(popup.domain, popup.observationBounds, function(intervals) {

				// var animateIn = 'zoomIn';
				// var animateOut = 'zoomOut';

				// document.getElementById('domainInfo').classList.remove(animateIn);
				// document.getElementById('domainInfo').classList.add(animateOut);

				// setTimeout(function() {
					// document.getElementById('domainInfo').classList.remove(animateOut);
					// document.getElementById('domainInfo').classList.add(animateIn);




					// domain
					document.getElementById('name').innerHTML = popup.domain;

					// duration
					var index = popup.chart.labels.indexOf(popup.domain);
					var domainDuration = popup.chart.data.datasets[0].data[index];
					document.getElementById('description').innerHTML = popup.getPrettyTime(domainDuration) + '<br>';

					// visits
					//document.getElementById('description').innerHTML += 'for ' + popup.numerus(intervals.length, 'visit');





					// indicator

					var canvas = document.getElementById('chart');
					var context = canvas.getContext('2d');

					var centerX = canvas.width/2;
					var centerY = canvas.height/2;
					var r =  300;

					var startAngle = 90.0;

					var degrees = 0 - startAngle;
					// defines the starting point of the line
					context.moveTo(centerX, centerY);
					// defines the ending point of the line
					context.lineTo(centerX + r * Math.cos(degrees * Math.PI / 180.0), centerY + r * Math.sin(degrees * Math.PI / 180.0));
					context.strokeStyle = 'black';
					context.stroke();




				// }, 200);				
			//});
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
