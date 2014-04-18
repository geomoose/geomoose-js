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
 * Class: GeoMOOSE.MapSource.Vector.WFS
 * Supports a WFS Editable Layer.
 */

dojo.provide('GeoMOOSE.MapSource.Vector.WFS');

dojo.declare('GeoMOOSE.MapSource.Vector.WFS', [GeoMOOSE.MapSource.Vector], {
	canSave: true,

	_createOLLayer: function(options) {
		this._ol_layer_name = 'wfs'+GeoMOOSE.id();

		this.save_strategy = new OpenLayers.Strategy.Save();
		
		var strategies = [];
        if (this.fixed) {
            strategies.push(new OpenLayers.Strategy.Fixed());
        } else {
            strategies.push(new OpenLayers.Strategy.BBOX());
        }
		
		this._ol_layer = new OpenLayers.Layer.Vector(this._ol_layer_name, {
			strategies: strategies,
			projection: new OpenLayers.Projection(this.srsName),
			styleMap : this.style_map,
			visibility: false,
			protocol: new OpenLayers.Protocol.WFS({
				version: '1.1.0',
				srsName: this.srsName,
				url: this.url,
				featureNS: this.featureNS,
				featureType: this.featureType,
				geometryName: this.featureGeometryName,
				schema: this.featureSchema
			})
		});
	},    
	
	getUrl: function() {
        return this.url
    },

    setUrl: function(url) {
        this.url = url;
        this._ol_layer.protocol.url = this.url;
        this._ol_layer.protocol.options.url = this.url;
    },

    redraw: function(url) {
        this._ol_layer.refresh();
    },

	preParseNode: function(mapbook_xml) {
		var conversion_hash = {
			'featureNS' : 'feature-namespace',
			'featureType' : 'feature-type',
			'featureSchema' : 'schema',
			'featureGeometryName' : 'geometry-name'
		};

		var name = mapbook_xml.getAttribute('name');
		for(var name in conversion_hash) {
			var elements = mapbook_xml.getElementsByTagName(conversion_hash[name]);
			if(elements.length > 0) {
				this[name] = OpenLayers.Util.getXmlNodeValue(elements[0]); 
			} else {
				GeoMOOSE.warning('Missing "'+conversion_hash[name]+'" from "'+name+'", this may cause errors if trying to use this layer for editing.');
			}
		}

		this.srsName = mapbook_xml.getAttribute('srs');
		if(!GeoMOOSE.isDefined(this.srsName)) {
			this.srsName = CONFIGURATION.projection;
		}
		
		this.fixed = mapbook_xml.getAttribute('fixed');

		return mapbook_xml;
	},

	save: function() {
		if (this.save_strategy) {
            this.save_strategy.save();
		}
	}
});

GeoMOOSE.registerMapSourceType('wfs', GeoMOOSE.MapSource.Vector.WFS);

