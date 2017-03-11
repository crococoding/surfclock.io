function getBackground() {
	return chrome.extension.getBackgroundPage();
}

var storage = chrome.storage.local;



popup.init();




function setPreference(key, value) {
	return new Promise(function(resolve, reject) {
		var preference = {};
		preference[key] = value;
		storage.set(preference, function() {
			if(chrome.runtime.lastError) {
				reject(chrome.runtime.lastError.message);
			} else {
				resolve();
			}
		});
	});
}

function getPreference(key, callback) {
	return new Promise(function(resolve, reject) {
		storage.get(key, function(preference) {
			var value = preference[key];
			resolve(value);
		});
	});
}