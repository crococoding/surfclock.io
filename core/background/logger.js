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
		}

		
		this.getFaviconColor(faviconUrl, function(color) {
			if (color) {
				database.storeColor(domain, rgbToHex(color[0], color[1], color[2]), faviconUrl);
			} else {
				database.storeColor(domain, null, faviconUrl);
			}
		});

	},


	getFaviconColor(url, callback) {
		var favicon = document.getElementById('favicon');
		if (!favicon) {
			favicon = document.createElement('img');
			favicon.setAttribute('id', 'favicon');
			document.body.appendChild(favicon);
		}

		favicon.setAttribute('src', url);
		var colorThief = new ColorThief();
		favicon.onload = function() {
			callback(colorThief.getColor(favicon));
		}

		favicon.onerror = function() {
			callback(null);
		}
	},


	startInterval: function(domain) {
		this.domain = domain;
		database.storeIntervalStart(this.domain, this.getTimestamp());
		//database.storeColor('facebook.com', '#0000FF');

	},


	endInterval: function() {
		if(this.domain) {
			database.storeIntervalEnd(this.domain, this.getTimestamp());
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

	getTimestamp: function() {
		// in milliseconds since Jan 1st 1970
		return Date.now();
	},

	url: null,

	domain: null

}


function rgbToHex(r, g, b) {
	var componentToHex = function(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}