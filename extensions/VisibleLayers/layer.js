dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.provide("extensions.VisibleLayers.layer");
dojo.declare("extensions.VisibleLayers.layer", [dijit._Widget, dijit._Templated], {
	templateString: dojo.cache("extensions.VisibleLayers", "templates/layer.html"),
    widgetsInTemplate: true,

	title: "Unknown",
	path: "Unknown",
	map_source: null,

	attributeMap: {
		title: { node: "titleNode", type: "innerHTML" }
	},

	addControl: function( title, classes, onClick, href ) {
		var controls = this.controls;
		var c = dojo.create("div", {
			className: classes,
			title: title,
			onclick: onClick
		});

		/* If href is present, wrap div in a link */
		if(href) {
            var urlNode = dojo.create('a', {
                "target": "geonetwork",
                "href": href
            });
			dojo.place( c, urlNode );
			c = urlNode;
		}

		dojo.place( c, controls );
	},
	
	postCreate: function() {
		this.inherited(arguments);

		this.checkbox.set("checked", true);
		this.checkbox.onChange = dojo.hitch(this, function() {
			var c = this.checkbox.get("checked");
			GeoMOOSE.changeLayerVisibility(this.path,c);
		});

		// TODO: use GeoMOOSE.Tab.Catalog.LayerControl.*
		//this.removeBtn.onclick = dojo.hitch(this, this.hideLayer);
		//this.fadeBtn.onclick = dojo.hitch(this, this.fadeLayer);
		//this.unfadeBtn.onclick = dojo.hitch(this, this.unfadeLayer);
		//this.upBtn.onclick = dojo.hitch(this, this.upLayer);
		//this.downBtn.onclick = dojo.hitch(this, this.downLayer);

		var title = this._getTitle();
		if(title) 
        	this.set("title", title);

		var metadata_url = this._getMetadata();
		if(metadata_url) {
			this.addControl( 
					"Metadata", 
					"sprite-control sprite-control-metadata", 
					null,
					metadata_url
				);
		}
    },

    _getTitle: function() {
        var mapSource = Application.getMapSource(this.path);
        return mapSource.titles[this.path];
    },
	_getMetadata: function() {
		var mapSource = Application.getMapSource(this.path);
		return mapSource.metadata[this.path];
	},

	hideLayer: function() {
		GeoMOOSE.changeLayerVisibility(this.path, false);
	},

	/* Note: so far these all operate on the entire map-source not the layer
	 *       so the controls are disabled in the template.  These should be
	 *       possible to implement at least for WMS services.
	 */ 
	fadeLayer: function() {
		GeoMOOSE.fadeLayer(this.path);
	},
	unfadeLayer: function() {
		GeoMOOSE.unfadeLayer(this.path);
	},
	upLayer: function() {
		GeoMOOSE.moveLayerUp(this.path);
	},
	downLayer: function() {
		GeoMOOSE.moveLayerDown(this.path);
	},
	onLayerChange: function(vis) {
		this.checkbox.set("checked", vis);
	}
});

