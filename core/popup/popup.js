var popup = {
	init: function() {
		getBackground().database.getFirstIntervalStart().then(function(start) {
			getBackground().database.getLastIntervalEnd().then(function(end) {
				maxObservationPeriod = end - start;
				if (maxObservationPeriod > 5000) { // 5 minutes
					popup.loadView('stats');
				} else {
					popup.loadView('welcome');
				}
			}).catch(function(error) {
				console.log(error);
			});	
		}).catch(function(error) {
			console.log(error);
		});	
	},

	loadView: function(view) {
		// simple caching mechanism
		//if (view == popup._currentPopup) {return;}

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../core/popup/' + view + '.html', true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState !== 4) return;
			document.write(xhr.responseText);
			document.close();

			popup._currentPopup = view;
		};
		xhr.send();
	}, 

	_currentPopup: null,

}



