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
	content: "",
	classNames: "",
	x: 0, y: 0,

	close: function() {
		// clear internal events if they were set.
		if(this.clearOnMove) {
			dojo.disconnect(this.clearEvent);
			dojo.disconnect(this.stickyEvent);
		}
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
		dojo.addClass(this.popupNode, 'Moved');
		if(!dojo.hasClass(this.popupNode, 'PopupAnchorRight')) {
			var p = dojo.position(this.popupNode);
			var map_pos = dojo.position('map');
			this.popupNode.style.left = ((p.x - map_pos.x) + CONFIGURATION.popups.left_offset)+'px';
		}
		dojo.removeClass(this.popupNode, ['PopupAnchorBottom', 'PopupAnchorRight']);
		dojo.disconnect(this._endEvt);
		dojo.disconnect(this._moveEvt);
	},

	movePopup: function(evt) {
		this.popupNode.style.bottom = 'auto';
		this.popupNode.style.right = 'auto';
		this.popupNode.style.top = (evt.clientY - this._offset.y) + 'px';
		this.popupNode.style.left = (evt.clientX - this._offset.x) + 'px';
	},

	position: function() {
		var parent_pos = dojo.position(this.domNode.parentNode);
		var anchors = {x: 'left', y: 'top'};
		if(this.x + 75 > parent_pos.w) {
			anchors.x = 'right';
			this.x = parent_pos.w - this.x; 
		}
		if(this.y + 75 > parent_pos.h) {
			anchors.y = 'bottom';
			this.y = parent_pos.h - this.y;
		}

		dojo.toggleClass(this.popupNode, 'PopupAnchorBottom', anchors.y == 'bottom');
		dojo.toggleClass(this.popupNode, 'PopupAnchorRight', anchors.x == 'right');
		this.popupNode.style[anchors.x] = this.x + 'px';
		this.popupNode.style[anchors.y] = this.y + 'px';
	},

	constructor: function(args) {
		if(args.renderXY) {
			this.x = args.renderXY.x;
			this.y = args.renderXY.y;
		}
		if(dojo.isArray(args.classNames)) {
			args.classNames = args.classNames.join(' ');
		}
		dojo.safeMixin(this, args);
	},

	/** Removes the "clear on move" event from the
	 *  popup.
	 */
	makeSticky: function() {
		dojo.disconnect(this.clearEvent);
		dojo.disconnect(this.stickyEvent);
	},

	postCreate: function() {
		this.inherited(arguments);

		this.contentsNode.innerHTML = this.content;

		/* position the popup */
		this.position();
		/* wire up a click to the close box to close the popup */	
		dojo.connect(this.closeBox, 'click', dojo.hitch(this, this.close));
		dojo.connect(this.titleNode, 'mousedown', dojo.hitch(this, this.startMove));

		// when clear on move is set to true the popups
		//  are dropped when the mouse moves away from the popup spot.
		if(this.clearOnMove) {
			this.clearEvent = dojo.connect(document, 'mousemove', dojo.hitch(this, this.close));
			this.stickyEvent = dojo.connect(document, 'click', dojo.hitch(this, this.makeSticky));
		}
	}
});
