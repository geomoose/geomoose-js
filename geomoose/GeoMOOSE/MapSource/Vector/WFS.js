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
		var strategies = [new OpenLayers.Strategy.BBOX()];
		if(this.canSave) {
			// Set the layer to save without using the save button,
			//  refs: #117
			this.save_strategy = new OpenLayers.Strategy.Save({auto: true});
			strategies.push(this.save_strategy);
		}
		if(this.clusteringEnabled) {
			strategies.push(new OpenLayers.Strategy.Cluster());
		}
		this._ol_layer = new OpenLayers.Layer.Vector(this.title, {
			strategies: strategies,
			projection: this.srsName,
			styleMap : this.style_map,
			visibility: false,
			protocol: new OpenLayers.Protocol.WFS({
				version: '1.1.0',
				srsName: this.srsName,
				url: this.url,
				filter: this.filter,
				featureNS: this.featureNS,
				featurePrefix: this.featurePrefix,
				featureType: this.featureType,
				geometryName: this.featureGeometryName,
				schema: this.featureSchema
			})
		});
	},

	preParseNode: function(mapbook_xml) {
		var conversion_hash = {
			'featureNS' : 'feature-namespace',
			'featurePrefix' : 'feature-prefix',
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


		return mapbook_xml;
	},

	constructor: function(mapbook_xml) {
		// set the filter default
		this.filter = null;
		// check the XML for a filter.
		var filters = mapbook_xml.getElementsByTagName('filter');
		if(filters.length > 0) {
			// this only honours the first filter.
			var filter = filters[0];
			// and that filter needs to be a CQL filter.
			if(filter.getAttribute('type') == 'cql') {
				this.updateFilter(OpenLayers.Util.getXmlNodeValue(filter));
			}
		}
	},

	save: function() {
		this.save_strategy.save();
	},

	/** Implement CQL Filting for WFS Layers
	 *
	 */

	updateFilter: function(filterText) {
		var filter = new OpenLayers.Filter.Logical();
		var format_CQL = new OpenLayers.Format.CQL();
		try {
			filter = format_CQL.read(filterText);
		} catch (err) {
			//GeoMOOSE.error('OpenLayers CQL parser is unable to parse:'+filter_text);
		}
		if(filter) {
			this.filter = filter;
			this._ol_layer.filter = this.filter;
			this._ol_layer.redraw({force: true});
			this._ol_layer.refresh({force: true});
		}
	}
});

GeoMOOSE.registerMapSourceType('wfs', GeoMOOSE.MapSource.Vector.WFS);

