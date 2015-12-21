/*
Copyright (c) 2009-2015, Dan "Ducky" Little & GeoMOOSE.org

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

/** MOTD (Message of the Day)
 *
 * Display a message to the user on GeoMOOSE startup.  This is similar
 * to the Disclaimer extension except:
 *  - The message is configured in the Mapbook instead of geomoose.html.
 *    This makes it easier to update the message as it is part of the 
 *    configuration and not the code. (And if the Mapbook is dynamically
 *    generated, the message can be stored/updated in a database).
 *  - Uses Dojo/Dijit instead of alert() to display the message.
 *    This allows for HTML messages and behaves better in modern browsers.
 *
 * Configuration:
 *  - Add "dojo.require('extensions.MOTD');" to site/includes.js
 *  - Rebuild GeoMoose using libs/build_js.sh (or use geomoose_dev.html)
 *  - Add message to the Mapbook:
 *    <mapbook version="2.6">
 *      <configuration>
 *        <param name="motd"><![CDATA[
 *          <p><b>04-Dec-2015</b> <b>Important</b>The Moose is Loose!</p>
 *        ]]></param>
 *        ...
 *      </configuration>
 *      ...
 *    </mapbook>
 */
dojo.require("dijit.Dialog");

dojo.provide("extensions.MOTD");
dojo.declare('MOTD', null, {
	display: function() {
	    if(CONFIGURATION.motd != "") {
		var content = CONFIGURATION.motd;

		var dlg = new dijit.Dialog({
		    title: "Message of the day",
		    content: content,
		    style: "width: 45%"
		});
		dojo.connect(dlg, "onClick", function() {
			dlg.hide();
		});
		dlg.show();
	    }
	},

	// Executed when GeoMOOSE is starting after UI loaded, 
	// but before Mapbook loaded.
	load: function() {
	    CONFIGURATION.motd = "";
	    GeoMOOSE.register('onMapbookLoaded', this, this.display);
	}
});

GeoMOOSE.UX.register('MOTD');
		
