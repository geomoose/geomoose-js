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

dojo.require('GeoMOOSE.Tab.Service');
dojo.require('dijit.form.TextBox');

BufferLengthInput = OpenLayers.Class(GeoMOOSE.Services.InputType.Length, {
	onChange: function() {
	},

	getTitle: function() {
		return 'Selection Shape Buffer: ';
	},

	_setValue: function() {
		var unit = this._select.get('value');
		var length = parseFloat(this._textbox.get('value'));
		/* We're going to use meters because they are more consistent. */
		// convert the UI units to meters. 
		this.value = GeoMOOSE.convertLength(length, unit, 'm');

		this.onChange(this.value);
	},

	"CLASS_NAME" : "BufferLengthInput"
});

/** Overrides the default GeoMOOSE.Tab.Service methods to create
 *  a preview layer and a new option to buffer the drawn shape.
 */
dojo.declare('ClientBufferServiceTab', [GeoMOOSE.Tab.Service], {

	/** Used to render a buffered shape. */ 
	previewLayer: null,
	/** Input for buffer values. */
	bufferInput: null,

	/** Style applied to the preview layer. */
	previewLayerStyle: {
		strokeColor: "#aa33aa",
		fillOpacity: 0.0
	},
	
	constructor: function() {
		var style_map = new OpenLayers.StyleMap(this.previewLayerStyle);
		this.previewLayer = new OpenLayers.Layer.Vector(GeoMOOSE.id(), {styleMap: style_map});
		Map.addLayer(this.previewLayer);

		dojo.connect(this, 'onClose', dojo.hitch(this, function() {
			if(GeoMOOSE.isDefined(this.previewLayer)) {
				Map.removeLayer(this.previewLayer);
				this.previewLayer = null;
			}
		}));

		this.inherited(arguments);
	},

	onSelectionFeatureChanged: function(event) {
		var wkt_format = new OpenLayers.Format.WKT();
		var buffer_length = this.bufferInput.getValue();
		// get the new WKT
		var wkt = wkt_format.write(event.feature);
		// buffer it
		var new_wkt = this.bufferDrawnShape(wkt, buffer_length);

		// set the feature geometry to the new buffered
		//  geo before it is saved in the XML.
		event.feature = wkt_format.read(new_wkt);

		//step.setAttribute('wkt', new_wkt);
	},

	renderPreviewFeatures: function(features) {
		// clear the old features.
		this.previewLayer.removeAllFeatures();

		// add the new feature
		this.previewLayer.addFeatures(features);

		// this layer should be "1 under" the drawing layer.
		Map.setLayerIndex(this.drawing_layer, Map.getNumLayers()-1);
	},

	bufferDrawnShape: function(wkt, bufferLength) {
		var buffered_wkt = wkt;

		var buffer = parseFloat(bufferLength);

		if(buffer != 0 && !isNaN(buffer)) {
			var wkt_reader = new jsts.io.WKTReader();
			var wkt_writer = new jsts.io.WKTWriter();

			var feature = wkt_reader.read(wkt);
			var buffered_feature = feature.buffer(buffer);

			buffered_wkt = wkt_writer.write(buffered_feature);

			// convert the buffered_wkt to the a feature
			var parser = new OpenLayers.Format.WKT();
			this.renderPreviewFeatures(parser.read(buffered_wkt));
		}

		return buffered_wkt;
	},

	afterSpatialStep: function(step, parentId, settingsObj) {
		var p = document.getElementById(parentId);

		var buffer_id = GeoMOOSE.id();
		var buffer_p = dojo.create('div', { 
			id: buffer_id
		}, p);

		var options = {};
		if(step.getAttribute('buffer-length')) {
			options.value = parseFloat(step.getAttribute('buffer-length'));
		}
		if(step.getAttribute('buffer-units')) {
			options.units = step.getAttribute('buffer-units'); 
		}

		var input = new BufferLengthInput(null, options);
		this.bufferInput = input;

		input.renderHTML(buffer_id);
		input.onChange = dojo.hitch(this, function(meters) {
			//this.bufferDrawnShape(step.getAttribute('wkt'), meters);
			var wkt_format = new OpenLayers.Format.WKT();
			var wkt = step.getAttribute('wkt');
			if(wkt) {
				var feature = wkt_format.read(step.getAttribute('wkt'));

				this._onFeatureAdded({feature: feature});
				step.setAttribute('buffer-length', meters);

				var units = this.bufferInput._select.get('value');
				step.setAttribute('buffer-units', units);
			}
		});

		// nice break
		dojo.create('br', {}, p);
	}
});

/** Client Buffer Extension loads the new ClientBufferServiceTab
 *  class into the Services, Service Manager.
 */
ClientBuffer = new OpenLayers.Class(GeoMOOSE.UX.Extension, {

	init: function(map) {
		Services.ServiceTabClass = ClientBufferServiceTab;
	},

	load: function() {
		if(typeof(window.jsts) == "undefined") {
			console.error("ClientBuffer disabled, JSTS is not present");
			return false;
		}
		GeoMOOSE.register('onMapbookLoaded', this, this.init);
	},

	CLASS_NAME: "ClientBuffer"
});

GeoMOOSE.UX.register('ClientBuffer');
