dojo.require("GeoMOOSE.Tab.Catalog.LayerControl");
dojo.provide("extensions.VisibleLayers.RemoveLayerControl");

dojo.declare("extensions.VisibleLayers.RemoveLayerControl", [GeoMOOSE.Tab.Catalog.LayerControl], {
	classes: ['sprite-control-fade'],

	tip: '"Remove ${layer} from the Visible Layers List."',

	draw: function(parent) {
		this.inherited(arguments);

		var control = dojo.byId(this.control_id);
		dojo.style(control, {
			'backgroundImage' : 'url("images/close.png")',
			'backgroundPosition' : 'bottom left'
		});
	},

	onClick: function() {
		GeoMOOSE.turnLayerOff(this.layer.pathsAsArray());
		dojo.publish('visible-layers-remove', [this.layer.src]);
	}
});

CONFIGURATION.layer_controls['remove-layer'] = {'on' : false};
CONFIGURATION.layer_control_order.unshift('remove-layer');

GeoMOOSE._registerLayerControl('remove-layer', extensions.VisibleLayers.RemoveLayerControl);

