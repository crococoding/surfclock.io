var port = chrome.extension.connect({
	name: 'TimeTrack Communication'
});

port.onMessage.addListener(function(message) {
	timeTrackPopup.processMessage(message);
});

function callApi(command, content) {
	port.postMessage({
		"command": command,
		"content": content
	});
}