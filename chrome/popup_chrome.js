function getBackground() {
	return chrome.extension.getBackgroundPage();
}

function getCurrentDomain(callback) {
	chrome.tabs.query({
		'active': true, 
		'currentWindow': true
	}, function(tabs) {
		var tab = tabs[0];
		var domain = getBackground().backgroundDataCollector.getDomain(tab.url);
		callback(domain);
	});
}