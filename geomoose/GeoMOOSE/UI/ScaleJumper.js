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
 * Class: GeoMOOSE.UI.ScaleJumper
 */

dojo.provide('GeoMOOSE.UI.ScaleJumper');

dojo.require('dijit.form.ComboBox');
dojo.require("dojo.data.ItemFileReadStore");

dojo.declare('GeoMOOSE.UI.ScaleJumper', null, {

	/*
	 * Member: select
	 * The select box.
	 */
	select: null, 

	/*
	 * Method: draw 
	 * Gets the job done of creating the scale jumper.
	 */
	draw: function() {
		/* convert the configuration into a Dojo store */
		var items_json = {
			'label' : 'name',
			'items' : []
		}
		for(var e in CONFIGURATION.jumpto_scales) {
			items_json.items.push({'name' : e, 'value' : CONFIGURATION.jumpto_scales[e]});
		}

		var footer = dojo.byId('footer');
		var jumper_parent = dojo.create('span', {}, footer, 1);
		dojo.style(jumper_parent, {
			'position' : 'absolute',
			'right' : '0px',
			'padding' : '2px',
			'paddingRight' : '3px'
		});

		var jumper_div = dojo.create('span', {}, jumper_parent);

		this.select = new dijit.form.ComboBox({
			'store' : new dojo.data.ItemFileReadStore({data: items_json}),
			'query' : {name : '*'},
			'style': "width: 150px; color: black; textAlign: right",
			'parseScale' : function(scale) {
				return parseFloat(scale.replace('1:',''));
			},
			'onChange' : function() {
				var map_scale = Map.getScale().toFixed(0);
				var rounded_value = this.parseScale(this.get('value')).toFixed(0);
				if(map_scale != rounded_value) {
					Map.zoomToScale(rounded_value, !CONFIGURATION.franctional_zoom);
				}
			}
		}, jumper_div);

	},

	onGotMapbook: function() {
		/* draw the control */
		this.draw();
		/* setup the initial scale */
		this.setScale();
		/* now have the map update the displayed scale */
		Map.events.register('moveend', this, this.setScale);
	},

	setScale: function() {
		this.select.set('value', '1:'+Map.getScale().toFixed(0));
	}
});
