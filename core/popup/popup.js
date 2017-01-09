window.onload = function() {
	storageApi.retrieve(null); // null means all domains

	document.getElementById('reset').onclick = function(event) {
		storageApi.remove(null); // null means remove everything
	};
}

var timeTrack = {

	processResult: function(text) {
		document.getElementById('chart').innerHTML = text;
	}

}
