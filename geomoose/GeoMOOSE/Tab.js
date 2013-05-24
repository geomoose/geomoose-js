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
 * Class: GeoMOOSE.Tab
 * The GeoMOOSE Tab Class is pretty basic and can serve as a "blank" type of container.
 */

dojo.provide('GeoMOOSE.Tab');

dojo.require('dijit.layout.ContentPane');

dojo.declare('GeoMOOSE.Tab', [dijit.layout.ContentPane], {
	/* 
	 * Member: targetId
	 * This is used as an identifier to aim content redirection
	 * towards this tab.  The "results" tab, for instance, has the
	 * targetId of "results".
	 */
	targetId: null,

	/*
	 * Member: title
	 * The title for the tab.
	 */
	title: 'GmTabUndefined',

	/*
	 * Method: postCreate
	 * This function is called after the tab has been added to the
	 * user interface.  Make sure to call "this.inherited(arguments)" at the top
	 * to ensure all of the other UI bits are handled correctly.
	 */
	postCreate: function() {
		this.inherited(arguments);
	}
});


