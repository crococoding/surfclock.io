var logger = {

	handleUrl: function(url) {

		logger.url = url;
		var domain = logger.getDomain(url);

		if(!domain) {
			// internal browser page
			logger.endInterval();
		} else if(domain != logger.domain) {
			// end previous interval
			logger.endInterval(function() {
				// start new interval
				logger.startInterval(domain);
			
				// store color (alternative: 'http://favicon.yandex.net/favicon/')
				var faviconUrl = 'https://www.google.com/s2/favicons?domain=' + domain;
				logger.getFaviconColor(faviconUrl).then(function(color) {
					database.storeColor(domain, color);
				});
			});
			
		} else if(domain == logger.domain) {
			database.updateIntervalEnd(logger.domain).catch(function(error) {
				alert('Error: ' + error);
				logger.reinstateDomain();
			});
		}
	},


	// main color of favicon in hex
	getFaviconColor(url) {
		return new Promise(function(resolve, reject) {
			var favicon = document.getElementById('favicon');
			if(!favicon) {
				favicon = document.createElement('img');
				favicon.setAttribute('id', 'favicon');
				favicon.setAttribute('width', '16px');
				favicon.setAttribute('height', '16px');
				favicon.setAttribute('crossOrigin', 'anonymous'); // necessary for Firefox
				document.body.appendChild(favicon);
			}

			favicon.setAttribute('src', url);
			
			favicon.onload = function() {
				var vibrant = new Vibrant(favicon);
				var swatches = vibrant.swatches();
				for(swatch in swatches) {
					if(swatches[swatch]) {
						resolve(swatches[swatch].getHex());
					}
				}
				// else
				resolve(null);
			}

			favicon.onerror = function() {
				resolve(null);
			}
		});
	},


	startInterval: function(domain) {

		database.storeInterval(domain);

		logger.paused = false;
		logger.domain = domain;
	},


	endInterval: function(completion) {
		if(logger.domain) {
			database.updateIntervalEnd(logger.domain).then(function() {
				logger.paused = true;
				logger.domain = null;
				if (typeof completion == 'function') completion();
			}).catch(function(error) {
				alert('Error: ' + error);
				logger.reinstateDomain();
			});
		} else {
			logger.paused = true;
			logger.domain = null;
			if (typeof completion == 'function') completion();
		}

		// logger.paused = true;
		// logger.domain = null;
	},

	reinstateDomain: function() {
		logger.domain = null;
		logger.handleUrl(logger.url);
	},

	getDomain: function(url) {
		const regex = /(((http)(s?):\/\/)(www\.)?)/;

		return regex.test(url) ? url.replace(regex, '').match(/.*?.(?=(\/|\?|#|$))/)[0] : null;
	},

	url: null,

	domain: null,

	// set this to true when browser is not active!
	paused: true,

}



// refresh intervalEnd every 3 secs
setInterval(function() {
	if (!logger.paused) {
		logger.handleUrl(logger.url);
	}
}, 3000);


function getTimestamp() {
	// in milliseconds since Jan 1st 1970
	return Date.now();
}

