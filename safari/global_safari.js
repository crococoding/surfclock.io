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



// var tester = {};

// 	var storageApi = {

// 	store: function(domain, from, till) {

// 		//alert(domain + from + till);

// 		var storedIntervals = JSON.parse(localStorage.getItem(domain));
// 		//var storedIntervals = tester[domain];
// 		var intervals = storedIntervals ? storedIntervals : [];

// 		if(from) {
// 			// new interval
// 			//console.log("from" + domain + JSON.stringify(intervals));
// 			intervals.push({'from': from});
// 			//console.log("from - did push" + domain + JSON.stringify(intervals));
// 		}
		
// 		if(till) {
// 			// save interval end in last interval
			
// 			//console.log("till" + domain + JSON.stringify(intervals));
// 			if (intervals.length <= 0) {
// 				return;
// 			}
// 			intervals[intervals.length - 1]['till'] = till;
// 			//console.log('till minus one: ' + JSON.stringify(intervals[intervals.length - 1]));
// 			//console.log("till - did update" + domain + JSON.stringify(intervals));
// 			//return;
// 		}

// 		try {


// 			localStorage.setItem(domain, JSON.stringify(intervals));

// 		} catch (e) {
// 			if (e == QUOTA_EXCEEDED_ERR) {
// 				alert('Unable to save preferred shirt size.');
// 			} else {
// 				alert('unknown error');
// 			}
// 		}
// 	}

// }