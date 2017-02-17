var logger = {

	handleUrl: function(url) {

		this.paused = false;

		this.url = url;
		var domain = this.getDomain(url);

		if(!domain) {
			//this.endInterval();
		} else if(domain != this.domain) {


			this.domain = domain;
			database.addUserActivity(this.domain);
			
			// store color
			// 'http://favicon.yandex.net/favicon/''
			
			var faviconUrl = 'https://www.google.com/s2/favicons?domain=' + domain;
			this.getFaviconColor(faviconUrl).then(function(color) {
				database.storeColor(domain, color);
			});
		} else if (domain == this.domain){
			database.updateUserActivity(this.domain);
		}
	},


	// main color of favicon in hex
	getFaviconColor(url) {
		return new Promise(function(resolve, reject) {
			var favicon = document.getElementById('favicon');
			if (!favicon) {
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
					if (swatches[swatch]) {
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
		this.domain = domain;
		database.storeIntervalStart(this.domain, getTimestamp());
	},


	endInterval: function() {

		logger.handleUrl(logger.url);
		this.paused = true;

		// if(this.domain) {
		// 	database.storeIntervalEnd(this.domain, getTimestamp());
		// }

		// // pause
		// this.domain = null;
	},

	reinstateDomain: function() {
		this.domain = null;
		this.handleUrl(this.url, null);
	},

	getDomain: function(url) {
		var regex = /(((http)(s*):\/\/)(www\.)*)/;
		
		if(regex.test(url)) {
			return url.replace(regex, '').split(/[/?#]/)[0];
		}

		return null;
	},

	url: null,

	domain: null,

	// set this to true when browser is not active!
	paused: true,

}




setInterval(function() {

	if (!logger.paused) {
		logger.handleUrl(logger.url);
	}
	
	//console.log("auto update");


	


}, 3000);



function logDB() {
	console.log("started");
	database.retrieve().then(function(val) {
		console.log(val);
	}).catch(function(error) {
		console.log("error: " + error);
	});
}


function getTimestamp() {
	// in milliseconds since Jan 1st 1970
	return Date.now();
}






