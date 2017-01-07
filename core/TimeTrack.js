var timeTrack = {
	handleUrl: function(url) {
		var domain = this.getDomain(url);

		if(domain == undefined) {
			this.stopRecording();
		} else if(domain != this.domain) {
			this.startRecording(domain);
		}
	},

	startRecording: function(domain) {
		console.log(domain);
		this.domain = domain;
		// TODO: time intervall
		storageApi.store(domain, {from: "x", till: "y"});
	},

	stopRecording: function() {
		console.log("stopped");
		this.domain = null;
		storageApi.retrieve(null); // only for testing
	},

	getDomain: function(url) {
		var regex = /(((http)(s*):\/\/)(www\.)*)/;
		
		if(regex.test(url)) {
			return url.replace(regex,'').split(/[/?#]/)[0];
		}

		return;
	},

	domain: null

}
