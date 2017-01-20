window.onload = function() {
	popup.setChartDefaults();

	// load data
	popup.updateChart();

	// init reset button
	document.getElementById('reset').onclick = function(event) {
		// null means remove everything
		getBackground().database.remove(null, function() {
			getBackground().backgroundDataCollector.reinstateDomain();
			//popup.showResetSuccess();
		});
	};
}

var popup = {

	updateChart: function() {
		getCurrentDomain(function(domain) {
			popup.currentDomain = domain;
			popup.inspectedDomain = domain;
		});

		popup.lowerBound = 0;
		popup.upperBound = Date.now();

		getBackground().database.retrieve(function(data) {
			popup.data = data;
			popup.showDomainDurationsChart();
		});
	},

	showResetSuccess: function() {
		// document.getElementById('chart').innerHTML = 'cleared';
	},

	showChart: function(input, options, type) {
		var canvas = document.getElementById('chart');
		var context = canvas.getContext('2d');

		if (this.chart) {
			this.chart.destroy();
		}

		this.chart = new Chart(context, {
			type: type,
			data: input,
			options: options
		});
	},

	showDomainDurationsChart: function() {
		var data = [];

		for (var domain in this.data) {
			var intervals = this.filterAndClipIntervals(this.data[domain]);
			var intervalDurations = intervals.map(this.getIntervalDuration);
			var domainDuration = this.sumArray(intervalDurations);
			data.push({
				'domain': domain,
				'duration': domainDuration
			});
		}

		// sort descending
		data.sort((x, y) => (y['duration'] - x['duration']));

		var domains = data.map((x) => x['domain']);
		var durations = data.map((x) => x['duration']);
		var totalDuration = this.sumArray(durations);

		var colors = randomColor({
			count: data.length
		});

		var chartInput = {
			labels: domains,
			datasets: [{
				data: durations,
				backgroundColor: colors,
				hoverBackgroundColor: colors,
				borderWidth: 2,
				hoverBorderWidth: 2,
				hoverBorderColor: 'white'
			}]
		}

		var chartOptions = {
			cutoutPercentage: 83,
			tooltips: {
				enabled: false
			},
			animation: {
	            duration: 1000,
	            //easing: 'easeOutBounce',
	            onProgress: function(animation) {
	                popup.showDomainInfo();
	            }
	        },
	        hover: {
	        	onHover: function(e) {
	        		var canvas = document.getElementById('chart');
	        		if (e[0]) {
	        			canvas.style.cursor = 'pointer';
	        			var index = e[0]._index;
						popup.inspectedDomain = domains[index];
	        		} else {
	        			canvas.style.cursor = 'default';
	        			popup.inspectedDomain = popup.currentDomain;
	        		}
	        	}
	        }
		}

		this.showChart(chartInput, chartOptions, 'doughnut');

		document.getElementById('headerText').innerHTML = 'Total Time: ' + this.getNiceTime(totalDuration);
		
	},

	showDomainInfo: function() {
		if(this.inspectedDomain) {
			var intervals = this.filterAndClipIntervals(this.data[this.inspectedDomain]);
			var intervalDurations = intervals.map(this.getIntervalDuration);
			var domainDuration = this.sumArray(intervalDurations);

			var canvas = document.getElementById('chart');
			var context = canvas.getContext('2d');

			context.textAlign = 'center';
			context.fillStyle = 'black';
			context.textBaseline = 'alphabetic';

			var line = 0;
			function writeOnCanvas(text, size = 20) {
				context.font = size + 'px HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial';
				context.fillText(text, canvas.width/2, (canvas.height/2 - 30 + line++ * 30));
			};

			writeOnCanvas(this.inspectedDomain, 30);
			writeOnCanvas(this.getNiceTime(domainDuration));
			writeOnCanvas('for ' + intervals.length + ' visit' + (intervals.length > 1 ? 's' : ''));
		}
	},

	filterAndClipIntervals: function(intervals) {
		var result = [];
		for(i in intervals) {
			var interval = intervals[i];
			var from = interval['from'];
			var till = interval['till'] ? interval['till'] : this.upperBound;
			if(this.lowerBound < till && this.upperBound > from) {
				result.push({
					'from': Math.max(from, this.lowerBound),
					'till': Math.min(till, this.upperBound)
				});
			}
		}
		return result;
	},

	getIntervalDuration: function(interval) {
		return (interval['till'] - interval['from']);
	},

	getNiceTime: function(milliseconds) {
		var seconds = parseInt((milliseconds/1000)%60);
		var minutes = parseInt((milliseconds/(1000*60))%60);
		var hours = parseInt(milliseconds/(1000*60*60));

		function getTimePartString(timePart, timePartName) {
			if(timePart > 0) {
				return ' ' + timePart + ' ' + timePartName + (timePart > 1 ? 's' : '');
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

		// hours = (hours < 10) ? "0" + hours : hours;
		// minutes = (minutes < 10) ? "0" + minutes : minutes;
		// seconds = (seconds < 10) ? "0" + seconds : seconds;

		// return (hours + ":" + minutes);
	},

	sumArray: function(array) {
		return array.reduce((total, duration) => total + duration, 0);
	},

	setChartDefaults: function() {
		// global
		Chart.defaults.global.tooltips.displayColors = false;
		// doughnut
		Chart.defaults.doughnut.legend.display = false;
		Chart.defaults.doughnut.animation.animateScale = true;
	},

	data: null,
	lowerBound: null,
	upperBound: null,
	inspectedDomain: null, // domain you chose to inspect details of
	currentDomain: null, // domain you're on right now
	chart: null

}
