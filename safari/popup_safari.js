function getBackground() {
	return safari.extension.globalPage.contentWindow;
}

safari.application.addEventListener('popover', event => popup.init(), true);

function setPreference(key, value) {
	return new Promise(function(resolve, reject) {
		safari.extension.settings[key] = value;
		resolve();
	});
}

function getPreference(key, callback) {
	return new Promise(function(resolve, reject) {
		const value  = safari.extension.settings[key];
		resolve(value);
	});
}
