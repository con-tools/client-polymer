(function(document) {
	'use strict';
	var app = document.querySelector('#app');
	app.baseUrl = '/';
	// Listen for template bound event to know when bindings
	// have resolved and content has been stamped to the page
	app.addEventListener('dom-change', function() {
		console.log('Our app is ready to rock!');
	});

	window.addEventListener('WebComponentsReady', function() {// See https://github.com/Polymer/polymer/issues/1381
		// imports are loaded and elements have been registered
	});

	/*
	 * Main area's paper-scroll-header-panel custom condensing transformation of
	 * the appName in the middle-container and the bottom title in the bottom-container.
	 * The appName is moved to top and shrunk on condensing. The bottom sub-title is shrunk to nothing on condensing.
	 */
	window.addEventListener('paper-header-transform', function(e) {
	    var appName = Polymer.dom(document).querySelector('#mainToolbar .app-name');
	    var middleContainer = Polymer.dom(document).querySelector('#mainToolbar .middle-container');
	    // var bottomContainer = Polymer.dom(document).querySelector('#mainToolbar
		// .bottom-container');
	    var detail = e.detail;
	    var heightDiff = detail.height - detail.condensedHeight;
	    var yRatio = Math.min(1, detail.y / heightDiff);
	    // appName max size when condensed. The smaller the number the smaller the
		// condensed size.
	    var maxMiddleScale = 0.50;
	    var auxHeight = heightDiff - detail.y;
	    var auxScale = heightDiff / (1 - maxMiddleScale);
	    var scaleMiddle = Math.max(maxMiddleScale, auxHeight / auxScale + maxMiddleScale);
	    var scaleBottom = 1 - yRatio;
	
	    // Move/translate middleContainer
	    Polymer.Base.transform('translate3d(0,' + yRatio * 100 + '%,0)', middleContainer);
	    
	    // Scale bottomContainer and bottom sub title to nothing and back
	    // Polymer.Base.transform('scale(' + scaleBottom + ') translateZ(0)',
		// bottomContainer);
	
	    // Scale middleContainer appName
	    Polymer.Base.transform('scale(' + scaleMiddle + ') translateZ(0)', appName);
	});
	
	// Scroll page to top and expand header
	app.scrollPageToTop = function() {
		app.$.headerPanelMain.scrollToTop(true);
	};
	
	app.closeDrawer = function() {
		app.$.paperDrawerPanel.closeDrawer();
	};
	
	app.sendRefreshEvent = function() {
	  console.log("Refreshing from server");
	  app.fire('please-refresh-lists');
	};
	
	app.controllCatalogs = {};
	app.getCatalog(catalog, callback) {
		
	}

	ConTroll.setConvention('M2UyZjJlNzE2M2RkYmVkZWZiYjkzZDRiZGJmOGVlNzM1YjBlN2ZkNQ');
	ConTroll.ifAuth(function(){
		ConTroll.getUserEmail(function(email){
			console.log("User authenticated as " + email);
		})
	});
})(document);
