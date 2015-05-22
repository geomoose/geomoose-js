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
 * Class: GeoMOOSE.UI.Toolbar
 * Create a handy toolbar.
 */

dojo.provide('GeoMOOSE.UI.Toolbar');

dojo.require('dijit.Toolbar');
dojo.require('dijit.TooltipDialog');

dojo.require('GeoMOOSE.Tool');

dojo.declare('GeoMOOSE.UI.Toolbar', [dijit.Toolbar], {

	activeLayer: null,

	untoggleOthers: function() {
		for(var tool_name in this.parent.tools) {
			var tool = this.parent.tools[tool_name];
			tool.set('checked', tool == this);
		}
	},

	_deactivateTools: function() {
		for(var tool_name in Tools) {
			Tools[tool_name].deactivate();
		}
	},

	_internalToolAction: function() {
		if(GeoMOOSE.isDefined(Tools[this.action])) {
			if(this.selectable) {
				this._deactivateTools();
			}

			Tools[this.action].activate();
		} else {
			GeoMOOSE.warning('The tool "'+this.action+'" is undefined!');
		}
	},

	_serviceToolAction: function() {
		GeoMOOSE.startService(this.service_name);
	},

	_javascriptToolAction: function() {
		eval(this.stuff_to_do);
	},

	_layerToolAction: function() {
		GeoMOOSE.activateLayerTool(this.action);
	},

	_addTool: function(parent, tool_xml, asMenuItem) {
		var tool_type = tool_xml.getAttribute('type');
		var name = tool_xml.getAttribute('name');

		var selectable = parseBoolean(tool_xml.getAttribute('selectable'), true);

		var tool = null;
		if(asMenuItem === true) {
			if(selectable) {
				tool = new GeoMOOSE.ToolMenu({'tool_xml': tool_xml, 'parent' : this});
				dojo.connect(tool, 'onClick', this.untoggleOthers);
			} else {
				tool = new GeoMOOSE.UnselectableToolMenu({'tool_xml' : tool_xml, 'parent' : this});
			}
		} else {
			if(selectable) {
				tool = new GeoMOOSE.Tool({'tool_xml': tool_xml, 'parent' : this});
				dojo.connect(tool, 'onClick', this.untoggleOthers);
			} else {
				tool = new GeoMOOSE.UnselectableTool({'tool_xml' : tool_xml, 'parent' : this});
			}
		}
		if(tool != null) {
			/*
			 * TODO : The way tool types are defined is very enumerated.  This needs
			 * to be migrated to being more modular in 3.0 ... of course ... that will
			 * fundamentally break mapbook definitions for many tools.
			 */
			if(tool_type == 'internal') {
				tool.action = tool_xml.getAttribute('action');
				dojo.connect(tool, 'onStart', this._internalToolAction);
			} else if(tool_type == 'service') {
				tool.service_name = tool_xml.getAttribute('service');
				dojo.connect(tool, 'onStart', this._serviceToolAction);
			} else if(tool_type == 'javascript') {
				tool.stuff_to_do = OpenLayers.Util.getXmlNodeValue(tool_xml);
				dojo.connect(tool, 'onStart', this._javascriptToolAction);
			} else if(tool_type == 'layer') {
				tool.action = tool_xml.getAttribute('action');
				dojo.connect(tool, 'onStart', this._layerToolAction);
			}

			tool._deactivateTools = this._deactivateTools;
			this.parent = this;
			this.tools[name] = tool;
			parent.addChild(tool);
		}

	},

	onMapbookLoaded: function(mapbook) {
		var toolbar_xml = mapbook.getElementsByTagName('toolbar')[0];

		this.tools = {};
		this.drawers = [];

		for(var i = 0, len = toolbar_xml.childNodes.length; i < len; i++) {
			var node = toolbar_xml.childNodes[i];
			if(node.tagName && node.tagName == 'tool') {
				this._addTool(this, node);
			} else if(node.tagName && node.tagName == 'drawer') {

				var drawer_class = node.getAttribute('icon-class');
				if(!GeoMOOSE.isDefined(drawer_class)) {
					drawer_class = 'spite-control sprite-control-down';
				}

				var label = '';
				var show_label = parseBoolean(node.getAttribute('show-label'), CONFIGURATION.toolbar.show_labels);
				if(show_label) {
					label = node.getAttribute('title');
				}

				var drawer_menu = new dijit.Menu();

				var drawer = new dijit.form.DropDownButton({
					'label' : label,
					'iconClass' : drawer_class,
					'dropDown' : drawer_menu
				});

				this.addChild(drawer);

				this.drawers.push(drawer);

				/* I really don't feel like writing recursion. */
				var tools = node.getElementsByTagName('tool');
				for(var t = 0, tt = tools.length; t < tt; t++) {
					this._addTool(drawer_menu, tools[t], true);
				}
			}
		}

		this.layout.resize();

	},

	activeMapSource: null,

	onActivateMapSource: function(map_source_name) {
		this.activeMapSource = map_source_name;
	},


	toolsDisabled: false,

	disableTools: function() {
		if(!this.toolsDisabled) {
			for(var tool in this.tools) {
				var t = this.tools[tool];
				t.set('old-state', t.get('disabled'));
				t.set('disabled', true);
			}

			for(var d = 0, dd = this.drawers.length; d < dd; d++) {
				var drw = this.drawers[d];
				drw.set('old-state', drw.get('disabled'));
				drw.set('disabled', true);
			}

			this.toolsDisabled = true;
		}
	},

	restoreTools: function() {
		if(this.toolsDisabled) {
			for(var tool in this.tools ){
				var t = this.tools[tool];
				t.set('disabled', t.get('old-state'));
			}
			for(var d = 0, dd = this.drawers.length; d < dd; d++) {
				var drw = this.drawers[d];
				drw.set('disabled', drw.get('old-state'));
				
			}
			this.toolsDisabled = false;
		}
	}
});
