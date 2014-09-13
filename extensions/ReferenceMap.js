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
	bbox: [-11205056.111008,5247860.2436133,-9458622.8889919,6461068.7563867],

	init: function(map) {
		if(GeoMOOSE.isDefined(CONFIGURATION.reference_extent)) {
			this.bbox = CONFIGURATION.reference_extent;
		}
		var start_closed = 'Closed';
		if(GeoMOOSE.isDefined(CONFIGURATION.reference_open) && CONFIGURATION.reference_open) {
			start_closed = '';
		}
		var map_div = map.div;
		this.map = map;


		/* create a div for the reference map */
		this.div = document.createElement('div');
		this.div.className = 'ReferenceMap '+start_closed;
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

		dojo.connect(this.reference_box, 'mousedown', dojo.hitch(this, this.pickUp));

		this.map.events.register('moveend', this, this.mapMoved);
	},

	mapMoved: function() {
		var mapext = this.map.getExtent().toArray();
		var bbox_w = this.bbox[2] - this.bbox[0];
		var bbox_h = this.bbox[3] - this.bbox[1];

		var x0 = (mapext[0] - this.bbox[0]) / bbox_w;
		var y0 = (this.bbox[3] - mapext[1]) / bbox_h;
		var x1 = (mapext[2] - this.bbox[0]) / bbox_w;
		var y1 = (this.bbox[3] - mapext[3]) / bbox_h;

		var pos = dojo.position(dojo.query('.ReferenceMap')[0]);

		var left = x0 * pos.w;
		var bottom = y0 * pos.h;
		var right = x1 * pos.w;
		var top = y1 * pos.h;

		var width = right - left;
		var height = Math.abs(bottom - top);

		if(width < 1) { width = 1; }
		if(height < 1) { height = 1; }

		this.reference_box.style.left = left+'px';
		this.reference_box.style.top = top+'px';
		this.reference_box.style.width = width+'px';
		this.reference_box.style.height = height+'px';
	},

	pickUp: function(evt) {
		var mouse_offset = dojo.position(this.reference_box, true);
		mouse_offset.x -= evt.clientX;
		mouse_offset.y -= evt.clientY;
		this.offset = dojo.position(this.div, true);
		this.offset.x -= mouse_offset.x;
		this.offset.y -= mouse_offset.y;

		this._mv_handle = dojo.connect(document, 'mousemove', dojo.hitch(this, this.boxMove));
		this._up_handle = dojo.connect(document, 'mouseup', dojo.hitch(this, this.dropBox));
	},

	boxMove: function(evt) {
		this.reference_box.style.left = (evt.clientX - this.offset.x)+'px';
		this.reference_box.style.top = (evt.clientY - this.offset.y)+'px';
	},

	dropBox: function() {
		if(this._mv_handle) {
			dojo.disconnect(this._mv_handle);
			dojo.disconnect(this._up_handle);
			this._mv_handle = null;
			this._up_handle = null;
		}

		var ref_pos = dojo.position(this.reference_box);
		var pos = dojo.position(this.div);
		ref_pos.x -= pos.x;
		ref_pos.y -= pos.y;
		var px0 = (ref_pos.x + ref_pos.w / 2.0) / pos.w;
		var py0 = (ref_pos.y + ref_pos.h / 2.0) / pos.h;

		var lat = this.bbox[0] + (this.bbox[2] - this.bbox[0]) * px0;
		var lon = this.bbox[3] - (this.bbox[3] - this.bbox[1]) * py0;

		this.map.setCenter(new OpenLayers.LonLat([lat, lon]));
	},

	toggleMap: function() {
		dojo.toggleClass(this.div, 'Closed');
		this.mapMoved();
	},

	load: function() {
		/* load reference map style into the document */
		var head = document.getElementsByTagName('head')[0];
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

