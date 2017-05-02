function getBackground() {
	return chrome.extension.getBackgroundPage();
}

// function setPreference(key, value) {
// 	return new Promise(function(resolve, reject) {
// 		let preference = {};
// 		preference[key] = value;
// 		chrome.storage.local.set(preference, function() {
// 			if(chrome.runtime.lastError) {
// 				reject(chrome.runtime.lastError.message);
// 			} else {
// 				resolve();
// 			}
// 		});
// 	});
// }

// function getPreference(key, callback) {
// 	return new Promise(function(resolve, reject) {
// 		chrome.storage.local.get(key, function(preference) {
// 			const value = preference[key];
// 			resolve(value);
// 		});
// 	});
// }