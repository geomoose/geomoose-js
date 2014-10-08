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

/** 
 * Class: GeoMOOSE.Dialog.AttributeEditor
 * Allows vector feature attributes to be edited in a nice pretty dialog.
 */

dojo.provide('GeoMOOSE.Dialog.AttributeEditor');

dojo.require('dijit.Dialog');
dojo.require('dijit.form.TextBox');

dojo.declare('GeoMOOSE.Dialog.AttributeEditor', [dijit.Dialog], {
	closable: true,

	title: "Edit Attributes",

	feature_desc: [],
	layer_path: '',

	postCreate: function() {
		this.inherited(arguments);
		this.content_id = GeoMOOSE.id();
		var content_div = dojo.create('div', {
			'id' : this.content_id
		});
		this.set('content', content_div);

		dojo.addClass(content_div, ['attribute-editor', this.layer_path]);
	},

	_updateAttribute: function(attr, value) {
		//this.feature.attributes[this.attr] = this.get('value');
		this.feature.attributes[attr] = value;
	},

	show: function(event) {
		var feature = event.feature;
		var content = dojo.byId(this.content_id);
		content.innerHTML = '';
//		var layout_div = dojo.create('div', {}, content)
		var layout = new dijit.layout.BorderContainer({}, content); 

		if(this._main) {
			this._main.destroyRecursive();
		}
		var main = dojo.create('div', {});
		var main_layout = new dijit.layout.ContentPane({'content' : main, 'region' : 'center'});
		this._main = main_layout;
		layout.addChild(main_layout);
		layout.startup();

		this.feature = feature;

		/** This code is copy and pasted directly form ServiceManager.js.
		 * This code is all sorts of evil, but until we restruct the server input types then we'll
		 * need to stick with it. Nice to have things for 2.8.
		 */
		var input_types = {};
		for(var x in GeoMOOSE.Services.InputType) {
			if(GeoMOOSE.Services.InputType[x].prototype && GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME) {
				var mb_name = GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME;
				if(GeoMOOSE.Services.InputType[x].prototype.MAPBOOK_NAME) {
					input_types[mb_name] = GeoMOOSE.Services.InputType[x];
				}
			}
		}

		var controls = [];

		for(var i = 0, len = this.feature_desc.length; i < len; i++) {
			var c_id = GeoMOOSE.id();
			var c = dojo.create('div', {'id' : c_id}, main);

			var attribute_name = this.feature_desc[i]['name'];
			var input_type = this.feature_desc[i]['type'].toLowerCase();

			if(!GeoMOOSE.isDefined(input_types[input_type])) {
				input_type = 'user';
			}

			var input_opts = {
				'name' : attribute_name,
				'title' : this.feature_desc[i]['label']
			}

			if(GeoMOOSE.isDefined(this.feature_desc[i]['options'])) {
				input_opts['options'] = this.feature_desc[i]['options'];
			}

			var input_obj = new input_types[input_type](null, input_opts);
	
			var value = this.feature_desc[i]['value'];
			if(feature.attributes[attribute_name]) {
				value = feature.attributes[attribute_name];
			}
			input_obj.setValue(value);

			if(input_obj.requiresRender()) {
				input_obj.renderHTML(c_id);
			}

			controls.push(input_obj);

		}

		var toolbar = new dijit.Toolbar({'region' : 'top'});
		layout.addChild(toolbar);

		toolbar.addChild(new dijit.form.Button({
			'label'  : 'Cancel',
			'iconClass':  'dijitIconDelete',
			'onClick' : dojo.hitch(this, this.hide)
		}));

		toolbar.addChild(new dijit.form.Button({
			'label' : 'Save Changes',
			'iconClass' : 'dijitIconSave',
			'onClick' : dojo.hitch(this, function() {
				for(var i = 0, ii = controls.length; i < ii; i++) {
					//controls[i].save();
					//console.log(controls[i].getName(), controls[i].getValue());
					this._updateAttribute(controls[i].getName(), controls[i].getValue());

				}
				if(this.feature.state != OpenLayers.State.INSERT) {
					this.feature.state = OpenLayers.State.UPDATE;
				}
				this.hide();
			})
		}));


		this.inherited(arguments);
	}
});
