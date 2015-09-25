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
 * Class: GeoMOOSE.Layer
 * Class to represent layers with more detail in GeoMOOSE
 *
 */

dojo.provide('GeoMOOSE.Layer');

/** Javascript representation of a "Layer" 
 *  to be rendred.
 */
dojo.declare('GeoMOOSE.Layer', null, {
	label: '',
	title: '',
	top: null,
	controls: {},
	minscale: null,
	maxscale: null,
	drawingTools: false,
	dynamicLegends: false,
	legendUrls: [],
	hasMetadata: false,
	metadataUrl: '',
	src: '',

	displayInCatalog: true,

	paths: {},

	_commonParser: function(xml) {
		this.label = xml.getAttribute('title');
		// fall back to the "name" attribute if "title" is not available.
		if(!GeoMOOSE.isDefined(this.label)) {
			this.label = xml.getAttribute('name');
		}
		this.title = this.label;

		this.displayInCatalog = parseBoolean(xml.getAttribute("display-in-catalog"), true);

		this.tip = xml.getAttribute('tip');

		this.minscale = parseFloat(xml.getAttribute('minscale'));
		this.maxscale = parseFloat(xml.getAttribute('maxscale'));

		this.drawingTools = parseBoolean(xml.getAttribute('drawing'), false);

		this.controls = {};

		for(var i = 0; i < CONFIGURATION.layer_control_order.length; i++) {
			var control_name = CONFIGURATION.layer_control_order[i];
			var control_on = parseBoolean(xml.getAttribute(control_name), CONFIGURATION.layer_controls[control_name].on);

			this.controls[control_name] = control_on;
		}

		this.showLegends = parseBoolean(xml.getAttribute('show-legend'), true);
		var legends_xml = xml.getElementsByTagName('legend');
		this.dynamicLegends = (legends_xml.length <= 0);
		if(!this.dynamicLegends) {
			this.legendUrls = [];
			for(var i = 0, len = legends_xml.length; i < len; i++) {
				this.legendUrls.push(OpenLayers.Util.getXmlNodeValue(legends_xml[i]));
			}
		}

		/** pull the metadata (as available( **/
		this.metadataUrl = '';
		var metadata = xml.getElementsByTagName('metadata');
		if(metadata.length > 0) {
			this.hasMetadata = true;
			this.metadataUrl = OpenLayers.Util.getXmlNodeValue(metadata[0]);
		}

		// enable auto refresh is auto-refresh is tagged.
		this.autoRefresh = parseFloat(xml.getAttribute('auto-refresh'));
		if(isNaN(this.autoRefresh)) {
			this.autoRefresh = 0;
		}
	},

	parseLayerXml: function(layerXml) {
		this._commonParser(layerXml);

		/* convert the known layers into a hash of booleans */
		this.paths = {};

		this.src = layerXml.getAttribute('src');
		var paths = [];
		if(GeoMOOSE.isDefined(this.src)) {
			paths = this.src.split(':');
			for(var i = 0; i < paths.length; i++) {
				this.paths[paths[i]] = false;
			}

		}

		if(this.title == null || !GeoMOOSE.isDefined(this.title)) {
			var title = '(untitled)';
			// try to pull it from the map source
			for(var path in this.paths) {
				var mapsource = Application.getMapSource(path);
				if(mapsource && mapsource.title) {
					title = mapsource.title;
					break;
				}
			}

			this.title = title;
			this.label = title;
		}

		var copy_children = {
			metadataUrl: 'metadata',
			hasMetadata: false,
			legendUrl: 'legend'
		};

		for(var name in copy_children) {
			if(this[name] == '' || this[name] == null || !GeoMOOSE.isDefined(this[name])) {
				for(var path in this.paths) {
					var mapsource = Application.getMapSource(path);
					// the "_layer" should denote a private member.
					//  change all references looked to be a big job to "delcare" it as
					//  public so I placed this note here and a similar one in MapSource.js
					if(mapsource && mapsource._layer && mapsource._layer[name]) {
						this[name] = mapsource._layer[name];
						break;
					}
				}
			}
		}



		var stat = parseBoolean(layerXml.getAttribute('status'));
		if(GeoMOOSE.isDefined(stat)) {
			var paths = [];
			for(var src in this.paths) {
				this.paths[src] = stat;
				paths.push(src);
			}
			GeoMOOSE.changeLayerVisibility(paths, stat);
		}
	},

	parseFromMapSource: function(mapSourceXml) {
		this._commonParser(mapSourceXml);

		var layers = mapSourceXml.getElementsByTagName('layer');
		var name = mapSourceXml.getAttribute('name');

		this.src = name;

		this.paths = {};
		for(var i = 0; i < layers.length; i++) {
			var l = layers[i];
			var on = parseBoolean(l.getAttribute('status'));
			var layer_name = l.getAttribute('name');
			var path = name+'/'+layer_name;
			this.paths[path] = on;
		}
		// handle the cases where the map-source IS the layer,
		//  ala Vector Drawings.
		if(layers.length == 0) {
			var status = parseBoolean(mapSourceXml.getAttribute('status')); 
			this.paths[name] = status;
		}

	},

	pathsAsArray: function() {
		var path_array = [];
		for(var name in this.paths) {
			path_array.push(name);
		}
		return path_array;
	}

});

