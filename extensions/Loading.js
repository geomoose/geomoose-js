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

/*
loading.gif is from the Dojo 1.6 toolkit and is subject to appropriate
licenses.
*/

/*
 * Class: LoadingExtension
 * Shows a loading spinner until all of the map layers have finished loading.
 * Inspired by the OpenLayers LoadingPanel Control; utilizes the dojox Standby widget.
 */

dojo.require('dojox.widget.Standby');

LoadingExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	load: function() {
		GeoMOOSE.register('onMapbookLoaded', this, this.startup);
	},

  	startup: function() {
		var color = dojo.isIE ? 'none' : 'white';
		var sb = new dojox.widget.Standby({
			'target': 'map', 
			'color': color,
			'image' : 'extensions/loading.gif'
		});
		this.standby = sb; 
		this.loading = 0;

		dojo.style(sb._underlayNode, 'pointerEvents', 'none');
		document.body.appendChild(sb.domNode);
		sb.startup();
		for (var src in Application.mapSources) {
			var lyr = Application.mapSources[src]._ol_layer;
			lyr.events.register('loadstart', this, function(){this.update( 1)});
			lyr.events.register('loadend',   this, function(){this.update(-1)});
		}
	},

        update: function(num) {
		this.loading += num;
		if (this.loading > 0) {
			this.standby.show();
		} else {
		  	this.loading = 0;
			this.standby.hide();
		}
	},

	CLASS_NAME: 'LoadingExtension'
});

GeoMOOSE.UX.register('LoadingExtension');
