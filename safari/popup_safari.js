function getBackground() {
	return safari.extension.globalPage.contentWindow;
}


function popoverHandler(event) {
	popup.init();
}

safari.application.addEventListener("popover", popoverHandler, true);
