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
		if (!ConTroll[this.catalog])
			throw new Error("Catalog " + this.catalog + " is not supported!");
		ConTroll[this.catalog].catalog(this.handleCallback.bind(this));
	};
	
	Catalog.prototype.dejsonify = function(data) {
		if (data instanceof Array) {
			for (var i = 0; i < data.length; i++)
				data[i] = this.dejsonify(data[i]);
			return data;
		}
		
		if (typeof data == 'object') {
			for (var field in data) {
				var value = this.dejsonify(data[field])
				if (field.match(/-/)) {
					data[field.replace(/-/g,'_')] = value;
					delete data[field];
				} else {
					data[field] = value;
				}
			}
			return data;
		}
		
		if (typeof data == 'string' && data.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[-+]\d{2}:\d{2}$/))
			// we love ISO-8601
			return moment(data).toDate();
		
		return data;
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
	app.properties.conventions = {
			type: Array,
			value: function() { return []; },
			notify: true
	};
	app.properties.convention = {
			type: Object,
			value: function() { return null; },
			notify: true
	};
	app.properties.role = { 
			type: String,
			value: false,
			notify: true
	};
	app.properties.selectedConvention = {
			type: Object,
			observer: 'onSelectedConvention',
			value: function() {
				return window.localStorage.getItem('controll-management-last-convention');
			},
			notify: true
	};
	// Listen for template bound event to know when bindings
	// have resolved and content has been stamped to the page
	app.addEventListener('dom-change', function() {
		console.log('Our app is ready to rock!');
	});
	
	// role queries
	app.unlessLoggedIn = function(role) { return !role; };
	app.ifLoggedIn = function(role) { return role; };
	app.unlessManager = function(role) { return !(role == 'manager' || role == 'administrator') };
	app.unlessCashier = function(role) { return !(role == 'cashier' || role == 'manager' || role == 'administrator'); };
	app.hidePasses = function(role, permission) { return this[permission].call(this,role) || 
		!(this.convention && this.convention.settings.registration_type == 'passes'); };

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
	  for (var catalog in app.controllCatalogs)
		  app.controllCatalogs[catalog].invalidate();
	  app.fire('please-refresh-lists');
	};
	
	app.onSelectedConvention = function(selected, previous) {
		if (previous !== undefined) // only store if the user actually selected something
			window.localStorage.setItem('controll-management-last-convention', selected);
		if (selected) {
			app.startLoading();
			this.chooseConvention(selected);
		}
	}
	
	app.chooseConvention = function(conid) {
		if (!this.conventions || !this.conventions.length) {
			window.setTimeout(this.chooseConvention.bind(this),100,conid);
			return;
		}
		
		var con = this.conventions.find(function(con){
			return con.id == conid;
		});
		if (con) {
			ConTroll.setConvention(con['public-key']);
		} else {
			alert('Invalid convention ' + conid + ' chosen');
		}

		ConTroll.conventions.getCurrent(function(con){
			app.set('convention', app.dejsonify(con));
			ConTroll.authentication.role(function(role){
				app.set('role',role.key);
				app.sendRefreshEvent();
				app.doneLoading();
			});
		});
	};
	
	app.startLoading = function() {
		if (!app.loadingCounter) {
			app.$.loadingScreen.toggle();
			app.loadingCounter = 0;
		}
		app.loadingCounter++;
	};
	
	app.doneLoading = function() {
		if (app.loadingCounter)
			app.loadingCounter--;
		if (!app.loadingCounter)
			app.$.loadingScreen.toggle();
	};
	
	app.controllCatalogs = {};
	app.getCatalog = function(catalog, callback) {
		if (!this.convention)
			return; // don't trigger the callback and don't load data unless we have a convention
		app.startLoading();
		console.log('started loading ' + catalog);
		if (!this.controllCatalogs[catalog]) this.controllCatalogs[catalog] = new Catalog(catalog);
		this.controllCatalogs[catalog].get(function(response) {
			app.doneLoading();
			console.log('done loading ' + catalog);
			callback(response);
		});
	};
	app.invalidateCatalog = function(catalog) {
		app.controllCatalogs[catalog].invalidate();
	};
	
	app.dejsonify = Catalog.prototype.dejsonify; // expose to other modules

	ConTroll.conventions.catalog(function(conventions){
		app.set('conventions', conventions);
	});
	//ConTroll.setConvention('a4VZ0fxOugGgEk1zjvZLsEONYNBjNDZlNzMxZDNmN2VkMTIzNjYyNDFkNTc0NDZiOTI1ODhkZGVmZGEw'); // bigor 17
	ConTroll.ifAuth(function(){
		app.set('role','user'); // best we know so far
		ConTroll.getUserEmail(function(email){
			console.log("User authenticated as " + email);
		});
	});
})(document);
