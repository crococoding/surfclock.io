var popup = {
	init: function() {
		getBackground().database.getFirstIntervalStart().then(function(start) {
			// > 5 minutes since 1st domain visit
			if (start && getBackground().getTimestamp() - start > 1000*60*5) {
				popup.loadView('stats');
			} else {
				popup.loadView('welcome');
			}
		}).catch(function(error) {
			console.log(error);
		});	
	},

	loadView: function(view) {
		// simple caching mechanism
		// if (view == popup._currentPopup) {return;}


		// load markup for view
		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../core/popup/' + view + '.html', true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState !== 4) return;

			// parse responseText string to DOM
			const htmlDoc = new DOMParser().parseFromString(xhr.responseText, 'text/html');

			// stylesheets

			// add new stylesheets to head
			const alreadyLoadedStylesheets = Array
				.from(document.head.querySelectorAll('link'))
				.map(stylesheet => stylesheet.getAttribute('href'));

			const newStylesheets = Array
				.from(htmlDoc.querySelectorAll('head link'))
				.filter(stylesheet => alreadyLoadedStylesheets.indexOf(stylesheet.href) == -1)
				.forEach(stylesheet => {
					var newStylesheet = document.createElement('link');
					newStylesheet.href = stylesheet.href;
					newStylesheet.rel = 'stylesheet';
					newStylesheet.type = 'text/css';

					document.head.append(newStylesheet);
				});

			// scripts
			
			// add new scripts to head
			const alreadyLoadedScripts = Array
				.from(document.head.querySelectorAll('script'))
				.map(script => script.getAttribute('src'));

			const newScripts = Array
				.from(htmlDoc.querySelectorAll('head script'))
				.filter(script => alreadyLoadedScripts.indexOf(script.src) == -1)
				.forEach(script => {
					var newScript = document.createElement('script');
					newScript.src = script.src;
					newScript.async = false;

					document.head.append(newScript);
				});

			// change HTML body
			document.body.innerHTML = htmlDoc.body.innerHTML;


			// call viewLoaded function - Safari
			if (typeof viewLoaded == 'function') {
				viewLoaded();
			}


			popup._currentPopup = view;
		};
		xhr.send();
	}, 

	_currentPopup: null,

}



