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
		
		GeoMOOSE.register('onMapbookLoaded', this, this.setupEvents);
		dojo.connect(Application, 'configureMapSources', dojo.hitch(this, this.renderTab));
	},

	setupEvents: function() {
		dojo.connect(Application, 'onLayersChange', dojo.hitch(this, this.onLayerChange));
		dojo.connect(Application, 'configureMapSource', dojo.hitch(this, this.onLayerAdd));
		dojo.connect(Map, 'setLayerIndex', dojo.hitch(this, this._place_layers));
	},

	onLayerAdd: function(xml, options) {
		this.renderTab();
	},

	onLayerChange: function(layer_id, vis) {
		console.log("Layer " + layer_id + " changed.");
		if(this.layers[layer_id]) {
			this.layers[layer_id].onLayerChange(vis);
		}
		this.renderTab();
	},

	renderTab: function(evt) {
		var layerList = GeoMOOSE.getVisibleLayers();
		for(var i in layerList) {
			var path = layerList[i];
			if(this.layers[path]) {
				; // update status
			} else {
				if(path.indexOf("/") > -1) { /* This is a layer */
					var group = path.split("/")[0];
					var l = new extensions.VisibleLayers.layer(
									{
										title: path,
										path: path,
										map_source: this.layers[group]
									});
					this.layers[path] = l;
					dojo.place(l.domNode, this.layers[group].layersNode, "last");
				} else {
					var g = new extensions.VisibleLayers.mapsource(
									{
										title: path,
										path: path
									});
					this.layers[path] = g;
					//dojo.connect(g, 'upLayer', dojo.hitch(this, this._place_layers));
					//dojo.connect(g, 'downLayer', dojo.hitch(this, this._place_layers));
					//dojo.place(g.domNode, this.layersNode, "last");
				}
			}
		}
		this._place_layers();
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

		for(var i in map_sources) {
			dojo.place(this.layers[map_sources[i]].domNode, this.layersNode, "last");
		}
	}

});
