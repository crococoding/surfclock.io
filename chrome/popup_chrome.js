function getBackground() {
	return chrome.extension.getBackgroundPage();
}

var storage = chrome.storage.local;

function setPreference(key, value, callback) {
	var preference = {};
	preference[key] = value;
	storage.set(preference, function() {
		if(chrome.runtime.lastError) {
			console.warn("Whoops.. " + chrome.runtime.lastError.message);
		} else {
			callback();
		}
	});
}

function getPreference(key, callback) {
	storage.get(key, function(preference) {
		var value = preference[key];
		callback(value);
	});
}