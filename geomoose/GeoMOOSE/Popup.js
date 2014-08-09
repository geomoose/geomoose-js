/*
Copyright (c) 2009-2014, Dan "Ducky" Little & GeoMOOSE.org

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
 * Class: GeoMOOSE.Popup
 * GeoMOOSE Popup Representation
 *
 */

dojo.provide('GeoMOOSE.Popup');
dojo.require('dijit._Widget');
dojo.require('dijit._Templated');

/*
 * Small internal _Layer object for tracking the layers from
 * a WMS request, et al.
 */
dojo.declare('GeoMOOSE.Popup', [dijit._Widget, dijit._Templated], {
	templateString: dojo.cache("GeoMOOSE", "popup_template.html"),
	title: "&nbsp;",
	contents: "",
	classNames: "",
	top: 0, left: 0,

	close: function() {
		/* user clicks close, we bring the boom. */
		this.destroyRecursive();
	},

	/*
	 * Method: Start Move
	 * Called when a mouse down happens in the title.
	 */
	startMove: function(evt) {
		var pos = dojo.position(this.popupNode);
		var map_pos = dojo.position('map');
		this._offset = {x: map_pos.x + (evt.clientX - pos.x), y: map_pos.y + (evt.clientY - pos.y)};

		//this._moveEvt = dojo.connect(dojo.byId('map'), 'mousemove', dojo.hitch(this, this.movePopup));
		this._moveEvt = dojo.connect(document, 'mousemove', dojo.hitch(this, this.movePopup));
		this._endEvt = dojo.connect(document, 'mouseup', dojo.hitch(this, this.endMove));
	},

	endMove: function(evt) {
		dojo.disconnect(this._endEvt);
		dojo.disconnect(this._moveEvt);
	},

	movePopup: function(evt) {
		this.popupNode.style.top = (evt.clientY - this._offset.y) + 'px';
		this.popupNode.style.left = (evt.clientX - this._offset.x) + 'px';
	},

	constructor: function(args) {
		if(args.renderXY) {
			args.left = args.renderXY.x;
			args.top = args.renderXY.y;
		}
		if(dojo.isArray(args.classNames)) {
			args.classNames = args.classNames.join(' ');
		}
		dojo.safeMixin(this, args);
	},

	postCreate: function() {
		this.inherited(arguments);
		/* wire up a click to the close box to close the popup */	
		dojo.connect(this.closeBox, 'click', dojo.hitch(this, this.close));
		dojo.connect(this.titleNode, 'mousedown', dojo.hitch(this, this.startMove));
	}
});
