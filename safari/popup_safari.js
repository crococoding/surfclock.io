function getBackground() {
	return safari.extension.globalPage.contentWindow;
}


function popoverHandler(event) {
	popup.updateChart();
}

safari.application.addEventListener("popover", popoverHandler, true);
