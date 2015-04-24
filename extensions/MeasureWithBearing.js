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
 * Class: MeasureWithBearingExtension
 * A more detailed measure tool.  Creation sponsored by Oregon Counties.
 * This is now the default measure-length tool in GeoMOOSE 2.6.
 */

dojo.require('GeoMOOSE.Control.Measure');
dojo.require('GeoMOOSE.Handler.MeasurePath');

MeasureWithBearingExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {

	/* displayDescending
	    false : 1 .. n displayed in the log table
	    true  : n .. 1 displayed in the log table
	*/
	displayDescending: true,

	units: {
		length: [
			{'label' : 'Feet', 'inches_per' : 12, 'unit' : 'ft'},
			{'label' : 'Yards', 'inches_per' : 36, 'unit' : 'yd'},
			{'label' : 'Miles', 'inches_per' : 63360, 'unit' : 'mi'},
			{'label' : 'Inches', 'inches_per' : 1 ,'unit' : 'in'},
			{'label' : 'Meters', 'inches_per' : 39.37, 'unit' : 'm'}, 
			{'label' : 'Kilometers', 'inches_per' : 39370.079, 'unit' : 'km'}
		]
	},

	titles: {
		'length' : 'Measure Length',
		'area' : 'Measure Area',
		'total' : 'Total:',
		'segment' : 'Segment:',
		'bearing' : 'Bearing:',
		'units' : 'Units:',
		'clear' : 'Clear Log'
	},

	helpText: "Click on the map to start measuring. Double-click to finish measuring.",

	is_area: false,

	id_ref: {},

	/* short hand function */
	id: function() {
		return OpenLayers.Util.createUniqueID('measure');
	},

	/* entries should contain a two element object with "measure" and "bearing" properties */
	entries: [],
	/* flag set after a meausre completes.  When true, the log is reset before refresh */
	reset_entries: false,
	/* iterate over the known entries */
	get_segment_total: function() {
		var sum = 0;
		for(var i = 0, len=this.entries.length; i < len; i++) {
			sum += this.entries[i].measure;
		}
		return sum;
	},

	clearLogTable: function() {
	},

	/*
	 * calculate_bearing
	 * Calculates the relative heading between point_a and point_b
	 */
	calculate_bearing: function(point_a, point_b) {
	},

	start_measure_length: function() {
		this.isArea = false;
		this.displayTitle = this.titles['length'];
		this.start_measure();
	},

	start_measure_area: function() {
		this.isArea = true;
		this.displayTitle = this.titles['area'];
		this.start_measure();
	},

	/*
	 * Clear out the tab and setup the necessary bits for display.
	 */
	start_measure: function() {
		this.measure_tool.cancel();
		this.measure_tool.deactivate();
		this.measure_tool.activate();

		/* default this to being a "length" tool. */
		if(!GeoMOOSE.isDefined(this.displayTitle)) {
			this.displayTitle = this.titles['length'];
		}

		var measure_tab = GeoMOOSE.getTab('measure_tab');
		var p = null;
		if(!GeoMOOSE.isDefined(measure_tab)) {
			p = dojo.create('div', {});
			measure_tab = new dijit.layout.ContentPane({
				'title' : 'Measure',
				'closable' : true,
				'content' : p
			});
			GeoMOOSE.addTab('measure_tab', measure_tab);
			dojo.connect(measure_tab, 'onClose', dojo.hitch(this, this.onClose));
			dojo.connect(measure_tab, 'onHide', dojo.hitch(this, this.onHide));
			dojo.connect(measure_tab, 'onShow', dojo.hitch(this, this.onShow));
		} else {
			p = measure_tab.content;
		}

		GeoMOOSE.selectTab('measure_tab');

		/* clear out old content */
		/* this is slower than .innerHTML='' but it is more memory friendly */
		p.innerHTML = '';

		/* display a title */
		var title_div = document.createElement('div');
		title_div.className = 'measure-tool-title';
		p.appendChild(title_div);
		title_div.innerHTML = this.displayTitle;

		/* display some indicators */
		var make_divs = ['total','segment','bearing','units'];
		for(var i = 0; i < make_divs.length; i++) {
			var to_make = make_divs[i];
			var div = document.createElement('div');
			p.appendChild(div);
			var title = document.createElement('span');
			title.className = 'measure-tool-display-title';
			div.appendChild(title);
			title.innerHTML = this.titles[to_make];

			var display = document.createElement('span');
			display.className = 'measure-tool-display';
			this.id_ref[to_make] = this.id(); 
			display.id = this.id_ref[to_make];
			div.appendChild(display);
		}

		/* create the unit conversion drop down */
		var select_p = document.getElementById(this.id_ref['units']);
		var select = document.createElement('select');
		this.id_ref['units_select'] = this.id();
		select.id = this.id_ref['units_select'];
		select_p.appendChild(select);
		var selected_index = 0;
		for(var i = 0; i < this.units.length.length; i++) {
			var opt = document.createElement('option');
			opt.setAttribute('value', i);
			select.appendChild(opt);
			opt.appendChild(document.createTextNode(this.units.length[i].label));

			if(this.units.length[i].unit == CONFIGURATION.measure_tool.line_units) {
				opt.setAttribute('selected', 'selected');
				selected_index = i;
			}
		}

		select.onchange = OpenLayers.Function.bind(function() {
			var sel = document.getElementById(this.id_ref['units_select']);
			this.convert_to = this.units.length[sel.selectedIndex].inches_per;
			this.update_log_table();
			this.update_measurements();
		}, this);

		/* set default units */
		this.convert_to = this.units.length[selected_index].inches_per;

		/* create a clear button */
		var clear_div = document.createElement('div');
		p.appendChild(clear_div);
		var clear_label = document.createElement('span');
		clear_div.appendChild(clear_label);
		clear_label.innerHTML = '&nbsp;'
		clear_label.className = 'measure-tool-display-title';

		var clear_button = document.createElement('button');
		clear_div.appendChild(clear_button);
		clear_button.innerHTML = this.titles['clear'];
		clear_button.onclick = OpenLayers.Function.bind(function () {
			this.clear_log();
			this.update_log_table();
			this.update_measurements();
		}, this);

		var help = document.createElement('div');
		p.appendChild(help);
		help.className = 'help-text';
		help.innerHTML = this.helpText;

		/* startup log table */
		var table = document.createElement('table');
		p.appendChild(table);
		/* create the head */
		var thead = document.createElement('thead');
		table.appendChild(thead);
		var header = document.createElement('tr');
		thead.appendChild(header);
		var elems = ['#', this.titles['segment'], this.titles['bearing']];
		for(var i = 0; i < elems.length; i++) {
			var td = document.createElement('td');
			td.className = 'measure-tool-header-cell';
			header.appendChild(td);
			td.innerHTML = elems[i];
		}

		var tbody = document.createElement('tbody');
		this.id_ref['tbody'] = this.id();
		tbody.id = this.id_ref['tbody'];
		table.appendChild(tbody);

		this.clear_log();
	},

	/*
	 * format_measure
	 * Format the display output of an individual measure.
	 * This function can be overridden by someone wanting to only modify this bit.
	 */
	format_measure: function(measure) {
		/* stolen from the standard measure tool */
		var converted_measure = measure / this.convert_to;
		return commifyNumber(converted_measure.toFixed(CONFIGURATION.measure_tool.precision));
	},
	update_measurements: function () {
		var to_update = {
			'segment' : this.format_measure(this.current_measure),
			'total' : this.format_measure(this.current_total),
			'bearing' : this.current_bearing
		};

		for(var update in to_update) {
			var element = document.getElementById(this.id_ref[update]);
			element.innerHTML = to_update[update];
		}

	},

	clear_log: function() {
		this.reset_entries = false;
		this.entries = new Array();
		this.update_log_table();
	},

	show_measure: function(event) {
		if(this.reset_entries) {
			this.clear_log();
		}

		/* need to use these to prevent the disparity between the mousemove and 
			mouse click events. (Moving = one measure, then clicking on what seems the same spot
			will create a small measurement differential */
		/* needing these fundementally annoys me but it makes the app work. */
		this.current_measure = event.measure;
		this.current_bearing = this.get_bearing_from_event(event);
		this.current_total = this.current_measure + this.get_segment_total();

		this.update_measurements();
	},

	get_bearing_from_event: function(event) {
		var components = event.geometry.components;
		/* if we have two points, the bearing will be valid,
			more important if we have a length > 1 we can actually make the array refs */
		var len = components.length;
		if(len > 1) {
			return this.get_bearing(components[len-2],components[len-1]);
		}
		/* set it to nil */
		return '-';
	},

	finish_measure: function(event) {
		/* update the display */
		/* update the log */
		/* flag the stack to be reset */
		this.reset_entries = true;
	},

	update_log_table: function() {
		var tbody = document.getElementById(this.id_ref['tbody']);
		/* clear it out ... */
		while(tbody.firstChild) {
			tbody.removeChild(tbody.firstChild);
		}

		/* put all the rows in... */
		for(var i = 0, len = this.entries.length; i < len; i++) {
			var row = document.createElement('tr');
			if(this.displayDescending) {
				tbody.insertBefore(row, tbody.firstChild);
			} else {
				tbody.appendChild(row);
			}
			var infos = [(i+1)+':', this.format_measure(this.entries[i].measure), this.entries[i].bearing];

			/* this is intentionally a constant, "3" is a lot cheaper in memory than "infos.length"
				if you want to add something to infos, up the 3 to 4,5,6,100 or whatever you need */
			for(var x = 0; x < 3; x++) {
				var cell = document.createElement('td');
				row.appendChild(cell);
				cell.innerHTML = infos[x];
			}
		}
	},

	log_measure: function(event) {
		/* add the entry to the internal log */
		this.entries.push({
			'measure' : this.current_measure,
			/* set the offset to "back 1" in order to prevent logging the 
				bearing of the double click */
			'bearing' : this.current_bearing 
		});
		/* refresh the log table */
		this.update_log_table();
	},

	load: function() {
		var measure_tool_style = new OpenLayers.Style();
		measure_tool_style.addRules([
			new OpenLayers.Rule({symbolizer: CONFIGURATION.measure_tool.style})
		]);
		var measure_tool_style_map = new OpenLayers.StyleMap({"default": measure_tool_style});
		var measure_tool_options = {
			handlerOptions: {
			    style: "default", // this forces default render intent
			    layerOptions: {styleMap: measure_tool_style_map},
			    persist: true
			}
		};


		this.measure_tool = new GeoMOOSE.Control.Measure(GeoMOOSE.Handler.MeasurePath, measure_tool_options);

		var self = this;
		Tools['measure'] = {
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

		this.measure_tool.events.register('measure', this, this.finish_measure);
		this.measure_tool.events.register('measuremove', this, this.show_measure);
		this.measure_tool.events.register('measurepartial', this, this.log_measure);

		GeoMOOSE.register('onMapCreated', this, this.onMapCreated);
	},

	onHide: function () {
		this.finish_measure();
		this.measure_tool.deactivate();
	},

	onClose: function() {
		this.finish_measure();
		this.closeMeasure();
		GeoMOOSE.activateDefaultTool();
	},

	onShow: function () {
		this.measure_tool.activate();
	},

	onMapCreated: function(map) {
		map.addControl(this.measure_tool);
	},

	closeMeasure: function(map) {
		this.measure_tool.deactivate();
		var tab = GeoMOOSE.getTab('measure_tab');
		if(tab) {
			GeoMOOSE.closeTab('measure_tab');
		}
	},

	get_bearing: function(point_a, point_b) {
		var bearing = '-';
		if(point_a && point_b) {
			var bearing = 'N0-0-0E';

			var rise = point_b.y - point_a.y;
			var run = point_b.x - point_a.x;
			if(rise == 0) {
				if(point_a.x > point_b.x) {
					bearing = 'Due West';
				} else {
					bearing = 'Due East';
				}
			} else if(run == 0) {
				if(point_a.y > point_b.y) {
					bearing = 'Due South';
				} else {
					bearing = 'Due North';
				}
			} else {
				var ns_quad = 'N';
				var ew_quad = 'E';
				if(rise < 0) {
					ns_quad = 'S';
				}
				if(run < 0) {
					ew_quad = 'W';
				}
				/* we've determined the quadrant, so we can make these absolute */
				rise = Math.abs(rise);
				run = Math.abs(run);
				/* convert to degrees */
				// var degrees = Math.atan(rise/run) / (2*Math.PI) * 360;
				// Calculation suggested by Dean Anderson, refs: #153
				var degrees = Math.atan(run/rise) / (2*Math.PI) * 360;

				/* and to DMS ... */
				var d = parseInt(degrees);
				var t = (degrees - d) * 60;
				var m = parseInt(t);
				var s = parseInt(60 * (t-m));

				bearing = ns_quad+d+'-'+m+'-'+s+ew_quad;

			}
		}
		return bearing;
	}

});

GeoMOOSE.UX.register('MeasureWithBearingExtension');

/*
 * Some Suggested CSS
 *
[css start]

.measure-tool-title {
	font-size: 1.1em;
	font-weight: bold;
	margin-bottom: .25em;
}

.measure-tool-display-title {
	display: inline-block;
	width: 6em;
	padding-left: .2em;
	font-weight: bold;
}

.measure-tool-header-cell {
	text-decoration: underline;
}

[css end]


*/
