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
 * Class: GeoMOOSE.MapSource.Google
 * Provides a Google MapSource to GeoMOOSE.
 *
 * Inherits from:
 *  - <GeoMOOSE.MapSource>
 */


dojo.provide('GeoMOOSE.MapSource.Google');

dojo.require('GeoMOOSE.MapSource');

dojo.declare('GeoMOOSE.MapSource.Google', [GeoMOOSE.MapSource], {

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
		this._ol_layer_name = 'google'+GeoMOOSE.id();
		this._ol_layer = new OpenLayers.Layer.Google(
			this._ol_layer_name,
			options
		);	
	},

	/**
	 * Constructor: constructor
	 * Creates a new Google MapSource
	 * 
	 * Parameters:
	 *  mapbook_entry - XML fragment defining the MapSource
	 */
	constructor: function(mapbook_entry) {
		if(!GeoMOOSE.isDefined(window.google) || !GeoMOOSE.isDefined(google.maps) || !GeoMOOSE.isDefined(google.maps.MapTypeId.TERRAIN)) {
			var message = "Warning, this application has a Google Maps layer defined in the mapbook, but the Google Maps library has not been included."
			GeoMOOSE.error(message);

			this._ol_layer_name = 'goog_error'+GeoMOOSE.id();
			this._ol_layer = this._createBlankLayer(this._ol_layer_name);
			return false;
		}
		/* OpenLayers internal options */
		var options = {
			visibility: this.isVisible(),
			isBaseLayer: false
		};

		var google_types = {
			'physical' : google.maps.MapTypeId.TERRAIN,
			'streets' : null, // default
			'hybrid' : google.maps.MapTypeId.HYBRID,
			'satellite' : google.maps.MapTypeId.SATELLITE
		};
		var layer_type = mapbook_entry.getAttribute('google-type');
		var google_type = google_types[layer_type];
		if(GeoMOOSE.isDefined(google_type)) {
			options['type'] = google_type;
		}

		this._createOLLayer(options);
	},

	/**
	 * Method: addToMap
	 * When this is added, refresh the layers.
	 */
	addToMap: function(map) {
		this.inherited(arguments);
		this.onLayersChange();
	},

	/**
	 * Method: onLayersChange
	 * When the Layers List changes, update the params, and refresh the layer.
	 */

	onLayersChange: function(path, visibility) {
		this.inherited(arguments);
		this._ol_layer.redraw();
	}
});

GeoMOOSE.registerMapSourceType('google', GeoMOOSE.MapSource.Google);
