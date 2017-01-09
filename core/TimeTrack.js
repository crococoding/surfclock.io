var timeTrack = {

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
		this.storeIntervalEnd();

		// next interval
		console.log(domain);
		this.domain = domain;
		this.storeIntervalStart();
	},

	endInterval: function() {
		// previous interval
		this.storeIntervalEnd();

		// pause
		console.log("stopped");
		this.domain = null;
	},

	storeIntervalStart: function() {
		if(this.domain) {
			storageApi.store(this.domain, this.getTimestamp(), null);
		}
	},

	storeIntervalEnd: function() {
		if(this.domain) {
			storageApi.store(this.domain, null, this.getTimestamp());
		}
	},

	getDomain: function(url) {
		var regex = /(((http)(s*):\/\/)(www\.)*)/;
		
		if(regex.test(url)) {
			return url.replace(regex,'').split(/[/?#]/)[0];
		}

		return null;
	},

	getTimestamp: function() {
		// in seconds
		return Math.round(Date.now() / 1000);
	},

	url: null,

	domain: null

}
