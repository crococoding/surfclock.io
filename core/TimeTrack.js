var timeTrack = {
	handleUrl: function(url) {
		var domain = url.replace(/(((http)(s*):\/\/)(www\.)*)/,'').split(/[/?#]/)[0];
		//alert("current domain: " + domain);
	}
}