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

dojo.provide('GeoMOOSE.ServiceManager');

dojo.require('GeoMOOSE.ServiceInputTypes');

window.ServiceManager = function(Catalog, ParentId) {
	var MySelf = this;
	var ReturnedResults = false;
	
	function getService(serviceName) {
		var services = Catalog.getElementsByTagName('service');
		for(var i = 0; i < services.length; i++) {
			if(services[i].getAttribute('name') == serviceName) {
				return services[i];
			}
		}
		return null;
	}


	/* TODO: Make this right.  It is VERY, VERY, VERY wrong... */
	var input_types = {};
	for(var x in GeoMOOSE.Services.InputType) {
		if(GeoMOOSE.Services.InputType[x].prototype && GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME) {
			var mb_name = GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME;
			if(GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME) {
				input_types[mb_name] = GeoMOOSE.Services.InputType[x];
			}
		}
	}


	function renderInputStep(step, parentId, settingsObj) {
		var inputs = step.getElementsByTagName('input');
		var nUserInputs = 0;

		var headers = step.getElementsByTagName('header');
		var p = document.getElementById(parentId);

		for(var i = 0; i < headers.length; i++) {	
			var span = document.createElement('span');
			p.appendChild(span);
			span.className = 'service-header';
			span.innerHTML = OpenLayers.Util.getXmlNodeValue(headers[i]);
		}

		var input_objs = [];
		var renderables = [];
		for(var i = 0; i < inputs.length; i++) {
			var inputType = new String(inputs[i].getAttribute('type')).toLowerCase();

			if(input_types[inputType]) {
				var input_obj = new input_types[inputType](inputs[i]);
				input_objs.push(input_obj);
				if(input_obj.requiresRender()) {
					renderables.push(input_obj);
					nUserInputs++;
				}
		
				var name = input_obj.getName();
				if(settingsObj && settingsObj[name]) {
					input_obj.setValue(settingsObj[name]);
				}
			}

		
		}

		for(var i = 0; i < renderables.length; i++) {
			renderables[i].renderHTML(parentId);
		}

		var footnotes = step.getElementsByTagName('footnote');
		var p = document.getElementById(parentId);
		for(var i = 0; i < footnotes.length; i++) {	
			var span = document.createElement('span');
			p.appendChild(span);
			span.className = 'service-footnote';
			span.innerHTML = OpenLayers.Util.getXmlNodeValue(footnotes[i]);
		}

		/* shift focus to the first non-hidden input of the service */
		var inputs = p.getElementsByTagName('input');
		var notfound = true;
		for(var i = 0; i < inputs.length && notfound; i++) {
			if(inputs[i].type != 'hidden' && inputs[i].type != 'radio') {
				inputs[i].focus();
				notfound = false;
			}
		}

		return nUserInputs;
	}

	function onAddFeature(f) {
		/* Clear the layer */
		while(this.layer.features.length > 0) {
			this.layer.removeFeatures(this.layer.features[0]);
		}
		this.layer.addFeatures(f);

		/* Store the WKT of the feature */
		var parser = new OpenLayers.Format.WKT();
		var str = parser.write(f);
		this.xml.setAttribute('wkt', str);

		var OutputFormat = OpenLayers.Format.WKT;
		var outputType = new String(this.xml.getAttribute('format')).toLowerCase();
		if(outputType == 'kml') {
			OutputFormat = OpenLayers.Format.KML;
		} else if(outputType == 'wfs') {
			OutputFormat = OpenLayers.Format.WFS;
		} else if(outputType == 'json') {
			OutputFormat = OpenLayers.Format.JSON;
		} else if(outputType == 'delim') {
			OutputFormat = OpenLayers.Format.Text;
			var delim = this.xml.getAttribute('delim');
			var point_delim = this.xml.getAttribute('point-delim');
			if(!delim) { delim = ','; }
			if(!point_delim) { point_delim = ','; }
			var getPoints = function (g) {
				var points = [];
				if(g.components) {
					for(var i = 0; i < g.components.length; i++) {
						if(g.components[i] instanceof OpenLayers.Geometry.Point) {
							points += g.components[i];
						} else if(g.components) {
							this(g);
						}
					}
				} else if(g instanceof OpenLayers.Geometry.Point) {
					return [g];
				}
				return points;
			}

			OutputFormat = function() {
				this.write = function(f) {
					// travel through the object until we get to a "point" then 
					// convert the x,y to text separated by a delimiter.
					var points = getPoints(f.geometry);
					for(var i = 0; i < points.length; i++) {
						points[i] = points[i].x+delim+points[i].y;
					}
					return points.join(point_delim);
				}
			}

		}
		var output = new OutputFormat();

		var inputs = this.xml.getElementsByTagName('input');

		/* Remove the old input */
		var stepName = this.xml.getAttribute('name');
		for(var i = 0; i < inputs.length; i++) {
			if(inputs[i].getAttribute('name') == stepName) {
				this.xml.removeChild(inputs[i]);
			}
		}

		if(this.xml.getAttribute('reproject')) {
			var new_proj = this.xml.getAttribute('reproject');
			if(new_proj == 'EPSG:4326' || new_proj == 'WGS84') {
				dest_proj = LatLongProjection;
			} else {
				dest_proj = OpenLayers.Projection(new_proj);
			}

			OpenLayers.Projection.transform(f.geometry, 
				Map.getProjectionObject(),
				dest_proj);
		}
		
		var input = Catalog.createElement('input');
		input.setAttribute('name', stepName);
		input.setAttribute('type', 'hidden');
		input.appendChild(Catalog.createCDATASection(output.write(f)));
		this.xml.appendChild(input);


	
		if(parseBoolean(this.xml.getAttribute('jump-start'), false)) {
			MySelf.callService(this.xml.parentNode.getAttribute('name'));
		} else if(ReturnedResults) {
			/* if results have been returned then we need to show the service form if it's not jump-start able */
			MySelf.startService(this.xml.parentNode.getAttribute('name'), {}, false);
		}
	}

	/* set the tool, and reference the xml to change */
	function changeDrawingTool(tool, xml) {
		for(var t in MySelf.tools) {
			MySelf.tools[t].deactivate();
		}
		if(GeoMOOSE.isDefined(MySelf.tools[tool])) {
			MySelf.tools[tool].activate();
			if(MySelf.tools[tool].featureAdded) {
				MySelf.tools[tool].featureAdded = onAddFeature;
			} else {
				MySelf.tools[tool].onModificationEnd = onAddFeature;
			}
			MySelf.tools[tool].xml = xml;
		} else {
			alert(GeoMOOSE.processTemplate(CONFIGURATION.messages.invalid_tool, {'TOOL': tool}));
		}
	}

	function onclickDrawingTool() {
		/* This code is needed because IE is stupid */
		if(this.type == 'radio') {
			var inputs = this.parentNode.getElementsByTagName('input');
			for(var i = 0; i < inputs.length; i++) {
				if(inputs[i].name == this.name) {
					inputs[i].checked = false;
				}
			}
			this.checked = true;
		}
		if(this.value) {
			changeDrawingTool(this.value, this.xml);
		}
	}

	function renderSpatialStep(step, parentId, settingsObj) {
		/* put our drawing layer at the top, and set it visible */

		Map.setLayerIndex(MySelf.drawing_layer, Map.getNumLayers());
		MySelf.drawing_layer.setVisibility(true);

		/* Restore preview drawing */
		var wkt = false;
		var wktFormat = false;
		if(settingsObj && settingsObj[step.getAttribute('name')]) {
			wkt = settingsObj[step.getAttribute('name')];
			wktFormat = true;
		} else if(step.getAttribute('wkt')) {
			wkt = step.getAttribute('wkt');
			if(!step.getAttribute('format') || step.getAttribute('format').toLowerCase() == 'wkt') {
				wktFormat = true;
			}
		}


		var parser = new OpenLayers.Format.WKT();
		if(wkt) {
			this.drawing_layer.addFeatures(parser.read(wkt));

			var inputs = step.getElementsByTagName('input');
			var input = false;
			for(var i = 0; i < inputs.length; i++) {
				if(inputs[i].getAttribute('name') == step.getAttribute('name')) {
					input = inputs[i];
				}
			}
			if(wktFormat) {
				if(input) {
					step.removeChild(input);
				}
				var input = Catalog.createElement('input');
				input.setAttribute('name', step.getAttribute('name'));
				input.setAttribute('type', 'hidden');
				input.appendChild(Catalog.createCDATASection(wkt));
				step.appendChild(input);
			}
		}

		/* Maybe I should move this into configuration ... maybe ... */
		var tools = {
			'pan' : {
				'status' : true,
				'title': 'Navigate'
			}, 
			'edit-polygon' : {
				'status' : false,
				'title' : 'Edit Polygon'
			},
			'point' : {
				'status' : true,
				'title' : 'Draw Point'
			}, 
			'line' : {
				'status' : true,
				'title' : 'Draw Line'
			}, 
			'polygon' : {
				'status' : true,
				'title' : 'Draw Polygon'
			},
			'box' : {
				'status' : false,
				'title' : 'Draw Box'
			}
		};


		if(parseBoolean(step.getAttribute('show-tools'), true)) {
			var p = document.getElementById(parentId);
			p.appendChild(document.createTextNode('Available Tools: '));
			p.appendChild(document.createElement("br"));

			for(var v in tools) {
				if(parseBoolean(step.getAttribute(v), tools[v]['status'])) {
					var radio = document.createElement('input');
					radio.name = 'drawing-tools';
					radio.type = 'radio';
					radio.value = v;
					radio.onclick = onclickDrawingTool;
					radio.xml = step;
					p.appendChild(radio);
					p.appendChild(document.createTextNode(tools[v].title));
					p.appendChild(document.createElement('br'));
				}
			}
			p.appendChild(document.createElement('br'));

			if(step.getAttribute('default')) {
				var def = step.getAttribute('default');
				var inputs = p.getElementsByTagName('input');
				for(var input = 0; input < inputs.length; input++) {
					if(inputs[input].name == 'drawing-tools' && inputs[input].value == def) {
						inputs[input].onclick();
					}
				}
			}
		} else if(step.getAttribute('default')) {
			changeDrawingTool(step.getAttribute('default'), step);
		} else {
			alert(CONFIGURATION.messages.service_config_error);
		}

		/* return the number of inputs, since the spatial step is one,
			include it in the cound */
		return 1+renderInputStep(step, parentId, settingsObj);
	}

	this.onStart = function(service) {
		/* Override */
	}

	this.onFinish = function() {
		/* Override */
	}

	function changeStep() {
		var panel = document.getElementById(this.step);
		var panels = document.getElementsByTagName('div');
		for(var i = 0; i < panels.length; i++) {
			if(panels[i].className == 'service-step-visible') {
				panels[i].className = 'service-step-hidden';
			}
		}
		panel.className = 'service-step-visible';

		cleanupService();
	}

	function cleanupService() {
		for(var t in this.tools) {
			this.tools[t].deactivate();
		}

		this.drawing_layer.setVisibility(false);

		var drawingLayer = this.drawing_layer;
		while(drawingLayer.features.length > 0) {
			drawingLayer.removeFeatures(drawingLayer.features[0]);
		}

	}

	this.startService = function(serviceName, settingsObj, forceStart) {
		var service = getService(serviceName);
		if(!GeoMOOSE.isDefined(this.service_tabs)) {
			this.service_tabs = [];
		}


		if(service) {
			ReturnedResults = false;
			this.onStart(service);
			//var p = document.getElementById(ParentId);
			var service_title = service.getAttribute('title');
			if(!GeoMOOSE.isDefined(service_title)) {
				service_title = serviceName;
			}

			var service_tab = GeoMOOSE.getTab(serviceName);
			var tab_contents_id = GeoMOOSE.id();
			var p = dojo.create("div", {
				'id' : tab_contents_id
			});

			if(GeoMOOSE.isDefined(service_tab)) {
				//service_tab.set('content', p);
				GeoMOOSE.changeTab(serviceName);
			} else {
				/* remove the old tabs */
				if(!parseBoolean(service.getAttribute('keep-others'), false)) {
					while(this.service_tabs.length > 0) {
						var tab_name = this.service_tabs.pop();
						GeoMOOSE.closeTab(tab_name);
					}
				}

				service_tab = new GeoMOOSE.Tab.Service({
					'title' : service_title,
					'closable' : true,
					'name' : serviceName,
					'service_xml' : service
				});

				dojo.connect(service_tab, 'onServiceReturn', dojo.hitch(service_tab, this.onServiceReturn));

				if(parseBoolean(service.getAttribute('display'), true)) {
					this.service_tabs.push(serviceName);
					GeoMOOSE.addTab(serviceName, service_tab);
				}


			}

			if(parseBoolean(service.getAttribute('display'), true)) {
				/* don't try to select the tab if we really don't want to show it. */
				dijit.byId('tabs').selectChild(service_tab);
			}

			service_tab.start(settingsObj, forceStart);

		}
	},

	this.onServiceReturn = function(response) {
	}
}
