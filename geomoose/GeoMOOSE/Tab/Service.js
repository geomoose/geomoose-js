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

/*
 * Class: GeoMOOSE.Tab.Service
 * Handles rendering services in the tab pane.
 *
 * Inherits from:
 *  - <GeoMOOSE.Tab>
 */



dojo.provide('GeoMOOSE.Tab.Service');

dojo.require('GeoMOOSE.ServiceInputTypes');

dojo.require('dijit.layout.BorderContainer');
dojo.require('dijit.layout.ContentPane');


dojo.declare('GeoMOOSE.Tab.Service', [dijit.layout.BorderContainer], {
	service_xml: null,

	postCreate: function() {
		/* setup some layout. */
		this.header = new dijit.layout.ContentPane({'region' : 'top'});
		this.content = new dijit.layout.ContentPane({'region' : 'center'});
		this.footer = new dijit.layout.ContentPane({'region' : 'bottom'});

		this.addChild(this.content);
		/* header and footer are added dynamically based on content */
		//this.addChild(this.header);
		//this.addChild(this.footer);

	},

	constructor: function() {

		/* make a nice little drawing layer */
		this.drawing_layer = new OpenLayers.Layer.Vector(GeoMOOSE.id());
		Map.addLayers([this.drawing_layer]);

		this.tools = {};
		this.tools['pan'] = {
			activate: function() {
				Tools['pan'].activate();
			},
			deactivate: function() {
				Tools['pan'].deactivate();
			},
			setMap: function () { },
			draw: function () {}
		}
		this.tools['point'] = new OpenLayers.Control.DrawFeature(this.drawing_layer, OpenLayers.Handler.Point);
		this.tools['line'] = new OpenLayers.Control.DrawFeature(this.drawing_layer, OpenLayers.Handler.Path);
		this.tools['polygon'] = new OpenLayers.Control.DrawFeature(this.drawing_layer, OpenLayers.Handler.Polygon);
		this.tools['box'] = new OpenLayers.Control.DrawFeature(this.drawing_layer, GeoMOOSE.Handler.Box);
		this.tools['edit-polygon'] = new OpenLayers.Control.ModifyFeature(this.drawing_layer);

		// find the list of vector layers
		var all_layers = [];
		var vis_layers = GeoMOOSE.getVisibleLayers();

		for(var i  = 0; i < vis_layers.length; i++) {
			if(GeoMOOSE.isEditable(vis_layers[i])) {
				all_layers.push(Application.getMapSource(vis_layers[i])._ol_layer);
			}
		}
		this.tools['select_feature'] = new OpenLayers.Control.SelectFeature(all_layers, {
							highlightOnly: true,
							multiple: false
						});

		this.unique_name = GeoMOOSE.id();

		for(var t in this.tools) {
			Map.addControl(this.tools[t]);
		}

		var add_tools = ['point','line','polygon','box'];
		for(var i = 0; i < 4; i++) {
			this.tools[add_tools[i]].events.register('featureadded', this, this._onFeatureAdded);
		}

		// modified features go through the layer and 
		//  *not* the tool
		this.drawing_layer.events.register('afterfeaturemodified', this, this._onFeatureAdded);

		this.tools['select_feature'].events.register('featurehighlighted', this, function(event) {
			this.tools['select_feature'].unselect(event.feature);
			var useful_feature = event.feature.clone();

			this._onFeatureAdded({feature: useful_feature});
		});

		/* TODO: Make this right.  It is VERY, VERY, VERY wrong... */
		this.input_types = {};
		for(var x in GeoMOOSE.Services.InputType) {
			if(GeoMOOSE.Services.InputType[x].prototype && GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME) {
				var mb_name = GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME;
				if(GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME) {
					this.input_types[mb_name] = GeoMOOSE.Services.InputType[x];
				}
			}
		}


	},

	start: function(settingsObj, forceStart) {
		var content_id = GeoMOOSE.id();
		var content = dojo.create('div', {'id' : content_id});
		this.content.set('content', content);

		/* Remove the header/footer since we may not need them */
		this.removeChild(this.header);
		this.removeChild(this.footer);

		/* save these settings incase we need to "restart" the tab */
		this._settingsObj = settingsObj;
		this._forceStart = forceStart;

		this._clearHighlightOnClose = parseBoolean(this.service_xml.getAttribute('clear-highlight'), false);

		var steps = this.service_xml.getElementsByTagName('step');

		var nInputs = 0;
		var submitParent = content_id;
		/* oops, no steps! */
		this.steps = [];
		var rootName = 'service-'+this.unique_name;

		if(CONFIGURATION.services.disable_others) {
			dijit.byId('toolbar').disableTools();
		}

		if(steps.length == 0) {
			var step0_name = rootName + '0';
			var step0 = dojo.create('div', {'id' : step0_name}, content);
			nInputs += this.renderInputStep(this.service_xml, step0_name, settingsObj);
			this.steps.push(step0_name);
		} else {
			for(var i = 0; i < steps.length; i++) {
				var stepType = new String(steps[i].getAttribute('type')).toLowerCase();
				var div = document.createElement('div');
				if(i > 0) {
					div.className = 'service-step-hidden';
				} else {
					div.className = 'service-step-visible';
				}
				div.id = rootName + i;
				content.appendChild(div);

				/* add this step the stack */
				this.steps.push(div.id);

				// render a help bubble as requested.
				var help_texts = steps[i].getElementsByTagName('help-text');
				var help_html = '';
				for(var h = 0, hh = help_texts.length; h < hh; h++) {
					help_html = OpenLayers.Util.getXmlNodeValue(help_texts[h]);
				}

				if(help_html != '') {
					var help_div = document.createElement('div');
					div.appendChild(help_div);
					help_div.className = 'help-text';
					help_div.innerHTML = help_html;
				}



				if(stepType == 'input') {
					nInputs += this.renderInputStep(steps[i], div.id, settingsObj);
				} else if(stepType == 'select' || stepType == 'spatial') {
					nInputs += this.renderSpatialStep(steps[i], div.id, settingsObj);
				}
				var table = document.createElement('table');
				table.width = '95%';
				var tbody = document.createElement('tbody');
				div.appendChild(table);
				table.appendChild(tbody);

				var tr = document.createElement('tr');
				tbody.appendChild(tr);

				var left = document.createElement('td');
				left.align = 'left';
				tr.appendChild(left);

				var right = document.createElement('td');
				right.align = 'right';
				tr.appendChild(right);

				right.id = rootName + '-right-' + i;

				if(i > 0) {
					var prevButton = document.createElement('input');
					prevButton.value = 'Back';
					prevButton.type = 'button';
					left.appendChild(prevButton);
					prevButton.className = 'service-button-back';

					prevButton.step = i-1;
					prevButton.onclick = this._changeStep;
				} else {
					new dijit.form.Button({
						label: CONFIGURATION.services.cancel_label,
						onClick: dojo.hitch(this, this._closeMe),
						"iconClass" : "dijitIconDelete",
						"class": "service-button"
					}, dojo.create('button', {}, left));
				}
				if(i < steps.length - 1) {
					var nextButton = document.createElement('button');
					nextButton.innerHTML = 'Next';
					right.appendChild(nextButton);
					nextButton.className = 'service-button-next';

					nextButton.parent = this;
					nextButton.step = i+1;
					nextButton.onclick = this._changeStep;
				}
			}
			submitParent = rootName + '-right-' + (steps.length - 1);
		}
		var buttonTitle = this.service_xml.getAttribute('submit');
		if(!buttonTitle) {
			buttonTitle = 'Go!';
		}

		if(parseBoolean(this.service_xml.getAttribute('display-submit'), true) && parseBoolean(this.service_xml.getAttribute('display'), true)) {
			var onclick = dojo.hitch(this, function () {
				if(this.meetsRequirements()) {
					//this.callService(this.service_xml.getAttribute('service-name'));	
					this.callService();
				} else {
					alert(CONFIGURATION.messages.requirement_failure);
				}
			});

			new dijit.form.Button({
				onClick: onclick,
				"class": "service-button",
				"iconClass" : "dijitIconFunction",
				label: buttonTitle
			}, dojo.create('button', {}, submitParent));

			if(nInputs <= 0 || forceStart) {
				onclick();
			}
		/* this is duplicate logic from above,  but works in the case when we haven't
		   actualy displayed the tab. */
		} else if(nInputs <= 0 || forceStart) {
			this.callService();
		}
	},


	meetsRequirements : function() {
		var service = this.service_xml;
		var inputs = service.getElementsByTagName('input');

		var meets_requirements = true;
		for(var i = 0; i < inputs.length; i++) {
			if(parseBoolean(inputs[i].getAttribute('required'))) {
				var v = inputs[i].getAttribute('value');
				if(!(v && v != '')) {
					meets_requirements = false;
				}
			}
		}

		var steps = service.getElementsByTagName('step');
		for(var i = 0; i < steps.length; i++) {
			if(parseBoolean(steps[i].getAttribute('required'))) {
				var v = steps[i].getAttribute('wkt');
				if(!(v && v != '')) {
					meets_requirements = false;
				}
			}
		}

		return meets_requirements;
	},


	renderInputStep: function(step, parentId, settingsObj) {
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

			if(this.input_types[inputType]) {
				var input_obj = new this.input_types[inputType](inputs[i]);
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
		if(GeoMOOSE.isDefined(p)) {
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
		}

		this.afterInputStep(step, parentId, settingsObj);

		return nUserInputs;
	},

	afterInputStep: function() {
	},

	renderSpatialStep: function(step, parentId, settingsObj) {
		/* put our drawing layer at the top, and set it visible */

		Map.setLayerIndex(this.drawing_layer, Map.getNumLayers());

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
			/* if the drawing layer is visible, we already have this feature rendered */
			if(!this.drawing_layer.getVisibility()) {
				this.drawing_layer.addFeatures(parser.read(wkt));
			}

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
				var input = step.ownerDocument.createElement('input');
				input.setAttribute('name', step.getAttribute('name'));
				input.setAttribute('type', 'hidden');
				input.appendChild(step.ownerDocument.createCDATASection(wkt));
				step.appendChild(input);
			}
		}
		this.drawing_layer.setVisibility(true);

		var p = dojo.byId(parentId);
		if(!parseBoolean(step.getAttribute('show-tools'), true)) {
			p.appendChild(dojo.create('div', {'style':'display:none;'}));
			p = p.children[0];
		}
		p.appendChild(document.createTextNode('Available Tools: '));
		p.appendChild(document.createElement("br"));

		var step_id = GeoMOOSE.id();

		var radio_buttons = {};
		var first_non_navigate_tool = null;

		var geotools = CONFIGURATION.services.tools;

		for(var v in geotools) {
			var geotool = geotools[v];

			if(parseBoolean(step.getAttribute(v), geotools[v]['status'])) {
				var input_div = dojo.create('div', {}, p);
				var radio_span = dojo.create('span', {}, input_div);
				var label_span = dojo.create('span', {
					'innerHTML' : geotools[v].title
				}, input_div);
				if(!GeoMOOSE.isDefined(first_non_navigate_tool) && v != 'pan') {
					first_non_navigate_tool = v;
				}

				radio_buttons[v] = new dijit.form.RadioButton({
					'name' : step_id,
					'onChange' : dojo.hitch({'drawing_tools' : this.tools,'tool' : v}, function(isMe) {
						if(isMe) {
							for(var tool in Tools) {
								Tools[tool].deactivate();
							}
							for(var tool in this.drawing_tools) {
								this.drawing_tools[tool].deactivate();
							}
							if(GeoMOOSE.isDefined(this.drawing_tools[this.tool])) {
								this.drawing_tools[this.tool].activate();
							}
						}
					})
				}, radio_span);

			}
		}
		p.appendChild(document.createElement('br'));

		var default_tool = step.getAttribute('default');
		if(GeoMOOSE.isDefined(default_tool) && GeoMOOSE.isDefined(radio_buttons[default_tool])) {
			radio_buttons[default_tool].set('checked',true);
		} else {
			radio_buttons[first_non_navigate_tool].set('checked', true);
		}

		this.afterSpatialStep(step, parentId, settingsObj);

		/* return the number of inputs, since the spatial step is one,
			include it in the count */
		return 1 + this.renderInputStep(step, parentId, settingsObj);
	},

	afterSpatialStep: function(step, parentId, settingsObj) {

	},


	callService: function(values) {
		var service = this.service_xml;

		var inputs = service.getElementsByTagName('input');
		var url = OpenLayers.Util.getXmlNodeValue(service.getElementsByTagName('url')[0]);
		var params = {};
		for(var i = 0; i < inputs.length; i++) {
			var inputType = new String(inputs[i].getAttribute('type')).toLowerCase();
		
			if(this.input_types[inputType]) {
				var input_obj = new this.input_types[inputType](inputs[i]);
				var input_name = input_obj.getName();
				var input_value = input_obj.getValue();

				if(values && values[input_name]) {
					input_value = values[input_name];
				}
				if(params[input_name]) {
					params[input_name].push(input_value);
				} else {
					params[input_name] = [input_value];
				}
			}
		}

		/** Clear out the old spatial stuff **/
		/*
		var drawing_tools = ['point','line','polygon'];
		for(var d = 0; d < drawing_tools.length; d++) {
			this.tools[drawing_tools[d]].deactivate();
		}

		while(this.drawing_layer.features.length > 0) {
			this.drawing_layer.removeFeatures(this.drawing_layer.features[0]);
		}
		*/

//		this.lastServiceName = serviceName;
		this.lastServiceParams = params;
	
		this.onStart();

		if(service.getAttribute('target') == '_blank') {
			dijit.byId('tabs').closeChild(GeoMOOSE.getTab(this.name));

			/* TODO: Make this work for posts by background-targetting an iframe */
			/* this is moderately evil. */
			var param_string = '';
			for(var p in params) {
				for(var i in params[p]) {
					param_string += '&' + p + '=' + params[p][i];
				}
			}
			window.open(url+'?'+param_string);

		} else {
			/* assume a post */
			this.query = dojo.xhrPost({
				'url' : url,
				'preventCache' : true,
				'content' : params,
				'load' : dojo.hitch(this, this.onServiceReturn),
				'error' : dojo.hitch(this, this.onServiceError)//,
				//'handleAs' : 'xml'
			});
		}


		/* this isn't totally correct but good enough for the events it handles */
		//ReturnedResults = true;
		this.onFinish();
	},

	onServiceError: function(contents) {
		GeoMOOSE.error('Error Calling the server:\n'+contents);
	},

	/* concatChildValues used to be in OpenLayers.Format.XML
	 * as of OpenLayers 2.12 it has been removed and so is
	 * implemented as a private method here.
	 */
	_concatChildValues: function(node) {
		var xml = new OpenLayers.Format.XML();
		var res = xml.getChildValue(node);
		if(node.children) {
			for(var i = 0; i < node.children.length; i++) {
				res += xml.getChildValue(node.children[i]);
			}
		}
		return res;
	},

	onServiceReturn: function(responseXML) {
		var parseFail = false;
		/* Dojo's built-in parsing was failing in IE, so I've switched
		 * back to using the OpenLayers parser and having the services
		 * return text.  This seems to be working more reliably.
		 * Duck 3 Sept 2013
		 */
		try {
			var xml = new OpenLayers.Format.XML();
			/* replace response XML */
			responseXML = xml.read(responseXML);
			/* check for our standard root element, "<results>" */
			if(responseXML.getElementsByTagName('results').length < 1) {
				parseFail = true;
			}
		} catch(e) {
			parseFail = true;
		}


		var html = '';
		if(!GeoMOOSE.isDefined(responseXML) || parseFail) {
			html = CONFIGURATION.messages.service_return_error;
		} else {
			var scripts = responseXML.getElementsByTagName('script');
			var js = '';
			for(var s = 0; s < scripts.length; s++) {
				js += this._concatChildValues(scripts[s]);
			}
			if(scripts.length > 0) { eval(js); }

			var texts = responseXML.getElementsByTagName('html');
			for(var h = 0; h < texts.length; h++) {
				html += this._concatChildValues(texts[h]);
			}


			var popups = responseXML.getElementsByTagName('popup');
			for(var p = 0; p < popups.length; p++) {
				var pp = popups[p];
				/*
				addPopup(parseFloat(pp.getAttribute('x')), parseFloat(pp.getAttribute('y')),
					parseFloat(pp.getAttribute('width')), parseFloat(pp.getAttribute('height')),
					xml.concatChildValues(pp));
				*/
			}
		}
	
		/* If the tab was closed, then the domNode still sticks around due to
			the closure generated with dojo.hitch, but we may not be attached to a document
			so Firefox (et al) will throw a Document error if we try to edit the HTML
			fragment. This short ciruits that behavior.  As reported in #97. */
		if(!GeoMOOSE.isDefined(this.domNode.parentNode)) {
			/* short circuit if this has been closed. */
			return false;
		}
	
		if(html != '') {
			/* disable tools */
			if(!this._isJumpStart) {
				this.disableTools();
			}

			/* display the html */
			//this.set('content', html);
			this.addChild(this.header);
			var back_to_settings = dojo.create('div', {
				innerHTML : 'Back to Settings'
			});
			var settings_icon = dojo.create('span', {}, back_to_settings, 'first');

			this.header.set('content', back_to_settings);
			dojo.addClass(settings_icon, ['dijitIcon', 'sprite-control', 'sprite-control-previous']);
			dojo.style(settings_icon, {'vertical-align' : 'middle', 'height' : '16px'});
			dojo.style(back_to_settings, {
				'cursor' : 'pointer',
				'fontSize' : '1.1em',
				'textDecoration' : 'underline'
			});

			dojo.connect(back_to_settings, 'onclick', dojo.hitch(this, this.toBeginning));

			this.content.set('content', html);

			/* update the display. */
			this.resize();

			/* we just got data, put ourselves at the forefront. */
			dijit.byId('tabs').selectChild(this);
		} else {
			/* so, okay, we did not display any html, so the tools should still be up,
				ergo, we don't disable them. */

			/* maybe there was a popup or something else useful? */
		}

		/* we'll see if there's a footer and render it. */
		if(GeoMOOSE.isDefined(responseXML)) {
			this.renderReturnFooter(responseXML);
		}
	},

	renderReturnFooter: function(responseXML) {
		//var xml = new OpenLayers.Format.XML();
		var footers = responseXML.getElementsByTagName('footer');
		var footer_html = '';
		for(var i = 0, ii = footers.length; i < ii; i++) {
			footer_html += this._concatChildValues(footers[i]);
		}


		if(footer_html != '') {
			this.addChild(this.footer);
			this.footer.set('content', footer_html);
			this.resize();
		}

	},

	/*
	 * Method: disableTools
	 * Disables all the tools but remembers which one was active.
	 */
	disableTools: function() {
		/** deactivate all our controls **/
		for(var t in this.tools) {
			if(this.tools[t].deactivate()) {
				this._lastTool = t;
			}
		}

		// restore outside tools
		if(CONFIGURATION.services.disable_others) {
			dijit.byId('toolbar').restoreTools();
		}

	},

	/*
	 * Method: restoreTools
	 * Renables the last tool, if defined.
	 */
	restoreTools: function() {
		if(GeoMOOSE.isDefined(this._lastTool)) {
			this.tools[this._lastTool].activate();
		}
		// disable outside tools
		if(CONFIGURATION.services.disable_others) {
			dijit.byId('toolbar').disableTools();
		}
	},

	onStart: function() {
		this.content.set('content', CONFIGURATION.waiting_html);
	},

	onFinish: function() {
	},

	onSelectionFeatureChanged: function(event) {
	},

	_onFeatureAdded: function(event) {
		/* clear the other features */
		while(this.drawing_layer.features.length > 0) {
			this.drawing_layer.removeFeatures(this.drawing_layer.features[0]);
		}
		this.drawing_layer.addFeatures([event.feature], {silent: true});

		/* Store the WKT of the feature */
		var parser = new OpenLayers.Format.WKT();
		var wkt = parser.write(event.feature);
		var step = null;
		var steps = this.service_xml.getElementsByTagName('step');
		for(var i = 0, n_steps = steps.length; i < n_steps; i++) {
			if(steps[i].getAttribute('type') == 'spatial') {
				step = steps[i];
			}
		}
		step.setAttribute('wkt', wkt);

		this.onSelectionFeatureChanged(event);

		var OutputFormat = OpenLayers.Format.WKT;
		var outputType = new String(step.getAttribute('format')).toLowerCase();
		if(outputType == 'kml') {
			OutputFormat = OpenLayers.Format.KML;
		} else if(outputType == 'wfs') {
			OutputFormat = OpenLayers.Format.WFS;
		} else if(outputType == 'json') {
			OutputFormat = OpenLayers.Format.JSON;
		} else if(outputType == 'delim') {
			OutputFormat = OpenLayers.Format.Text;
			var delim = step.getAttribute('delim');
			var point_delim = step.getAttribute('point-delim');
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

		var inputs = step.getElementsByTagName('input');

		/* Remove the old input */
		var stepName = step.getAttribute('name');
		for(var i = 0, len = inputs.length; i < len; i++) {
			if(inputs[i].getAttribute('name') == stepName) {
				step.removeChild(inputs[i]);
			}
		}

		if(GeoMOOSE.isDefined(step.getAttribute('reproject'))) {
			var new_proj = step.getAttribute('reproject');
			if(new_proj == 'EPSG:4326' || new_proj == 'WGS84') {
				dest_proj = new OpenLayers.Projection('EPSG:4326'); //LatLongProjection;
			} else {
				dest_proj = OpenLayers.Projection(new_proj);
			}

			event.feature.geometry = OpenLayers.Projection.transform(event.feature.geometry, 
				Map.getProjectionObject(),
				dest_proj);
		}

		/* this is basically a fake-out for the old GeoMOOSE service parser/launcher */
		/* In 3.0, we should really just keep a bunch of stuff in JSON */
		var doc = this.service_xml.ownerDocument;
		var input = doc.createElement('input');
		input.setAttribute('name', stepName);
		input.setAttribute('type', 'hidden');
		input.appendChild(doc.createCDATASection(output.write(event.feature)));
		step.appendChild(input);

		/* if jump-start is set to true, then we just launch the service */
		if(parseBoolean(step.getAttribute('jump-start'), false)) {
			this._isJumpStart = true;
			this.callService();
		} else {
			this._isJumpStart = false;
		}
	},

	onClose: function() {
		this.disableTools();

		/** deactivate all our controls **/
		for(var t in this.tools) {
			Map.removeControl(this.tools[t]);
			delete this.tools[t];
		}

		/** remove the drawing layer **/
		if(GeoMOOSE.isDefined(this.drawing_layer)) {
			Map.removeLayer(this.drawing_layer);
			this.drawing_layer = null;
		}

		var ret_code = this.inherited(arguments);

		/* clean up header and footer, if they were never added as children
		 * we can get a memory leak from them not being destroyed. */

		if(this.header) { this.header.destroyRecursive(); }
		if(this.footer) { this.footer.destroyRecursive(); }

		if(this._clearHighlightOnClose) {
			if(GeoMOOSE.isDefined(CONFIGURATION.services.highlight_layer)) {
				GeoMOOSE.clearLayerParameters(CONFIGURATION.services.highlight_layer);
				GeoMOOSE.changeLayerVisibility(CONFIGURATION.services.highlight_layer, false);
			}
		}

		GeoMOOSE.activateDefaultTool();

		return ret_code;
	},

	onHide: function() {
		this.disableTools();
		this.inherited(arguments);
	},

	onShow: function() {
		this.inherited(arguments);
		this.restoreTools();
	},

	_closeMe: function() {
		this.disableTools();
		dijit.byId('tabs').closeChild(this);
	},

	/*
	 * Method: _changeStep
	 * Used to bind to the step-changing buttons.
	 */
	_changeStep: function() {
		this.parent.changeStep(this.step);
	},

	/*
	 * Method: changeStep
	 * Change to a step in the sequnce of steps for this service.
	 */
	changeStep: function(step) {
		var panel = document.getElementById(this.steps[step]);
		var panels = this.content.domNode.getElementsByTagName('div');
		//var panels = document.getElementsByTagName('div');
		for(var i = 0; i < panels.length; i++) {
			if(panels[i].className == 'service-step-visible') {
				panels[i].className = 'service-step-hidden';
			}
		}
		panel.className = 'service-step-visible';
	},

	/*
	 * Method: toBeginning
	 * Go back to the start of the settings for the service.
	 */
	toBeginning: function() {
		// I forced false start to "false", when the user clicks to "change" settings
		// I'm assuming they wish to actually see them!
		this.start(this._settingsObj, false); //this._forceStart);
	}


});

