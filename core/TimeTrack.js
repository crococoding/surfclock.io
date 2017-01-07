var timeTrack = {
	startRecording: function(url) {
		var domain = url.replace(/(((http)(s*):\/\/)(www\.)*)/,'').split(/[/?#]/)[0];
		this.updateConsole(domain);
		//alert("current domain: " + domain);
	},

	stopRecording: function() {
		// TODO
		 this.updateConsole(null);
		//alert("stopped");
	},

	updateConsole: function(domain) {
		if (domain != this.domain) {
			console.log(domain);
		}
		this.domain = domain;
	},


	domain: null,

}