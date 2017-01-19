var backgroundDataCollector = {

	handleUrl: function(url) {
		this.url = url;
		var domain = this.getDomain(url);

		if(!domain) {
			this.endInterval();
		} else if(domain != this.domain) {
			this.startInterval(domain);
		}
	},

	startInterval: function(domain) {
		// previous interval
		this.endInterval();

		// new interval
		this.domain = domain;
		database.storeIntervalStart(this.domain, this.getTimestamp());
	},

	endInterval: function() {
		// previous interval
		if(this.domain) {
			database.storeIntervalEnd(this.domain, this.getTimestamp());
		}

		// pause
		this.domain = null;
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

	reinstateDomain: function() {
		this.domain = null;
		this.handleUrl(this.url);
	},

	url: null,

	domain: null

}
