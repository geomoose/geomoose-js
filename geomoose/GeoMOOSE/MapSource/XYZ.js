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
 * Class: GeoMOOSE.MapSource.XYZ
 * Provides a XYZ MapSource to GeoMOOSE.
 *
 * Inherits from:
 *  - <GeoMOOSE.MapSource>
 */


dojo.provide('GeoMOOSE.MapSource.XYZ');

dojo.require('GeoMOOSE.MapSource.TMS');

dojo.declare('GeoMOOSE.MapSource.XYZ', [GeoMOOSE.MapSource.TMS], {

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
		this._ol_layer = new OpenLayers.Layer.XYZ(
			this.title,
			this.urls,
			options
		);	
	}
});

GeoMOOSE.registerMapSourceType('xyz', GeoMOOSE.MapSource.XYZ);
