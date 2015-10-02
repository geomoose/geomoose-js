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


dojo.provide('GeoMOOSE.Tool');

dojo.require('dijit.form.Button');
dojo.require('dijit.MenuItem');
dojo.require('dijit.CheckedMenuItem');

dojo.declare('GeoMOOSE._Tool', null, {
	tool_xml: null,

	doStyle: function() {
		var icon_class = this.tool_xml.getAttribute('icon-class');
		if(icon_class) {
			this.iconClass = icon_class;
		} else {
			this.iconClass = 'sprite-control sprite-control-'+this.name;
		}
	},

	constructor: function() {
		dojo.mixin(this, arguments[0]);
		/* name is the internal identifier for the tool */
		this.name = this.tool_xml.getAttribute('name');
		/* Label is what is potentially displayed on the tool */
		var label = this.tool_xml.getAttribute('title');
		var show_label = parseBoolean(this.tool_xml.getAttribute("show-label"), CONFIGURATION.toolbar.show_labels);
		if(show_label) {
			this.label = label; 
		}
		this.title = label;

		this.doStyle();

		this.cursor_css = 'default';
		if(GeoMOOSE.isDefined(CONFIGURATION.cursor[this.name])) {
			this.cursor_css = CONFIGURATION.cursor[this.name];
		} else if(GeoMOOSE.isDefined(this.tool_xml.getAttribute('cursor'))) {
			this.cursor_css = this.tool_xml.getAttribute('cursor'); 
		}
	},

	changeCursor: function() {
		dojo.style(dojo.byId('mapContainer'), {'cursor' : this.cursor_css});
	}

});

/*
 * Class: GeoMOOSE.Tool
 * Defines a selectable tool
 */


dojo.declare('GeoMOOSE.Tool', [GeoMOOSE._Tool, dijit.form.ToggleButton], {
	selectable: true,

	onStart: function() {
	},

	
	onClick: function() {
		/** this is a small hack to make sure that the button stays selected. **/
		if(!this.get('checked')) {
			this.set('checked', true);
		} else {
			//this.inherited(arguments);
			this.onStart();
		}
		this.changeCursor();
	}
});

/*
 * Class: GeoMOOSE.UnselectableTool
 * Creates a tool that cannot be selcted.
 */

dojo.declare('GeoMOOSE.UnselectableTool', [GeoMOOSE.Tool], {
	selectable: false
});

/*
 * Class: GeoMOOSE.ToolMenu
 * Renders a tool as a menu item.
 */

dojo.declare('GeoMOOSE.ToolMenu', [GeoMOOSE.Tool, dijit.CheckedMenuItem], {
	selectable: true,

	postCreate: function() {
		this.inherited(arguments);

		var icon = dojo.create('div', {}, this.labelNode, 'first');
		dojo.addClass(icon, this.iconClass);
		dojo.addClass(icon, 'dijitInline');
	},

	onClick: function() {
		this.inherited(arguments);
		this.changeCursor();
	}
});

/*
 * Class: GeoMOOSE.UnselectableToolMenu
 * Renders a tool as a menu item that cannot be selected.
 */
dojo.declare('GeoMOOSE.UnselectableToolMenu', [GeoMOOSE._Tool, dijit.MenuItem], {
	selectable: false,

	onClick: function() {
		this.onStart();
		this.changeCursor();

	}
});


