/*
Copyright (c) 2009-2015, Dan "Ducky" Little & GeoMOOSE.org

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

/** HashTrack
 *
 *  Continuously update the hash tag in the URL to match the location of 
 *  the map.  On startup, change the default extents to the stored location.
 *
 */

HashTrack = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	initialCenter: null,
	initialZoom: null,

	init: function(map) {
		var args = dojo.queryToObject(''+window.location.hash.substring(1));
		console.log('Args?', args);
		if(args.l) {
			var split = args.l.split(',');

			this.initialCenter = new OpenLayers.LonLat();
			this.initialCenter.lat = parseFloat(split[0]);
			this.initialCenter.lon = parseFloat(split[1]);
			this.initialZoom = parseFloat(split[2]);

			GeoMOOSE.register('onMapbookLoaded', this, function() {
				map.setCenter(this.initialCenter, this.initialZoom);
			});
		}
		map.events.register('moveend', this, this.mapMoved);
	},

	mapMoved: function() {
		var center = Map.getCenter();
		var zoom = Map.getZoom();
		var position = center.lat + ',' + center.lon + ',' + zoom;
		window.location.hash = '#l='+position 
	},

	load: function() {
		GeoMOOSE.register('onMapCreated', this, this.init);
	},
	
	CLASS_NAME: "HashTrack"
});

GeoMOOSE.UX.register('HashTrack');
