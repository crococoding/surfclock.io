function getBackground() {
	return safari.extension.globalPage.contentWindow;
}


function popoverHandler(event) {
	popup.updateChart();
}



function getCurrentDomain(callback) {
	callback(getBackground().backgroundDataCollector.domain)
}

safari.application.addEventListener("popover", popoverHandler, true);
