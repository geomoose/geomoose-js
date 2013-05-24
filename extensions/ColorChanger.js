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
 * Class: ColorChangerExtension
 * Demo extensions that changes the color of a div after it's been
 * loaded.
 */

ColorChangerExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {

	current_color: 0,
	colors: ['red','green','blue','yellow','aqua'],

	my_id: OpenLayers.Util.createUniqueID('ColorChanger'),

	change_color: function() {
		p = document.getElementById('control-panel');
		this.current_color++;
		if(this.current_color >= this.colors.length) {
			this.current_color = 0;
		}

		p.style.backgroundColor = this.colors[this.current_color]
	},

	load: function() {
		if(!window.color_changers) {
			window.color_changers = {}
		}

		window.color_changers[this.my_id] = this;

		setInterval("colorChangerCallChange('"+this.my_id+"')", 1000);
	},
	CLASS_NAME: 'ColorChangerExtension'
});

function colorChangerCallChange(id) {
	window.color_changers[id].change_color();
}

GeoMOOSE.UX.register('ColorChangerExtension');
