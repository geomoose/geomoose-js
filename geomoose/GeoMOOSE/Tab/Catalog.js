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
 * Class: GeoMOOSE.Tab.Catalog
 * The new, more classy, GeoMOOSE catalog.
 *
 * Inherits from:
 *  - <GeoMOOSE.Tab>
 *
 */

dojo.provide('GeoMOOSE.Tab.Catalog');
dojo.require('GeoMOOSE.Tab');
dojo.require('GeoMOOSE.Layer');

dojo.require('dijit.form.RadioButton');
dojo.require('dijit.form.CheckBox');

dojo.declare('GeoMOOSE.Tab._CatalogLayer', null, {

	parent_id: '',

	paths: {},
	visible_paths: [],

	checkbox_id: '',

	onRefreshMap: function() {
		dojo.query('.catalog-layer-title', this.parent_id).forEach(function(layer_title) {
			var minscale = parseFloat(layer_title.getAttribute('data-minscale'));
			var maxscale = parseFloat(layer_title.getAttribute('data-maxscale'));

			if(GeoMOOSE.inScale(minscale, maxscale)) {
				dojo.removeClass(layer_title, 'catalog-outscale');
			} else {
				dojo.addClass(layer_title, 'catalog-outscale');
			}
		});
		this.updateLegends();
	},

	constructor: function(parent_id, layer, multiple, group_name) {
		this.layer = layer;

		/* render ... */
		this.parent_id = parent_id;
		var p = dojo.byId(parent_id);

		var container;
		if (layer.tip != null) {
			container = dojo.create('div', {title: layer.tip}, p);
		} else {
			container = dojo.create('div', null, p);
		}
		this.div = container;

		var title = dojo.create('div', {}, container);

		this.checkbox_id = GeoMOOSE.id();
		var checkbox = dojo.create('span', {'id' : this.checkbox_id}, title);
		var checkbox_class = dijit.form.CheckBox;
		var construct_opts = {};

		if(multiple === false) {
			var checkbox_class = dijit.form.RadioButton;
			construct_opts['name'] = group_name;
		}

		// check the box if it has any layers on.
		var visible_layers = GeoMOOSE.getVisibleLayers();
		// update this.layer.paths by what is turned on now.
		for(var l = 0, ll = visible_layers.length; l < ll; l++) {
			if(GeoMOOSE.isDefined(this.layer.paths[visible_layers[l]])) {
				this.layer.paths[visible_layers[l]] = true;
				
			}
		}
		for(var path in this.layer.paths) {
			if(this.layer.paths[path] === true) {
				construct_opts['checked'] = true;
				break;
			}
		}

		var cbox = new checkbox_class(construct_opts, checkbox);
		dojo.connect(cbox, 'onChange', dojo.hitch(this, function(v) {
			/* toggle the paths values */
			var paths = [];
			for(var src in this.layer.paths) {
				this.layer.paths[src] = v;
				paths.push(src);
			}
			GeoMOOSE.changeLayerVisibility(paths, v);
		}));

		/* store min/maxscale in the dom */
		var label_span = dojo.create('span', {
			'innerHTML' : layer.label,
			'data-minscale' : layer.minscale,
			'data-maxscale' : layer.maxscale
		}, title);
		dojo.addClass(label_span, 'catalog-layer-title');

		if(!GeoMOOSE.inScale(parseFloat(layer.minscale),parseFloat(layer.maxscale))) {
			dojo.addClass(label_span, 'catalog-outscale');
		}

		/** Whew ... time to render controls ... yikes ... **/
		var controls_id = GeoMOOSE.id();
		var controls = dojo.create('div', {id: controls_id}, container);
		if(CONFIGURATION.catalog.show_controls === false) {
			dojo.addClass(controls, 'hide');
		}
		for(var i = 0; i < CONFIGURATION.layer_control_order.length; i++) {
			var control_name = CONFIGURATION.layer_control_order[i];
			if(layer.controls[control_name]) {
				var control_class = GeoMOOSE._getLayerControl(control_name);
				if(GeoMOOSE.isDefined(control_class)) {
					var control = new control_class({layer: layer});
					control.draw(controls);
				}
			}
		}
		if(CONFIGURATION.catalog.toggle_controls) {
			label_span.style.cursor = 'pointer';
			label_span.setAttribute('data-control-id', controls_id);
			dojo.connect(label_span, 'click', this.toggleControls);
		}

		/** check for the drawing tools **/
		if(layer.drawingTools) {	
			if(!GeoMOOSE.isDefined(layer.src)) {
				GeoMOOSE.warning('Cannot draw on this layer, the SRC is not defined.');
			} else if(GeoMOOSE.isEditable(layer.src)) {
				/* Ahh, the sweet spot where things should actually work */

			} else {
				GeoMOOSE.warning('Drawing tool will not work on layer "'+layer.src+'", it is not an editable map source type.');
			}
		}


		/** Handle the legends **/
		this.legends_id = GeoMOOSE.id();
		var legends = dojo.create('div', {'id' : this.legends_id }, container);
		dojo.addClass(legends, ['catalog_legend_container']);

		/* check to see if we show the legends by default */
		if(!layer.showLegends) {
			dojo.style(legends, {'height' : 'auto', 'display' : 'none'});
		}
		p = null;

		dojo.subscribe('geomoose/activate-map-source', dojo.hitch(this, this.activateMapSource));
	},

	activateMapSource: function(activated_map_source) {
		var found = false;
		for(var p in this.layer.paths) {
			if(activated_map_source == p) {
				found = true;
				break;
			}
		}
		if(found) {
			dojo.addClass(this.div, 'catalog-active-map-source');
		} else {
			dojo.removeClass(this.div, 'catalog-active-map-source');
		}
	},

	updateListing: function(changed_layers, change_state) {
		this.active_paths = [];

		var changed = false;

		for(var i = 0; i < changed_layers.length; i++) {
			if(typeof(this.layer.paths[changed_layers[i]]) == 'boolean') {
				this.layer.paths[changed_layers[i]] = change_state;
				changed = true;
			}
		}

		for(var path in this.layer.paths) {
			if(this.layer.paths[path] === true) {
				this.active_paths.push(path);
			}
		}
		/* okay first update the checkbox */
		var checkbox = dijit.byId(this.checkbox_id);
		if(changed) {
			checkbox.set('checked', change_state);
		}
		
		/** update the legends as appropriate **/
		if(this.active_paths.length > 0) {
			this.updateLegends();
		}
	},

	updateLegends: function() {
		var legends_div = dojo.byId(this.legends_id);
		if(!legends_div) { return false; }

		/* remove all the current legends */
		while(legends_div.firstChild) { legends_div.removeChild(legends_div.firstChild); }

		/* load the new legends */
		if(dijit.byId(this.checkbox_id).get('checked')) {
			var legend_urls = [];
			if(this.layer.dynamicLegends) {
				var paths = [];
				for(var path in this.layer.paths) {
					if(this.layer.paths[path] === true) {
						paths.push(path);
					}
				}
				legend_urls = GeoMOOSE.getLegendUrls(paths);
			} else {
				legend_urls = this.layer.legendUrls;
			}
			/* update the legends */
			for(var i = 0, ii = legend_urls.length; i < ii; i++) {
				var legend_img = dojo.create('img', {
					'src' : legend_urls[i]
				}, legends_div);
				dojo.addClass(legend_img, ['catalog-legend-image']);
			}
		}
	},
	
	toggleControls: function() {
		var controls_id = this.getAttribute('data-control-id');
		var controls = dojo.byId(controls_id);
		if(dojo.hasClass(controls, 'hide')) {
			dojo.removeClass(controls, 'hide');
		} else {
			dojo.addClass(controls, 'hide');
		}
	}
});

dojo.declare('GeoMOOSE.Tab.Catalog', [GeoMOOSE.Tab], {
	targetId: "catalog",

	title: 'Catalog',

	mapbook: null,

	catalog_layers: null,

	startup: function() {
		this.inherited(arguments);
		var main_id = GeoMOOSE.id();
		this.main_id = main_id;
		var main = dojo.create('div', {'id' : main_id});
		this.set('content', main);
		
		this.catalog_layers = new Array();

		this.set('title', CONFIGURATION['catalog_name']);

	},

	/*
	 * Function: renderLayer
	 * Responsible for actually rendering the layer in the catalog.
	 * 
	 * Arguments:
	 *  groupElementId - The Group's Div to which the layer belongs.
	 *  layer_xml - The layer's XML definition
	 *  overrideStatusList - A hash containing a list of layers which are "on" by default. 
	 */
	renderLayer: function(groupElementId, layer_xml, overrideStatusList) {
		var multiple = parseBoolean(layer_xml.parentNode.getAttribute('multiple'),true);
		var group_name = '';
		if(multiple == false) {
			group_name = layer_xml.parentNode.getAttribute('title');
		}
		var layerObj = new GeoMOOSE.Layer();
		layerObj.parseLayerXml(layer_xml);
		var layer = new GeoMOOSE.Tab._CatalogLayer(groupElementId, layerObj, multiple, group_name);
		this.catalog_layers.push(layer);
	},

	_hideGroup: function(id) {
		var children = dojo.byId(id);
		var wipe_params = {'node' : id};
		if(CONFIGURATION.flashy_bits) {
			dojo.fx.wipeOut(wipe_params).play();
		} else {
			children.style.display = 'none';
		}
	},

	_showGroup: function(id) {
		var children = dojo.byId(id);
		var wipe_params = {'node' : id};
		if(CONFIGURATION.flashy_bits) {
			dojo.fx.wipeIn(wipe_params).play();
		} else {
			children.style.display = 'block';
		}
	},

	/*
	 * Function: toggleGroup
	 * Toggle the group div's children's visibility.
	 */
	
	toggleGroup: function() {
		var children = dojo.byId(this.children_id);
		if(children.style.display != 'none') {
			this._hideGroup(this.children_id);
		} else {
			this._showGroup(this.children_id);
		}
	},

	/*
	 * Function: renderGroup
	 * Render the Group from the catalog.
	 * 
	 * Parameters:
	 *  groupElementId - The div id in which to render the group.
	 *  group - The group XML definition.
	 *
	 */
	renderGroup: function(groupElementId, group) {
		var p = document.getElementById(groupElementId);
		var ul = document.createElement('ul');
		ul.className = 'catalog';

		var children_id = GeoMOOSE.id();

		if(group.getAttribute('title')) {
			var li = document.createElement('li');
			p.appendChild(li);
			/*
			if(CONFIGURATION.group_checkboxes && parseBoolean(group.getAttribute('multiple'), true)) {
				var group_control = document.createElement('input');
				group_control.type = 'checkbox';
				li.appendChild(group_control);
				group_control.onclick = groupClickAll;
			}
			*/

			var title_div = dojo.create('a', {
				'innerHTML' : group.getAttribute('title')
			}, li);

			dojo.addClass(title_div, ['catalog-group']);
			title_div._hideGroup = this._hideGroup;
			title_div._showGroup = this._showGroup;
			title_div.onclick = this.toggleGroup;


			var children = dojo.create('div', {'id' : children_id}, li);
			dojo.addClass(children, 'catalog-indent');
			title_div.children_id = children_id;
			if(!parseBoolean(group.getAttribute('expand'), true)) {
				this._hideGroup(children_id);
			}

			li = null;
		} else {
			ul.className += ' catalog-group-expanded';
			ul.id = children_id;
		}
		p.appendChild(ul);


		var args = GeoMOOSE.getUrlParameters();
		var overrideStatusList = {};
		if(args.on) {
			var on_list = new String(args.on).split(';');
			for(var i = 0; i < on_list.length; i++) {
				overrideStatusList[on_list[i]] = 'on';
			}
		}
		if(args.off) {
			var off_list = new String(args.off).split(';');
			for(var i = 0; i < off_list.length; i++) {
				overrideStatusList[off_list[i]] = 'off';
			}
		}
		for(var i = 0; i < group.childNodes.length; i++) {
			var tagName = group.childNodes[i].tagName;
			if(tagName) {
				if(tagName == 'group') {
					this.renderGroup(children_id, group.childNodes[i]);
				} else if(tagName == 'layer') {
					this.renderLayer(children_id, group.childNodes[i], overrideStatusList);
				}
			}
		}

		ul = null;
		p = null;
	},

	onLayersChange: function(path, vis) {
		/* check to see if we have any catalog entries to update */
		if(this.catalog_layers && this.catalog_layers.length > 0) {
			/* and update the entries */
			/* This is supremely heavy-handed for what it does.  Oy. */
			this.updateListing(path,vis);
		}
	},

	updateListing: function(visible_layers, visibility) {
		var layers = GeoMOOSE.asArray(visible_layers);
		if(typeof(visibility) == 'undefined') { visibility = true; }
		for(var i = 0, len = this.catalog_layers.length; i < len; i++) {
			this.catalog_layers[i].updateListing(layers,visibility);
		}
	},

	onGotMapbook: function(response) {
		this.mapbook = response;
		var catalog = this.mapbook.getElementsByTagName('catalog')[0];
		this.renderGroup(this.main_id, catalog);
		this.updateListing(GeoMOOSE.getVisibleLayers());
	},

	onRefreshMap: function() {
		for(var i = 0, ii = this.catalog_layers.length; i < ii; i++) {
			this.catalog_layers[i].onRefreshMap();
		}
	}

});
