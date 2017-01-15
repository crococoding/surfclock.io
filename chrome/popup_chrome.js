// messaging with background page

var port = chrome.extension.connect({
	name: 'TimeTrack Communication'
});

var backgroundCommunication = {

	reinstateDomain: function() {
		port.postMessage('reinstateDomain');
	}

}
