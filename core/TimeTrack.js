var timeTrack = {
	startRecording: function(url) {
		var domain = this.getDomain(url);

		if(domain == null) {
			this.stopRecording();
		} else if(domain != this.domain) {
			this.domain = domain;
			console.log(domain);

			// TODO: time intervall
			timeTrackApi.save(domain, {start: "x", end: "y"});
		}
	},

	stopRecording: function() {
		console.log("stopped");
		this.domain = null;
	},

	getDomain: function(url) {
		var regex = /(((http)(s*):\/\/)(www\.)*)/;
		
		if(regex.test(url)) {
			return url.replace(regex,'').split(/[/?#]/)[0];
		}

		return null;
	},


	domain: null

}