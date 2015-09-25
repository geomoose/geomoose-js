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

dojo.provide('GeoMOOSE.Tab.Catalog.LayerControl.Legend');
dojo.provide('GeoMOOSE.Tab.Catalog.LayerControl.Metadata');

dojo.require('GeoMOOSE.Tab.Catalog.LayerControl');

dojo.declare('GeoMOOSE.Tab.Catalog.LayerControl.Legend', [GeoMOOSE.Tab.Catalog.LayerControl], {
	classes: ['sprite-control-legend'],

	tip: 'CONFIGURATION.layer_controls.legend.tip',

	onClick: function() {
		var legend = dojo.query('.catalog_legend_container', this.parentNode.parentNode)[0];
		var wipe_params = {'node' : legend};
		if(legend.style.display != 'none') {
			if(CONFIGURATION.flashy_bits) {
				dojo.fx.wipeOut(wipe_params).play();
			} else {
				legend.style.display = 'none';
			}
		} else {
			if(CONFIGURATION.flashy_bits) {
				dojo.fx.wipeIn(wipe_params).play();
			} else {
				legend.style.display = 'block';
			}
		}

	}
});

dojo.declare('GeoMOOSE.Tab.Catalog.LayerControl.Metadata', [GeoMOOSE.Tab.Catalog.LayerControl], {
	classes: ['sprite-control-metadata'],

	tip: 'CONFIGURATION.layer_controls.metadata.tip',

	onClick: function() {
		if(this.layer.metadataUrl != '') {
			window.open(this.layer.metadataUrl);
		} else {
			alert('No metadata available for ' + this.layer.title);
		}
	}
});

GeoMOOSE._registerLayerControl('legend', GeoMOOSE.Tab.Catalog.LayerControl.Legend);
GeoMOOSE._registerLayerControl('metadata', GeoMOOSE.Tab.Catalog.LayerControl.Metadata);

