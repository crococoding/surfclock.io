var logger = {

	handleUrl: function(url, faviconUrl) {
		this.url = url;
		var domain = this.getDomain(url);

		if(!domain) {
			this.endInterval();
		} else if(domain != this.domain) {
			// previous interval
			this.endInterval();
			// new interval
			this.startInterval(domain);

			// store color
			this.getFaviconColor(faviconUrl).then(function(color) {
				database.storeColor(domain, color ? rgbToHex(color[0], color[1], color[2]) : null, faviconUrl);
			});
		}
	},

	// main color of favicon in r,g,b array
	getFaviconColor(url) {
		return new Promise(function(resolve, reject) {
			var favicon = document.getElementById('favicon');
			if (!favicon) {
				favicon = document.createElement('img');
				favicon.setAttribute('id', 'favicon');
				favicon.setAttribute('width', '50px');
				favicon.setAttribute('height', '50px');
				document.body.appendChild(favicon);
			}

			favicon.setAttribute('src', url);
			var colorThief = new ColorThief();
			favicon.onload = function() {
				resolve(colorThief.getColor(favicon));
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
		if(this.domain) {
			database.storeIntervalEnd(this.domain, getTimestamp());
		}

		// pause
		this.domain = null;
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

	domain: null

}

function getTimestamp() {
	// in milliseconds since Jan 1st 1970
	return Date.now();
}


function rgbToHex(r, g, b) {
	var componentToHex = function(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? '0' + hex : hex;
	}
	return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}