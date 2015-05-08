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
dojo.require('dijit.Dialog');
dojo.require('dijit.form.Button');


/** Get the UTM Zone for a Shape
 *
 * @param longitude - Representative Longitude for the shape
 *
 * @returns An EPSG for the appropriate UTM Zone
 */
GeoMOOSE.getUtmZone = function(longitude) {
	// This is the same formula as is in the config.php code,
	//  I do not have a citation for the validity of the forumula.
	return Math.ceil((longitude / 6.0) + 30)+1;
}

/** Created a buffered shape
 *  
 *  @param wkt  Well Known Text of the feature.
 *  @param bufferLength Float of ground units to buffer.
 *
 *  @returns New WKT of the buffered shape.
 */
GeoMOOSE.bufferWkt = function(wkt, bufferLength) {
	var buffered_wkt = wkt;

	var buffer = parseFloat(bufferLength);

	// JSTS does all of the heavy lifting of the buffer.
	if(buffer != 0 && !isNaN(buffer)) {
		// OpenLayers has built-in projection capabilities
		//  while JSTS has the ability to do transformation,
		//  everything here is laundered around as WKT
		var wkt_format = new OpenLayers.Format.WKT();
		var ol_feature = wkt_format.read(wkt);
		// to lat,lon
		ol_feature.geometry.transform(Map.getProjection(), 'EPSG:4326')
		// get the UTM zone for the shape
		var bounds = ol_feature.geometry.getBounds();
		var utm_zone = GeoMOOSE.getUtmZone(bounds.left);
		var north = bounds.top > 0 ? 'north' : 'south';
		// define a UTM projection
		var proj_id = 'EPSG:'+(32600+utm_zone);
		var proj_string = '+proj=utm +zone='+utm_zone+' +'+north+'+datum=WGS84 +units=m +no_defs'
		// definte the projection for PROJ
		Proj4js.defs[proj_id] = proj_string;

		ol_feature.geometry.transform('EPSG:4326', proj_id);
		var projected_wkt = wkt_format.write(ol_feature);

		var wkt_reader = new jsts.io.WKTReader();
		var wkt_writer = new jsts.io.WKTWriter();

		var feature = wkt_reader.read(projected_wkt);
		var buffered_feature = wkt_format.read(wkt_writer.write(feature.buffer(buffer)));
		// back to map projection
		buffered_feature.geometry.transform(proj_id, Map.getProjection())
		buffered_wkt = wkt_format.write(buffered_feature);
	}

	return buffered_wkt;

}



/** A special class to describe a length for a buffer opeation.
 *  
 */
BufferLengthInput = OpenLayers.Class(GeoMOOSE.Services.InputType.Length, {
	title: 'Selection Shape Buffer: ',

	onChange: function() {
	},

	getTitle: function() {
		return this.title;
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

/** Dialog to get the value of the buffer on a feature.
 */
dojo.declare('ClientBufferSizeDialog', [dijit.Dialog], {
	promise: null,

	title: "Buffer Size",

	show: function() {
		this.promise = new dojo.Deferred();
		this.inherited(arguments);
		return this.promise;
	},

	postCreate: function() {
		this.inherited(arguments);

		var parent_div = dojo.create('div', {});
		this.set('content', parent_div);
		dojo.style(parent_div, {
			'width' : '300px', 'height' : '100px'
		});

		var message_div = dojo.create('div', {
			innerHTML: "<b>Please enter the buffer size for this feature.</b>"
		}, parent_div);

		dojo.style(message_div, {
			'padding' : '4px'
		});

		var edit_div = dojo.create('div', {}, parent_div);

		var input = new BufferLengthInput(null, {});
		input.title = "Buffer Size: ";
		var buffer_id = GeoMOOSE.id();

		// add a target for the input
		dojo.create('div', {id: buffer_id}, edit_div);
		input.renderHTML(buffer_id);

		dojo.style(edit_div, {
			paddingLeft: '4px',
			paddingTop: '1em'
		});

		var control_div = dojo.create('div', {}, parent_div);

		dojo.style(control_div, {
			position: 'absolute',
			bottom: 0,
			padding: '4px'
		});


		var close_btn = dojo.create('button', {innerHTML: "Close"}, control_div);
		new dijit.form.Button({
			onClick: dojo.hitch(this, function() {
				this.promise.reject();
				this.hide();
			})
		}, close_btn);

		var okay_btn = dojo.create('button', {innerHTML: "Okay"}, control_div);
		new dijit.form.Button({
			onClick: dojo.hitch(this, function() {
				// TODO: read the buffer length input value.
				this.promise.resolve(input.getValue());
				this.hide();
			})
		}, okay_btn);

			
	}
});

/** Adds a Layer Control to allow drawn shapes to be buffered.
 */
dojo.declare('ClientBufferLayerControl', [GeoMOOSE.Tab.Catalog.LayerControl], {
	classes: ['sprite-control-transformFeature'],

	tip: "CONFIGURATION.layer_controls.buffer.tip",

	onClick: function() {
		GeoMOOSE.activateMapSource(this.layer.src);
		var ol_layer = Application.getMapSource(GeoMOOSE.getActiveMapSource())._ol_layer;

		alert('Select a feature on the map.');
		
		var choose_feature = new OpenLayers.Control.SelectFeature(ol_layer, {
			multiple: false
		});

		choose_feature.events.register('featurehighlighted', this, function(event) {
			// clone the feature
			var new_feature = event.feature.clone();

			// unselect the old one
			choose_feature.unselect(event.feature);

			// buffer it
			var parser = new OpenLayers.Format.WKT();
			var wkt = parser.write(new_feature);


			var d = new ClientBufferSizeDialog();
			var promise = d.show();
			promise.then(function(length) {
				// remove it from the old layer
				ol_layer.removeFeatures([event.feature]);

				var buffered_wkt = GeoMOOSE.bufferWkt(wkt, length);
				var buffered_feature = parser.read(buffered_wkt);

				// add the new feature back to the layer
				new_feature.geometry = buffered_feature.geometry;
				ol_layer.addFeatures([new_feature]);
				ol_layer.redraw();
				
				// deactivate the "choose feature" tool.
				choose_feature.deactivate();
				Map.removeControl(choose_feature);
				choose_feature = null;
			}, function() {
				// failed/cancel

				// deactivate the "choose feature" tool.
				choose_feature.deactivate();
				Map.removeControl(choose_feature);
				choose_feature = null;
			});

		});

		Map.addControl(choose_feature);

		choose_feature.activate();
	}
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
		var buffer_length = this.bufferInput.getValue();
		var wkt_format = new OpenLayers.Format.WKT();
		// get the new WKT
		var wkt = wkt_format.write(event.feature);
		// buffer it
		var new_wkt = GeoMOOSE.bufferWkt(wkt, buffer_length);

		// convert the buffered_wkt to the a feature
		var parser = new OpenLayers.Format.WKT();
		var buffered_feature = parser.read(new_wkt);
		this.renderPreviewFeatures(buffered_feature);

		// set the feature geometry to the new buffered
		//  geo before it is saved in the XML.
		event.feature = buffered_feature;
	},

	renderPreviewFeatures: function(features) {
		// clear the old features.
		this.previewLayer.removeAllFeatures();

		// add the new feature
		this.previewLayer.addFeatures(features);

		// this layer should be "1 under" the drawing layer.
		Map.setLayerIndex(this.drawing_layer, Map.getNumLayers()-1);
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

		GeoMOOSE._registerLayerControl('buffer', ClientBufferLayerControl);

		CONFIGURATION.layer_control_order.push('buffer');
		CONFIGURATION.layer_controls['buffer'] = {
			on: false,
			tip: 'Buffer a feature from ${layer}'
		}

		GeoMOOSE.register('onMapbookLoaded', this, this.init);
	},

	CLASS_NAME: "ClientBuffer"
});

GeoMOOSE.UX.register('ClientBuffer');
