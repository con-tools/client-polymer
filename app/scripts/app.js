(function(document) {
	'use strict';
	
	var Catalog = function(catalogName) {
		this.catalog = catalogName;
		this.callbacks = [];
		this.content = null;
	};
	
	Catalog.prototype.get = function(callback) {
		if (this.content) {
			// locally cache content in case we get an invalidation before we can delivery
			var localContent = this.content;
			window.setTimeout(function(){ callback(localContent); },0);
			return;
		}
		
		if (this.callbacks.length > 0) { // already someone waiting, lets wait as well
			this.callbacks.push(callback);
			return;
		}
		
		this.callbacks.push(callback);
		ConTroll[this.catalog].catalog(this.handleCallback.bind(this));
	};
	
	Catalog.prototype.handleCallback = function(content) {
		this.content = content;
		this.callbacks.forEach(function(callback){
			callback(content);
		});
		this.callbacks = [];
	}
	
	Catalog.prototype.invalidate = function() {
		this.content = null;
		this.callbacks = [];
	};
	
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
	  // first invalidate catalog caches
	  for (catalog in app.controllCatalogs)
		  app.controllCatalogs[catalog].invalidate();
	  app.fire('please-refresh-lists');
	};
	
	app.controllCatalogs = {};
	app.getCatalog = function(catalog, callback) {
		if (!this.controllCatalogs[catalog]) this.controllCatalogs[catalog] = new Catalog(catalog);
		this.controllCatalogs[catalog].get(callback);
	};
	app.invalidateCatalog = function(catalog) {
		app.controllCatalogs[catalog].invalidate();
	}

	ConTroll.setConvention('M2UyZjJlNzE2M2RkYmVkZWZiYjkzZDRiZGJmOGVlNzM1YjBlN2ZkNQ');
	ConTroll.ifAuth(function(){
		ConTroll.getUserEmail(function(email){
			console.log("User authenticated as " + email);
		})
	});
})(document);
