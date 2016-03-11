/** Renders the results of the query as an interactive grid.
 */

dojo.require('dojo.store.Memory');
dojo.require('dojo.data.ItemFileWriteStore');
dojo.require('dojo.data.ObjectStore');
dojo.require('dojox.grid.DataGrid');
dojo.require("dojox.grid._CheckBoxSelector")
dojo.require('dijit.Toolbar');
dojo.require('dijit.layout.BorderContainer');

dojo.provide("extensions.ResultsAsGrid");
dojo.declare("ResultsAsGrid", null, {
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

	conf: {
		targetLayer: 'vector_highlight'
	},


	/** Tracking time. */
	lastUpdate: 0,

	/** Update interval time. Every half-second. */
	updateInterval: 500,

	/** The current update interval */
	interval: null,

	gridStructure: null,


	/** This is a demo function that collects all of the selected rows and
	 *  displays the list of PIN numbers in a dialog.  This can serve
	 *  as a starting point for a service that may print mailing labels, 
	 *  report on the parcels, all sorts of fun options.
	 */

	demoListParcels: function() {
		var pins = [];
		var items = this.dataGrid.selection.getSelected();
		for(var i = 0, ii = items.length; i < ii; i++) {
			var pin = this.objectStore.getValue(items[i], "PIN");
			pins.push(pin);
		}


		alert('You have selected the following PINs: '+pins.join(', '));
	},


	/** Render the toolbar, override with custom code when you need a toolbar.
	 */
	renderToolbar: function(layout) {
		// add the toolbar to the layout containing the grid.
		var toolbar = new dijit.Toolbar({region: 'top'});
		layout.addChild(toolbar);
		toolbar.startup();

		var list_button = new dijit.form.Button({
			label: "List Parcels",
			iconClass: "dijitEditorIcon dijitEditorIconInsertTable",
			onClick: dojo.hitch(this, this.demoListParcels)
		});
		toolbar.addChild(list_button);
		toolbar.startup();
	},


	highlightFeatures: [],

	clearHighlightFeatures: function() {
		while(this.highlightFeatures.length > 0) {
			var f = this.highlightFeatures.pop();
			f.style = null;
		}
	},

	/** Highlight the feature when the mouse if over the row.
	 */
	mouseOver: function(e) {
		var row = e.rowIndex;
		var item = this.dataGrid.getItem(row);

		//this.clearHighlightFeatures();

		if(item) {
			var ol_layer = Application.getMapSource(this.conf.targetLayer)._ol_layer;
			var f = ol_layer.getFeatureById(item.id);
			f.style =  {
				strokeColor: 'red',
				strokeOpacity: 1.0,
				fillColor: 'red',
				fillOpacity: 0.8
			};

			this.highlightFeatures.push(f);

			ol_layer.redraw();
		}
	},

	/** Clear all 'highlighting' when the mouse leaves the grid.
	 */
	mouseOut: function(e) {
		this.clearHighlightFeatures();
		var ol_layer = Application.getMapSource(this.conf.targetLayer)._ol_layer;
		ol_layer.redraw();

	},

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
					var dg_layout = new dijit.layout.BorderContainer({
						region: 'bottom', gutters: false,
						splitter: true, liveSplitters: false,
						style: "height: 30%" //125px"
					});

					var middle = dijit.byId('middle');
					middle.addChild(dg_layout);

					this.renderToolbar(dg_layout);

					this.dataGrid = new dojox.grid.DataGrid({
						region: 'center',
						store: this.objectStore,
						query: {id: '*' },
						structure: this.gridStructure
					});

					dojo.connect(this.dataGrid, 'onMouseOver', this, this.mouseOver);
					dojo.connect(this.dataGrid, 'onMouseOut', this, this.mouseOut);


					//var middle = dijit.byId('middle');
					dg_layout.addChild(this.dataGrid);
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
		// NOTE: This is a bit hacky, whenever possible directly interacting
		//       with an OpenLayers class should be avoided.  That said, I needed
		//       to access the events object.
		var ol_layer = Application.getMapSource(this.conf.targetLayer)._ol_layer;

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
				var view = [
					new dojox.grid.cells.RowIndex({ width: "20px" })
				];

				for(var attr in evt.feature.attributes) {
					view.push({
						name: attr, field: attr, width: 8
					});
				}


				var structure = [{
					type: "dojox.grid._CheckBoxSelector"
				}, view];
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


GeoMOOSE.UX.register("ResultsAsGrid");


