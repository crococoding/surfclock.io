var popup = {
	init: function() {
		getBackground().database.getFirstIntervalStart().then(function(start) {
			getBackground().database.getLastIntervalEnd().then(function(end) {
				getBackground().database.getNumberOfDomains().then(function(count) {
					if (start && end && count && end - start > 1000*60*5 && count > 0) { // 5 minutes and at least 1 domain
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



