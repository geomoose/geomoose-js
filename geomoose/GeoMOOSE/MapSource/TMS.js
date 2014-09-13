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
 * Class: GeoMOOSE.MapSource.TMS
 * Provides a TMS MapSource to GeoMOOSE.
 *
 * Inherits from:
 *  - <GeoMOOSE.MapSource>
 */


dojo.provide('GeoMOOSE.MapSource.TMS');

dojo.require('GeoMOOSE.MapSource');

dojo.declare('GeoMOOSE.MapSource.TMS', [GeoMOOSE.MapSource], {

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
		this._ol_layer = new OpenLayers.Layer.TMS(
			this.title,
			this.urls,
			options
		);	
	},

	/**
	 * Constructor: constructor
	 * Creates a new TMS MapSource
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
			visibility: this.isVisible(),
			isBaseLayer: false,
			sphericalMercator: true,
			buffer: CONFIGURATION.layer_options.buffer, /* 0 */
			transitionEffect: transitionEffect
		};

        transitionEffect = mapbook_entry.getAttribute('transitionEffect');
        if(transitionEffect) {
            if(transitionEffect == "null")
                transitionEffect = null;
			options.transitionEffect = transitionEffect;
        }

		/* parse the tilesize, defaults to 256x256 */
		var w = mapbook_entry.getAttribute('width');
		var h = mapbook_entry.getAttribute('height');
		if(!GeoMOOSE.isDefined(w)) { w = 256; }
		if(!GeoMOOSE.isDefined(h)) { h = 256; }
		options.tileSize = new OpenLayers.Size(parseFloat(w), parseFloat(h));

		var buffer = parseInt(mapbook_entry.getAttribute('buffer'));
		if(buffer) {
			options.buffer = buffer;
		}

		/* get the image format, uses WMS style definition, default to png */
		var image_format = 'png';
		if(GeoMOOSE.isDefined(this.params['FORMAT'])) {
			image_format = this.params['FORMAT'];
			delete this.params['FORMAT'];
		}

		/* strip "image/" from a mimetype, if specified that way. */
		var has_slash = image_format.indexOf('/');
		if(has_slash > 0) {
			image_format = image_format.substring(has_slash+1);
		}
		options['type'] = image_format;

		/* define the layer name */
		options['layername'] = this.layers[0].name;

		/* pass through any other parameters set in the mapbook
		 * TODO: should this code be merged with the WMS case?
		 */
		dojo.mixin(options, this.params);

		if(!GeoMOOSE.isDefined(this.title)) {
			this.title = this.path;
		}

		this._createOLLayer(options);
		this.onLayersChange();
	},

	/**
	 * Method: onLayersChange
	 * When the Layers List changes, update the params, and refresh the layer.
	 */

	onLayersChange: function(path, visibility) {
		//this._ol_layer.params['LAYERS'] = this._getLayersList().join(',');
		this.inherited(arguments);
		this._ol_layer.redraw();
	},

	getUrl: function() {
		return this.urls;
	},

	setUrl: function(url) {
		this.urls = url;
		this._ol_layer.url = url;
	}


});

GeoMOOSE.registerMapSourceType('tms', GeoMOOSE.MapSource.TMS);
