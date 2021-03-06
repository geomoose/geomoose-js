/*
Copyright (c) 2009-2016, Dan "Ducky" Little & GeoMOOSE.org

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
 * Example Demo Grid Extension for use with the Demo's parcel data.
 */

dojo.require('extensions.ResultsAsGrid')

dojo.provide("extensions.ResultsAsGrid.DemoResultsAsGrid");
dojo.declare("extensions.ResultsAsGrid.DemoResultsAsGrid", extensions.ResultsAsGrid, {
	/** This is a demo function that collects all of the selected rows and
	 *  displays the list of PIN numbers in a dialog.  This can serve
	 *  as a starting point for a service that may print mailing labels, 
	 *  report on the parcels, all sorts of fun options.
	 */
	demoListParcels: function() {
		// Array to contain the selected PINs.
		var pins = [];
		// Get the selected items from the grid.
		var items = this.dataGrid.selection.getSelected();
		// iterate through the items.
		for(var i = 0, ii = items.length; i < ii; i++) {
			// get the PIN.
			var pin = this.objectStore.getValue(items[i], "PIN");
			// add the PIN to the array.
			pins.push(pin);
		}

		// put an alert up that shows which PINs were selected.
		alert('You have selected the following PINs: '+pins.join(', '));
	},


	/** Add a demo of listing the selected PINs using a button in the toolbar.
	 */
	renderToolbar: function(layout) {
		// create a new toolbar on the top of the grid pane.
		var toolbar = new dijit.Toolbar({region: 'top'});

		// Add the toolbar to the layout.
		layout.addChild(toolbar);

		// Create a button.
		var list_button = new dijit.form.Button({
			label: "List Parcels",
			iconClass: "dijitEditorIcon dijitEditorIconInsertTable",
			onClick: dojo.hitch(this, this.demoListParcels)
		});
		// Place the button on the toolbar.

		toolbar.addChild(list_button);
		// Tell the toolbar to startup and register its events.
		toolbar.startup();
	}
});

// This is the magic reason ResultsAsGrid will not load, it does
//  not have a UX register line.
// So this adds it.
GeoMOOSE.UX.register('extensions.ResultsAsGrid.DemoResultsAsGrid');
