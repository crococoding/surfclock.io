var timeTrack = {

	handleUrl: function(url) {
		var domain = this.getDomain(url);

		if(domain == null) {
			this.endInterval();
		} else if(domain != this.domain) {
			this.startInterval(domain);
		}
	},

	startInterval: function(domain) {
		// previous interval
		this.storePreviousIntervalEnd();

		// next interval
		console.log(domain);
		this.domain = domain;
		this.storeNewIntervalStart();
	},

	endInterval: function() {
		// previous interval
		this.storePreviousIntervalEnd();

		// pause
		console.log("stopped");
		this.domain = null;

		// only for testing
		// setTimeout(function() {
		// 	storageApi.retrieve(null);
		// }, 2000);
	},

	storeNewIntervalStart: function() {
		if(this.domain != null) {
			storageApi.store(this.domain, this.getTimestamp(), null);
		}
	},

	storePreviousIntervalEnd: function() {
		if(this.domain != null) {
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
		return Math.round(+new Date() / 1000);
	},

	domain: null

}
