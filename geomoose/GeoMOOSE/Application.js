/*
Copyright (c) 2009-2012, Dan "Ducky" Little & GeoMOOSE.org

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
 * Class: GeoMOOSE.Application
 *
 * The class defining a GeoMOOSE application.
 */


dojo.provide('GeoMOOSE.Application');

dojo.declare('GeoMOOSE.Application', null, {

	_tabContainer: 'tabs',
	
	mapSources: {},

	/*
	 * Member: events {<OpenLayers.Events}>}
	 * Global events, like turning on or off a layer.
	 */
	events: null,


	/*
	 * Member: isPopupSticky
	 * Toggles whether the current popups should be "sticky"
	 */
	isPopupSticky: false,

	/*
	 * Member: popups
	 * Hash of popups currently on display in the map.
	 */
	popups: {},

	initialize: function() {
	},

	startup: function() {
		/* setup the popups array */
		this.popups = {};

		/* Load the extensions */
		var extensions = GeoMOOSE.UX.getExtensions();

		for(var i = 0; i < extensions.length; i++) {
			var n = new extensions[i]();
			n.load();
		}

		/* startup global arguments */
		var args = GeoMOOSE.getUrlParameters();
	
		/* Check for the debug flag, override configuration settings */
		if(args.debug) {
			CONFIGURATION['debug'] = true;
		}

		/* if there is a mapbook parameter, let it override the default */
		var mapbook_url = undefined;
		if(args.mapbook) {
			mapbook_url = args.mapbook;
		}

		/* initalize the global event handler */
		this.events = new OpenLayers.Events();

		/* and start off the real application by fetching the mapbook */
		this.getMapbook(mapbook_url);
	},

	/**
	 * Method: getMapbook
	 * Loads the mapbook from the CONFIG.mapbook, or an alternative from the url parameter.
	 *
	 * Parameters:
	 *  url - Overrides the setting from CONFIG
	 */
	getMapbook: function (url) {
		var mapbook_url = GeoMOOSE.isDefined(url) ? url : CONFIGURATION.mapbook;

		dojo.xhrGet({
			'url' : mapbook_url,
			'load' : dojo.hitch(this, this.gotMapbook),
			'error' : dojo.hitch(this, this.onMapbookLoadError),
			'handleAs' : 'xml'
		});
	},

	/**
	 * Method: onGotMapbook
	 * Called when the mapbook is loaded and ready for parsing.
	 * Use hooks to this for doing custom onGotMapbook functionaliy.
	 */
	onGotMapbook: function(response) {
	},

	/**
	 * Method: gotMapbook
	 * Called immediate after the mapbook is loaded from the server.
	 */
	gotMapbook: function(response) {
		if(!GeoMOOSE.isDefined(response)) {
			var master_div = dojo.create('div', {}, dojo.body());
			var message_div = dojo.create('div', {'innerHTML' : CONFIGURATION.messages.mapbook_invalid}, master_div);
			dojo.style(master_div, {
				'position' : 'absolute',
				'top' : '0', 'left' : '0',
				'width' : '100%', 'height' : '100%',
				'backgroundColor' : 'white',
				'fontWeight' : 'bold', 'fontSize' : '1.5em',
				'opacity' : '.8',
				'zIndex' : '1000'
			});

			dojo.style(message_div, {
				'position' : 'absolute',
				'top' : '5%', 'width' : '20em',
				'left' : '-10em', 'marginLeft' : '50%',
				'backgroundColor' : 'white', 
				'opacity' : '1',
				'padding' : '.5em',
				'border' : 'solid 1px #444'
			})
			/* short circuit */
			return false;
		}
		/* check the version of the mapbook. */

		/* parse the configuration bits to setup the interface */
		this.parseConfiguration(response);

		/* configure the map */
		this.configureMap();

		/* add the MapSources */
		this.configureMapSources(response);

		/* check for initial extent override */
		var params = GeoMOOSE.getUrlParameters();
		if(GeoMOOSE.isDefined(params.extent)) {
			var extent = params.extent.split(',');
			for(var i = 0; i < 4; i++) {
				extent[i] = parseFloat(extent[i]);
			}
			/* set the initial_extent as this will be our new initial extent */
			CONFIGURATION.initial_extent = extent;
		}

		/* zoom to the initial extent */
		Map.zoomToExtent(OpenLayers.Bounds.fromArray(CONFIGURATION.initial_extent));

		/* And let the event hooks know what happened */
		this.onGotMapbook(response);

		if(this.active_map_source) {
			GeoMOOSE.activateMapSource(this.active_map_source);
		}

		GeoMOOSE.activateDefaultTool();
	},

	/**
	 * Method: onMapbookLoadError
	 * Called when the Mapbook fails to load.
	 */
	onMapbookLoadError: function(response) {
		/* TODO: Add some way of making this configurable for different behaviors - and internationalization - that'd be good too*/
	},

	/**
	 * Method: parseConfiguration
	 * Parses the configuration into the global CONFIGURATION hash
	 */

	_getConfigValue: function(name) {
		var seed = CONFIGURATION;
		var path = name.split('.');
		var i = 0;
		while(i < path.length) {
			if(typeof(seed[path[i]]) != "undefined") {
				seed = seed[path[i]];
			} else {
				return undefined;
			}
			i++;
		}
		return seed;
	},

	_setConfigValue: function(name, value) {
		var s = 'CONFIGURATION';
		var seed = CONFIGURATION;
		var path = name.split('.');
		for(var i = 0, ii = path.length; i < ii; i++) {
			s += '["'+path[i]+'"]';
		}
		eval(s+'=arguments[1]');
	},

	parseConfiguration: function(response) {
		/* get the configuration object */
		var configuration = response.getElementsByTagName('configuration')[0];
		/* check that we're not working agianst null and that there are some children worth 
		    working on */
		if(configuration && configuration.childNodes) {
			var params = configuration.getElementsByTagName('param');
			var n_params = params.length;
			for(var p = 0; p < n_params; p++) {
				var param = params[p];
				var name = param.getAttribute('name');
				var value = OpenLayers.Util.getXmlNodeValue(param);

				/* this is a bit naughty... but it works quite well */
				var typeValue = this._getConfigValue(name);

				var var_type = typeof(typeValue);

				if(typeValue instanceof Array) {
					if(value[0] == '[' && value[value.length-1] == ']') {
						value = value.substring(1,value.length-1);
					}
					value = eval('['+value+']');
				} else if(var_type == 'string') {
					/* do nothing, don't need to do anything with strings. */
				} else if(var_type == 'boolean') {
					value = parseBoolean(value);
				} else if(var_type == 'object') {
					value = dojo.fromJson(value);
				} else {
					value = eval('('+value+')');
				}

				this._setConfigValue(name, value);
				try {
				} catch(e) {
					/* TODO: Make this use some form of localization */
					GeoMOOSE.warning(GeoMOOSE.processTemplate(CONFIGURATION.messages.mapbook_param_error, {'FIELD' : name}));
				}
			}
		}
	},

	/**
	 * Method: configureMap
	 * Sets up the main OpenLayers.Map object with the GeoMOOSE configuration,
	 * and creates the "navigation" layer.
	 */
	
	configureMap: function () {
		CONFIGURATION.scales = CONFIGURATION.scales.sort().reverse();
		var options = {
			tileManager: null,
			maxExtent : OpenLayers.Bounds.fromArray(CONFIGURATION.max_extent),
			resolutions: CONFIGURATION.scales,
			controls : [new OpenLayers.Control.PanZoomBar()], //, new OpenLayers.Control.ScaleJumper({target: 'scale-jumper'})],
			units: CONFIGURATION.ground_units,
			projection: new OpenLayers.Projection(CONFIGURATION.projection),
			displayProjection: new OpenLayers.Projection(CONFIGURATION.projection),
			fractionalZoom: CONFIGURATION.fractional_zoom
		}


		var test_for = {
			'scales' : 'resolutions',
			'maxResolution' : 'maxResolution',
			'numZoomLevels' : 'numZoomLevels'
		}

		for(var key in test_for) {
			if(GeoMOOSE.isDefined(CONFIGURATION[key])) {
				options[test_for[key]] = CONFIGURATION[key];
			}
		}

		if(GeoMOOSE.isDefined(options['numZoomLevels']) && GeoMOOSE.isDefined(options['maxResolution'])) {
			/* don't let the resolutions over power things */
			if(GeoMOOSE.isDefined(options['resolutions'])) {
				delete options['resolutions'];
			}
		}

		/* Setup the Map */	
		/* TODO: Maybe not map Map a global variable, and maybe make the target div configurable */
		Map = new OpenLayers.Map('mapContainer', options);

		/* Add the GeoMOOSE configuration layer.  This let's us avoid nasty basemap issues */

		options['singleTile'] = true;

		this.navigationLayer = new OpenLayers.Layer.WMS('GeoMOOSE Navigation Layer',
			'images/blank.gif', /* url */
			{}, /* no params */
			options /* and we won't bother to tile it */
		);

		Map.addLayers([this.navigationLayer]);


		if(CONFIGURATION['debug']) {
			Map.addControl(new OpenLayers.Control.LayerSwitcher());
		}



		this.configureMapTools();

		this.configureServiceManager();

		GM_Events.triggerEvent('onMapCreated', Map);

		dojo.connect(dijit.byId('map'), 'resize', function() {
			Map.updateSize();
		});

		/* override the map popups functions with out own.  */
		Map.addPopup = dojo.hitch(this, this.addPopup);
		Map.removePopup = dojo.hitch(this, this.removePopup);

		Map.events.register('moveend', this, this.clearPopups);

		// place a scale line on the map


//		var mapContainer = dojo.byId('mapContainer');
//		dojo.connect(mapContainer, 'click', dojo.hitch(this, this.toggleStickyPopups));
//		dojo.connect(mapContainer, 'mouseout', dojo.hitch(this, this.clearPopups));
	},

	/**
	 * Method: configureMapTools
	 * Configures the internal tools relating to the map.
	 */
	configureMapTools: function() {
		/* internal-type navigation tools */
		Tools['pan'] = new OpenLayers.Control.Navigation();
		Tools['zoomin'] = new OpenLayers.Control.ZoomBox();
		Tools['zoomout'] = new OpenLayers.Control.ZoomBox({out: true});

		var added_tools = ['pan','zoomin','zoomout'];
		for(var i = 0, len = added_tools.length; i < len; i++) {
			Map.addControl(Tools[added_tools[i]]);
		}

		/* Keep scroll wheel zoom always available by adding a second
			navigation tool that cannot be deactivate()-ed  */
		if (CONFIGURATION['always_scroll_zoom']) {
			var nav = new OpenLayers.Control.Navigation();
			Map.addControl(nav);
		}

		/* Not my favorite way to do this but I'm not wanting to spend a lot of time
			refactoring EVERYTHING before 3.0 */

		var nav_history = new OpenLayers.Control.NavigationHistory();
		Map.addControl(nav_history);

		/* Wrapper objects for navigation history */
		var previous = { activate: function() { nav_history.previous.trigger(); }, deactivate: function() { } };
		var next = { activate: function() { nav_history.next.trigger(); }, deactivate: function() { } };

		/* And a wrapper for the simply Map function */
		var fullExtent = { activate: function() { Map.zoomToMaxExtent(); }, deactivate: function () { } };

		Tools['previous'] = previous;
		Tools['next'] = next;
		Tools['fullextent'] = fullExtent;

		// add the scale line to the map as configured.
		if(CONFIGURATION.scale_line && CONFIGURATION.scale_line.enabled) {
			Map.addControl(new OpenLayers.Control.ScaleLine({
				bottomOutUnits: CONFIGURATION.scale_line.bottom_units,
				bottomInUnits: CONFIGURATION.scale_line.bottom_units,
				topOutUnits: CONFIGURATION.scale_line.top_units,
				topInUnits: CONFIGURATION.scale_line.top_units,
				maxWidth: CONFIGURATION.scale_line.width
			}));
		}


	},

	/** Method: configureMapSource
	 * Parses a map-source XML fragment and creates necessary GM and OL classes
	 *
	 * Parameters
	 *  map_source_xml - The <map-source> xml node
	 */
	configureMapSource: function(map_source_xml, override_list) {
		var map_source_class = GeoMOOSE.getMapSourceType(map_source_xml.getAttribute('type'));
		var name = map_source_xml.getAttribute('name');

		/* pre-process the map-source's layer params with the override list */
		var layers = map_source_xml.getElementsByTagName('layer');
		for(var l = 0, ll = layers.length; l < ll; l++) {
			var layer = layers[l];
			/* copy the old status to the new. */
			var layer_status = layer.getAttribute('status');
			if(!GeoMOOSE.isDefined(layer_status)) {
				layer_status = 'off'; 
				/* Lazy complete the XML definition for the user */
				layer.setAttribute('status', 'off');
			}
			layer.setAttribute('_status', layer_status); 

			/* check to see if we've turned this on or off... */
			var layer_name = layer.getAttribute('name');
			var path = name+'/'+layer_name;
			if(GeoMOOSE.isDefined(override_list[path])) {
				layer.setAttribute('status', override_list[path]);
			}
		}

		if(typeof(map_source_class) == 'undefined') {
			GeoMOOSE.warning('Undefined Layer Type : ' + map_source_xml.getAttribute('type'));
		} else {
			/* warn the user they did something wrong */
			if(this.mapSources[name]) {
				GeoMOOSE.warning('map-source "'+name+'" is being redefined!.');
			}
			/* but do it anyway */
			this.mapSources[name] = new map_source_class(map_source_xml);
			this.mapSources[name].addToMap(Map);
			dojo.connect(this.mapSources[name], 'onLayersChange', this.onLayersChange);
		}
	},

	/**
	 * Method: configureMapSources
	 * Creates real classes for all of the MapSources.
	 *
	 * Parameters:
	 *  response - The Mapbook.
	 */
	configureMapSources: function(response) {
		this.mapSources = {};

		var active_map_source = null;

		var override_list = {};

		var args = GeoMOOSE.getUrlParameters();
		if(args.on) {
			var on_list = new String(args.on).split(';');
			for(var i = 0, ii = on_list.length; i < ii; i++) {
				override_list[on_list[i]] = 'on';
			}
		}
		if(args.off) {
			var off_list = new String(args.off).split(';');
			for(var i = 0, ii = off_list.length; i < ii; i++) {
				override_list[off_list[i]] = 'off';
			}
		}


		/* Map sources are listed "top to bottom" so we need to iterate through them backwards */
		var map_sources = response.getElementsByTagName('map-source');
		for(var i = map_sources.length - 1; i >= 0; i--) {
			var map_source_xml = map_sources[i];
			this.configureMapSource( map_source_xml, override_list );

			if(parseBoolean(map_source_xml.getAttribute('active'), false)) {
				active_map_source = map_sources[i].getAttribute('name');
			}
		}

		this.active_map_source = active_map_source;

	},

	/**
	 * Method: getMapSource
	 * Takes a full path and return a MapSource
	 *
	 * Parameters:
	 *  name - Name of the MapSource or a "/"-delimited path.
	 */
	getMapSource: function(name) {
		var parts = name.split('/');
		return this.mapSources[parts[0]];
	},

	/*
	 * Method: onLayersChange
	 */
	onLayersChange: function(path, visibility) {
	},

	/*
	 * Method: getVisibleLayers
	 * Iterates through the mapSources and returns a list of the visible paths.
	 */

	getVisibleLayers: function() {
		var visible_layers = [];
		for(var name in this.mapSources) {
			if(this.mapSources[name].isVisible()) {
				visible_layers.push(name);
			}
			var source_layers = this.mapSources[name]._getLayersList();
			for(var i = 0, len = source_layers.length; i < len; i++) {
				source_layers[i] = name+'/'+source_layers[i];
			}
			visible_layers = visible_layers.concat(source_layers);
		}
		return visible_layers;
	},

	/*
	 * Method: getStatusDifferences
	 * Iterates through all the Map Source's and Layers and returns which
	 * ones have changed through use of the application.
	 *
	 * Returns:
	 *  An object containing "off" and "on" members, which are lists containing
	 *  the list of layers which have been turned on and off.
	 */
	
	getStatusDifferences: function() {
		var layers = {'on' : [], 'off' : []};
		for(var name in this.mapSources) {
			var diffs = this.mapSources[name].getStatusDifferences();
			for(var stat in layers) {
				for(var i = 0, ii = diffs[stat].length; i < ii; i++) {
					layers[stat].push(name+'/'+diffs[stat][i]);
				}
				
			}
		}
		return layers;
	},

	/*
	 * Method: configureServiceManager
	 * Configures the service manager, which provides the core functionality
	 * for talking with servers.
	 */

	configureServiceManager: function () {
	},

	/*
	 * Method: activateMapSource
	 * Triggers on onActivateMapSource Event.
	 */
	
	activateMapSource: function(path) {
		this.active_map_source = path;
		this.onActivateMapSource(path);
	},

	getActiveMapSource: function() {
		return this.active_map_source;
	},
	
	/*
	 * Method: onActivateMapSource
	 * Triggered when a layer is "activated."
	 */

	onActivateMapSource: function(path) {
		dojo.publish('geomoose/activate-map-source', [path]);
	},

	/*
	 * Method: addPopup
	 * Place a popup on the map.
	 */
	addPopup: function(popup) {
		var popup_div = dojo.create('div', {}, Map.div);
		this.popups[GeoMOOSE.id()] = new GeoMOOSE.Popup(popup, popup_div);
	},

	removePopup: function(popupId) {
		if(this.popups[popupId]) {
			this.popups[popupId].close();
			delete this.popups[popupId];
		}
	},

	clearPopups: function() {
		var keys = [];
		for(var key in this.popups) {
			keys.push(key);
		}
		for(var i = 0, ii = keys.length; i < ii; i++) {
			this.popups[keys[i]].close();
			delete this.popups[keys[i]];
		}
	}
});


