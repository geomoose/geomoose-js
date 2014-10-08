/*
Copyright (c) 2009-2011, Dan "Ducky" Little & GeoMOOSE.org

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
 * Class: GeoMOOSE.Tool.MeasureArea
 * Defines the MeasureArea Tool.
 * 
 * Inherits from:
 *  - <GeoMOOSE.Tool>
 */


dojo.provide('GeoMOOSE.Tool.MeasureArea');

dojo.require('dijit.form.Select');
dojo.require('dijit.form.TextBox');


dojo.declare('GeoMOOSE.Tool.MeasureArea', null, {
	show_segments: true,

	default_units: 'yd',

	units: [
		{'unit' : 'a', 'label' : 'Acres'},
		{'unit' : 'ft', 'label' : 'Square Feet'},
		{'unit' : 'm', 'label' : 'Square Meters'},
		{'unit' : 'km', 'label' : 'Square Kilometers'},
		{'unit' : 'yd', 'label' : 'Square Yards'},
		{'unit' : 'mi', 'label' : 'Square Miles'}
	],

	/* convert square inches to units */
	conversion: {
		'a' : 6272640,
		'ft' : 144,
		'm' :  1550.0031,
		'km' : 1550003100.0,
		'yd' : 1296,
		'mi' : 4014489600
	},

	/**
	 * Method: start_measure
	 * Create a tab for the contents of the measure tab.
	 */
	start_measure: function() {
		var measure_tab = GeoMOOSE.getTab('measure_area_tab');
		var p = null;
		if(!GeoMOOSE.isDefined(measure_tab)) {
			p = dojo.create('div', {});
			measure_tab = new dijit.layout.ContentPane({
				'title' : 'Measure Area',
				'closable' : true,
				'content' : p
			});
			GeoMOOSE.addTab('measure_area_tab', measure_tab);
			dojo.connect(measure_tab, 'onClose', dojo.hitch(this, this.onClose));
			dojo.connect(measure_tab, 'onHide', dojo.hitch(this, this.onHide));
			dojo.connect(measure_tab, 'onShow', dojo.hitch(this, this.onShow));

		} else {
			p = measure_tab.content;
		}

		p.innerHTML = '';

		var header = dojo.create('div', {}, p);
		var total_div = dojo.create('div', {}, header);
		var total_label = dojo.create('span', {'innerHTML' : 'Total:'}, total_div);
		dojo.addClass(total_label, ['dijitInline','measure_header_label']);

		this.total_display = new dijit.form.TextBox({
			'style' : {
				'width' : '10em'
			},
			'readOnly' : true
		}, dojo.create('span', {}, total_div));

		if(this.show_segments) {
			var segment_div = dojo.create('div', {}, header);
			var segment_label = dojo.create('span', {'innerHTML' : 'Segment:'}, segment_div);
			dojo.addClass(segment_label, ['dijitInline','measure_header_label']);

			this.segment_display = new dijit.form.TextBox({
				'style' : {
					'width' : '10em'
				},
				'readOnly' : true
			}, dojo.create('span', {}, segment_div));
		}

		var units_div = dojo.create('div', {}, header);
		var units_label = dojo.create('span', {'innerHTML' : 'Units:'}, units_div);
		dojo.addClass(units_label, ['dijitInline','measure_header_label']);

		var options = [];
		for(var i = 0, ii = this.units.length; i < ii; i++) {
			options.push({
				'label' : this.units[i].label,
				'value' : this.units[i].unit
			});
		}

		this.units_select = new dijit.form.Select({
			'style': {
				'width' : '10em'
			},
			'options' : options,
			'onChange' : dojo.hitch(this, this.change_units)
		}, dojo.create('span', {}, units_div));

		this.units_select.set('value', CONFIGURATION.measure_tool.area_units);

		var clear_div = dojo.create('div', {}, header);
		dojo.addClass(dojo.create('span', {}, clear_div), ['dijitInline','measure_header_label']);

		this.clear_button = new dijit.form.Button({
			'label' : 'Clear',
			'onClick' : dojo.hitch(this, this.clear_log)
		}, dojo.create('span', {}, clear_div));

		this.tbody_id = GeoMOOSE.id();

		var body = dojo.create('div', {}, p);

		var table = dojo.create('table', {}, body);
		var thead = dojo.create('thead', {}, table);
		var header_row = dojo.create('tr', {}, thead);
		var columns = {'#':'measure_segment_id_column','Segment':'measure_segment_column','Total':'measure_total_column'};

		if(!this.show_segments) {
			delete columns['Segment'];
		}
		
		for(var label in columns) {
			dojo.addClass(dojo.create('th', {'innerHTML' : label}, header_row), columns[label]);
		}

		var tbody = dojo.create('tbody', {'id' : this.tbody_id}, table);

		/* This is a bit of a hack.  But it gets the configurator the desired behavior. */
		if(!this.show_segments) {
			dojo.style(table, {'display' : 'none'});
		}

		GeoMOOSE.selectTab('measure_area_tab');
	},

	constructor: function(map, options) {
		/* allow mixin to change defaults */
		dojo.mixin(this, options);

		this.measures = [];

		/* Configuration option to hide the area segments */
		//alert('o hai');
		//console.log(CONFIGURATION.measure_tool.show_area_segments, parseBoolean(CONFIGURATION.measure_tool.show_area_segments,true));
		//alert('fonde');
		if(parseBoolean(CONFIGURATION.measure_tool.show_area_segments,true) === false) {
			this.show_segments = false;
		}

		var measure_tool_style = new OpenLayers.Style();
		measure_tool_style.addRules([
			new OpenLayers.Rule({symbolizer: CONFIGURATION.measure_tool.style})
		]);
		var measure_tool_style_map = new OpenLayers.StyleMap({"default": measure_tool_style});
		var measure_tool_options = {
			geodesic: true,
			handlerOptions: {
			    style: "default", // this forces default render intent
			    layerOptions: {styleMap: measure_tool_style_map},
			    persist: true
			}
		};


		this.measure_tool = new GeoMOOSE.Control.Measure(GeoMOOSE.Handler.MeasurePolygon, measure_tool_options);
		/* setup the events */
		var self = this;
		Tools['measurearea'] = {
			active: false,
			activate: function() { 
				if(!this.active) { self.start_measure(); }
				this.active = true;
			}, 
			deactivate: function() { 
				if(this.active) { self.closeMeasure(); }
				this.active = false;
			},
			draw: function() {},
			setMap: function() {}
		};


		//new GeoMOOSE.Control.Measure(GeoMOOSE.Handler.MeasurePolygon, measure_tool_options);
		this.measure_tool.events.register('measure', this, this.finish_measure);
		this.measure_tool.events.register('measuremove', this, this.show_measure);
		this.measure_tool.events.register('measurepartial', this, this.log_measure);
		/* when the map is created add the tool appropriately */
		this.onMapCreated(map);
		//GeoMOOSE.register('onMapCreated', this, this.onMapCreated);

		//this.measure_tool.activate();
		//this.start_measure();
	},

	onHide: function () {
		this.measure_tool.deactivate();
	},

	onShow: function () {
		this.measure_tool.activate();
	},

	onMapCreated: function(map) {
		map.addControl(this.measure_tool); 
	},

	onClose: function() {
		GeoMOOSE.activateDefaultTool();
	},

	closeMeasure: function(map) {
		this.measure_tool.deactivate();
		/* we want this tab to disappear when the measure tool is finished. */
	//	dijit.byId('tabs').closeChild(GeoMOOSE.getTab('measure_area_tab'));
		GeoMOOSE.closeTab('measure_area_tab');
	},

	_convertUnits: function(area) {
		var conversion_factor = this.conversion[Map.units];
		/* map units to square inches */
		//var area_in_inches = area * conversion_factor; 
		var area_in_display_units = area / this.conversion[this.units_select.get('value')];
		return area_in_display_units;
	},

	show_measure: function(event) {
		this.current_segment = event.measure;
		if(this.show_segments) {
			this.segment_display.set('value', this._convertUnits(event.measure).toFixed(CONFIGURATION.measure_tool.precision));
		}
	},

	log_measure: function(event) {
		if(this.reset_measure) {
			this.clear_log();
		}
		this.reset_measure = false;		
		if(event.measure.toFixed() != 0) {
			this.measures.push(event.measure);
		}
		this.current_total = event.measure;
		this.total_display.set('value', this._convertUnits(event.measure).toFixed(CONFIGURATION.measure_tool.precision));
		this.render_log();
	},

	render_log: function() {
		var tbody = dojo.byId(this.tbody_id);
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		var accum = 0;
		for(var i = 0, ii = this.measures.length; i < ii; i++) {
			var row = dojo.create('tr', {}, tbody);

			var seg = this.measures[i] - accum;

			dojo.create('td', {'innerHTML' : i+1}, row);
			if(this.show_segments) {
				dojo.create('td', {'innerHTML' : this._convertUnits(seg).toFixed(CONFIGURATION.measure_tool.precision)}, row);
			}
			dojo.create('td', {'innerHTML' : this._convertUnits(this.measures[i]).toFixed(CONFIGURATION.measure_tool.precision)}, row);

			accum = this.measures[i];
		}
	},

	clear_log: function() {
		this.measures = [];
		this.render_log();
		this.total_display.set('value', '');
		if(this.show_segments) {
			this.segment_display.set('value', '');
		}
	},

	change_units: function() {
		this.render_log();
		var cur_total = this._convertUnits(this.current_total).toFixed(CONFIGURATION.measure_tool.precision);
		if(isNaN(cur_total)) { cur_total = ''; }
		this.total_display.set('value', cur_total);

		if(this.show_segments) {
			var cur_segment = this._convertUnits(this.current_segment).toFixed(CONFIGURATION.measure_tool.precision);
			if(isNaN(cur_segment)) { cur_segment = ''; }
			this.segment_display.set('value', cur_segment);
		}
	},

	finish_measure: function() {
		this.reset_measure = true;
	}

});
