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
 * Class: GeoMOOSE.MapSource.Vector.GeoJSON
 * Supports rendering a GeoJSON url.
 */

dojo.provide('GeoMOOSE.MapSource.Vector.GeoJSON');

dojo.declare('GeoMOOSE.MapSource.Vector.GeoJSON', [GeoMOOSE.MapSource.Vector], {
	canSave: false,

	_createOLLayer: function(options) {
		// this could be inadvisable and/or there may be a need 
		//  to pull new features as the user navigates.  However, this could also
		//  be used to pull down a static file from a local source and render it.
		//  in the default case, this is being used to download a GeoJSON file from
		//  the cache and render it in a new layer for highlighting and interaction.
		var strategies = [new OpenLayers.Strategy.Fixed()];

		this._format = new OpenLayers.Format.GeoJSON();

		this._ol_layer = new OpenLayers.Layer.Vector(this.title, {
			strategies: strategies,
			projection: new OpenLayers.Projection('EPSG:4326'), 
			styleMap : this.style_map,
			visibility: false,
			protocol: new OpenLayers.Protocol.HTTP({
				url: this.url,
				format: this._format
			})
		});
	},

	setUrl: function(url) {
		// update the layer definition with the new URL.
		this._ol_layer.protocol = new OpenLayers.Protocol.HTTP({
			url: url,
			format: this._format
		});
		// force the redrawing of the layer.
		this._ol_layer.refresh({force: true});
	},

	preParseNode: function(mapbook_xml) {
		return mapbook_xml;
	},

	save: function() {
		this.save_strategy.save();
	}
});

GeoMOOSE.registerMapSourceType('geojson', GeoMOOSE.MapSource.Vector.GeoJSON);

