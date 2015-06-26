dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("GeoMOOSE.Tab");
dojo.require("extensions.VisibleLayers.mapsource");
dojo.require("extensions.VisibleLayers.layer");

dojo.provide("extensions.VisibleLayers.tab");
dojo.declare('extensions.VisibleLayers.tab', [GeoMOOSE.Tab, dijit._Widget, dijit._Templated], {
	title: 'Active Layers', /* GeoMOOSE.Tab */

	templateString: dojo.cache("extensions.VisibleLayers", "templates/tab.html"),
	widgetsInTemplate: true,

	layers: null,

	startup: function() {
		this.inherited(arguments);
		this.layers = {};

		if(CONFIGURATION['extensions.VisibleLayers.tab_name'])
			this.set('title', CONFIGURATION['extensions.VisibleLayers.tab_name']);

		dojo.connect(Application, 'onLayersChange', dojo.hitch(this, this.onLayerChange));
		dojo.connect(Application, 'configureMapSource', dojo.hitch(this, this.onLayerAdd));
		dojo.subscribe('visible-layers-remove', dojo.hitch(this, this.remove));
		
		GeoMOOSE.register('onMapCreated', this, this.setupMapEvents);
		dojo.connect(Application, 'configureMapSources', dojo.hitch(this, this.renderTab));
	},

	postCreate: function() {
		this.inherited(arguments);
		this.parentId = GeoMOOSE.id();
		dojo.attr(this.layersNode, 'id', this.parentId);
	},

	setupMapEvents: function() {
		//dojo.connect(Map, 'setLayerIndex', dojo.hitch(this, this._place_layers));
		Map.events.register('changelayer', this, this._place_layers);
		Map.events.register('moveend', this, this.onRefreshMap);

	},

	onLayerAdd: function(xml, options) {
		this.renderTab(xml);
	},

	onRefreshMap: function() {
		for(var group in this.layers) {
			this.layers[group].updateLegends();
		}
	},

	onLayerChange: function(path, vis) {
		// since we update based on the group, pull the group.
		var group = path.split('/')[0];
		if(this.layers[group]) {
			//this.layers[layer_id].onLayerChange(vis);
			this.layers[group].updateListing([path], vis);
		}
		this.renderTab();
	},

	renderTab: function(xml) {
		var layerList = GeoMOOSE.getVisibleLayers();
		for(var i in layerList) {
			var path = layerList[i];
			if(this.layers[path]) {
				; // update status
			} else {
				if(path.indexOf("/") > -1) { /* This is a layer */
				/*
					var group = path.split("/")[0];
					if(GeoMOOSE.isDefined(this.layers[group])) {
						var l = new extensions.VisibleLayers.layer(
										{
											title: path,
											path: path,
											map_source: this.layers[group]
										});
						this.layers[path] = l;
						dojo.place(l.domNode, this.layers[group].layersNode, "last");
					}
				*/
				} else {
					var layer = Application.getMapSource(path).asLayer();
					if(layer.displayInCatalog) {
						// add the remove-layer control.
						layer.controls['remove-layer'] = true;

						var group = path.split("/")[0];
						this.layers[group] = new GeoMOOSE.Tab._CatalogLayer(this.parentId,
									layer,
									true, '');

						this.layers[group].getLayerIndex = function() {
							var mapSource = Application.getMapSource(this.layer.src);
							var ol_layer = mapSource._ol_layer;
							var index = Map.getLayerIndex(ol_layer);
							return index;
						};
					}

					/*
					var g = new extensions.VisibleLayers.mapsource(
									{
										title: path,
										path: path,
										tab: this
									});
					this.layers[path] = g;
					*/

					// parent_id, layer_xml, multiple, group_name
					/*
					this.layers[group] = new GeoMOOSE.Tab._CatalogLayer(this.parentId, 
								xml,
								false,
								'');
					*/
					//dojo.connect(g, 'upLayer', dojo.hitch(this, this._place_layers));
					//dojo.connect(g, 'downLayer', dojo.hitch(this, this._place_layers));
					//dojo.place(g.domNode, this.layersNode, "last");
				}
			}
		}
		this._place_layers();
	},

	remove: function(path) {
		path = path.split("/")[0];
		/* Check if path is valid map-source */	
		if(GeoMOOSE.isDefined(this.layers[path])) {
			/* Delete layers in the map-source */		
			for(var p in this.layers) {
				if(p.indexOf(path+"/") == 0) {
					dojo.destroy(this.layers[p].div);
					delete this.layers[p];
				}
			}
			/* Delete the map-source */
			dojo.destroy(this.layers[path].div);
			delete this.layers[path];
	
			/* Update the list - do we need to do this?*/
			this.renderTab();
		}
	},

	_place_layers: function() {
		var map_sources = [ ];
		for(var i in this.layers) {
			if(i.indexOf("/") < 0) {
				map_sources.push(i);
			}	
		}	
		map_sources = map_sources.sort( dojo.hitch(this,
			function(a,b) {
				var al = this.layers[a];
				var bl = this.layers[b];
				return (bl.getLayerIndex() - al.getLayerIndex());
			}));

		for(var i = 0, len = map_sources.length; i < len; i++) {
			//dojo.place(this.layers[map_sources[i]].domNode, this.layersNode, "last");
			dojo.place(this.layers[map_sources[i]].div, this.layersNode, "last");
		}
	}

});
