dojo.require("extensions.VisibleLayers.tab");
dojo.require("extensions.VisibleLayers.RemoveLayerControl");

dojo.provide("extensions.VisibleLayers");
dojo.declare('VisibleLayers', null, {
	// Executed when GeoMOOSE is starting after UI loaded, before Mapbook loaded.
	load: function() {
		var tab = new extensions.VisibleLayers.tab();
		GeoMOOSE.addTab('visible_layers_tab', tab);
	}
});

GeoMOOSE.UX.register('VisibleLayers');
