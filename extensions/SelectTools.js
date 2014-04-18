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

/* Tools to manipulate returned features.  Can be used on WFS layers only. */

dojo.require('dojox.grid.DataGrid');
dojo.require('dojo.data.ItemFileWriteStore');

var selectToolsInside;

SelectToolsExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	startup: function() {		
		var node = window.document.createElement("link");				
		node.type = "text/css";
		node.rel = "stylesheet";
		node.href = "build/dojox/grid/resources/tundraGrid.css";
		node.title = "build/dojox/grid/resources/tundraGrid.css";
		dojo.query("head")[0].appendChild(node);
		
		var lyrPoint = Application.mapSources['highlightPoint']._ol_layer;
		var lyrLine = Application.mapSources['highlightLine']._ol_layer;
		var lyrPoly = Application.mapSources['highlightPoly']._ol_layer;
		this.selectToolPoint = new OpenLayers.Control.SelectFeature(lyrPoint);
		this.selectToolLine = new OpenLayers.Control.SelectFeature(lyrLine);
		this.selectToolPoly = new OpenLayers.Control.SelectFeature(lyrPoly);
		this.a = 1;
		
		dojo.connect(this.selectToolPoint.layer, 'onFeatureInsert', function() {
			GeoMOOSE.count = 0;
			setTimeout(function() { //Hack to only zoom once.
				GeoMOOSE.count++;
				if (GeoMOOSE.count == 1) {
					GeoMOOSE.zoomToHighlight();
				}
			}, 500);
		});
		dojo.connect(this.selectToolLine.layer, 'onFeatureInsert', function() {
			GeoMOOSE.count = 0;
			setTimeout(function() {
				GeoMOOSE.count++;
				if (GeoMOOSE.count == 1) {
					GeoMOOSE.zoomToHighlight();
				}
			}, 500);
		});
		dojo.connect(this.selectToolPoly.layer, 'onFeatureInsert', function() {
			GeoMOOSE.count = 0;
			setTimeout(function() {
				GeoMOOSE.count++;
				if (GeoMOOSE.count == 1) {
					GeoMOOSE.zoomToHighlight();
				}
			}, 500);
		});
		
		var self = this;
		selectToolsInside = this;
			
		GeoMOOSE.selectFeature = function(id) {
			var selectTool = self.getActiveLayer(id.split(".")[0]);
			var feat = selectTool.layer.getFeaturesByAttribute('geomoose_id', id.split(".")[1])[0];
			selectTool.unselectAll();
			selectTool.select(feat);
		};
		
		GeoMOOSE.zoomToHighlight = function() {
			var featuresPoint = self.selectToolPoint.layer.features;
			var featuresLine = self.selectToolLine.layer.features;
			var featuresPoly = self.selectToolPoly.layer.features;
			var bounds = new OpenLayers.Bounds();
			for(var i = 0; i < featuresPoint.length; i++) {
				bounds.extend(featuresPoint[i].geometry.getBounds());
			}
			for(var i = 0; i < featuresLine.length; i++) {
				bounds.extend(featuresLine[i].bounds);
			}
			for(var i = 0; i < featuresPoly.length; i++) {
				bounds.extend(featuresPoly[i].geometry.getBounds());
			}
			
			if (bounds.left != null) { //Don't zoom in to nothing
				Map.zoomToExtent(bounds);
			}
			if (featuresPoint.length == 1 && featuresLine.length == 0 && featuresPoly.length == 0) { // If a single point zoom out more
				Map.zoomOut();
				Map.zoomOut();
				Map.zoomOut();
			}
			
			if (self.a == 1) {
				for(var tab in GeoMOOSE._tabs) {
					dojo.connect(GeoMOOSE._tabs[tab], "onClose", function(){
						GeoMOOSE.turnLayerOff('highlightPoint');
						GeoMOOSE.turnLayerOff('highlightLine');
						GeoMOOSE.turnLayerOff('highlightPoly');
						GeoMOOSE.turnLayerOff('highlightSelect');
						GeoMOOSE.turnLayerOff('highlight/highlight');
						GeoMOOSE.hideParcelDataTable();
					});
				}
				self.a = 2;
				var b = self;
				setTimeout(function(){b.a=1;},5000);
			}
		};
		
		GeoMOOSE.zoomToFeature = function(id) {
			var selectTool = self.getActiveLayer(id.split(".")[0]);
			Map.zoomToExtent(selectTool.layer.getFeaturesByAttribute('geomoose_id', id.split(".")[1])[0].bounds);
		};
		
		GeoMOOSE.getFeature = function(id) {
			var selectTool = self.getActiveLayer(id.split(".")[0]);
			var feat = selectTool.layer.getFeaturesByAttribute('geomoose_id', id.split(".")[1])[0];
			return feat.geometry;
		};
		
		GeoMOOSE.removeFeature = function(id) {
			var selectTool = self.getActiveLayer(id.split(".")[0]);
			var layer = selectTool.layer;
			layer.removeFeatures(layer.getFeaturesByAttribute('geomoose_id', id.split(".")[1])[0]);
			if (dojo.byId("div_" + id.split(".")[1])) {
				dojo.destroy("div_" + id.split(".")[1]);
				dojo.byId("numShapes").innerHTML = (dojo.byId("numShapes").innerHTML - 1);
			}
			if (dijit.byId("datagrid")) {
				dijit.byId("datagrid").store.fetch({
					query:{geomoose_id: id.split(".")[1]}, 
					onComplete: function (items) { 
						if (items[0]) {
							dijit.byId("datagrid").store.deleteItem(items[0]);
						} else {
							dijit.byId("datagrid").render();
						}
					}
				});
			}
		};
		
		GeoMOOSE.hideParcelDataTable = function() {
			if(dijit.byId("datagridDisplay")) {
				dijit.byId("datagrid").destroy();
				dijit.byId("datagridDisplay").destroy();
				dijit.byId("datagridDisplay_splitter").destroy();
				dojo.style("footer", "display", "");
				dijit.byId("main").resize();
				if (dojo.byId("parcel_holder")) {
					dojo.forEach(dojo.byId("parcel_holder").children, function(child) {
						dojo.style(child, "border", "none");
					});
					if (dojo.byId("table-icon")) {
						dojo.byId("table-icon").src = "images/toolbar/table-add.png";
					}
				}
			}
		};
		
		GeoMOOSE.printInfoDiv = function(strid) {
			var prtContent = dojo.byId(strid);
			var WinPrint = window.open('','','letf=0,top=0,width=1,height=1,toolbar=0,scrollbars=0,status=0');
			WinPrint.document.write(prtContent.innerHTML);
			WinPrint.document.close();
			WinPrint.focus();
			WinPrint.print();
			WinPrint.close();
		};
		
		GeoMOOSE.highlightItem = function(obj) {
			var lyrname;
			switch (obj.geo) {
				case "OpenLayers.Geometry.Polygon":
				case "OpenLayers.Geometry.MultiPolygon":
				case "OpenLayers.Geometry.Rectangle":
					lyrname = "selectedPoly";
					break;
				case "OpenLayers.Geometry.LineString":
				case "OpenLayers.Geometry.MultiLineString":
					lyrname = "selectedLine";
					break;
				case "OpenLayers.Geometry.Point":
				case "OpenLayers.Geometry.MultiPoint":
					lyrname = "selectedPoint";
					break;
			}
			GeoMOOSE.selectFeature(lyrname + "." + obj.id);
			dojo.forEach(dojo.byId("parcel_holder").children, function(child) {
				dojo.style(child, "border", "none");
			});
			dojo.style(dojo.byId("div_" + obj.id), "border", "5px solid orange");
			dojo.window.scrollIntoView("div_" + obj.id);
		};
		
		GeoMOOSE.removeItem = function(obj) {
			switch (obj.geo) {
				case "OpenLayers.Geometry.Polygon":
				case "OpenLayers.Geometry.MultiPolygon":
				case "OpenLayers.Geometry.Rectangle":
					GeoMOOSE.removeFeature("selectedPoly." + obj.id);
					break;
				case "OpenLayers.Geometry.LineString":
				case "OpenLayers.Geometry.MultiLineString":
					GeoMOOSE.removeFeature("selectedLine." + obj.id);
					break;
				case "OpenLayers.Geometry.Point":
				case "OpenLayers.Geometry.MultiPoint":
					GeoMOOSE.removeFeature("selectedPoint." + obj.id);
					break;
			}
		};
		
		GeoMOOSE.resultsToService = function (lyr, column) {
			var parcelId = {};
			var features = Application.mapSources[lyr]._ol_layer.features;
			dojo.forEach(features, function(feat, i) {
				var ftjs = dojo.fromJson(feat.attributes.attributes);
				parcelId[i] = ftjs[column];
			});
			return dojo.toJson(parcelId);
		};
		
		GeoMOOSE.showParcelDataTable = function() {
			if (dojo.byId("footer").style.display == "none") {
				GeoMOOSE.hideParcelDataTable();
				return;
			}
			var featuresPoint = self.selectToolPoint.layer.features;
			var featuresLine = self.selectToolLine.layer.features;
			var featuresPoly = self.selectToolPoly.layer.features;
			var features = featuresPoint.concat(featuresLine).concat(featuresPoly);
			if (features.length == 0) {
				return;
			}
				
			var data = {
				identifier: "geomoose_id",
				items: []
			};
				
			var layout = [];
			var layoutInside = [];
			for(var i = 0; i < features.length; i++) {
				var item = {};
				var json = dojo.fromJson(features[i].attributes["attributes"]);
				item["geomoose_id"] = features[i].attributes["geomoose_id"];
				item["geomoose_geotype"] = features[i].geometry.CLASS_NAME;
				if (i == 0) {
					layoutInside.push({'name': 'geomoose_id', 'field': 'geomoose_id', 'hidden':true});
					layoutInside.push({'name': 'geomoose_geotype', 'field': 'geomoose_geotype', 'hidden':true});
				}
				if (CONFIGURATION.table_results.length > 0 && i == 0) {
					dojo.forEach(CONFIGURATION.table_results, function(res) {
						for(var j in json) { 
							if (res.name == j && res.layer == GeoMOOSE.tableLayer) {
								if (res.width) {
									layoutInside.push({'name': res.alias, 'field': j, 'width':res.width});
								} else {
									layoutInside.push({'name': res.alias, 'field': j, 'width':'auto'});
								}
							}
						}
					});
				} else if (i == 0) {
					for(var j in json) { 
						layoutInside.push({'name': j, 'field': j, 'width':'auto'});
					}				
				}
				for(var j in json) { 
					item[j] = json[j];
				}
				data.items.push(item);
			}
			layout.push(layoutInside);
			var store = new dojo.data.ItemFileWriteStore({data: data});
					
			var main = dijit.byId("main");
			
			main.addChild(new dijit.layout.ContentPane({
				id: "datagridDisplay",
				region: "bottom",
				splitter: true,
				gutters: false,
				style: "height:250px;bottom:0;left:0;position:absolute;width:100%;font-size:18px;"
			}));
			
			var grid = new dojox.grid.DataGrid({
				id: "datagrid",
				store: store,
				structure: layout,
				escapeHTMLInData: false,
                onRowClick: function(e) {
                    var item = this.getItem(e.rowIndex);
					var json = {"geo": this.store.getValue(item, "geomoose_geotype"), "id": this.store.getValue(item, "geomoose_id")};
					GeoMOOSE.highlightItem(json);
                }
			}).placeAt(dijit.byId("datagridDisplay").domNode);
			grid.startup();
			
			dojo.style("footer", "display", "none");
			dijit.byId("main").resize();
			if (dojo.byId("table-icon")) {
				dojo.byId("table-icon").src = "images/toolbar/table-close.png";
			}
		};
	},
	
	getActiveLayer: function(name) {
		if (name == "selectedPoint") {
			return this.selectToolPoint;
		} else if (name == "selectedLine") {
			return this.selectToolLine;
		} else {
			return this.selectToolPoly;
		}
	},

	load: function() {
		GeoMOOSE.register('onMapbookLoaded', this, this.startup);
	},

	CLASS_NAME: "SelectToolsExtension"
});

GeoMOOSE.UX.register('SelectToolsExtension');