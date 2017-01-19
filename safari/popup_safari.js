// api

function getGlobalDatabase() {
	return safari.extension.globalPage.contentWindow.database;
}


function popoverHandler(event) {
	popup.updateChart();
}

safari.application.addEventListener("popover", popoverHandler, true);

// messaging with background page