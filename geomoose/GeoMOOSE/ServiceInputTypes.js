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

/* these, theoretically, could be broken out into separate class
	files, but for now, this seems to be sufficient */

/*
 * Class: GeoMOOSE.ServiceInputTypes
 * Container for the litany of service inputs.
 */

dojo.provide('GeoMOOSE.ServiceInputTypes');

dojo.require('dijit.form.CheckBox');

GeoMOOSE.Services = {};

/*
 * InputType
 * Base class for all of the GeoMOOSE inputs types used with services.
 */
GeoMOOSE.Services.InputType = OpenLayers.Class({
	/*
	 * The value of the input-type
	 */
	value: null,

	/* XML input */
	input: null,

	initialize: function(input, options) {
		this.input = input;

		this.options = {
			renderable : false, /* set whether this needs rendered in a form */
			title: ''
		};
		OpenLayers.Util.extend(this.options, options || {});		

		if(input != null) {
			/* set the input based on the "value" attribute */
			if(input.getAttribute('value')) {
				this.value = input.getAttribute('value');
			}

			/* set the input value based on the value of the childnodes */
			if(input.childNodes.length > 0) {
				this.value = OpenLayers.Util.getXmlNodeValue(input);
			}
		}
	},

	/* requiresRender()
	 * return whether or not to render this input.
	 */
	requiresRender: function() {
		return this.options.renderable;
	},

	/*
	 * setValue()
	 */
	setValue: function(value) {
		this.value = value;

		if(this.input) {
			var node = this.input;
			/* clear the current children */
			if(node.childNodes) {
				while(node.childNodes.length > 0) {
					node.removeChild(node.childNodes[0]);
				}
			}
			/* create a new CDATA section with the value */
			node.appendChild(node.ownerDocument.createCDATASection(this.getValue()));
		}
	},

	/*
	 * getValue()
	 * Gets the value of the input
	 */
	getValue: function() {
		/* This does no escaping, and essentially just lets things roll...*/
		if(!GeoMOOSE.isDefined(this.value)) {
			return '';
		}
		return this.value;
	},

	/*
	 * getName()
	 * get the name of hte input
	 */
	getName: function() {
		if(GeoMOOSE.isDefined(this.options.name)) {
			return this.options.name;
		}
		if(!GeoMOOSE.isDefined(this.input)) {
			return ''
		}
		return this.input.getAttribute('name');
	},

	/*
	 * renderHTML(parent_id)
	 * Render the form representation of the input type in the parent specified
	 * by parent_id.
	 */
	renderHTML: function (parent_id) {
	},


	/*
	 * Method: getTitle
	 * Returns the title/label of this input.
	 */
	
	getTitle: function() {
		if(this.input) {
			return this.input.getAttribute('title');
		} else if(this.options.title) {
			return this.options.title;
		}
		return '';
	},

	MAPBOOK_NAME: null
});

GeoMOOSE.Services.InputType.Hidden = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "hidden"
});

GeoMOOSE.Services.InputType.Extent = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "extent",

	getValue: function() {
		var delim = this.input.getAttribute('delim');
		if(!delim) { delim = ','; }
		return Map.getExtent().toArray().join(delim);
	}
});

GeoMOOSE.Services.InputType.VisibleLayers = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "visiblelayers",

	getValue: function() {
		var delim = this.input.getAttribute('delim');
		if(!delim) { delim = ':'; }
		return GeoMOOSE.getVisibleLayers().join(delim);
	}
});

GeoMOOSE.Services.InputType.Sketches = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "sketches",

	getValue: function() {
		var sketch_layer = Map.getLayersByName('sketchlayer')[0];
		var wkt = new OpenLayers.Format.WKT();

		var feature_info = [];
		for(var i = 0; i < sketch_layer.features.length; i++) {
			var feature = sketch_layer.features[i];

			var feature_obj = {};
			feature_obj['wkt'] = wkt.write(feature);
			for(var k in feature.attributes) {
				feature_obj[k] = feature.attributes[k];
			}

			feature_info.push(feature_obj);
		}

		var json = new OpenLayers.Format.JSON();
		return json.write(feature_info);
	}

});

GeoMOOSE.Services.InputType.PrintInfo = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "print_info",

	getValue: function() {
		var map_sources = Application.mapSources;
		var print_info = [];

		for(var src in map_sources) {
			if(map_sources[src].printable && map_sources[src].isVisible()) {
				print_info.push(map_sources[src].print());
			}
		}
		return dojo.toJson(print_info);
	}
});

GeoMOOSE.Services.InputType.MapInfo = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "map_info",

	getValue: function() {
		var map_info = {
			extent: Map.getExtent().toArray(),
			img_size: [ Map.getSize().w, Map.getSize().h ],
			center: [ Map.getCenter().lon, Map.getCenter().lat ],
			scale_denom: Map.getScale(),
			resolution: Map.getResolution(),
			projection: Map.getProjection().toString()
		};
		return dojo.toJson(map_info);
	}
});
		
GeoMOOSE.Services.InputType.User = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "user",

	initialize: function(input, options) {
		GeoMOOSE.Services.InputType.prototype.initialize.apply(this, arguments);
		this.options.renderable = true;
	},

	updateServiceSetting: function() {
		this.input_obj.setValue(this.value);
	},

	keyCallService: function(event) {
		if(window.event) { event = window.event; }
		var keyCode = null;
		if(event.which) {
			keyCode = event.which;
		} else if(event.keyCode) {
			keyCode = event.keyCode;
		}
		if(keyCode == 13) {
			this.onchange();
			var submit_button = document.getElementById('submit-service');
			if(GeoMOOSE.isDefined(submit_button)) {
				submit_button.onclick();
			}
		}
	},

	renderHTML: function(parent_id) {
		var p = document.getElementById(parent_id);
		var inputParent = document.createElement('span');
		inputParent.className = 'service-input-parent';
		p.appendChild(inputParent);

		var i = document.createElement('input');
		i.className = 'service-input';
		i.input_obj = this;
		var name = this.getName();
		if(name == '') { name = GeoMOOSE.id(); }
		i.id = 'service-input-'+name;

		if(GeoMOOSE.isDefined(this.getValue())) {
			i.value = this.getValue();
		}
		i.onchange = this.updateServiceSetting;
		i.onkeypress = this.keyCallService;

		var title = document.createElement('span');
		title.className = 'service-input-title';
		inputParent.appendChild(title);
		title.innerHTML = this.getTitle();
		inputParent.appendChild(i);
	}
	
});

GeoMOOSE.Services.InputType.Select = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "select",

	initialize: function(input, options) {
		GeoMOOSE.Services.InputType.prototype.initialize.apply(this, arguments);
		this.options.renderable = true;
	},

	getValue: function() {
		if(this.input) {
			return this.input.getAttribute("value");
		}
		return this.value;
	},

	getOptions: function() {
		if(GeoMOOSE.isDefined(this.options['options'])) {
			return this.options['options'];
		} else {
			var opts = this.input.getElementsByTagName('option');
			var formed_opts = [];
			for(var i = 0 ; i < opts.length; i++) {
				formed_opts.push({value: opts[i].getAttribute('value'), name: OpenLayers.Util.getXmlNodeValue(opts[i])});
			}
			return formed_opts;
		}
	},

	setValue: function(v) {
		this.value = v;
		if(this.input) {
			this.input.setAttribute('value', v);
		}
	},

	updateSettings: function() {
		this.input_obj.setValue(this.getElementsByTagName('option')[this.selectedIndex].value);
	},

	renderHTML: function(parent_id) {
		var p = document.getElementById(parent_id);
		var inputParent = document.createElement('span');
		inputParent.className = 'service-input-parent';
		p.appendChild(inputParent);

		var select = document.createElement('select');
		select.input_obj = this;

		var title = document.createElement('span');
		title.className = 'service-input-title';
		inputParent.appendChild(title);
		title.innerHTML = this.getTitle();
		inputParent.appendChild(select);

		var options = this.getOptions();
		var selIndex = 0;
		var val = this.getValue();
		for(var i = 0; i < options.length; i++) {
			if(options[i].value == val) {
				selIndex = i;
			}

			var opt = document.createElement('option');
			opt.selected= false;
			opt.setAttribute('value', options[i].value);
			select.appendChild(opt);
			opt.appendChild(document.createTextNode(options[i].name));
		}

		var selected_option = select.getElementsByTagName('option')[selIndex];
		selected_option.selected = true;

		this.setValue(selected_option.value);
			
		select.onchange = this.updateSettings;
	}

});

/*
 * Get the options from a URL
 * The returned XML should follow a convenction of HTML-style options, e.g.
 * <options>
 *	<option value="a">A</option>
 *	<option value="b">B</option>
 * </options>
 */
GeoMOOSE.Services.InputType.AjaxSelect = OpenLayers.Class(GeoMOOSE.Services.InputType.Select, {
	MAPBOOK_NAME: "ajax_select",

	options: [],

	got_opts_from_req: function(request) {
		var formed_opts = [];
		var response = request.responseXML;
		var opts = response.getElementsByTagName('option'); 
		for(var i = 0 ; i < opts.length; i++) {
		       formed_opts.push({value: opts[i].getAttribute('value'), name: OpenLayers.Util.getXmlNodeValue(opts[i])});
		}
		this.options = formed_opts;
	},

	getOptions: function () {
		var url = this.input.getElementsByTagName('url')[0];

		url = OpenLayers.Util.getXmlNodeValue(url);

		var requestOptions = new OpenLayers.Request.GET({
		       url: url,
		       async: false,
		       success: OpenLayers.Function.bind(this.got_opts_from_req, this) 
		});

		return this.options; 
	}
});

GeoMOOSE.Services.InputType.Tolerance = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "tolerance",

	getValue: function() {
		return Map.getResolution() * 10;
	}
});

/*
 * Class: GeoMOOSE.Services.InputType.Text
 * Provide a text label for describing behaviour to the user.
 */
GeoMOOSE.Services.InputType.Text = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "text",

	initialize: function(input, options) {
		GeoMOOSE.Services.InputType.prototype.initialize.apply(this, arguments);
		this.options.renderable = true;
	},

	getValue: function() {
		if(this.input) {
			return OpenLayers.Util.getXmlNodeValue(this.input);
		} else {
			return this.value;
		}
	},

	renderHTML: function(parent_id) {
		var p = document.getElementById(parent_id);
		var inputParent = document.createElement('span');
		inputParent.className = 'service-input-parent';
		p.appendChild(inputParent);

		var text = document.createElement('span');
		text.className = 'service-input-text';
		inputParent.appendChild(text);
		text.innerHTML = this.getValue();
	}
	
});

GeoMOOSE.Services.InputType.TextArea = OpenLayers.Class(GeoMOOSE.Services.InputType.User, {
	MAPBOOK_NAME: "textarea",

	renderHTML: function(parent_id) {
		var p = document.getElementById(parent_id);
		var inputParent = document.createElement('span');
		inputParent.className = 'service-input-parent';
		p.appendChild(inputParent);

		var i = document.createElement('textarea');
		i.className = 'service-input';
		i.input_obj = this;
		i.id = 'service-input-'+this.getName();
		i.rows = 3;
		if(this.input.getAttribute('rows')) {
			i.rows = this.input.getAttribute('rows');
		}

		if(this.getValue()) {
			i.value = this.getValue();
		}
		i.onchange = this.updateServiceSetting;
		i.onkeypress = this.keyCallService;

		var title = document.createElement('span');
		title.className = 'service-input-title';
		inputParent.appendChild(title);
		title.innerHTML = this.getTitle();
		inputParent.appendChild(i);
	}
	
});

/*
 * Class GeoMOOSE.Services.InputType.Checkbox
 * Provides a boolean checkbox. The value alternates between "true" and "false."
 */

GeoMOOSE.Services.InputType.Checkbox = OpenLayers.Class(GeoMOOSE.Services.InputType.User, {
	MAPBOOK_NAME: "checkbox",

	renderHTML: function(parent_id) {
		var p = document.getElementById(parent_id);
		var inputParent = document.createElement('span');
		inputParent.className = 'service-input-parent';
		p.appendChild(inputParent);

		var title = document.createElement('span');
		title.className = 'service-input-title';
		inputParent.appendChild(title);
		title.innerHTML = this.getTitle();

		/* new dojo short hand, yay! */
		var i = dojo.create('input', {
			'type' : 'checkbox'
		}, inputParent);

		this._input = new dijit.form.CheckBox({
			'checked' : parseBoolean(this.getValue())
		}, i);

		dojo.connect(this._input, 'onChange', dojo.hitch(this, this._setValue));
	},
	
	/*
	 * Method: _setValue
	 * Internal method for setting up the value.
	 */
	_setValue: function(value) {
		//this.setValue(this._input.getAttribute('checked') == 'true');
		this.setValue(value);
	}
});

/*
 * Class: GeoMOOSE.Services.InputType.Color
 * Provides both a freeform hex input and a color picker.
 */

dojo.require('dojo.string');
dojo.require('dijit.form.DropDownButton');
dojo.require('dijit.ColorPalette');

GeoMOOSE.Services.InputType.Color = OpenLayers.Class(GeoMOOSE.Services.InputType.User, {
	MAPBOOK_NAME: "color",

	/*
	 * Variable: _labelHTML
	 * Stores the text template for updating the legend chip in a color picker.
	 */
	_labelHTML: '<span class="dijitInline" style="border: solid 1px black; width: 18px; height: 1em; background-color: ${color}"></span>',

	renderHTML: function(parent_id) {
		/* this is one of the first pure dojo/dijit written input types */
		var p = dojo.byId(parent_id);
		var input_parent = dojo.create('span', {}, p);
		dojo.addClass(input_parent, 'service-input-parent');
		var input_title = dojo.create('span', { innerHTML : this.getTitle() }, input_parent);
		dojo.addClass(input_title, 'service-input-title');

		this.color_value_id = GeoMOOSE.id();

		this._dropdown = new dijit.form.DropDownButton({
			'label' : dojo.string.substitute(this._labelHTML, {'color' : this.getValue()}),
			'dropDown' : new dijit.ColorPalette({
				onChange: dojo.hitch(this, this._setValue)
			}) 
		}, dojo.create('span', {'id': this.color_value_id}, input_parent));

	},

	/*
	 * Method: _setValue
	 * Takes in the value from the onChange of the Palette, sets the local value
	 * and updates the display.
	 */
	_setValue: function(value) {
		this.setValue(value);
		dijit.byId(this.color_value_id).set('label', dojo.string.substitute(this._labelHTML, {'color' : this.getValue()}));
	}
});

/*
 * Class: GeoMOOSE.Services.InputType.Projection
 * Sends the current projection definition for the map to the service.
 * Useful for when datasets may not match the projection of the map.
 */
GeoMOOSE.Services.InputType.Projection = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "projection",

	getValue: function() {
		return Map.getProjection();
	}
});

/*
 * Class: GeoMOOSE.Services.InputType.Length
 * Uses a combination of a textbox and a drop down in order to provide
 * multiple unit compatibility for entering length information.
 */


GeoMOOSE.Services.InputType.Length = OpenLayers.Class(GeoMOOSE.Services.InputType, {
	MAPBOOK_NAME: "length",

	unit_order: ['ft','yd','mi','in','m','km'],
	unit_labels: {
		'ft' :'Feet',
		'yd' :'Yards',
		'mi' :'Miles',
		'in' :'Inches',
		'm' :'Meters',
		'km' :'Kilometers'
	},

	units: null,

	initialize: function(input, options) {
		GeoMOOSE.Services.InputType.prototype.initialize.apply(this, arguments);
		this.options.renderable = true;
		this.units = CONFIGURATION.measure_tool.line_units;
		if(input && input.getAttribute('units')) {
			this.units = input.getAttribute('units');
		}

		if(options) {
			if(options.units) {
				this.units = options.units;
			}
			if(options.value) {
				this.value = options.value;
			}
		}
	},

	renderHTML: function(parent_id) {
		var p = dojo.byId(parent_id);
		var input_parent = dojo.create('span', {}, p);
		dojo.addClass(input_parent, 'service-input-parent');
		var input_title = dojo.create('span', { innerHTML : this.getTitle() }, input_parent);
		dojo.addClass(input_title, 'service-input-title');

		this.color_value_id = GeoMOOSE.id();

		this._textbox = new dijit.form.TextBox({
			value: GeoMOOSE.convertLength(this.getValue(), 'm', this.units),
			onChange: dojo.hitch(this, this._setValue)
		}, dojo.create('span', {}, input_parent));

		dojo.style(this._textbox.domNode, {'width' : '5em'});

		var options = [];
		for(var i = 0, ii = this.unit_order.length; i < ii; i++) {
			var unit = this.unit_order[i];
			options.push({
				'value' : unit,
				'label' : this.unit_labels[unit]
			});
		}

		this._select = new dijit.form.Select({
			onChange: dojo.hitch(this, this._setValue),
			options: options,
			value: this.units 
		}, dojo.create('span', {}, input_parent));
	},

	/*
	 * Method: _setValue
	 * Uses the value from the select and the textbox to convert the users input to 
	 * meters.
	 */
	_setValue: function(value) {
		var unit = this._select.get('value');
		var length = parseFloat(this._textbox.get('value'));

		this.input.setAttribute('units', unit);
		/* We're going to use meters because they are more consistent. */
		this.setValue(GeoMOOSE.convertLength(length, unit, 'm'));
	}
});
