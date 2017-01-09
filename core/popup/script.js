window.onload = function() {
	getJsonOfEverything();
}

function processJson(json) {
	document.getElementById("chart").innerHTML = json;
}