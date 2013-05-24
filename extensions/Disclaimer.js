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
 * Class: DisclaimerExtension
 * Creates an alert to prompt the user with a disclaimer message on startup.
 * This version uses an alert box.  This can be useful if you're required
 * to make the user agree to a EULA  before using your application.
 * The variable "DISCLAIMER_MESSAGE" must be set in your code for this to work.
 *
 * Example:
 *
 * <script type="text/javascript">DISCLAIMER_MESSAGE="My Message";</script>
 * <script type="text/javascript" src="extensiosn/DisclaimerExtension.js"></script>
 *
 */

DisclaimerExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	disclaim: function() {
		if(window.DISCLAIMER_MESSAGE) {
			alert(window.DISCLAIMER_MESSAGE);
		} else {
			alert("Hello, World!");
		}
	},

	load: function() {
		GeoMOOSE.register('onMapbookLoaded', this, this.disclaim);
	},

	
	CLASS_NAME: "DisclaimerExtension"
});

GeoMOOSE.UX.register('DisclaimerExtension');
