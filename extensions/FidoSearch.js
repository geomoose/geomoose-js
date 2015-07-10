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

/** Fido Searching utility. Creates a small client-side search box from the
 *   data provided by fido.php.
 *  
 */
dojo.require("dijit.form.FilteringSelect");
dojo.require('dijit.layout.ContentPane');
dojo.require('dojo.store.Memory');
dojo.require('dojo.data.ObjectStore');

dojo.provide("extensions.FidoSearch");

dojo.declare('FidoPane', [dijit.layout.ContentPane], {
	postCreate: function() {
		this.inherited(arguments);


		// this is a little ugly, but the data and the UI
		//  need to be ready for the FilteringSelect to work properly.
		dojo.xhrGet({
			// TODO: Make this a configuration option.
			url: 'php/fido.php', 
			handleAs: 'json'
		}).then(dojo.hitch(this, function(res) {
			// create a content holder
			var p = dojo.create('div', {});
			this.set('content', p);

			var search_line = dojo.create('div', {}, p);
			dojo.style(search_line, {'padding' : '.5em', 'textAlign' : 'center'});

			// Dojo likes the elements to have an id which can be
			//  referenced.  This creates a synthetic ID.
			for(var i = 0, len = res.length; i < len; i++) {
				res[i].id = 'id'+i;
			}

			// establish the in-memory database
			this.store = new dojo.store.Memory({data: res});


			// create the new search box.
			var search_box = dojo.create('div', {}, search_line);
			dojo.style(search_box, {
				width: '100%',
				fontSize: '1.25em'
			});
			this.filter_box = new dijit.form.FilteringSelect({
				id: 'FidoSearch',
				// convert new-style data store to old style for 
				//  the list.
				store: new dojo.data.ObjectStore({objectStore: this.store}),
				name: 'placename',
				value: '',
				searchAttr: 'label',
				maxHeight: 160,
				required: false,
				placeHolder: 'Start typing to search'
			}, search_box);

			dojo.addClass(this.filter_box.domNode, ['zoomto_select']);

			// have the UI update its size based on the new elements
			dijit.byId('control-panel').resize();

			// connect to the change event.
			dojo.connect(this.filter_box, 'onChange', dojo.hitch(this, this.zoomTo));
		}));	

	},

	/** Zoom to an area, reset the search box as appropriate.
	 */
	zoomTo: function(id) {
		if(id) {
			// get the original object from the memory-store
			var obj = this.store.get(id);
			var ext = obj.extent;
			// zoom to the extent
			GeoMOOSE.zoomToExtent(ext[0], ext[1], ext[2], ext[3], 'EPSG:4326');
			// reset the search
			this.filter_box.set('value', '');
		}
	}
});

dojo.declare('FidoSearch', null, {
	// Executed when GeoMOOSE is starting after UI loaded, before Mapbook loaded.
	load: function() {
		GeoMOOSE.register('onMapbookLoaded', this, this.populateSearchBox);
	},

	populateSearchBox: function() {
		console.log('populate search box');

		var control_panel = dijit.byId('control-panel');
		/* Add the zoom to to the control panel */
		control_panel.addChild(new FidoPane({
			'region' : 'top'
		}));
		/* update the size of the control panel after dynamically adding a bunch of stuff. */
		control_panel.resize(); 

	}
});

GeoMOOSE.UX.register('FidoSearch');
