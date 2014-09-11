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
 * Class: GeoMOOSE.MapSource.MapServer
 * This converts a traditional MapServer request into a WMS Object.
 * Internally, it uses an OpenLayers.Layer.WMS type.
 *
 * Inherits from:
 *  GeoMOOSE.MapSource.WMS
 */

dojo.provide('GeoMOOSE.MapSource.MapServer');

dojo.require('GeoMOOSE.MapSource.WMS');

dojo.declare('GeoMOOSE.MapSource.MapServer', [GeoMOOSE.MapSource.WMS], {

	/**
	 * Method: preParseNode
	 * Override the default XML to support the MapServer format.
	 *
	 * Parameters:
	 *  mapbook_xml - XML fragment defining the MapSource
	 */

	preParseNode: function(mapbook_xml) {
		/* check for url listing */
		var urls = mapbook_xml.getElementsByTagName('url').length;

		/* get the parent doc */
		var doc = mapbook_xml.ownerDocument;

		/* if not URL listing use the default MapServer URL */
		if(urls == 0) {
			/* add the url node */
			var url_node = doc.createElement('url');
			url_node.appendChild(doc.createTextNode(CONFIGURATION.mapserver_url));
			mapbook_xml.appendChild(url_node);
		}

		/* Ah yes, the mapfile */
		var file = '';
		try {
			file = OpenLayers.Util.getXmlNodeValue(mapbook_xml.getElementsByTagName('file')[0]);
			if(file.substring(0,1) == '.') {
				file = CONFIGURATION.mapfile_root + file.substring(1);
			}
		} catch(e) {
			GeoMOOSE.warning('No file entry for mapserver-type mapsource: '+mapbook_xml.getAttribute('name'));
		}

		/* create a param entry */
		var param = doc.createElement('param');
		param.setAttribute('name', 'MAP');
		//param.appendChild(doc.createTextNode(file));
		param.setAttribute('value', file);
		mapbook_xml.appendChild(param);

		return mapbook_xml;
	}
});

GeoMOOSE.registerMapSourceType('mapserver', GeoMOOSE.MapSource.MapServer);
