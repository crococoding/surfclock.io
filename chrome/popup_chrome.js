function getBackground() {
	return chrome.extension.getBackgroundPage();
}

const storage = chrome.storage.local;

function setPreference(key, value) {
	return new Promise(function(resolve, reject) {
		let preference = {};
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
			const value = preference[key];
			resolve(value);
		});
	});
}