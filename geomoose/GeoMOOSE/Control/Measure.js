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

dojo.provide('GeoMOOSE.Control.Measure');

/*
 * Class: GeoMOOSE.Control.Measure
 * Extends the OpenLayers.Control.Measure class to provide additional
 * segment tracking.
 */

GeoMOOSE.Control.Measure = OpenLayers.Class(OpenLayers.Control.Measure, {

    EVENT_TYPES: ['measuremove'],
    immediate: true,
    geodesic: true,
    partialDelay: 100,

	partials : 0,
	segments: new Array(),
	total: 0.0,
	last_move_length: 0.0,

	activate: function() {
		this.segments = new Array();
		this.total = 0.0;
		this.last_move_length = 0.0;
		this.partials = 0;

		OpenLayers.Control.Measure.prototype.activate.apply(this, arguments);
	},

    initialize: function(handler, options) {
        this.callbacks = OpenLayers.Util.extend(
		{mousemove: this.measureMove},
            this.callbacks
        );

	OpenLayers.Control.Measure.prototype.initialize.apply(this, [handler, options]);
	this.events.addEventType('measuremove');
    },

    measureImmediate : function(point, feature, drawing) {
        if (drawing && this.delayedTrigger === null &&
                                !this.handler.freehandMode(this.handler.evt)) {
            this.measure(feature.geometry, "measuremove");
        }
    },

    /*
     * this is defaulting to "always inches" so that the rendering step
     * can take care of unit approximation and conversion
     */
    measure: function(geometry, eventType) {
        var stat, order;
        if(geometry.CLASS_NAME.indexOf('LineString') > -1) {
            stat = this.getLength(geometry, 'in');
            order = 1;
        } else {
            stat = this.getArea(geometry, 'in');
            order = 2;
        }


	if(eventType != "measuremove") {
		var length = this.last_move_length;
		if(length != 0) {
			this.segments.push(length);
		}
		for(var i=0, sum=0; i < this.segments.length; sum += this.segments[i++]);
		this.total = sum;
		this.last_move_length = 0;
	}


	/* attempt to detect the false measure partial events */
	if(eventType == "measurepartial") {
		this.partials++;
		if(this.partials == 1) {
			/* reset the tool */
			this.segments = new Array();
			this.total = 0;
			return false;
		}
	}
	/* get just "this" segment size */
	if(eventType == 'measuremove') {
		stat = stat - this.total;
		this.last_move_length = stat;
	}
        this.events.triggerEvent(eventType, {
            measure: stat,
            units: 'in',
            order: order,
            geometry: geometry
        });

	if(eventType == 'measure') {
		this.partials = 0;
		this.last_move_length = 0.0;
	}
    },

    CLASS_NAME: "GeoMOOSE.Control.Measure"
});
