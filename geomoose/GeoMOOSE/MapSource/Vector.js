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
 * Class: GeoMOOSE.MapSource.Vector
 * Basic class for sketch and WFS-T Layers.
 */
dojo.provide('GeoMOOSE.MapSource.Vector');

dojo.declare('GeoMOOSE.MapSource.Vector', GeoMOOSE.MapSource, {
	/* We have a save function for hooks, but really, we're not going anywhere with the changes. */
	canSave: false,

	checkPath: function(path) {
		return (path == this.path)
	},

	isVisible: function() {
		return this.visibility;
	},

	setVisibility: function(path, visibility) {
		if(this.checkPath(path)) {
			if(this.visibility != visibility) {
				this.visibility = visibility;
				this._ol_layer.setVisibility(this.isVisible());
				if(visibility === true) {
					this._ol_layer.redraw({force: true});
				}
			}
		}
	},

	_createOLLayer: function(options) {
		this._ol_layer_name = 'vector'+GeoMOOSE.id();
		this._ol_layer = new OpenLayers.Layer.Vector(this._ol_layer_name,{
			styleMap : this.style_map
		});
		this._ol_layer.setVisibility(this.isVisible());
	},

	_addOLHooks: function() {
		/** set the default values before adding to the layer **/
		this._ol_layer.events.register('beforefeatureadded', this, function(event) {
			var feature = event.feature;
			if(!GeoMOOSE.isDefined(feature.attributes)) {
				feature.attributes = {};
			}
			for(var i = 0, len = this.attributes.length; i < len; i++) {
				var attr = this.attributes[i];
				var value = '';
				if(GeoMOOSE.isDefined(attr['default'])) {
					value = attr['default'];
				}
				if(!GeoMOOSE.isDefined(feature.attributes[attr['name']])) {
					feature.attributes[attr['name']] = value; 
				}
			}
		});

		/** call save after any changes have occured **/
		/*
		this._ol_layer.events.register('featureadded', this, this.save);
		this._ol_layer.events.register('featureremoved', this, this.save);
		this._ol_layer.events.register('afterfeaturemodified', this, this.save);
		*/
	},

	addToMap: function(map) {
		this.inherited(arguments);

		this.controls = {
			'polygon' : new OpenLayers.Control.DrawFeature(this._ol_layer, OpenLayers.Handler.Polygon, {}),
			'line' : new OpenLayers.Control.DrawFeature(this._ol_layer, OpenLayers.Handler.Path, {}),
			'point' : new OpenLayers.Control.DrawFeature(this._ol_layer, OpenLayers.Handler.Point, {}),
			'modify' : new OpenLayers.Control.ModifyFeature(this._ol_layer, {
				vertexRenderIntent: 'select'
			}),
			'edit_attributes' : new OpenLayers.Control.SelectFeature(this._ol_layer),
			'remove' : new GeoMOOSE.Control.DeleteFeature(this._ol_layer),
			'remove_all' : {
				'activate' : dojo.hitch(this, function() {
					this._ol_layer.removeAllFeatures();
				}),
				'deactivate' : function () {},
				'setMap' : function() {},
				'draw': function() {}
			}
		};


		for(var control in this.controls) {
			map.addControl(this.controls[control]);
			Tools[this._ol_layer_name+'_'+control] = this.controls[control];
		}

		this.controls['edit_attributes'].events.register('featurehighlighted', this, function(ev) {
			var dialog = new GeoMOOSE.Dialog.AttributeEditor({'feature_desc' : this.attributes});
			dialog.show(ev);
			//dojo.connect(dialog, 'onClose', function() { dialog.destoryRecursive(); });
		});

	},

	/**
	 * Constructor: constructor
	 * Creates a new Vector Layer
	 * 
	 * Parameters:
	 *  mapbook_entry - XML fragment defining the MapSource
	 */
	editable: true,

	constructor: function(mapbook_entry) {
		/* A layer supports all editable types unless one is spec'd.  
		  If you disagree with this type of behavior email Jim.
		  */  
		this.supports = {
			'point' : true,
			'line' : true,
			'polygon' : true,
			'modify' : true,
			'edit_attributes' : true,
			'remove' : true,
			'remove_all' : true
		};

		var supported = mapbook_entry.getAttribute('supports');
		if(GeoMOOSE.isDefined(supported) && supported != '') {
			supported = supported.split(',');
			if(supported.length > 0) {
				for(var shape_type in this.supports) {
					this.supports[shape_type] = (dojo.indexOf(supported, shape_type) >= 0);
				}
			}
		}

		/* check to see if a URL is spec'd.  This is generally useful, so I put the parser here. */
		var urls = mapbook_entry.getElementsByTagName('url');
		if(urls.length > 0) {
			this.url = OpenLayers.Util.getXmlNodeValue(mapbook_entry.getElementsByTagName('url')[0]);
		}

		/*** Find out what type of attributes we have for this layer ***/
		var attributes = mapbook_entry.getElementsByTagName('attribute');
		this.attributes = [];
		for(var i = 0, len = attributes.length; i < len; i++) {
			var attr = attributes[i];
			var attr_label = attr.getAttribute('label');
			var attr_name = attr.getAttribute('name'), attr_type = attr.getAttribute('type');
			var attr_default_value = attr.getAttribute('default-value');
			var required_on_create = parseBoolean(attr.getAttribute('mandatory'), false);
			this.attributes.push({
				'name'  : attr_name, 'type' : attr_type, 'default' : attr_default_value,
				'mandatory' : required_on_create, 'label' : attr_label
			});
		}

		/* interpret the style! */
		var styles = mapbook_entry.getElementsByTagName('style');
		var style_map = {};
		for(var i = 0, len = styles.length; i < len; i++) {
			var style_type = styles[i].getAttribute('type');
			var style_intent = styles[i].getAttribute("intent");
			var style_contents = OpenLayers.Util.getXmlNodeValue(styles[i]);
			if(!GeoMOOSE.isDefined(style_intent) || style_intent == '') {
				style_intent = 'default';
			}

			if(style_type == 'stylemap') { 
				var style_hash = dojo.fromJson(style_contents);
				if(GeoMOOSE.isDefined(style_map[style_intent])) {
					dojo.mixin(style_map[style_intent], style_hash);
				} else {
					style_map[style_intent] = style_hash;
				}
			} else if(style_type == 'sld') {
				/** TODO: Implement SLD **/
			}

		}

		/* If there is no "label" defined for the "select" intent,
		 * set it to blank so the default label doesn't propagate
		 * and cause "undefined" to appear while editing vertices
		 * ticket #11.
		 */
		if(GeoMOOSE.isDefined(style_map['select'])) {
			if(!GeoMOOSE.isDefined(style_map['select']['label'])) {
				dojo.mixin(style_map['select'], { 'label' : "" });
			}
		} else {
			style_map['select'] = { 'label' : "" };
		}

		var ol_built_in_style = new OpenLayers.Style();
		for(var style_intent in style_map) {
			/* mixin with the default openlayers styles */
			var style = dojo.clone(OpenLayers.Feature.Vector.style[style_intent]);
			dojo.mixin(style, style_map[style_intent]);
			style_map[style_intent] = style;
			style_map[style_intent] = new OpenLayers.Style(style_map[style_intent], {defaultStyle: false});
		}

		this.style_map = new OpenLayers.StyleMap(style_map);
		var options = {};
		this.visibility = parseBoolean(mapbook_entry.getAttribute('status'), false);

		this._createOLLayer(options);
		this._addOLHooks();
	},

	/*
	 * Function: save
	 * Called after any changes.
	 */
	save: function() {
		
	},

	/*
	 * Function: print
	 * Get a print represetnation for the vectors.  This means we need to
	 * send the shape and a collection of applicable styles.
	 */
	printable: true, /* this can be printed */

	print: function() {
	 	var layer = this._ol_layer;
		var print_obj = {
			'type' : 'vector',
			'features' : []
		};

		for(var i = 0, len = layer.features.length; i < len; i++) {
			print_obj.features.push({
				'geometry' : layer.features[i].geometry.toString(),
				'attributes' : layer.features[i].attributes,
				'style' : layer.styleMap.createSymbolizer(layer.features[i])
			});
		}
		return print_obj;
	 }
});

GeoMOOSE.registerMapSourceType('vector', GeoMOOSE.MapSource.Vector);

