/*
Copyright (c) 2009, Dan "Ducky" Little & GeoMOOSE.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * Namespace: GeoMOOSE
 * Parent namespace for all GeoMOOSE classes.
 */

window.GeoMOOSE = {
	_map_source_type_register: {},
	_tabs: {},

	/*
	 * Method: splitPaths
	 * Splits paths in a GeoMOOSE path string (split by ':')
	 *
	 * Parameters:
	 *  layerPaths - String of GeoMOOSE paths delimited by ";".
	 */
	splitPaths : function(layerPaths) {
		return (new String(layerPaths)).split(':');
	},

	/*
	 * Method: error
	 * Display an error to the user.  This is preferable over console.error or console.log
	 * as we can start to make browser neutral and increasingly user-friendly delivery.
	 *
	 * Parameters:
	 *  Takes in the entire argument list similiar to console.log
	 */
	error: function() {
		var args = [];
		for(var i = 0,ii = arguments.length; i < ii; i++) {
			args.push(new String(arguments[i]));
		}
		var msg = args.join(' ');
		if(GeoMOOSE && GeoMOOSE.Dialog && GeoMOOSE.Dialog.Error) {
			var err_dialog = new GeoMOOSE.Dialog.Error({'message' : msg});
			err_dialog.show();
		} else {
			/* Error Dialog not loaded, or not included with build. */
			alert(msg);
		}
	},

	/*
	 * Method: warning
	 * Similar to error, but with less severity.
	 */
	warning: function() {
		if(console && typeof(console.log) == 'function') {
			console.log.apply(console, arguments);
		}
	},

	/**
	 * Method: registerMapSourceType 
	 * Registers a Class to a GeoMOOSE class type
	 * Parameters:
	 *  map_source_type - The map-source type from the Mapbook.
	 *  js_class - The class reference.
	 */
	registerMapSourceType: function(map_source_type, js_class) {
		this._map_source_type_register[map_source_type] = js_class;
	},

	/**
	 * Method: getMapSourceType
	 * Get the class for a given layer type
	 * Parameters:
	 *  map_source_type - The map-source type from the Mapbook.
	 */
	getMapSourceType: function(map_source_type) {
		/* TODO : Add a sanity check here. */
		return this._map_source_type_register[map_source_type];
	},

	/*
	 * Method: asArray
	 * Converts parameter to an array.
	 * 
	 * Parameters:
	 *  layer_list - Misnomer, really, it's "var" and then returns an array if it's not one already.
	 */
	asArray: function(layer_list) {
		if(dojo.isArray(layer_list) !== true) {
			return [layer_list];
		}
		return layer_list;
	},

	/** Method: configureMapSource
	* Parses a map-source XML fragment and adds it to the map.
	* Important: this does not add anything to the catalog!
	*
	* Parameters
	*  map_source_xml - The <map-source> xml node
	*/
	configureMapSource: function( map_source_xml ) {
		Application.configureMapSource( map_source_xml, {} );
	},

	/**
	 * Method: changeLayerVisibility
	 * Turn a layer on or off.
	 * Parameters:
	 *  layerPaths - The full GeoMOOSE layer path. (ex. my_wms/my_layer)
	 */
	changeLayerVisibility : function(layerPaths, visibility) {
		var paths = this.asArray(layerPaths);
		for(var i = 0, len = paths.length; i < len; i++) {
			var layerPath = paths[i];
			if(layerPath) {
				var ms = Application.getMapSource(layerPath);
				if(GeoMOOSE.isDefined(ms)) {
					ms.setVisibility(layerPath, visibility);
				} else {
					GeoMOOSE.error("GeoMOOSE.changeLayerVisibility: map-source for path " + layerPath + " undefined.");
				}
			}
		}
	},
	

	/*
	 * Method: turnLayerOn.
	 * Turns on some layers.
	 * 
	 * Parameters:
	 *  layerPaths - The list of layers.
	 */
	turnLayerOn : function(layerPaths) {
		this.changeLayerVisibility(layerPaths, true);
	},

	/*
	 * Method: turnLayerOff.
	 * Turns off some layers.
	 * 
	 * Parameters:
	 *  layerPaths - The list of layers.
	 */

	turnLayerOff : function(layerPaths) {
		this.changeLayerVisibility(layerPaths, false);
	},

	/*
	 * Method: refreshLayers
	 * Force some layers to redraw.
	 *
	 * Parameters:
	 *  layerNames - List of layers to redraw.
	 */
	refreshLayers : function(layerNames) {
		var layerNames = this.asArray(layerNames);
		for(var i = 0, len = layerNames.length; i < len; i++) {
			Application.getMapSource(layerNames[i]).redraw();
		}
	},

	/*
	 * Method: isEditable
	 * Checks to see if a MapSource is editable.
	 *
	 * Parameters:
	 *  source - The map source.
	 */
	isEditable: function(source) {
		return (Application.getMapSource(source).editable === true);
	},

	/*
	 * Method: getLayerUrl
	 * Get the base URL for a given layer.
	 *
	 * Parameters:
	 *  layerName - The name of the layer to find.
	 */
	getLayerUrl : function(layerName) {
		return Application.getMapSource(layerName).getUrl();
	},

	/*
	 * Method: changeLayerUrl
	 * Change the base URL for a given layer.
	 *
	 * Parameters:
	 *  layerName - The name of the layer to find.
	 *  url - The URL to change to.
	 */
	changeLayerUrl : function(layerName, url) {
		Application.getMapSource(layerName).setUrl(url);
	},

	/*
	 * Method: updateLayerParameters
	 * Change the params for a given layer.
	 *
	 * Parameters:
	 *  layerName - The name of the layer to find.
	 *  paramObject - A hash of the parameters.
	 */
	updateLayerParameters : function(layerName, paramObject) {
		Application.getMapSource(layerName).updateParameters(paramObject);
	},

	/*
	 * Method: getLayerParameters
	 * Get the params for a given layer.
	 *
	 * Parameters:
	 *  layerName - The name of the layer to find.
	 * 
	 * Returns:
	 *  The parameters, in a hash.
	 */

	getLayerParameters : function(layerName) {
		return Application.getMapSource(layerName).getParameters(layerName);
	},

	/*
	 * Method: getLayerOpacity
	 * Get the client-side Opacity parameter setting.
	 *
	 * Parameters:
	 *  layerName - The layername.
	 *
	 * Returns:
	 *  A floating point number represeting the opacity (0-100)
	 */
	getLayerOpacity : function(layerName) {
		return Application.getMapSource(layerName).getOpacity()*100.0;
	},

	/*
	 * Method: setLayerOpacity
	 * Set the client-side Opacity parameter setting.
	 *
	 * Parameters:
	 *  layerName - The layername.
	 *  opacity - 0-100, percentage of visibility.
	 */
	setLayerOpacity: function(layerName, opacity) {
		Application.getMapSource(layerName).setOpacity(opacity/100.0);
	},

	/*
	 * Method: clearLayerParameters
	 * Clears all the user set parameters from a 
	 * MapSource.
	 *
	 * Parameters:
	 *  layerName - The Layername.
	 */
	clearLayerParameters: function(layerName) {
		Application.getMapSource(layerName).clearParameters();
	},

	/*
	 * Method: getVisibleLayers
	 * Get the list of currently visible layer paths.
	 *
	 * Parameters:
	 *  None
	 *
	 * Returns:
	 *  A list of layer names.
	 */
	getVisibleLayers : function() {
		return Application.getVisibleLayers();
	},

	/*
	 * Method: getExtent
	 * Get the map's extent as an array.
	 *
	 * Returns:
	 *  An array with [minx,miny,maxx,maxy]
	 */
	getExtent: function() {
		return Map.getExtent().toArray();
	},

	/*
	 * Method: getScale
	 * Return the map's current scale.
	 *
	 * Returns:
	 *  Floating point of the map's scale.
	 */

	getScale: function() {
		return Map.getScale();
	},

	/*
	 * Method: inScale
	 * Check whether a given min/maxscale is within the 
	 *  current scale.
	 */
	inScale: function(minscale, maxscale) {
		var scale = GeoMOOSE.getScale();
		var def_minscale = GeoMOOSE.isDefined(minscale) && !isNaN(minscale);
		var def_maxscale = GeoMOOSE.isDefined(maxscale) && !isNaN(maxscale);
		if(!def_minscale && !def_maxscale) { return true; }
		if(!def_maxscale && scale >= minscale) { return true; }
		if(!def_minscale && scale <= maxscale) { return true; }
		return (minscale <= scale && scale <= maxscale);
	},

	/*
	 * Method: moveLayerUp
	 * Move's a layer up on the visibility stack.
	 *
	 * Parameters:
	 *  path - the layer path.
	 */
	moveLayerUp: function(path) {
		Application.getMapSource(path).moveUp();
	},

	/*
	 * Method: moveLayerDown
	 * Move's a layer down on the visibility stack.
	 *
	 * Parameters:
	 *  path - the layer path.
	 */
	moveLayerDown: function(path) {
		Application.getMapSource(path).moveDown();
	},

	/*
	 * Method: fadeLayer
	 * Fade out the opacity by CONFIGURATION.layer_controls.fade.change_percent.
	 *
	 * Parameters:
	 *  path - the layer path.
	 */
	fadeLayer: function(path) {
		this.setLayerOpacity(path, this.getLayerOpacity(path) - CONFIGURATION.layer_controls.fade.change_percent);
	},

	/*
	 * Method: unfadeLayer
	 * Un-Fade out the opacity by CONFIGURATION.layer_controls.fade.change_percent.
	 *
	 * Parameters:
	 *  path - the layer path.
	 */
	unfadeLayer: function(path) {
		this.setLayerOpacity(path, this.getLayerOpacity(path) + CONFIGURATION.layer_controls.fade.change_percent);
	},


	/* 
	 * Method: startService
	 * Start a service with some given parameters 
	 *
	 * Parameters:
	 *  serviceName - The service to call.
	 *  settingsObj - A hash of settings to pass to the service.  The keys in the hash should match the names of
	 *    inputs in the service definition from the Mapbook.
	 *  forceStart - When true, the service will start, ignoring any user input requirements.
	 */
	startService : function(serviceName, settingsObj, forceStart) {
		Services.startService(serviceName, settingsObj, forceStart);
	},

	/*
	 * Method: changeTab
	 * Change to a tab given by tabName
	 *
	 * Parameters:
	 *  tabName - A name of a tab.
	 */
	changeTab : function(tabName) {
		this.selectTab(tabName);
	},

	/* Method: zoomToPoint
	 * Zoom to a point and a buffer 
	 * 
	 * Parameters:
	 *  x - X coordinate.
	 *  y - Y coordinate.
	 *  buffer - Buffer in ground units.
	 */
	zoomToPoint : function(x,y,buffer) {
		Map.zoomToExtent(OpenLayers.Bounds.fromArray([x-buffer, y-buffer, x+buffer, y+buffer]));
	},

	/* 
	 * Method: zoomToExtent
	 * Zoom to an extent 
	 *
	 * Parameters:
	 *  minx - Minimum X-bound.
	 *  miny - Minimum Y-bound.
	 *  maxx - Maximum X-bound.
	 *  maxx - Maximum Y-bound.
	 *  projection - Optional projection. When unspecified, assumes map coordinates.
	 */
	zoomToExtent : function(minx,miny,maxx,maxy,projection) {
		var bounds = OpenLayers.Bounds.fromArray([minx,miny,maxx,maxy]);

		// transform the bounds if the projection is specified
		if(GeoMOOSE.isDefined(projection)) {
			var proj = new OpenLayers.Projection(projection);
			bounds.transform(proj, Map.projection);
		}

		Map.zoomToExtent(bounds);
	},

	/*
	 * Method: addPopup
	 * Add a popup to the map.
	 *
	 * Parameters:
	 *  x - X-coordinate to place the popup.
	 *  y - Y-coordinate to place the popup.
	 *  w - Deprecated. The width of the popup.
	 *  h - Deprecated. The height of the popup.
	 *  html - The contents of the popup.
	 *  title - The title of the popup
	 */
	addPopup : function(x,y,w,h,html,title) {
		var popup_id = 'popup-'+GeoMOOSE.id();
		if(!GeoMOOSE.isDefined(title)) {
			title = '';
		}
		Map.addPopup({
			clearOnMove: false,
			renderOnAdd: true,
			renderXY: {x: x, y: y}, 
			id: popup_id,
			title: title,
			classNames: ['LayerLess'],
			content: html
		});

		//addPopup(x,y,w,h,html);
	},

	/*
	 * Method: clearPopups
	 * Remove all popups from the map.
	 */
	clearPopups : function() {
		while(Map.popups[0]) {
			Map.removePopup(Map.popups[0]);
		}
	},

	/* 
	* Method: processTemplate
	* A low-cost, built-in template utility for GeoMOOSE.  Takes in a string and replace
	* all "%name%" instances with their appropriate values from replace_dict.
	* Example:
	*  GeoMOOSE.processTemplate("Hello, %name%!", {'name' : 'World'});
	*  will return the ubiquitous "Hello, World".
	*
	* Parameters:
	*  template - String containining "%...%"'s to be replaced.
	*  replace_dict - A hash/object containing the replacement values.
	*
	* Returns:
	*  A string with the values substituted.
	*/
	processTemplate : function (template, replace_dict) {
		var ret_string = new String(template);
		for(var d in replace_dict) {
			var find = new RegExp('%'+d+'%', 'g');
			ret_string = ret_string.replace(find, replace_dict[d]);
		}
		return ret_string
	},

	/*
	 * Method: getBookmarkUrl
	 * Get an URL for bookmarking.
	 */
	getBookmarkUrl: function() {
		var url = new String(document.location)
		if(url.indexOf('?') > 0) {
			url = url.split('?')[0];
		}
		url = url.replace('#','');
		url += '?extent=' + Map.getExtent().toArray().toString(',');

		var layer_changes = Application.getStatusDifferences();
		if(layer_changes['on'].length > 0) {
			url += '&on=' + layer_changes['on'].join(';');
		}
		if(layer_changes['off'].length > 0) {
			url += '&off=' + layer_changes['off'].join(';');
		}
		return url;
	},

	/*
	 * Method: getUrlParameters
	 * Parses URL parameters and returns a hash.
	 */
	getUrlParameters: function() {
		if(!GeoMOOSE.isDefined(this._parsed_parameters)) {
			var url = document.location+'';
			if(url.indexOf('?') > 0) {
				var url = url.split('?')[1];
				this._parsed_parameters = dojo.queryToObject(url);
			} else {
				this._parsed_parameters = {};
			}
		}
		return this._parsed_parameters;
	},
	

	/*
	 * Method: bookmark
	 * Change the URL to be something bookmarkable.
	 * Warning! Sets document.location!
	 */
	bookmark: function() {
		document.location = GeoMOOSE.getBookmarkUrl();
	},

	/*
	 * Method: register
	 * Register an event with GM_Events.
	 *
	 * Parameters:
	 *  event_type - Name of the event.
	 *  ref_obj - A reference object.  Sets the scope for "func".
	 *  func - The function to call when the event is triggered.
	 */
	register: function(event_type, ref_obj, func) {
		GM_Events.register(event_type, ref_obj, func);
	},

	/*
	 * Function: id
	 * Generates an unique ID
	 */
	id: function() {
		return OpenLayers.Util.createUniqueID('gm');
	},


	/*
	 * Function: addTab
	 * Add a new GeoMOOSE.Tab instance to the tab bar.
	 * Parameters:
	 *  tab_name - Internal controllable name for the tab.
	 *  tab - The dijit Object being added.
	 */
	addTab: function(tab_name, tab) {
		/* add the tab to the list */
		dijit.byId('tabs').addChild(tab, 100);
		/* set an internal name for the tab */
		tab._gm_tab_name = tab_name;
		/* add the tab to the internal stack */
		this._tabs[tab_name] = tab;

		/* Make sure that the tab is removed from the internal management list */
		dojo.connect(tab, 'onClose', function() { GeoMOOSE.removeTab(this._gm_tab_name); });
	},

	/*
	 * Function: getTab
	 * Recall a tab that has been added with addTab.
	 */
	
	getTab: function(tab_name) {
		return this._tabs[tab_name];
	},

	/*
	 * Function: closeTab
	 * Close a tab by the name.
	 */
	closeTab: function(tab_name) {
		var tab = this.getTab(tab_name);
		/* TODO: This should really check for a function. */
		if(GeoMOOSE.isDefined(tab)) {
			if(GeoMOOSE.isDefined(tab.onClose)) {
				tab.onClose();
			}
			GeoMOOSE.removeTab(tab_name);
			dijit.byId('tabs').removeChild(tab);
		}
	},

	/*
	 * Function: removeTab
	 * Removes a tab from the internal list, but not 
	 * the user interface.
	 */
	removeTab: function(tab_name) {
		var tab = this._tabs[tab_name];
		if(GeoMOOSE.isDefined(tab)) {
			this._tabs[tab_name] = null;
		}
	},

	/*
	 * Function: selectTab
	 * Bring a tab to the forefront.
	 *
	 * Parameters:
	 *  tab_name - Name of the tab to bring to the front.
	 */
	selectTab: function(tab_name) {
		var tab = this._tabs[tab_name];
		if(GeoMOOSE.isDefined(tab)) {
			dijit.byId('tabs').selectChild(tab);
		}
	},
	 

	/*
	 * Function: getLegendUrls
	 * Returns an array of legend URLs for a given set of paths.
	 *
	 * Parameters:
	 *  layer_paths - GeoMOOSE Paths
	 */
	getLegendUrls: function(layer_paths) {
		var paths = GeoMOOSE.asArray(layer_paths);
		var urls = [];
		for(var i = 0; i < paths.length; i++) {
			var msrc = Application.getMapSource(paths[i]);
			urls = urls.concat(msrc.getLegendUrls([paths[i]]));
		}
		return urls;
	},

	_layerControls: {},

	_registerLayerControl: function(control_name, class_name) {
		this._layerControls[control_name] = class_name;
	},

	_getLayerControl: function(control_name) {
		return this._layerControls[control_name];
	},

	/*
	 * Function: isDefined
	 * Check for the null condition in a variable.
	 */
	
	isDefined: function(v) {
		return (typeof(v) != "undefined" && v != null);
	},

	/*
	 * Function: activateMapSource
	 * Set the active map source.
	 *
	 * Parameters:
	 *  name - The name of the mapsource to activate.
	 */
	activateMapSource: function(name) {
		var active_map_source = GeoMOOSE.getActiveMapSource();
		if(GeoMOOSE.isDefined(active_map_source)) {
			var map_source = Application.getMapSource(active_map_source); 
			map_source.deactivate();
		}
		Application.activateMapSource(name);
	},

	/*
	 * Function: deactivateMapSource
	 * Sets the active map source to null
	 * and turns off the controls on any active map source.
	 */
	deactiveMapSource: function(path) {
		if(!GeoMOOSE.isDefined(path)) { path = GeoMOOSE.getActiveMapSource(); }

		var map_source = Application.getMapSource(path);
		if(GeoMOOSE.isDefined(map_source)) {
			map_source.deactivate();
		}
		if(path == GeoMOOSE.getActiveMapSource()) {
			GeoMOOSE.activateMapSource(null);
		}
	},

	/*
	 * Function: getActiveMapSource
	 * Gets the active map source.
	 *
	 * Returns:
	 *  A GeoMOOSE.MapSource class representing the current active map class, or null if none is active.
	 */
	getActiveMapSource: function() {
		return Application.getActiveMapSource();
	},

	/*
	 * Function: saveChanges
	 * Parameters:
	 *  name - MapSource name to save.
	 */
	
	saveChanges: function(name) {
		var map_source = Application.getMapSource(name);
		if(map_source) {
			if(typeof(map_source.save) == "function" && map_source.canSave) {
				map_source.save();
			} else {
				GeoMOOSE.warning('Map source "'+name+'" does not support saving changes.');
			}
		} else {
			GeoMOOSE.warning('No map source named "'+name+'"');
		}
	},

	/*
	 * Method: zoomToPointsList
	 * Zooms to the bounding box of a points list.
	 *
	 * Parameters:
	 *  points_lits - String formatted as "X Y, X Y, X Y"
	 *  projection - MapServer's [shpxy proj=] is broken, this allows for client-side reprojection.
	 */

	zoomToPointsList: function(points_list, projection) {
		var pairs = points_list.split(' ');
		var x_s = [], y_s = [];
		var min_x = null, min_y = null, max_x = null, max_y = null;
		for(var i = 0, ii = pairs.length; i < ii; i++) {
			var point = pairs[i].split(',');
			var x = parseFloat(point[0]);
			var y = parseFloat(point[1]);
			if(!isNaN(x)) {
				if(min_x == null || x < min_x) { min_x = x; }
				if(max_x == null || x > max_x) { max_x = x; }
			}
			if(!isNaN(y)) {
				if(min_y == null || y < min_y) { min_y = y; }
				if(max_y == null || y > max_y) { max_y = y; }
			}
		}

		/* make a bounds object */
		var bounds = new OpenLayers.Bounds(min_x,min_y,max_x,max_y);
		if(GeoMOOSE.isDefined(projection)) {
			var proj = new OpenLayers.Projection(projection);
			bounds.transform(proj, Map.projection);
		}
		Map.zoomToExtent(bounds);
	},
	
	/*
	 * Method: convertLength
	 * Convert a number from one denomination to another.
	 */

	convertLength: function(length, src_units, dest_units) {
		var length_in_inches = length * OpenLayers.INCHES_PER_UNIT[src_units];
		return length_in_inches / OpenLayers.INCHES_PER_UNIT[dest_units];
	},

	/*
	 * Method: download
	 * Offers a download dialog for the php/download.php script.
	 */
	download: function(id, extension) {
		var d = new GeoMOOSE.Dialog.Download({'download_id' : id, 'download_extension' : extension});
		d.show();
	},

	/*
	 * Method: zoomToLonLat
	 * Zooms to a specified lon, lat.
	 */
	_latLongProj: null,

	zoomToLonLat: function(lon, lat) {
		if(GeoMOOSE._latLongProj == null) {
			GeoMOOSE._latLongProj = new OpenLayers.Projection('WGS84');
		}
		var p = new OpenLayers.Geometry.Point(lon,lat);
		OpenLayers.Projection.transform(p, GeoMOOSE._latLongProj, Map.getProjectionObject());
		GeoMOOSE.zoomToPoint(p.x,p.y,100);
	},

	/*
	 * Method: deactivateTools
	 * Turn off all current tools, including layer tools.
	 */
	deactivateTools: function() {
		dojo.publish('/geomoose/deactivate-tools', {});	
		for(var tool_name in Tools) {
			Tools[tool_name].deactivate();
		}
	},

	/*
	 * Method: activateLayerTool
	 * Activates a layer tool
	 */
	activateLayerTool: function(action, kwargs) {
		//return Application.getMapSource(layerName).getUrl();
		var active_map_source = GeoMOOSE.getActiveMapSource();
		if(!GeoMOOSE.isDefined(active_map_source)) {
			GeoMOOSE.error('There is no actively selected layer.  Please activate a layer from the catalog.');
		} else {
			var map_source = Application.getMapSource(active_map_source);
			if(map_source.supports[action] === true) {
				/* okay, let's go! */
				GeoMOOSE.deactivateTools();

				if(GeoMOOSE.isDefined(kwargs)) {
					map_source.controls[action].activate(kwargs);
				} else {
					map_source.controls[action].activate();
				}
			} else {
				GeoMOOSE.error('The current active layer does not support your selected action.');
			}
		}


	},

	/*
	 * Method: activateDefaultTool
	 * This is a bit of a "pull the 'chute" call.  Starts up the pan tool.
	 *  In the future this needs to be more configurable.
	 */
	activateDefaultTool: function() {
		var toolbar = dijit.byId('toolbar');
		if(GeoMOOSE.isDefined(toolbar.tools[CONFIGURATION.default_tool])) {
			var tool = toolbar.tools[CONFIGURATION.default_tool];
			tool.onClick();
			tool.onStart();
		} else {
			GeoMOOSE.warning('Could not activateDefaultTool "'+CONFIGURATION.default_tool+'" as it is not defined in the toolbar.');
		}
	}
	
};

/*
 * GeoMOOSE User Extensions Library 
 */


GeoMOOSE.UX = {
	registered_extensions: {},

	/* 
	 * The names are used as keys.
	 */
	register: function(extension_name) {
		GeoMOOSE.UX.registered_extensions[extension_name] = eval(extension_name);
	},

	unregister: function(extension_name) {
		delete GeoMOOSE.UX.registered_extensions[extension_name];
	},

	/*
	 * Return the extension objects
	 */
	getExtensions: function() {
		var all_extensions = new Array();
		for(var k in GeoMOOSE.UX.registered_extensions) {
			all_extensions.push(GeoMOOSE.UX.registered_extensions[k]);
		}
		return all_extensions;
	}
};

/*
 * I made this a class to give User Extensions a prayer of surviving an upgrade.
 * Currently, the only method is "load" which is called in main() to load the user
 * extension.
 */
GeoMOOSE.UX.Extension = OpenLayers.Class({
	initialize: function () {
		/* do nothing on creation */
	},
	load: function() {
		/* do nothing on load */
	},
	CLASS_NAME: 'GeoMOOSE.UX.Extension'
});

/*
 * These are non-namespaced functions for a few reasons:
 *  1. Lots of legacy code use these.
 *  2. The frequency of use and the basic commonality of need.
 *     makes it appropraite to leave them on the outside.
 */

/**
 * Function: parseBoolean
 * Inputs a string and outputs a boolean.
 * 
 * Parameters:
 *  bool - The bit to parse.
 *  def - The default value in case of an undefined value.
 */
function parseBoolean(bool, def) {
	if(!GeoMOOSE.isDefined(bool)) { return def; }
	var boolString = new String(bool);
	if(boolString.match(/true/i)) { return true; }
	else if(boolString == '1') { return true; }
	else if(boolString.match(/on/i)) { return true; }
	return false;
}

/**
 * Function: commifyNumber
 * Convert a number into a string that is comma delimited.
 * TODO: Replace this with an internationalized friendly function.
 *
 * Parameters:
 *  number - The number to commify
 *
 */
function commifyNumber(number) {
	var numberOrig = new String(number);
	var numberArr = new String(number).split('.');
	var numberSign = number.substring(0,1);
	/* Oh, snap, it's negative */
	if(numberSign == '-') {
		number = new String(number).substring(1);
		numberArr = new String(number).split('.');
	} else {
		numberSign = '';
	}
	number = numberArr[0];
	number = '' + number;
	if (number.length > 3) {
		var mod = number.length % 3;
		var output = (mod > 0 ? (number.substring(0,mod)) : '');
		for (i=0 ; i < Math.floor(number.length / 3); i++) {
			if ((mod == 0) && (i == 0))
				output += number.substring(mod+ 3 * i, mod + 3 * i + 3);
			else
				output+= ',' + number.substring(mod + 3 * i, mod + 3 * i + 3);
		}
		} else {
		output=number;
	}
	if(numberOrig.match('.') && numberArr[1]) {
		output = output + '.' + numberArr[1];
	}
	return numberSign+output;
}

/**
 * Function: stripCommas
 * Remove the commas from a number.
 * TODO: Again, more international version of this. (e.g. the Europeans use "," as the decimal point)
 *
 * Parameters:
 *  v - The string number with commas.
 */
function stripCommas(v) {
	v = new String(v);
	while(v.match(/\,/)) {
		v = v.replace(',','');
	}
	return v;
}


