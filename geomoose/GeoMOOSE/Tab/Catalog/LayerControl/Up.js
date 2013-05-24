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

dojo.provide('GeoMOOSE.Tab.Catalog.LayerControl.Up');
dojo.provide('GeoMOOSE.Tab.Catalog.LayerControl.Down');

dojo.declare('GeoMOOSE.Tab.Catalog.LayerControl.Up', [GeoMOOSE.Tab.Catalog.LayerControl], {
	classes: ['sprite-control-up'],

	tip: 'CONFIGURATION.layer_controls.up.tip',

	onClick: function() {
		for(var path in this.layer.paths) {
			GeoMOOSE.moveLayerUp(path);
		}
	}
});

dojo.declare('GeoMOOSE.Tab.Catalog.LayerControl.Down', [GeoMOOSE.Tab.Catalog.LayerControl], {
	classes: ['sprite-control-down'],

	tip: 'CONFIGURATION.layer_controls.down.tip',

	onClick: function() {
		for(var path in this.layer.paths) {
			GeoMOOSE.moveLayerDown(path);
		}
	}
});

GeoMOOSE._registerLayerControl('up', GeoMOOSE.Tab.Catalog.LayerControl.Up);
GeoMOOSE._registerLayerControl('down', GeoMOOSE.Tab.Catalog.LayerControl.Down);

