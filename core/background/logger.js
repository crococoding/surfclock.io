var logger = {

	handleUrl: function(url) {
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
	},

	startInterval: function(domain) {
		this.domain = domain;
		database.storeIntervalStart(this.domain, this.getTimestamp());
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
		this.handleUrl(this.url);
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
