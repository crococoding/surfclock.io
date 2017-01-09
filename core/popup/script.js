window.onload = function() {
	callApi('retrieveIntervals', null); // null means all domains

	document.getElementById('reset').onclick = function(event) {
		callApi('removeIntervals', null); // null means remove everything
	};
}

var timeTrackPopup = {

	processMessage: function(text) {
		document.getElementById('chart').innerHTML = text;
	}

}