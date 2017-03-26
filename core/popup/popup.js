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
		//if (view == popup._currentPopup) {return;}

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../core/popup/' + view + '.html', true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState !== 4) return;
		 	
		 	// popup wireframe
			const head = document.head;

			const alreadyLoadedStylesheets = Array
				.from(head.querySelectorAll('link'))
				.map(stylesheet => stylesheet.getAttribute('href'));
			
			const alreadyLoadedScripts = Array
				.from(head.querySelectorAll('script'))
				.map(script => script.getAttribute('src'));

			// new view
			const parser = new DOMParser();
			const htmlDoc = parser.parseFromString(xhr.responseText, 'text/html');

			const body = htmlDoc.body.innerHTML;
			
			const stylesheets = htmlDoc.querySelectorAll('head link');

			for(var i = 0; i < stylesheets.length; i++) {
				const href = stylesheets[i].getAttribute('href');
				if (alreadyLoadedStylesheets.indexOf(href) == -1) {
					var stylesheet = document.createElement( 'link' );
					stylesheet.href = href;
					stylesheet.rel = 'stylesheet';
					stylesheet.type = 'text/css';

					head.append(stylesheet);
				}
			}

			const scripts = htmlDoc.querySelectorAll('head script');

			for(var i = 0; i < scripts.length; i++) {
				const src = scripts[i].getAttribute('src');
				if (alreadyLoadedScripts.indexOf(src) == -1) {
					var script = document.createElement( 'script' );
					script.src = src;
					script.async = false;

					head.append(script);
				}
			}

			document.body.innerHTML = body;

			if (typeof viewLoaded == 'function') {
				viewLoaded();
			}


			popup._currentPopup = view;
		};
		xhr.send();
	}, 

	_currentPopup: null,

}



