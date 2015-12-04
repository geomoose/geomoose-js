/*
Copyright (c) 2009-2015, Dan "Ducky" Little & GeoMOOSE.org

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

/** HashTrack
 *
 *  Continuously update the hash tag in the URL to match the location of 
 *  the map.  On startup, change the default extents to the stored location.
 *
 */
HashTrack = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	map: null,  // reference to OpenLayers.Map
	newHash: null, // the last thing we set the hash to.

	/**
	 * Method: parseHashTag
	 * Parses the hash tag from the URL and updates the map state to match
	 * the parameters.
	 * 
	 * Parameters:
	 *  Parsed from window.location.hash:
	 *    xy=[center x coordinate],[center y coordinate],[zoom level]
	 *    l=[layer path],[layer path],...
	 */
	parseHashTag: function() {
		//console.log("HashTrack: parseHashTag called");

		// Avoid event loop where parseHashTag gets called as a result of updateHash
		// setting window.location.hash thus causing a mapmove/layerchange...
		if( this.newHash === window.location.hash ) {
			//console.log("HashTrack: parseHashTag found no changes, exiting.");
			return;
		}

		var args = dojo.queryToObject(''+window.location.hash.substring(1));

		if(args.xy) {
			var split = args.xy.split(',');

			var center = new OpenLayers.LonLat();
			center.lat = parseFloat(split[0]);
			center.lon = parseFloat(split[1]);
			var zoomLevel = parseFloat(split[2])

			if(this.map) {
				// this.map hould always be defined by the time this is called, but just to be safe.
				this.map.setCenter(center, zoomLevel);
			} else {
				//console.log("HashTrack: Warning: parseHashTag called before Map is ready.");
			}
		}
		if(args.on) {
			var layers = args.on.split(';');

			//console.log("HashTrack: parseHashTag found on layers: ", layers);
			dojo.forEach(layers, function(val, idx) {
				//console.log("HashTrack: parseHashTag turning on layer: " + val);
				GeoMOOSE.turnLayerOn(val);
			});
		}
		if(args.off) {
			var layers = args.off.split(';');

			//console.log("HashTrack: parseHashTag found off layers: ", layers);
			dojo.forEach(layers, function(val, idx) {
				//console.log("HashTrack: parseHashTag turning off layer: " + val);
				GeoMOOSE.turnLayerOff(val);
			});
		}
	},

	/**
	 * Method: updateHash
	 * Updates the hash parameters based on changes to the map state.
	 * 
	 * Parameters: none
         * Side effects: Updates window.location.hash
	 */
	updateHash: function() {
		//console.log("HashTrack: updateHash called");

		var center = Map.getCenter();
		var zoom = Map.getZoom();
		var position = center.lat + ',' + center.lon + ',' + zoom;

		this.newHash = '#xy='+position;

		var layer_changes = Application.getStatusDifferences();
		if(layer_changes['on'].length > 0) {
			this.newHash += '&on=' + layer_changes['on'].join(';');
		}
		if(layer_changes['off'].length > 0) {
			this.newHash += '&off=' + layer_changes['off'].join(';');
		}

		// Don't update if no change.
		if(window.location.hash !== this.newHash) {
			//console.log("HashTrack: updateHash updating hash");
			//console.log("Old: " + window.location.hash);
			//console.log("New: " + this.newHash);
			window.location.hash = this.newHash; // this causes a hashchange event
		}
	},

	/**
	 * Method: load
	 * Called once when module is registered. Registers methods with GeoMOOSE events. 
         */
	load: function() {
		// Save the map (Don't assume window.Map).
		GeoMOOSE.register('onMapCreated', this, function(map) {
			this.map = map;
		});

		// Wait until mapbook is ready before moving map or messing with layers.
		GeoMOOSE.register('onMapbookLoaded', this, function() {
			// Make sure we parse the hash tag before we allow updates to the hash tag.
			// Otherwise we can loose the initial passed in value.
			this.parseHashTag();

			this.map.events.register('moveend', this, this.updateHash);
			dojo.connect(Application, 'onLayersChange', dojo.hitch(this, this.updateHash));
			dojo.connect(window, 'hashchange', dojo.hitch(this, this.parseHashTag));
		});
	},

	CLASS_NAME: "HashTrack"
});

GeoMOOSE.UX.register('HashTrack');
