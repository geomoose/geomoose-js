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
		return 'Buffer: ';
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
	
	constructor: function() {
		this.previewLayer = new OpenLayers.Layer.Vector(GeoMOOSE.id());
		Map.addLayer(this.previewLayer);

		this.inherited(arguments);
	},

	renderPreviewFeatures: function(features) {
		// clear the old features.
		this.previewLayer.removeAllFeatures();

		// add the new feature
		this.previewLayer.addFeatures(features);

		// this layer should be "1 under" the drawing layer.
		Map.setLayerIndex(this.drawing_layer, Map.getNumLayers()-1);
	},

	bufferDrawnShape: function(step, buffer) {
		var wkt = step.getAttribute('wkt');

		var wkt_reader = new jsts.io.WKTReader();
		var wkt_writer = new jsts.io.WKTWriter();

		var buffered_wkt = wkt;
		var buffer = parseFloat(buffer);

		if(buffer != 0) {
			var feature = wkt_reader.read(wkt);
			var buffered_feature = feature.buffer(buffer);

			buffered_wkt = wkt_writer.write(buffered_feature);

			// convert the buffered_wkt to the a feature
			//var ol_parser = new jsts.io.OpenLayersParser();
			var parser = new OpenLayers.Format.WKT();
			this.renderPreviewFeatures(parser.read(buffered_wkt));
		}
	},

	afterSpatialStep: function(step, parentId, settingsObj) {
		var p = document.getElementById(parentId);

		var buffer_id = GeoMOOSE.id();
		var buffer_p = dojo.create('div', { 
			id: buffer_id
		}, p);

		var input = new BufferLengthInput();
		input.renderHTML(buffer_id);
		input.onChange = dojo.hitch(this, function(meters) {
			this.bufferDrawnShape(step, meters);
		});

		// nice break
		dojo.create('br', {}, p);
	},

	onClose: function() {
		if(GeoMOOSE.isDefined(this.previewLayer)) {
			Map.removeLayer(this.previewLayer);
			this.previewLayer = null;
		}

		this.inherited(arguments);
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
