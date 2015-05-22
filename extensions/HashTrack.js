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
	center: null,
	zoomLevel: null,


	parseHashTag: function() {
		var args = dojo.queryToObject(''+window.location.hash.substring(1));

		this.center = null;
		if(args.xy) {
			var split = args.xy.split(',');

			this.center = new OpenLayers.LonLat();
			this.center.lat = parseFloat(split[0]);
			this.center.lon = parseFloat(split[1]);
			this.zoomLevel = parseFloat(split[2]);
		}

	},

	init: function(map) {
		this.parseHashTag();
		if(this.center != null) {
			GeoMOOSE.register('onMapbookLoaded', this, function() {
				map.setCenter(this.center, this.zoomLevel);
			});
		}
		map.events.register('moveend', this, this.mapMoved);
	},

	mapMoved: function() {
		var center = Map.getCenter();
		var zoom = Map.getZoom();
		var position = center.lat + ',' + center.lon + ',' + zoom;
		window.location.hash = '#xy='+position 
	},

	load: function() {
		GeoMOOSE.register('onMapCreated', this, this.init);

		dojo.connect(window, 'hashchange', dojo.hitch(this, function() {
			this.parseHashTag();
			if(this.center != null) {
				Map.setCenter(this.center, this.zoomLevel);
			}
		}));
	},
	
	CLASS_NAME: "HashTrack"
});

GeoMOOSE.UX.register('HashTrack');
