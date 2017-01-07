var timeTrack = {
	startRecording: function(url) {
		var domain = url.replace(/(((http)(s*):\/\/)(www\.)*)/,'').split(/[/?#]/)[0];
		
		if (domain != this.domain) {
			this.domain = domain;
			console.log(domain);
		}

		// TODO
	},

	stopRecording: function() {
		console.log("stopped");

		// TODO
	},


	domain: null,

}