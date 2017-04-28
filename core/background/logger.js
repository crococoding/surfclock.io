var logger = {

	handleUrl: function(url) {

		logger.url = url;
		const domain = logger.getDomain(url);

		if(!domain) {
			// internal browser page
			logger.endInterval();
		} else if(domain != logger.domain) {
			// end previous interval
			logger.endInterval().then(function() {
				// start new interval
				logger.startInterval(domain);
			
				// store color (alternative: 'http://favicon.yandex.net/favicon/')
				const faviconUrl = 'https://www.google.com/s2/favicons?domain=' + domain;
				logger.getFaviconColor(faviconUrl).then(function(color) {
					database.storeColor(domain, color);
				});
			});
			
		} else if(domain == logger.domain) {
			database.updateIntervalEnd(logger.domain).catch(function(error) {
				console.log('Error: ' + error);
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
						return resolve(swatches[swatch].getHex());
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


	endInterval: function() {
		const domain = logger.domain;
		logger.paused = true;
		logger.domain = null;

		if(logger.domain) {
			return database.updateIntervalEnd(domain).catch(function(error) {
				console.log('Error: ' + error);
				logger.reinstateDomain();
			});
		} else {
			return Promise.resolve();
		}
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

