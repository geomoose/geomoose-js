/*
Copyright (c) 2009-2011, Dan "Ducky" Little & GeoMOOSE.org
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

var Map = false;
var GM_Events = new OpenLayers.Events(window, window, ['onMapbookLoaded', 'onMapCreated'], true, {});

var ReferenceMap = false;
var Services = false; /* Service Manager */
var LatLongProjection = false;
var Tabs;
var Catalog = false;

var Tools = new Array();

var Application = null;

/*
 * This is the startup for the application.
 */
dojo.addOnLoad(function() {
	/* Proj really like to know where its def files reside */
	Proj4js.libPath = './libs/proj4js/lib/';

	var layout = new GeoMOOSE.Layout.Default();

	/* Instantiate a new GeoMOOSE Application */
	Application = new GeoMOOSE.Application();

	dojo.connect(Application, 'onGotMapbook', dojo.hitch(layout, layout.updatePanelSides));

	var catalog = new GeoMOOSE.Tab.Catalog();
	/* add the catalog, and put it at the front. */
	GeoMOOSE.addTab('catalog', catalog);

	dojo.connect(Application, 'onLayersChange', dojo.hitch(catalog, catalog.onLayersChange));
	dojo.connect(Application, 'onGotMapbook', dojo.hitch(catalog, catalog.onGotMapbook));

	var toolbar = new GeoMOOSE.UI.Toolbar({application: Application, layout: layout}, 'toolbar');
	dojo.connect(Application, 'onActivateMapSource', dojo.hitch(toolbar, toolbar.onActivateMapSource));
	dojo.connect(Application, 'onGotMapbook', dojo.hitch(toolbar, toolbar.onMapbookLoaded));

	dojo.connect(Application, 'onGotMapbook', function(response) {
		/* startup the service manager, this is a bit legacy but it's getting
		    the job done. */
		Services = new ServiceManager(response); 
		/* Trigger the old onMapbookLoaded event. */
		GM_Events.triggerEvent('onMapbookLoaded', {});

		var params = GeoMOOSE.getUrlParameters();
		if(GeoMOOSE.isDefined(params.call)) {
			var service_name = params.call;
			delete params.call;
			GeoMOOSE.startService(service_name, params, true);
		}
	});

	dojo.connect(Application, 'onGotMapbook', layout.resize);

	/* this can just be tossed, the constructor does everything we need. */
	new GeoMOOSE.UI.CoordinateDisplay();

	/* Define the scale jumper */
	var scale_jumper = new GeoMOOSE.UI.ScaleJumper();
	dojo.connect(Application, 'onGotMapbook', dojo.hitch(scale_jumper, scale_jumper.onGotMapbook));

	/* And now the zoom to boxes */
	dojo.connect(Application, 'onGotMapbook', function() {
		var control_panel = dijit.byId('control-panel');
		/* Add the zoom to to the control panel */
		control_panel.addChild(new GeoMOOSE.UI.ZoomTo({
			'region' : 'top'
		}));
		/* update the size of the control panel after dynamically adding a bunch of stuff. */
		control_panel.resize(); 

	});

	/* enable the links bar. */
	new GeoMOOSE.UI.LinksBar();

	//dojo.connect(Application, 'onGotMapbook', 
	GeoMOOSE.register('onMapCreated', null, function(map) {
		var measure_area = new GeoMOOSE.Tool.MeasureArea(map);
		map.events.register('moveend', catalog, catalog.onRefreshMap);
	});


	/* Start the application */
	Application.startup();
	
});


function clearPopups() {
	while(Map.popups.length > 0) {
		Map.removePopup(Map.popups[0]);
	}
}

function addPopup(x,y,w,h,html) {
	var size = new OpenLayers.Size(w,h);
	var offset = new OpenLayers.Pixel(-1,-1);
	var icon = new OpenLayers.Icon('images/blank.gif', new OpenLayers.Size(1,1), offset);

	var modifiedHTML = '<div class="popupContainer" style="width: '+w+'px; height: '+h+'px">'+html+'</div>';
	var popup = new OpenLayers.Popup.FramedCloud('id0', new OpenLayers.LonLat(x,y),
			size, modifiedHTML, icon, true);

	popup.autoSize = CONFIGURATION.popups.autosize;
	Map.addPopup(popup);
}

