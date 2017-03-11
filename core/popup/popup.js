

var popup = {
	init: function() {
		getBackground().database.countIntervals().then(function(count) {
			if (count > 5) {
				popup.loadView('stats');
			} else {
				popup.loadView('welcome');
			}

		}).catch(function(error) {
			alert("error counting intervals: " + error);
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



