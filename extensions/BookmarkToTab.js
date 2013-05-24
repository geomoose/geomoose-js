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
 * Class: BookmarkToTabExtension
 * Will create a new tab and populate it with bookmark information for the 
 * page. Overrides the default GeoMOOSE.bookmark() function which just updates
 * window.location.
 * 
 */

BookmarkToTabExtension = new OpenLayers.Class(GeoMOOSE.UX.Extension, {
	load: function() {
		GeoMOOSE.bookmark = function() {
			var url  = GeoMOOSE.getBookmarkUrl();
			var id   = GeoMOOSE.id('bookmark');
			var html = GeoMOOSE.processTemplate(BOOKMARK_TEMPLATE, {'id': id, 'url': url});

  			var bookmark_tab = GeoMOOSE.getTab('bookmark_tab');
			if(!GeoMOOSE.isDefined(bookmark_tab)) {
				bookmark_tab = new GeoMOOSE.Tab({'title': 'Bookmark'});
				GeoMOOSE.addTab('bookmark_tab', bookmark_tab)
			}

			bookmark_tab.set('content', html)
			GeoMOOSE.changeTab('bookmark_tab');

			dojo.byId(id).focus();
			dojo.byId(id).select();

		}
	},
	CLASS_NAME: 'BookmarkToTabExtension'
});

if (!window.BOOKMARK_TEMPLATE) {
	window.BOOKMARK_TEMPLATE = "\
	<span class='service-title'>Bookmark</span>\
	Right-click on the link, or copy and paste the text below:\
	<br><br>\
	<a href='%url%'>Map Link</a>\
	<br>\
	<textarea id='%id%' rows='20' style='width:90%'>%url%</textarea>\
	<br>\
	<button onclick='GeoMOOSE.bookmark();'>Update</button><br>\
	";
}

GeoMOOSE.UX.register('BookmarkToTabExtension');
