/*
Copyright (c) 2009-2011, Dan "Ducky" Little & GeoMOOSE.org

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

dojo.provide('GeoMOOSE.Handler.Box');


GeoMOOSE.Handler.Box = OpenLayers.Class(OpenLayers.Handler.Box, {
	initialize: function(control, callbacks, options) {
		OpenLayers.Handler.Box.prototype.initialize.apply(this, arguments);
	},


	endBox: function(end) {
		var result;
/*		if (Math.abs(this.dragHandler.start.x - end.x) > 5 ||    
			Math.abs(this.dragHandler.start.y - end.y) > 5) {   */
		var start = this.dragHandler.start;
		var top = Math.min(start.y, end.y);
		var bottom = Math.max(start.y, end.y);
		var left = Math.min(start.x, end.x);
		var right = Math.max(start.x, end.x);
		result = new OpenLayers.Bounds(left, bottom, right, top);
		/*
		} else {
			result = this.dragHandler.start.clone(); // i.e. OL.Pixel
		} 
		*/
		this.removeBox();

		var geometry = new OpenLayers.Geometry.Polygon();
		var points = [[left, bottom], [left, top], [right, top], [right, bottom]];
		var ring = new OpenLayers.Geometry.LinearRing();
		for(var i = 0; i < points.length; i++) {
			var px = new OpenLayers.Pixel(points[i][0], points[i][1]);
			var ll = this.map.getLonLatFromPixel(px);
			ring.addPoint(new OpenLayers.Geometry.Point(ll.lon, ll.lat));
		}
		geometry.addComponent(ring);
		this.geometry = geometry;

		this.callback("done", [geometry]);
	},


	getGeometry: function() {
		return this.geometry;
	},
	CLASS_NAME: 'OpenLayers.Handler.GeomooseBox'
});
