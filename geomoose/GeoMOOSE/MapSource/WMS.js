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
 * Class: GeoMOOSE.MapSource.WMS
 * Provides a WMS MapSource to GeoMOOSE.
 *
 * Inherits from:
 *  - <GeoMOOSE.MapSource>
 */


dojo.provide('GeoMOOSE.MapSource.WMS');

dojo.require('GeoMOOSE.MapSource');

dojo.declare('GeoMOOSE.MapSource.WMS', [GeoMOOSE.MapSource], {

	/**
	 * Method: _createOLLayer(options)
	 * Internal method to create the OpenLayers Layer object. 
	 * This is divorced from the constructor so it can be overriden
	 * without hitting an inheritance chain.
	 *
	 * Parameters:
	 *  options - OpenLayers Layer Options hash.
	 */
	_createOLLayer: function(options) {
		this._ol_layer = new OpenLayers.Layer.WMS(
			this._ol_layer_name,
			this.urls,
			this.params,
			options
		);	
	},

	/**
	 * Constructor: constructor
	 * Creates a new WMS MapSource
	 * 
	 * Parameters:
	 *  mapbook_entry - XML fragment defining the MapSource
	 */
	constructor: function(mapbook_entry) {
		/* get all the URLs */
		this.urls = [];
		var urls = mapbook_entry.getElementsByTagName('url');
		for(var i = 0, len = urls.length; i < len; i++) {
			this.urls.push(OpenLayers.Util.getXmlNodeValue(urls[i]));
		}

		var transitionEffect = CONFIGURATION.layer_options.transitionEffect;
		if(transitionEffect == "null")
			transitionEffect = null;

		/* OpenLayers internal options */
		var options = {
			singleTile : !parseBoolean(mapbook_entry.getAttribute('tiled'), false),
			isBaseLayer: false,
			ratio: CONFIGURATION.layer_options.ratio, /* (1) only applies in single tile mode */
			buffer: CONFIGURATION.layer_options.buffer, /* (0) only applies in tiled/gridded mode */
			transitionEffect: transitionEffect,
			visibility: this.isVisible(),
			/* by default setup the popup controls */
			popups: parseBoolean(mapbook_entry.getAttribute('popups'), true)
		};

		transitionEffect = mapbook_entry.getAttribute('transitionEffect');
		if(transitionEffect) {
			if(transitionEffect == "null")
				transitionEffect = null;
			options.transitionEffect = transitionEffect;
		}

		if(options.singleTile) {
			var buffer = parseFloat(mapbook_entry.getAttribute('buffer'));
			if(buffer) {
				options.ratio = buffer;
			}
		} else { /* !singleTile */
			var w = mapbook_entry.getAttribute('width');
			var h = mapbook_entry.getAttribute('height');
			if(w && h) {
				options.tileSize = new OpenLayers.Size(parseFloat(w), parseFloat(h));
			}
			var buffer = parseInt(mapbook_entry.getAttribute('buffer'));
			if(buffer) {
				options.buffer = buffer;
			}
		}

		var title = mapbook_entry.getAttribute('title');
		if(GeoMOOSE.isDefined(title)) {
			this._ol_layer_name = title;
		} else {
			this._ol_layer_name = this.path;
		}

		if(!GeoMOOSE.isDefined(this.params['FORMAT'])) {
			this.params['FORMAT'] = 'image/png';
		}
		if(!GeoMOOSE.isDefined(this.params['TRANSPARENT'])) {
			this.params['TRANSPARENT'] = 'TRUE';
		}

		this._createOLLayer(options);

		if(GeoMOOSE.isDefined(this.attributes['opacity'])) {
			this.setOpacity(parseFloat(this.attributes['opacity']));
		}

		this.updateParameters({});

		this.supports = {'popups': true};
		this.onLayersChange();
	},

	addToMap: function(map) {
		this.inherited(arguments);

		var feature_info_control = new OpenLayers.Control.WMSGetFeatureInfo({
			'url' : this.urls[0],
			'layers' : [this._ol_layer],
			'hover' : true,
			'queryVisible' : true,
			'vendorParams' : this.params
		});

		feature_info_control._activate = feature_info_control.activate;

		feature_info_control.activate = function(kwargs) {
			if(GeoMOOSE.isDefined(kwargs) && GeoMOOSE.isDefined(kwargs.title)) {
				this.title = kwargs.title;
			} else {
				this.title = '&nbsp;';
			}
			this._activate();
		}

		/* this corrects a bug we were having with IE11,
		 *  OpenLayers document sniffing was causing issues. */
		feature_info_control.handleResponse = function(xy, request, url) {
			this.triggerGetFeatureInfo(request, xy, []);
		}

		feature_info_control.events.register('getfeatureinfo', {layer: this, control: feature_info_control}, function(ev) {
			var ol_map = this.layer._ol_layer.map;
			var popup_id = 'popup'+GeoMOOSE.id();
			if(ev.text && ev.text.length > 1) {
				ol_map.addPopup({
					clearOnMove: this.layer.clearPopupsOnMove,
					renderOnAdd: true,
					renderXY: ev.xy, 
					id: popup_id,
					title: this.control.title,
					classNames: [this.layer.cssName],
					content: ev.text
				});
			}
		});

		this.controls = {
			'popups' : feature_info_control 
		}
		map.addControl(this.controls['popups']);
	},

	/**
	 * Method: onLayersChange
	 * When the Layers List changes, update the params, and refresh the layer.
	 */

	onLayersChange: function(path, visibility) {
		this._ol_layer.params['LAYERS'] = this._getLayersList().join(',');
		this.inherited(arguments);
		this._ol_layer.redraw(true);
	},

	getUrl: function() {
		return this.urls;
	},

	setUrl: function(url) {
		this.urls = [url];
		this._ol_layer.url = url;
	},

	updateParameters: function(params) {
		this.inherited(arguments);
		this._ol_layer.mergeNewParams(this.params);
	},

	clearParameters: function() {
		var keepers = ['service','version','request','styles','format'];
		var new_params = {};
		for(var i = 0, ii = keepers.length; i < ii; i++) {
			new_params[keepers[i]] = this._ol_layer.DEFAULT_PARAMS[keepers[i]];
		}
		this.params = {};		
		this._ol_layer.params = new_params;
	},

	getLegendUrls: function(paths) {
		var urls = this._ol_layer.url;  // this.urls
		var params = {};  // need to clone so we don't change the orig.
		for(var k in this._ol_layer.params ) {
			params[k] = this._ol_layer.params[k];
		}

		// Add legend parameters
		params['REQUEST'] = 'GetLegendGraphic';
		params['SCALE'] = GeoMOOSE.getScale();
		params['WIDTH'] = 250;// Get Legend Width in Pixels -- how updated when user drags handle?
	
		// Remove non-legend parameters	
		var ls = params['LAYERS'].split(',');
		if(!GeoMOOSE.isDefined(params['STYLES'])) {
			params['STYLES'] = '';
		}
		var ss = params['STYLES'].split(',');
		var styles = {};
		for(var i in ls) {
			styles[ls[i]] = ss[i];
		}
		delete params['LAYERS'];
		delete params['STYLES'];

		var param_array = [];
		for( var k in params ) {
			param_array.push(k + "=" + params[k]); // URL encode
		}

		var legendURL = urls[0]; 

		// Check to see if there is a ? in the 
		//  URL, if so, add a '&' before adding parameters
		//  or add the ? 
		if(legendURL.indexOf('?') > 0) {
			legendURL+='&';
		} else {
			legendURL+='?';
		}
		legendURL += param_array.join('&');

		// Loop over layers and get legend all legnd chips
		var layers = this._getLayersList();
		var legend_urls = [];

		var add_to_list = false;
		if(paths instanceof Array) {
			/* TODO: Really need to come up with a sane way of handling heirarchy! */
			for(var i = 0, len = paths.length; i < len; i++) {
				paths[i] = paths[i].split('/')[1];
			}

			for(var p = 0, plen = paths.length; p < plen; p++) {
				if(dojo.indexOf(layers, paths[p]) >= 0) {
					var url = legendURL;
					if(GeoMOOSE.isDefined(paths[p])) {
						if(GeoMOOSE.isDefined(styles[paths[p]])) {
							url += '&STYLE=' + styles[paths[p]];
						}
						legend_urls.push(url + '&LAYER=' + paths[p]);
					}
				}
			}
		} else {
			/* if we're not locking it down, then just return everything */
			for(var i = 0, len = layers.length; i < len; i++) {
				legend_urls.push(legendURL + '&LAYER=' + layers[i] + '&STYLE=' + styles[layers[i]]);
			}
		}

		return legend_urls;
	},


	/*
	 * Method: getLayerParams
	 * 
	 * Parameters:
	 *  all_params - Get all the parameters from the WMS, instead of just
	 *   the internal ones.
	 */
	getLayerParams: function(all_params) {
		if(all_params === true) {
			var p = {};
			dojo.mixin(p, OpenLayers.Util.upperCaseObject(this._ol_layer.params));
			dojo.mixin(p, this.params);
			return p;
		}
		return this.params;
	},

	/*
	 * Method: print
	 * 
	 * Return the print representation of this layer.
	 */

	printable: true, /* this can be printed */
	
	print: function() {
		var print_obj = {
			'type' : 'wms',
			'url' : this.urls[0],
			'layers' : this._getLayersList(),
			'legends' : this.getLegendUrls(),
		        'params' : this.getLayerParams(true),
		        'zindex': this._ol_layer.getZIndex(),
			'opacity': this._ol_layer.opacity
		};
		return print_obj;
	}

});

GeoMOOSE.registerMapSourceType('wms', GeoMOOSE.MapSource.WMS);
