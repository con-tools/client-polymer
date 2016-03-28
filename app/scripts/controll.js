"use strict";
/**
 * Javascript browser client for the Con-Troll API
 */
var ConTroll = (function(w,d){
	
	function readResponse(reqObj) {
		if (reqObj.responseType == 'json')
			return reqObj.response;
		try {
			return JSON.parse(reqObj.responseText);
		} catch (e) {
			return false;
		}
	}
	
	/**
	 * Authentication API
	 */
	var ConTrollAuth = function(api){
		this.api = api;
		return this;
	};
	
	ConTrollAuth.prototype.verify = function(callback) {
		this.api.send('auth/verify', function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res.status);
		});
	};
	
	/**
	 * Start authentication by calling ConTroll to provide an auth start URL for the specified provider
	 * The callback will be called with that URL and is expected to redirect the user to it somehow.
	 */
	ConTrollAuth.prototype.start = function(url, provider, callback) {
		if (arguments.length == 1) { // url is optional
			callback = arguments[0];
			provider = null;
			url = null;
		}
		if (arguments.length == 2) { // provider is optional
			callback = arguments[1];
			provider = null;
		}
		this.api.send('auth/start', {
			'redirect-url': url,
			'provider': (provider || 'google')
		}, function(res,err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res['auth-url']);
		});
	};
	
	/**
	 * Change the current window to the contorll provider selection dialog, and if successful, come back to the
	 * specified url
	 */
	ConTrollAuth.prototype.startSelect = function(url) {
		window.location.href = this.api.endpoint + '/auth/select?redirect-url=' + encodeURIComponent(url);
	};
	
	ConTrollAuth.prototype.logout = function(callback) {
		this.api.send('auth/logout', function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	}
	
	/**
	 * Get the current user's identification data, if logged in
	 */
	ConTrollAuth.prototype.id = function(callback) {
		this.api.send('auth/id', function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	/**
	 * User records API
	 */
	var ConTrollRecords = function(api) {
		this.api = api;
		return this;
	};
	
	ConTrollRecords.prototype.get = function(descriptor, callback) {
		this.api.get({convention: true, collection: 'records'}, descriptor, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			var data = res['data'];
			if (data == null) // no data was found
				callback(null);
			else
				callback(JSON.parse(data['data']));
		});
	};
	
	ConTrollRecords.prototype.save = function(descriptor, data, acl, callback) {
		if (arguments.length == 3) { // acl is optional
			callback = acl;
			acl = null;
		}
		if (!acl) acl = 'private';
		this.api.create({convention: true, collection: 'records'}, {
			descriptor: descriptor,
			content_type: 'application/json',
			acl: acl,
			data: JSON.stringify(data)
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(true);
		});
	};
	
	/**
	 * ConTroll System Tags API
	 * @param ConTroll api
	 */
	var ConTrollTags = function(api) {
		this.api = api;
		this.collection = {convention: true, collection: 'tagtypes'};
		return this;
	};
	
	ConTrollTags.prototype.catalog = function(callback) {
		this.api.get(this.collection, '', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTags.prototype.getType = function(title, callback) {
		this.api.get(this.collection, title, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTags.prototype.addType = function(title, requirement, ispublic, callback) {
		this.api.create(this.collection, {
			title: title,
			requirement: requirement,
			"public": ispublic
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTags.prototype.updateType = function(oldtitle, newtitle, requirement, ispublic, callback) {
		this.api.update(this.collection, oldtitle, {
			title: newtitle,
			requirement: requirement,
			"public": ispublic
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTags.prototype.deleteType = function(title, callback) {
		this.api.del(this.collection, title, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTags.prototype.replaceValue = function(title, oldvalue, newvalue, callback) {
		var replace_values = {};
		replace_values[oldvalue] = newvalue;
		this.api.update(this.collection, title, {
			"replace-values": replace_values
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTags.prototype.addValue = function(title, newvalue, callback) {
		this.api.update(this.collection, title, {
			values: [ newvalue ]
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTags.prototype.deleteValue = function(title, value, callback) {
		this.api.update(this.collection, title, {
			"remove-values": [ value ]
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	/**
	 * ConTroll Events API
	 * @param ConTroll api
	 */
	var ConTrollEvents = function(api) {
		this.api = api;
		this.collection = {convention: true, collection: 'events'};
		return this;
	};
	
	ConTrollEvents.prototype.catalog = function(callback) {
		this.api.get(this.collection, '', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollEvents.prototype.get = function(id, callback) {
		this.api.get(this.collection, id, function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollEvents.prototype.create = function(title, teaser, duration, ownerId, callback) {
		this.api.create(this.collection, {
			title: title,
			teaser: teaser,
			duration: duration,
			user: { id: ownerId }
		}, function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollEvents.prototype.update = function(id, fields, callback) {
		this.api.update(this.collection, id, fields, function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollEvents.prototype.remove = function(id, fields, callback) {
		this.api.del(this.collection, id, fields, function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	/**
	 * ConTroll Time Slots API
	 * @param ConTroll api
	 */
	var ConTrollTimeslots = function(api) {
		this.api = api;
		this.collection = {convention: true, collection: 'timeslots'};
		return this;
	};
	
	ConTrollTimeslots.prototype.catalog = function(callback) {
		this.api.get(this.collection, '', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				alert("Error getting time slot catalog: " + (err.error||err));
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTimeslots.prototype.forEvent = function(event_id, callback) {
		this.api.get(this.collection, { event: event_id }, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				alert("Error getting time slots for event: " +(err.error||err));
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTimeslots.prototype.create = function(event_id, start_time, duration, locations, hosts, callback) {
		var data = {
				event: event_id,
				start: parseInt(start_time.getTime()/1000),
				duration: duration,
				locations: locations
			};
		if (hosts && hosts.length > 0)
			// submit hosts directly - assumes a host is an object with either email or id fields and optionally a name - like api wants 
			data.hosts = hosts; 
		this.api.create(this.collection, data, function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				alert("Error creating a new time slot: " + (err.error||err));
				return;
			}
			callback(res);
		});
	};
	
	ConTrollTimeslots.prototype.remove = function(id, fields, callback) {
		this.api.del(this.collection, id, fields, function(res, err){
			if (err) {
				console.log('Error', err.error || err);
				alert("Error removing a time slot: " + (err.error||err));
				return;
			}
			callback(res);
		});
	};

	/**
	 * ConTroll Locations API
	 * @param ConTroll api
	 */
	var ConTrollLocations = function(api) {
		this.api = api;
		this.collection = {convention: true, collection: 'locations'};
		return this;
	};
	
	ConTrollLocations.prototype.catalog = function(callback) {
		this.api.get(this.collection, '', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollLocations.prototype.add = function(title, area, max_attendees, callback) {
		this.api.create(this.collection, {
			title: title,
			area: area,
			"max-attendees": max_attendees
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	}
	
	ConTrollLocations.prototype.update = function(id, title, area, max_attendees, callback) {
		this.api.update(this.collection, id, {
			title: title,
			area: area,
			"max-attendees": max_attendees
		}, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	}
	
	ConTrollLocations.prototype.remove = function(id, callback) {
		this.api.del(this.collection, id, function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	}
	
	var ConTrollConventions = function(api) {
		this.api = api;
		this.collection = {convention: true, collection: 'conventions'};
		return this;
	};
	
	ConTrollConventions.prototype.catalog = function(callback) {
		this.api.get(this.collection, '', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	/**
	 * Retrieve the current convention's details
	 * @param callback
	 */
	ConTrollConventions.prototype.getCurrent = function(callback) {
		this.api.get(this.collection, 'self', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	}
	
	/**
	 * ConTroll Managers API
	 * @param ConTroll api
	 */
	var ConTrollManagers = function(api) {
		this.api = api;
		this.collection = {convention: true, collection: 'managers'};
		return this;
	};
	
	ConTrollManagers.prototype.catalog = function(callback) {
		this.api.get(this.collection, '', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	ConTrollManagers.prototype.add = function(userObj, callback) {
		this.api.create(this.collection, userObj, function(res,err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	}
	
	ConTrollManagers.prototype.remove = function(id, callback) {
		this.api.del(this.collection, id, function(res,err){
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	}
	
	/**
	 * ConTroll Users API
	 * @param ConTroll api
	 */
	var ConTrollUsers = function(api) {
		this.api = api;
		this.collection = {convention: true, collection: 'users'};
		return this;
	};
	
	ConTrollUsers.prototype.catalog = function(callback) {
		this.api.get(this.collection, '', function(res, err) {
			if (err) {
				console.log('Error', err.error || err);
				return;
			}
			callback(res);
		});
	};
	
	/**
	 * Main API private API entry point, 
	 */
	var ConTroll = function() {
		this.endpoint = 'http://api.con-troll.org';
		//if (window.location.host.match(/localhost/))
		//	this.endpoint = 'http://localhost:8080';
		this.auth = new ConTrollAuth(this);
		this.records = new ConTrollRecords(this);
		return this;
	};
	
	ConTroll.prototype.create = function(collection, data, callback) {
		var auth = {};
		if (typeof collection == 'object') {
			for (var field in collection) {
				if (field == 'collection') continue;
				auth[field] = collection[field];
			}
			collection = collection.collection;
		}
		this.send('entities/' + collection, data, callback, auth);
	};
	
	ConTroll.prototype.update = function(collection, id, data, callback) {
		var auth = {};
		if (typeof collection == 'object') {
			for (var field in collection) {
				if (field == 'collection') continue;
				auth[field] = collection[field];
			}
			collection = collection.collection;
		}
		this.send('entities/' + collection + '/' + id, data, callback, auth, 'PUT');
	};
	
	ConTroll.prototype.del= function(collection, id, callback) {
		var auth = {};
		if (typeof collection == 'object') {
			for (var field in collection) {
				if (field == 'collection') continue;
				auth[field] = collection[field];
			}
			collection = collection.collection;
		}
		this.send('entities/' + collection + '/' + id, {}, callback, auth, 'DELETE');
	};
	
	/**
	 * Retreive a record or a catalog of collection from the server
	 * @param collection Collection to retrieve
	 * @param record_id records to lookup: a specific ID (Number or String), the entire
	 * 	collection catalog (falsy value) or a filtered catalog (Object with filter specification)
	 * @param callback
	 */
	ConTroll.prototype.get = function(collection, record_id, callback) {
		var auth = {};
		if (typeof collection == 'object') {
			for (var field in collection) {
				if (field == 'collection') continue;
				auth[field] = collection[field];
			}
			collection = collection.collection;
		}
		var uri = 'entities/' + collection + '/';
		if (typeof record_id == 'object') {
			var filters = [];
			for (var field in record_id) {
				filters.push(encodeURIComponent('by_' + field) + '=' + encodeURIComponent(record_id[field]));
			}
			uri += '?' + filters.join('&');
		} else if (record_id)
			uri += record_id
		this.send(uri, callback, auth);
	};
	
	ConTroll.prototype.send = function(action, data, callback, auth, method) {
		if (typeof arguments[1] == 'function') { // data is optional
			callback = arguments[1];
			auth = arguments.length > 2 ? arguments[2] : null;
			data = null;
		}
		var req = new XMLHttpRequest();
		req.onreadystatechange = function() {
			if (req.readyState == 4) {// DONE
				var res = readResponse(req);
				if (req.status == 200)
					callback(res, null);
				else {
					Rollbar.error("ConTroll API error:", res || req.responseText || req);
					if (typeof res == 'object')
						callback(null, res); // server sent a non-OK status code, but had stuff to say about it
					else
						callback(null, req.responseText || "CORS error");
				}
			}
		};
		req.withCredentials = true; // allow CORS cookies that are required for the PHP session
		if (data) {
			req.open(method || 'POST', this.endpoint + '/' + action);
			req.setRequestHeader("Content-type","application/json");
			//req.setRequestHeader("Access-Control-Request-Method", "POST");
		} else {
			req.open('GET', this.endpoint + '/' + action);
		}
		//req.setRequestHeader("Origin",window.location.host);
		if (this.authToken) {
			//req.setRequestHeader('Access-Control-Request-Headers', 'Authorization');
			req.setRequestHeader('Authorization', this.authToken);
		}
		if (auth) {
			if (auth.convention) {
				if (auth.convention === true) auth.convention = this.conventionApiKey;
				req.setRequestHeader('Convention', auth.convention);
			} 
		}
		if (data) {
			req.send(JSON.stringify(data));
		} else {
			req.send();
		}
	}
	
	ConTroll.prototype.handleAuth = function() {
		this.startedIDLookup = true;
		var token = null;
		// check if we got here from a ConTroll redirect 
		w.location.search.split(/[\?\&]+/).forEach(function(f){
			var kv = f.split('='); 
			if (kv[0] == 'token') token = decodeURIComponent(kv[1]);
		});
		if (token) {
			// store token locally and reload without the query
			w.sessionStorage.setItem('controll-token', token);
			this.authtoken = token;
			if (w.history.pushState) {
				w.history.pushState({controll_token: token}, "authenticated", w.location.pathname);
			} else {
				w.location = w.location.pathname
			}
		}
		
		if (!this.authToken) {
			this.authToken =  w.sessionStorage.getItem('controll-token');
		}
		// load user data from Controll
		this.auth.id(function(res){
			if (res.status == false)
				return; // no ID
			w.sessionStorage.setItem('controll-name', res['name']);
			w.sessionStorage.setItem('controll-email', res['email']);
		});
	};
	
	var api = new ConTroll;
	
	/*** API public access **/
	
	/**
	 * Retrieve user's name and email
	 */
	ConTroll.userDetails = function() {
		return {
			name: w.sessionStorage.getItem('controll-name'),
			email: w.sessionStorage.getItem('controll-email')
		};
	};
	
	ConTroll.getUserEmail = function(callback) {
		if (w.sessionStorage.getItem('controll-email')) {
			callback(w.sessionStorage.getItem('controll-email'));
			return;
		}
		
		api.auth.id(function(res){
			if (res.status == false)
				callback(false);
			else
				callback(res['email']);
		});
	};
	
	ConTroll.getAuthToken = function() {
		if (api.authToken)
			return api.authToken;
		if (w.sessionStorage.getItem('controll-token'))
			return w.sessionStorage.getItem('controll-token');
		return false;
	};
	
	/**
	 * Retrieve a convention user record
	 */
	ConTroll.getUserRecord = function(descriptor, callback) {
		api.records.get(descriptor, callback);
	};
	
	/**
	 * Store a convention user record
	 * @param descriptor unique name for the document
	 * @param data the document data to save
	 * @param acl (optional) an ACL to set. This value must be valid or it will be ignored
	 * @param callback function to be called when the API call has finished
	 */
	ConTroll.saveUserRecord = function(descriptor, data, acl, callback) {
		api.records.save(descriptor, data, acl, callback);
	};
	
	/**
	 * Call the callback if user is authenticated, otherwise
	 * authenticate and come back to the same URL
	 */
	ConTroll.ifAuth = function(callback) {
		api.auth.verify(function(loggedin){
			if (loggedin) {
				callback();
			} else {
				ConTroll.auth(window.location.href);
			}
		});
	};
	
	/**
	 * Go to a URL, authenticating first if needed
	 */
	ConTroll.authAndGo = function(url) {
		api.auth.verify(function(loggedin){
			if (loggedin) {
				window.location.href = url;
				return;
			}
			
			ConTroll.auth(url);
		});
	};
	
	/**
	 * Authenticate with ConTroll, and either call the provided Javascript callback, or redirect to the specified URL
	 * @param redirect_or_callback URL | function()
	 */
	ConTroll.auth = function(redirect_or_callback) {
		if (typeof redirect_or_callback == 'function') {
			// TODO: implement auth in window and callback
		} else {
			if (!redirect_or_callback.match(/^https?:\/\//))
				redirect_or_callback = window.location.protocol + '//' + window.location.host + redirect_or_callback;
			api.auth.startSelect(redirect_or_callback);
		}
	};
	
	/**
	 * logout the user, optionally redirect the browser to another page
	 * @param redirect_or_callback URL | function()
	 */
	ConTroll.logout = function(redirect_or_callback) {
		if (typeof redirect_or_callback == 'string' && !redirect_or_callback.match(/^https?:\/\//))
			redirect_or_callback = window.location.protocol + '//' + window.location.host + redirect_or_callback;
		api.auth.logout(function(){
			if (typeof redirect_or_callback == 'string')
				window.location.href = redirect_or_callback;
			else
				redirect_or_callback();
		});
	};
	
	/**
	 * Set the convention API key used for convention specific API calls
	 */
	ConTroll.setConvention = function(api_key) {
		api.conventionApiKey = api_key;
	}
	
	/**
	 * Expose APIs
	 */
	ConTroll.records = new ConTrollRecords(api);
	ConTroll.tags = new ConTrollTags(api);
	ConTroll.events = new ConTrollEvents(api);
	ConTroll.managers = new ConTrollManagers(api);
	ConTroll.users = new ConTrollUsers(api);
	ConTroll.locations = new ConTrollLocations(api);
	ConTroll.conventions = new ConTrollConventions(api);
	ConTroll.timeslots = new ConTrollTimeslots(api);
	
	api.handleAuth();
	return ConTroll;
})(window, document);
