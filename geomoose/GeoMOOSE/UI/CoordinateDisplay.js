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
 * Class: GeoMOOSE.UI.CoordinateDisplay
 * Provide the XY, Lat Long, and USNG display.
 */
dojo.provide('GeoMOOSE.UI.CoordinateDisplay');


dojo.declare('GeoMOOSE.UI.CoordinateDisplay', null, {
	constructor: function() {
		/* setup the UI bits */
		var footer = dojo.byId('footer');
		this.coordinate_display = dojo.create('span', {
			'id' : 'coordinate-display'
		}, footer);

		if(CONFIGURATION.coordinate_display.usng) {
			var has_usng = true;
			try {
				eval('new USNG2()');
			} catch(err) {
				GeoMOOSE.error('usng display requested but USNG2 Library is not included.');
				has_usng = false;
			}
			if(has_usng) {
				this.usng = new USNG2();
			}
		}

		/* wait for the mapbook to load and then finish setup */
		GeoMOOSE.register('onMapbookLoaded', this, this.gotMapbook);
	},

	gotMapbook: function() {
		this.map_proj = Map.getProjectionObject();
		this.lat_long = new OpenLayers.Projection('WGS84');

		/* add the control to the Map */
		var coordDisplay = new OpenLayers.Control.MousePosition({div: this.coordinate_display});
		coordDisplay.formatOutput = dojo.hitch(this, this.displayCoordinates);
		Map.addControl(coordDisplay);
	},

	displayCoordinates: function (lonLat) {
		var digits = parseInt(this.numDigits);
		var html = '';
		if(CONFIGURATION.coordinate_display.xy) {
			html += '<span class="coordinate-type">X,Y: </span>';
			html += lonLat.lon.toFixed(digits) + ', ' + lonLat.lat.toFixed(digits);
		}
		var degrees = new OpenLayers.Geometry.Point(lonLat.lon, lonLat.lat);
		var lat_long = OpenLayers.Projection.transform(degrees, this.map_proj, this.lat_long); 

		if(CONFIGURATION.coordinate_display.latlon) {
			html += '<span class="coordinate-type">Lat, Lon: </span>';
			html += lat_long.y.toFixed(3) + ', ' + lat_long.x.toFixed(3);
		}

		if(CONFIGURATION.coordinate_display.usng) {
			html += '<span class="coordinate-type">USNG: </span>';
			// Map.getResolution returns map units per pixel
			var inches = OpenLayers.INCHES_PER_UNIT;
			/* Convert the map units to inches, and then inches to meters */
			var metersPerPx = Map.getResolution() * (inches[Map.getUnits()] * (1/inches['m']));
			var digits = 6-Math.ceil(Math.log(metersPerPx)/2.302585092994046);
			try {
				var usng_c = this.usng.fromLonLat({
				                   lon: lat_long.x, 
				                   lat: lat_long.y}, digits);
				html += usng_c;
			} catch(err) {
				html += err;
			}
		}
		return html;
	}
});

