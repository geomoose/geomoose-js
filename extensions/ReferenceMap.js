/*
Copyright (c) 2009-2014, Dan "Ducky" Little & GeoMOOSE.org

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
 * Class: ReferenceMap
 *
 * GeoMOOSE Reference Map 
 *
 * Given an image, some extent, and some other configuration parameters
 *  GeoMOOSE gets an image map, *above* the map!

 * Demo image generated using: 
 * http://localhost/mapserver/cgi-bin/mapserv?MAP=%2FUsers%2Fducky%2FProjects%2FGeoMOOSE%2Fgithub%2Fgeomoose%2Fmaps%2F%2Fdemo%2Fstatedata%2Fbasemap.map&FORMAT=image%2Fpng&TRANSPARENT=TRUE&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&LAYERS=county_borders&SRS=EPSG%3A3857&BBOX=-11205056.111008,5247860.2436133,-9458622.8889919,6461068.7563867&WIDTH=150&HEIGHT=150
 *
 */

ReferenceMap = new OpenLayers.Class(GeoMOOSE.UX.Extension, {

	/* bbox stored as minx, miny, maxx, maxy */
	bbox: [-11205056.111008, 4981247.88899195, -9458622.8889919, 6727681.11100805];

	init: function(map) {
		if(GeoMOOSE.isDefined(CONFIGURATION.reference_extent)) {
			this.bbox = CONFIGURATION.reference_extent;
		}
		var map_div = map.div;
		this.map = map;

		this.map.events.register('moveend', this, this.mapMoved);

		/* create a div for the reference map */
		this.div = document.createElement('div');
		this.div.className = 'ReferenceMap';
		map_div.appendChild(this.div);

		this.toggle = document.createElement('div');
		this.toggle.className = 'ToggleBox';
		this.div.appendChild(this.toggle);

		dojo.connect(this.toggle, 'click', dojo.hitch(this, this.toggleMap));

		var icon = document.createElement('i');
		icon.className = 'Icon';
		this.toggle.appendChild(icon);

		this.reference_box = document.createElement('div');
		this.reference_box.className = 'ReferenceBox';
		this.div.appendChild(this.reference_box);
	},

	mapMoved: function() {
		var mapext = this.map.getExtent().toArray();
		var bbox_w = this.bbox[2] - this.bbox[0];
		var bbox_h = this.bbox[3] - this.bbox[1];
		var x0 = (mapext[0] - this.bbox[0]) / bbox_w;
		var y0 = (mapext[1] - this.bbox[1]) / bbox_h;
		var x1 = (mapext[2] - this.bbox[0]) / bbox_w;
		var y1 = (mapext[3] - this.bbox[1]) / bbox_h;

		var pos = dojo.position(this.div);


		console.log('Map moved', map_extent, this.reference_box); 
	},

	toggleMap: function() {
		dojo.toggleClass(this.div, 'Closed');
	},

	load: function() {
		/* load reference map style into the document */
		var head = document.getElementsByTagName('head')[0];
		//<link type="text/css" rel="stylesheet" href="css/common.css"/>
		var link = document.createElement('link');
		link.setAttribute('type', 'text/css');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', 'extensions/ReferenceMap.css');
		head.appendChild(link);

		GeoMOOSE.register('onMapCreated', this, this.init);
	},
	
	CLASS_NAME: "ReferenceMap"
});

GeoMOOSE.UX.register('ReferenceMap');

