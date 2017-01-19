// messaging with background page

function getGlobalDatabase() {
	return chrome.extension.getBackgroundPage().database;
}

var port = chrome.extension.connect({
	name: 'TimeTrack Communication'
});

var backgroundCommunication = {

	reinstateDomain: function() {
		port.postMessage('reinstateDomain');
	}

}
