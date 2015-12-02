/** Renders the results of the query as an interactive grid.
 */

dojo.require('dojo.store.Memory');
dojo.require('dojo.data.ItemFileWriteStore');
dojo.require('dojo.data.ObjectStore');
dojo.require('dojox.grid.DataGrid');

DataGridExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	load: function() {
		var self = this;

		// Install the required CSS for datagrid.
		var head = document.getElementsByTagName('head')[0];
		var style_urls = [
			'libs/dojo/dojox/grid/resources/Grid.css',
			'libs/dojo/dojox/grid/resources/tundraGrid.css'
		];

		for(var i = 0 ; i < style_urls.length; i++) {
			//<link type="text/css" rel="stylesheet" href="css/user_tools.css"/>
			var link = document.createElement('link');
			link.setAttribute('type', 'text/css');
			link.setAttribute('rel', 'stylesheet');
			link.setAttribute('href', style_urls[i]);
			head.appendChild(link);
		}

		//this.data = new dojo.data.ObjectStore({objectStore: this.dataStore});
		GeoMOOSE.register('onMapbookLoaded', this, this.startup);
	},


	/** Tracking time. */
	lastUpdate: 0,

	/** Update interval time. Every half-second. */
	updateInterval: 500,

	/** The current update interval */
	interval: null,

	gridStructure: null,

	/** Delayed update when lists are changed.
	 */
	updateGrid: function() {
		var now = (new Date()).getTime();
		// check to see if an update is appropriate
		if(now - this.lastUpdate > this.updateInterval) {
			// clear out the repeating inveral
			clearInterval(this.interval);
			this.interval = null;

			// get the count
			var n_elements = 0;
			function showCount(size, req) {
				n_elements = size;
			}
			this.objectStore.fetch({query: {}, onBegin: showCount, start: 0, count: 0});

			if(n_elements == 0) {
				// clear out the data grid if it exists.
			} else {
				if(this.dataGrid == null) {
					this.dataGrid = new dojox.grid.DataGrid({
						region: 'bottom',
						gutters: false,
						splitter: true,
						liveSplitters: false,
						style: "height: 125px",
						store: this.objectStore,
						query: {id: '*' },
						structure: this.gridStructure
					});

					var middle = dijit.byId('middle');
					middle.addChild(this.dataGrid);
					this.dataGrid.startup();
					middle.resize();
				}

				this.dataGrid.setQuery({id: '*'});
			}
		} 
	},

	triggerUpdate: function() {
		this.lastUpdate = (new Date()).getTime();
		if(this.interval == null) {
			this.interval = setInterval(dojo.hitch(this, this.updateGrid), 400);
		}
	},

	startup: function() {
		var target_layer = 'vector_highlight';
		// NOTE: This is a bit hacky, whenever possible directly interacting
		//       with an OpenLayers class should be avoided.  That said, I needed
		//       to access the events object.
		var ol_layer = Application.getMapSource(target_layer)._ol_layer;

		this.memoryStore = new dojo.store.Memory({data: []});
		this.objectStore = new dojo.data.ObjectStore({objectStore: this.memoryStore}); 


		// this will bridge the gap between the openlayers events/features
		//  and the Dojo dataStore object.
		ol_layer.events.register('featureadded', this, function(evt) {
			var obj = evt.feature.attributes;
			// bridge the ID from OpenLayers
			obj['id'] = evt.feature.id;
			this.memoryStore.add(obj, {});
			// check for a structure update
			if(this.gridStructure == null) {
				var structure = [];
				for(var attr in evt.feature.attributes) {
					structure.push({
						name: attr, field: attr, width: 8
					});
				}
				this.gridStructure = structure;
			}
			this.triggerUpdate();
		});

		ol_layer.events.register('featureremoved', this, function(evt) {
			this.memoryStore.remove(evt.feature.id);
			this.triggerUpdate();
		});


	}
});


GeoMOOSE.UX.register("DataGridExtension");


