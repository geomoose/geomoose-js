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
 * Class: DynamicZoomExtension
 * Creates a dyamically populated zoom-to list based on results
 * from query.php.
 *
 * TODO: TEST WITH GEOMOOSE 2.6
 */

DynamicZoomConfiguration = {
	url : 'php/query.php',
	title: '',
	blank_title: 'Zoom to...',
	/*
		qitem and qstring are not required but they can be used
		to create a basic filter across the dataset.
	*/
	layers : {
		'Counties' : {
			mapbook_src: 'borders/county_borders',
			qitem: '',
			qstring: ''
		},
		'Cities' : {
			mapbook_src: 'borders/city_poly',
			qitem: '',
			qstring: ''
		}
	}
};


DynamicZoomExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	extent_selector: null,

	got_dynamic_zoom: function(req) {
		if(req.responseText) {
			/* reset the "zoom to.." selector */
/*
			var layer_select = document.getElementById(this.layer_selector);
			var layer_options = layer_select.getElementsByTagName('option');
			for(var i = 0; i < layer_options; i++) {
				layer_options[i].selected = false;
			}
			layer_options[0].selected = true;
*/
			/* populate the extent selector and enable it */
			var xml = '<options>' + req.responseText + '</options>';
			var options_doc = (new OpenLayers.Format.XML()).read(xml);
			var options = options_doc.getElementsByTagName('option');

			var extent_select = document.getElementById(this.extent_selector);
			/* enable it in case it's disabled */
			extent_select.disabled = false;

			/* clear the old children */
			while(extent_select.firstChild) {
				extent_select.removeChild(extent_select.firstChild);
			}

			/* add a blank child */
			var blank_option = document.createElement('option');
			extent_select.appendChild(blank_option);
			blank_option.appendChild(document.createTextNode(DynamicZoomConfiguration.blank_title));

			/* convert the XML results into a JS array, using insert sort on the way*/
			var js_options = [];
			for(var i = 0; i < options.length; i++) {
				var elem = {
					name: OpenLayers.Util.getXmlNodeValue(options[i]),
					extent: options[i].getAttribute('value')
				};
				var new_js_options = [];
				var inserted = false;
				for(var x = 0; x < js_options.length; x++) {
					if(inserted || elem.name > js_options[x].name) {
						new_js_options.push(js_options[x]);
					} else {
						new_js_options.push(elem);
						new_js_options.push(js_options[x]);
						inserted = true;
					}
				}
				if(!inserted) {
					new_js_options.push(elem);
				}
				js_options = new_js_options;
			}
			/* populate the sorted results in the selection box */
			for(var i = 0; i < js_options.length; i++) {
				var opt = document.createElement('option');
				opt.value = js_options[i].extent;
				extent_select.appendChild(opt);
				opt.appendChild(document.createTextNode(js_options[i].name));
			}

		}
	},

	start_dynamic_zoom: function() {
		/* disable the extent selector */
		var test = { responseXML: true };
//		this.got_dynamic_zoom(test);
		var layer_name = document.getElementById(this.layer_selector).value;

		var layer_info = DynamicZoomConfiguration.layers[layer_name];
		var query_params = {
			'fieldname0' : layer_info.qitem,
			'layer0' : layer_info.mapbook_src,
			'template0' : 'dynamic_zoom',
			'value0' : layer_info.qstring,
			'comparitor0' : 'like-icase',
			'mode' : 'results'
		};

		OpenLayers.loadURL(DynamicZoomConfiguration.url, query_params, this, this.got_dynamic_zoom);
	},

	load: function() {
		var dynamicZoomToParent = document.getElementById('zoomto-boxes');

		var zoomToContainer = document.createElement('div');
		dynamicZoomToParent.appendChild(zoomToContainer);
		zoomToContainer.className = 'zoomto-container';


		if(DynamicZoomConfiguration.title) {
			zoomToContainer.appendChild(document.createTextNode(DynamicZoomConfiguration.title));
		}

		var zoomToSelect = document.createElement('select');
		zoomToSelect.className = 'zoomto-select';
		this.layer_selector = OpenLayers.Util.createUniqueID();
		zoomToSelect.id = this.layer_selector;

		zoomToContainer.appendChild(zoomToSelect);

		OpenLayers.Event.observe(zoomToSelect, "change", OpenLayers.Function.bind(this.start_dynamic_zoom, this));

		var blankOption = document.createElement('option');
		blankOption.appendChild(document.createTextNode(DynamicZoomConfiguration.blank_title));
		
		zoomToSelect.appendChild(blankOption);
		
		for(var groupTitle in DynamicZoomConfiguration.layers) {
			var option = document.createElement('option');
			option.value = groupTitle; //DynamicZoomConfiguration.features[groupTitle];
			zoomToSelect.appendChild(option);
			option.appendChild(document.createTextNode(groupTitle));
		}

		var extentSelector = document.createElement('select');
		dynamicZoomToParent.appendChild(extentSelector);

		this.extent_selector = OpenLayers.Util.createUniqueID();
		extentSelector.id = this.extent_selector;

		OpenLayers.Event.observe(extentSelector, "change", OpenLayers.Function.bind(this.zoomToExtent, extentSelector));	

		/* TODO: Move stylization to a CSS class */
		extentSelector.style.width = '150px';
		zoomToSelect.style.width = '150px';

		extentSelector.disabled = true;
	},

	zoomToExtent : function () {
		Map.zoomToExtent(OpenLayers.Bounds.fromArray(this.options[this.selectedIndex].value.split(' ')));
	},

	CLASS_NAME: 'DynamicZoomExtension'
});

GeoMOOSE.UX.register('DynamicZoomExtension');
