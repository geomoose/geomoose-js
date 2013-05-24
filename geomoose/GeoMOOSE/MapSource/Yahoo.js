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
 * Class: GeoMOOSE.MapSource.Yahoo
 * Provides a Yahoo MapSource to GeoMOOSE.
 *
 * Inherits from:
 *  - <GeoMOOSE.MapSource>
 */


dojo.provide('GeoMOOSE.MapSource.Yahoo');

dojo.require('GeoMOOSE.MapSource');

dojo.declare('GeoMOOSE.MapSource.Yahoo', [GeoMOOSE.MapSource], {

	/**
	 * Constructor: constructor
	 * Creates a new Yahoo MapSource
	 * 
	 * Parameters:
	 *  mapbook_entry - XML fragment defining the MapSource
	 */
	constructor: function(mapbook_entry) {
		var message = "Warning, this application has a Yahoo Maps layer defined in the mapbook, but the Yahoo MapSource type has been removed as it is no longer supported by OpenLayers."
		GeoMOOSE.error(message);

		this._ol_layer_name = 'yahoo_error'+GeoMOOSE.id();
		this._ol_layer = this._createBlankLayer(this._ol_layer_name);
		return false;
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

GeoMOOSE.registerMapSourceType('yahoo', GeoMOOSE.MapSource.Yahoo);
