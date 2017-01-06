var timeTrack = {
	startRecording: function(url) {
		var domain = url.replace(/(((http)(s*):\/\/)(www\.)*)/,'').split(/[/?#]/)[0];
		alert("current domain: " + domain);
	},

	stopRecording: function() {
		// TODO
		alert("stopped");
	}
}