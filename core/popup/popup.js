window.onload = function() {
	storageApi.retrieve(null); // null means all domains

	document.getElementById('reset').onclick = function(event) {
		storageApi.remove(null); // null means remove everything
	};
}

var timeTrack = {

	displayClearedSuccess: function() {
		document.getElementById('chart').innerHTML = 'cleared';
	},

	displayJsonResult: function(json) {
		document.getElementById('chart').innerHTML = JSON.stringify(json);
	}

}
