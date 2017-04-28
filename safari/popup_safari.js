function getBackground() {
	return safari.extension.globalPage.contentWindow;
}


function popoverHandler(event) {
	popup.init();
}

safari.application.addEventListener("popover", popoverHandler, true);




function setPreference(key, value) {
	return new Promise(function(resolve, reject) {
		safari.extension.settings[key] = value;
		resolve();
	});
}

function getPreference(key, callback) {
	return new Promise(function(resolve, reject) {
		var value  = safari.extension.settings[key];
		resolve(value);
	});
}
