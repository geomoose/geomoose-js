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

dojo.require('dijit.form.Button');

BasemapButtonsExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	load: function() {
		var self = this;
		// Wait until mapbook loads in case there are configuration overrides
		GeoMOOSE.register('onMapbookLoaded', this, this.startup);
	},

	startup: function() {
		var self = this;
		var config = CONFIGURATION['BasemapButtonsExtension']

		// Automatically add all button layers to baseLayers array
		if (config.autoBaseLayers) {
			if (!dojo.isArray(config.baseLayers))
				config.baseLayers = [];
			dojo.forEach(config.buttons, function(conf) {
				config.baseLayers = config.baseLayers.concat(conf.layers);
			});
		}
		
		// Create div to contain buttons
		var opts = {
			'class': 'dijitToolbar',
			'style': {
				'zIndex': 1000,
				'position': 'absolute',
				'right': '10px',
				'top': '10px'
			}
		};
		self.container = dojo.create('div', opts, dojo.byId('map'));

		// Generate buttons and add to page
		self.buttons = [];
		dojo.forEach(config.buttons, function(conf) {
			var opts = dojo.mixin(conf, {
				onChange: self.update
			});
			var btn = new dijit.form.ToggleButton(opts);
			btn.extension = self;
			self.buttons.push(btn);
			dojo.place(btn.domNode, self.container, "last");
		});
	},

	// Respond to button click
	update: function(checked) {
		var config = CONFIGURATION['BasemapButtonsExtension']
		var btn = this;
		var self = btn.extension;

		// Turn all layers off
		GeoMOOSE.turnLayerOff(config.baseLayers);
		if (checked)
			GeoMOOSE.turnLayerOn(btn.layers);

		// Automatically un-check other buttons
		dojo.forEach(self.buttons, function(obtn) {
			if (btn !== obtn)
				obtn.set('checked', false, false);
		});
	},

	CLASS_NAME: "BasemapButtonsExtension"
});

GeoMOOSE.UX.register("BasemapButtonsExtension");
		
// Default configuration (works with demo layers)
CONFIGURATION['BasemapButtonsExtension'] = {
	'baseLayers': null,
	'autoBaseLayers': true,
	'buttons': [
		{
			'label':'Basemap',
			'title':'County and City Boundaries',
			'layers': [
				'blank/blank',
				'borders/city_labels',
				'borders/county_labels',
				'borders/county_borders',
				'borders/city_poly'
			],
			'checked': true
		},
		{
			'label':'Aerial',
			'title':'2010 Photos',
			'layers': 'lmic/met10'
		}
	]
};
