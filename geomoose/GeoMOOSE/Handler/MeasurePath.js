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

dojo.provide('GeoMOOSE.Handler.MeasurePath');

GeoMOOSE.Handler.MeasurePath = OpenLayers.Class(OpenLayers.Handler.Path, {
	mousemove: function(evt) {
		if(this.drawing) { 
			this.callback("mousemove", [this.point.geometry, this.getGeometry()]);
		}
		OpenLayers.Handler.Path.prototype.mousemove.apply(this, arguments);
		return true;
	},

	mouseup: function(evt) {
		OpenLayers.Handler.Path.prototype.mouseup.apply(this, arguments);
	},

	CLASS_NAME: 'GeoMOOSE.Handler.MeasurePath'
});

GeoMOOSE.Handler.MeasurePolygon = OpenLayers.Class(OpenLayers.Handler.Polygon, {
	mousemove: function(evt) {
		if(this.drawing) { 
			this.callback("mousemove", [this.point.geometry, this.getGeometry()]);
		}
		OpenLayers.Handler.Polygon.prototype.mousemove.apply(this, arguments);
		return true;
	},

	CLASS_NAME: 'GeoMOOSE.Handler.MeasurePolygon'
});

