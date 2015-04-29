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
 * Class: GeoMOOSE.MapSource
 * GeoMOOSE base layer.
 *
 * Do NOT forget to include a GeoMOOSE.registerMapSourceType() directive at the end of subclasses.
 *
 */

dojo.provide('GeoMOOSE.MapSource');

/*
 * Small internal _Layer object for tracking the layers from
 * a WMS request, et al.
 */
dojo.declare('GeoMOOSE._Layer', null, {
	path: "",
	name: "",
	on: false,

	constructor: function(path, name, on, initial_on) {
		/* parent path*/
		this.path = path;
		this.name = name;
		this.on = on;
		this.initial_on = initial_on;
		this.supports = {};
	},

	hasChanged: function() {
		return (this.on == this.initial_on);
	}
});

dojo.declare('GeoMOOSE.MapSource', null, {
	/**
	 * Variable: mapbookType
	 *
	 * The matching "type" attribute from the mapbook XML
	 */
	mapbookType: null,

	/**
	 * Variable: _ol_layer
	 *
	 * The OpenLayers Object Managed by the GeoMOOSE layer
	 */
	_ol_layer: null,

	/**
	 * Variable: path
	 *
	 * The root path of the MapSource. 
	 */
	path: "",

	/**
	 * Variable: cssName
	 *
	 * CSS Friendly identifier for the MapSource.
	 */
	cssName: "",

	/**
	 * Variable: params
	 * 
	 * Used to hold the "parameters" found in the mapbook.
	 */
	params: {},

	/** 
	 * Variable: paths
	 *
	 * A list of the matching paths for this layer.
	 */
	paths: [],

	/**
	 * Variable: titles
	 *
	 * A hash of the titles keyed on layer path.
	 */
	titles: {},

	/**
	 * Variable: metadata
	 *
	 * A hash of the metadata URLs keyed on layer path.
	 */
	metadata: {},

	/**
	 * Variable: controls
	 *
	 * A hash of OL controls supported by the layer.
	 */
	controls: {},

	/** 
	 * Variable: clearPopupsOnMove
	 * 
	 * Toggle whether to clear popups when the user moves the mouse.
	 * Defaults to CONFIGURATION.popups.clearOnMove
	 *
	 */
	clearPopupsOnMove: false,

	/**
	 * Method: _parseParams
	 *
	 * Parse the Mapbook parameters for a map-source
	 *
	 * Parameters:
	 *	mapbook_entry - The XML fragment pertaining to the mapbook entry.
	 */
	_parseParams: function(mapbook_entry) {
		var paramsHash = {};
		var params = mapbook_entry.getElementsByTagName('param');

		for(var p = 0, len = params.length; p < len; p++) {
			var param = params[p];
			paramsHash[param.getAttribute('name')] = param.getAttribute('value');
			//OpenLayers.Util.getXmlNodeValue(param);
		}
		return paramsHash;
	},

	/**
	 * Method: _parseLayers
	 *
	 * Parses the <layer/>s from a Mapbook Entry
	 *
	 * Parameters:
	 *	mapbook_entry - The XML fragment pertaining to the mapbook entry.
	 */

	 _parseLayers: function(mapbook_entry) {
	 	var layers = mapbook_entry.getElementsByTagName('layer');

		var ret_layers = [];

		for(var i = 0, len = layers.length; i < len; i++) {
			var name = layers[i].getAttribute('name');
			var title = layers[i].getAttribute('title');
			var metadata_url = layers[i].getAttribute('metadata_url');
			ret_layers.push(
				new GeoMOOSE._Layer(
					this.path,
					name,
					parseBoolean(layers[i].getAttribute('status')),
					/* _status is populated on load and should never be specified by the user. */
					parseBoolean(layers[i].getAttribute('_status'))
				)
			);
			this.paths.push(this.path+'/'+name);
			this.titles[this.path+'/'+name] = title;
			this.metadata[this.path+'/'+name] = metadata_url;
		}
		return ret_layers;
	 },

	/**
	 * Method: onLayersChange()
	 * Called every time a change is made to the visible layers list.
	 * A sub-class is expected to handle changing the values here.
	 *
	 * Parameters:
	 *  path - The layer path that changed.
	 *  visibility - How it changed.
	 */
	
	onLayersChange: function (path, visibility) {
		if(this._ol_layer) {
			this._ol_layer.setVisibility(this.isVisible());
		}
	},

	/**
	 * Method: _getLayersList()
	 * Returns an array of current layers.
	 */
	_getLayersList: function() {
		var layer_names = [];
		for(var i = 0, len = this.layers.length; i < len; i++) {
			if(this.layers[i].on === true) {
				layer_names.push(this.layers[i].name);
			}
				
		}
		return layer_names;
	},

	/**
	 * Method: getStatusDifferences()
	 * Returns a two element object with lists for "on" and "off",
	 * representing layers that are currently different than their 
	 * definition in the mapbook.
	 */
	
	getStatusDifferences: function() {
		var diffs = {'on' : [], 'off' : []};
		for(var i = 0, len = this.layers.length; i < len; i++) {
			var layer = this.layers[i];
			if(layer.on != layer.initial_on) {
				if(layer.on === true) {
					diffs['on'].push(layer.name);
				} else {
					diffs['off'].push(layer.name);
				}
			}
		}
		return diffs;
		
	},

	/**
	 * Method: getLayerByName()
	 * Returns a layer by name.
	 *
	 * Parameters:
	 *   name - The name of the layer.
	 *
	 * Returns:
	 *   A GeoMOOSE._Layer class, or null if not found.
	 *
	 */
	getLayerByName: function(name) {
		for(var i = 0, len = this.layers.length; i < len; i++) {
			if(this.layers[i].name == name) {
				return this.layers[i];	
			}
		}
		return null;
	},

	/**
	 * Method: isVisible()
	 * By default the isVisible checks to see if any layers are "on".
	 * This can be over-ridden depending on the layer type.
	 */
	isVisible: function() {
		return (this._getLayersList().length > 0);
	},

	/**
	 * Method: preParseNode(mapbook_xml)
	 * Can be overridden to convert some layer types (e.g. MapServer) into
	 * another (e.g. WMS)
	 */
	
	preParseNode: function(mapbook_xml) {
		return mapbook_xml;
	},

	/**
	 * Constructor: constructor
	 *
	 * Creates a new instance of a GeoMOOSE MapSource.
	 *
	 * Parmaeters:
	 *	mapbook_entry - The XML fragment pertaining to the mapbook entry.
	 */
	constructor: function(mapbook_entry) {
		this.clearPopupsOnMove = CONFIGURATION.popups.clearOnMove;

		this.paths = [];

		mapbook_entry = this.preParseNode(mapbook_entry);
		this.path = mapbook_entry.getAttribute('name');
		// technically we supported "/" in the names and so we 
		//  will replace them with css-friendly "-"s
		this.cssName = this.path.replace('/','-');
		this.params = this._parseParams(mapbook_entry);
		this.layers = this._parseLayers(mapbook_entry);

		this.attributes = {};
		var valid_attributes = ['opacity', 'buffer'];
		for(var i = 0, ii = valid_attributes.length; i < ii; i++) {
			var attr_value = mapbook_entry.getAttribute(valid_attributes[i]);
			if(!GeoMOOSE.isDefined(attr_value)) {
				attr_value = null;
			}
			this.attributes[valid_attributes[i]] = attr_value;
		}

	},

	/**
	 * Method: checkPath
	 *
	 * Checks to see if this is a matching path for this layer.
	 *
	 * Parameters:
	 *	path - The GeoMOOSE "path" format (POSIX style).
	 */
	
	checkPath: function(path) {
		/* Something like these needs to be made native in Javascript! */
		return (dojo.indexOf(this.paths, path) >= 0);
	},

	/**
	 * Method: setVisibility 
	 *
	 * Turn a layer on or off.
	 *
	 * Parameters:
	 * 	path - Path of layer from the mapbook.
	 *	visibility - the visibility status
	 */
	setVisibility: function(path, visibility) {
		var parts = path.split('/');
		var layer_name = parts.pop();

		var has_change = false;
		/* quick check to see if we really need to do anything */
		if(this.checkPath(path)) {
			for(var i = 0, len = this.layers.length; i < len; i++) {
				if(this.layers[i].name == layer_name) {
					if(visibility != this.layers[i].on) {
						this.layers[i].on = visibility;
						has_change = true;
					}
				}
			}
		}

		/* trigger us some events */
		if(has_change) {
			this.onLayersChange(path, visibility);
		}
	},

	/**
	 * Method: addToMap
	 * Adds the MapSource to the map.
	 * This may seem backwards, but a GeoMOOSE MapSource != an OpenLayers layer.
	 * addToMap takes care of the clean up to bridge that gap.
	 * 
	 * Parameters:
	 *  map - {<OpenLayers.Map}> Map to add the layer to.
	 *
	 */

	addToMap: function(map) {
		map.addLayers([this._ol_layer]);
	},


	setUrl: function(url) {
		/* do nothing, not all MapSources will support this but
		 the legacy API requies we provide a function. */
	},

	getUrl: function() {
		/* return a blank string.  This needs to be implemented
		 by subclasses */
		return '';
	},

	redraw: function() {
		if(this._ol_layer) {
			this._ol_layer.redraw(true);
		}
	},

	getParameters: function(params) {
		return this.params;
	},


	getOpacity: function() {
		var lay = this._ol_layer;
		if(lay.opacity != null) {
			return lay.opacity;
		}
		return 1;
	},

	setOpacity: function(opacity) {
		var layer = this._ol_layer;
		if(opacity > 1) { opacity = 1.0; }
		if(opacity < 0) { opacity = 0.0; }
		if(layer) {
			layer.setOpacity(opacity);
		}
	},

	getLegendUrls: function(paths) {
		return [];
	},

	moveUp: function() {
		Map.raiseLayer(this._ol_layer, 1);
	},

	moveDown: function() {
		Map.raiseLayer(this._ol_layer, -1);
	},

	updateParameters: function(params) {
		dojo.mixin(this.params, params);
	},

	clearParameters: function(params) {
		this.params = {};
	},

	/** 
	 * Variable: printable
	 * Indication whether this MapSource is printable.
	 */
	printable: false,

	/**
	 * Method: isPrintable
	 * Check whether the .printable flag is set.
	 * This is made into a function so that sub-classes can over-ride it with
	 * more specific knowledge (for example, printing maybe scale dependent)
	 */
	isPrintable: function() {
		return this.printable;
	},

	print: function() {
	},

	/*
	 * Method: _createBlankLayer
	 * Creates a "blank" WMS layer stub to preserve
	 * the behavior of a layer when a library is missing.
	 */
	_createBlankLayer: function(name) {
		return new OpenLayers.Layer.WMS(name,'images/blank.gif', {}, {singleTile: true});
	},

	/*
	 * Method: deactivate
	 * Deactivates any of the layer controls.
	 */
	deactivate: function() {
		for(var control in this.controls) {
			this.controls[control].deactivate();
		}
	}

});
