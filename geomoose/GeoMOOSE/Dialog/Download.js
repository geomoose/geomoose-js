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
 * Class: GeoMOOSE.Dialog.Download
 * Display an Download Dialog.
 */

dojo.provide('GeoMOOSE.Dialog.Download');
dojo.require('dijit.Dialog');

dojo.declare('GeoMOOSE.Dialog.Download', dijit.Dialog, {
	title: 'Download File',
	download_id: '',
	download_extension: '',

	postCreate: function() {
		this.inherited(arguments);

		var content = dojo.create('div', {});
		this.set('content', content);

		dojo.style(content, {
			'width' : '300px', 'height' : '100px'
		});

		var urls = [
			{
				label: "View in new Window/Tab",
				url: "php/download.php?id="+this.download_id+"&ext="+this.download_extension
			}
		];

		urls.push({
			label: "Download",
			url: urls[0].url+"&download=true"
		});
		
		urls.push({
			label: "Close this Window",
			url: "#"
		});

		for(var i = 0, ii = urls.length; i < ii; i++) {
			var url = urls[i].url;
			var options = {
				'href' : url,
				'innerHTML' : urls[i].label
			};
			if(url != '#') {
				options['target'] = '_blank';
			}

			var link = dojo.create('a', options, content);
			dojo.addClass(link, 'geomooseDownloadLink');
			dojo.connect(link, 'onclick', dojo.hitch(this, this.hide));
		}
	}
});
