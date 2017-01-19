function safariNavigate(event) {
	
	var url = event.target.url;
	if (typeof(url) !== 'undefined' && url) { 
		
		if (event.target.browserWindow.activeTab == event.target) {
			backgroundDataCollector.handleUrl(url);
			//console.log(url);
		}
	} else {
		// opened a new empty tab
		backgroundDataCollector.endInterval();
	}
}

function safariActivate(event) {

	var url = null;
	if (typeof(event.target.url) !== 'undefined') { // SafariBrowserTab - switched to a different tab
		url = event.target.url;
	} else if (typeof(event.target.browserWindow) !== 'undefined') { //activated safari by clicking somewhere on a window
		url = event.target.browserWindow.activeTab.url
	} else if (typeof(event.target.activeTab) !== 'undefined') { //SafariBrowserTab - switched to a different safari window
		url = event.target.activeTab.url
	} 

	if (typeof(url) === 'undefined' || !(url)) {
		backgroundDataCollector.endInterval();
	} else {
		backgroundDataCollector.handleUrl(url);
	}

	
}


function safariDeactivate(event) {

	// switching between tabs of a single window 
	
	if (typeof(event.target.browserWindow) !== 'undefined') {
		if (event.target.browserWindow.tabs.length > 1) {
			return;
		}
	}
	backgroundDataCollector.endInterval();

}

safari.application.addEventListener("navigate", safariNavigate, true);
safari.application.addEventListener("deactivate", safariDeactivate, true);
safari.application.addEventListener("activate", safariActivate, true);
