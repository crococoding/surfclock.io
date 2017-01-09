var port = chrome.extension.connect({
	name: 'TimeTrack Communication'
});

function getJsonOfEverything() {
	port.postMessage({
		command: "retrieveData",
		content: null // fetch everything
	});
}

port.onMessage.addListener(function(message) {
	processJson(message);
});