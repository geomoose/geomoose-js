dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.provide("extensions.VisibleLayers.mapsource");
dojo.declare("extensions.VisibleLayers.mapsource", [dijit._Widget, dijit._Templated], {
	templateString: dojo.cache("extensions.VisibleLayers", "templates/mapsource.html"),
    widgetsInTemplate: true,

	title: "Unknown",
	path: "Unknown",
	tab: null,
	visible: true,

	attributeMap: {
		title: { node: "titleNode", type: "innerHTML" }
	},

	postCreate: function() {
		this.inherited(arguments);

		this.fadeBtn.onclick = dojo.hitch(this, this.fadeLayer);
		this.unfadeBtn.onclick = dojo.hitch(this, this.unfadeLayer);
		this.upBtn.onclick = dojo.hitch(this, this.upLayer);
		this.downBtn.onclick = dojo.hitch(this, this.downLayer);
		this.killBtn.onclick = dojo.hitch(this, this.killLayer);
		this.activateBtn.onclick = dojo.hitch(this, this.activateLayer);
		this.popupBtn.onclick = dojo.hitch(this, this.popupsLayer);
		this.reloadBtn.onclick = dojo.hitch(this, this.reloadLayer);

		this.titleNode.onclick = dojo.hitch(this, this.hideShow);

		this.set("title", this._getTitle());

		dojo.style(this.activateBtn, { display: "none" } );
		/* TODO: need to figure out when to show popups tool */
		/* dojo.style(this.popupBtn, { display: "none" } ); */
	},

	_getTitle: function() {
		var mapSource = Application.getMapSource(this.path);
		return mapSource._ol_layer.name;
	},


	/* TODO: Up/Down should be disabled for OL basemap layers */
	hideShow: function() {
		if(this.visible) {
			this.visible = false;
			dojo.style( this.layersNode, { height: "auto", display: "none" });
		} else {
			this.visible = true;
			dojo.style( this.layersNode, { height: "auto", display: "inherit" });
		}
	},
	
	hideLayer: function() {
		GeoMOOSE.changeLayerVisibility(this.path, false);
	},
	fadeLayer: function() {
		GeoMOOSE.fadeLayer(this.path);
	},
	unfadeLayer: function() {
		GeoMOOSE.unfadeLayer(this.path);
	},
	upLayer: function() {
		//GeoMOOSE.moveLayerUp(this.path);
		var layers = GeoMOOSE.getVisibleLayers();
		var my_index = 0;
		var visible_indices = {};
		for(var i in layers) {
			var path = layers[i];
			if(path.indexOf("/") < 0) {
				var mapSource = Application.getMapSource(path);
				var index = Map.getLayerIndex(mapSource._ol_layer);
				visible_indices[index] = path;
				if(path == this.path) {
					my_index = index;
				}
			}
		}
		var keys = Object.keys(visible_indices).sort(function(a,b) { return parseInt(a)-parseInt(b);});
		for(var i in keys) {
			if(keys[i] > my_index) {
				Map.setLayerIndex(Application.getMapSource(this.path)._ol_layer, keys[i]);
				break;
			}
		}
	},
	downLayer: function() {
		//GeoMOOSE.moveLayerDown(this.path);
		var layers = GeoMOOSE.getVisibleLayers();
		var my_index = 0;
		var visible_indices = {};
		for(var i in layers) {
			var path = layers[i];
			if(path.indexOf("/") < 0) {
				var mapSource = Application.getMapSource(path);
				var index = Map.getLayerIndex(mapSource._ol_layer);
				visible_indices[index] = path;
				if(path == this.path) {
					my_index = index;
				}
			}
		}
		var keys = Object.keys(visible_indices).sort(function(a,b) { return parseInt(b)-parseInt(a);});
		for(var i in keys) {
			if(keys[i] < my_index) {
				Map.setLayerIndex(Application.getMapSource(this.path)._ol_layer, keys[i]);
				break;
			}
		}
	},
	killLayer: function() {
		var mapSource = Application.getMapSource(this.path);

		/* First turn off all layers in this map-source. */
		for(var i in mapSource.layers) {
			var layer = mapSource.layers[i];
			GeoMOOSE.changeLayerVisibility(this.path + "/" + layer.name, 0);
		}

		/* Now remove the map-source from the UI */
		this.tab.remove(this.path);
	},
	activateLayer: function() {
		return GeoMOOSE.activateMapSource(this.path);
	},
	popupsLayer: function() {
		GeoMOOSE.activateMapSource(this.path);
		GeoMOOSE.activateLayerTool('popups');
	},
	reloadLayer: function() {
		console.log("Refresh " + this.path);
		return GeoMOOSE.updateLayerParameters(this.path, {MOOSETIME: (new Date).getTime()});
	},
	getLayerIndex: function() {
		var mapSource = Application.getMapSource(this.path);
		var ol_layer = mapSource._ol_layer;
		return(Map.getLayerIndex(ol_layer));
	}
});
