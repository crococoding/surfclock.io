function getBackground() {
	return safari.extension.globalPage.contentWindow;
}


function popoverHandler(event) {
	popup.init();
}

safari.application.addEventListener("popover", popoverHandler, true);




function setPreference(key, value, callback) {
	safari.extension.settings[key] = value;
	callback();
}

function getPreference(key, callback) {
	var value  = safari.extension.settings[key];
	callback(value);
}