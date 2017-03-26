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

		var xhr = new XMLHttpRequest();
		xhr.open('GET', '../core/popup/' + view + '.html', true);
		xhr.onreadystatechange = function() {
			if(xhr.readyState !== 4) return;
			// document.write(xhr.responseText);
			// document.close();
			// 
			// 
			// alert('hello');
			 
			var parser = new DOMParser();
			var htmlDoc = parser.parseFromString(xhr.responseText, "text/html");

			// console.log(xml.responseText);
			var body = htmlDoc.body.innerHTML;

			var stylesheets = htmlDoc.querySelectorAll('head link');
			var scripts = htmlDoc.querySelectorAll('head script');

			var head = document.head;


			var alreadyLoadedStylesheetsList = head.querySelectorAll('link');
			var alreadyLoadedStylesheets = [];
			[].forEach.call(alreadyLoadedStylesheetsList, function(link) {
				alreadyLoadedStylesheets.push(link.getAttribute('href'));
			
			});


			var alreadyLoadedScriptsList = head.querySelectorAll('script');
			var alreadyLoadedScripts = [];
			[].forEach.call(alreadyLoadedScriptsList, function(script) {
				alreadyLoadedScripts.push(script.getAttribute('src'));
			
			});



			for(var i = 0; i < stylesheets.length; i++) {
				var href = stylesheets[i].getAttribute('href');
				if (alreadyLoadedStylesheets.indexOf(href) == -1) {
					var stylesheet = document.createElement( 'link' );
					// script.type = 'text/javascript';
					stylesheet.href = href;
					stylesheet.rel = 'stylesheet';
					stylesheet.type = 'text/css';
					// alert(JSON.stringify(scripts[i]));

					head.append(stylesheet);
				} else {
					console.log('found stylesheet: ' + href);
				}
			}


			// alert(JSON.stringify(scripts));

			for(var i = 0; i < scripts.length; i++) {
				var src = scripts[i].getAttribute('src');
				if (alreadyLoadedScripts.indexOf(src) == -1) {
					var script = document.createElement( 'script' );
					// script.type = 'text/javascript';
					script.src = src;
					script.async = false;
					// alert(JSON.stringify(scripts[i]));

					head.append(script);
				}
			}


			document.body.innerHTML = body;



			// window.onload();

			// stylesheets.forEach(function(stylesheet) {
				
			// });
			// 
			

			if (typeof viewLoaded == 'function') {
				viewLoaded();
			}


			popup._currentPopup = view;
		};
		xhr.send();
	}, 

	_currentPopup: null,

}



