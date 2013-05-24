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
 * Class: GeoMOOSE.UI.ZoomTo
 * Creates the zoom-to drop down boxes in the control panel.
 */

dojo.provide('GeoMOOSE.UI.ZoomTo');

dojo.require('dijit.layout.ContentPane');
dojo.require('dijit.form.DropDownButton');
dojo.require('dijit.form.Select');
dojo.require('dijit.Menu');

dojo.declare('GeoMOOSE.UI.ZoomTo', [dijit.layout.ContentPane], {

	zoomTo: function () {
		var select = dijit.byId(this.select_id);
		var v = select.get('value');
		/* if we don't have an array, don't presume it has a useful value */
		if(v instanceof Array) {
			Map.zoomToExtent(OpenLayers.Bounds.fromArray(v));
			/* this should select the first menu item in the select */
			select.set('value','reset');
		}
	},

	postCreate: function() {
		var p = dojo.create('div', {});
		this.set('content', p);
		for(var zoom_to_group in CONFIGURATION['zoomto']) {
			var z_group = CONFIGURATION['zoomto'][zoom_to_group];

			var entry = dojo.create('div', {}, p);
			dojo.style(entry, {'padding' : '.5em'});

			var label_span = dojo.create('span', {'innerHTML' : zoom_to_group}, entry);

			/* the first item will be our "reset" item for after a user selects a value */
			var zoom_tos = [{'label':'', 'value' : 'reset'}];
			/* now, populate the list. */
			for(var zoom_to_label in CONFIGURATION['zoomto'][zoom_to_group]) {
				zoom_tos.push({
					'label' : zoom_to_label, 
					'value' : z_group[zoom_to_label]
				});
			}

			this.select_id = GeoMOOSE.id();

			var select_span = dojo.create('span', {'id' : this.select_id}, entry);
			var select = new dijit.form.Select({
				maxHeight: 160,
				options: zoom_tos
			}, select_span);

			dojo.connect(select, 'onChange', dojo.hitch(this, this.zoomTo));

			/* add our custom class. */
			dojo.addClass(select.domNode, ['zoomto_select']);
		}
	}
});


