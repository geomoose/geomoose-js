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
 * Class: AnimateLayersExtension
 * Turns on/off layers in the catalog to give the appearance of animation.
 */

AnimateLayersExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	current_layer: -1,
	is_animating: false,
	layers_to_animate: [],
	interval_id: -1,
	interval_delay: 1000,

	animate: function() {
		this.is_animating = true;
		/* go to the 0th frame */
		this.current_layer = -1;
		this.next_frame(this);

		/* because of scoping rules with setInterval, we need to pass the class back to the function */
		/* Also, this function variable thing is done because IE doesn't properly implement setInterval */
		var instance = this;
		var my_func = function() {
			instance.next_frame(instance);
		}
		this.interval_id = window.setInterval(my_func, this.interval_delay, this);
	},

	stop_animate: function() {
		clearInterval(this.interval_id);
		this.is_animating = false;
	},

	toggle_animation: function () {
		if(this.is_animating) {
			this.stop_animate();
		} else {
			this.animate();
		}
			
	},

	next_frame: function(instance) {
		instance.current_layer+=1;
		if(instance.current_layer >= instance.layers_to_animate.length) {
			instance.current_layer = 0;
		}

		for(var i = 0; i < instance.layers_to_animate.length; i++) {
			if(i != instance.current_layer) {
				GeoMOOSE.changeLayerVisibility(instance.layers_to_animate[i], false);
			}
		}
		GeoMOOSE.changeLayerVisibility(instance.layers_to_animate[instance.current_layer], true);
	},

	load: function() {
	},

	initialize: function(layers,delay) {
		this.layers_to_animate = layers;
		if(delay) {
			this.interval_delay = delay;
		}
	},
	
	CLASS_NAME: "AnimateLayersExtension"
});

GeoMOOSE.UX.register('AnimateLayersExtension');
