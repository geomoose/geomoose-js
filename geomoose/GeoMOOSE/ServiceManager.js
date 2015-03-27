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

dojo.provide('GeoMOOSE.ServiceManager');

dojo.require('GeoMOOSE.ServiceInputTypes');

window.ServiceManager = function(Catalog, ParentId) {
	var MySelf = this;
	var ReturnedResults = false;
	this.ServiceTabClass = GeoMOOSE.Tab.Service;
	
	function getService(serviceName) {
		var services = Catalog.getElementsByTagName('service');
		for(var i = 0; i < services.length; i++) {
			if(services[i].getAttribute('name') == serviceName) {
				return services[i];
			}
		}
		return null;
	}

	this.onStart = function(service) {
		/* Override */
	}

	this.onFinish = function() {
		/* Override */
	}

	this.startService = function(serviceName, settingsObj, forceStart) {
		var service = getService(serviceName);
		if(!GeoMOOSE.isDefined(this.service_tabs)) {
			this.service_tabs = [];
		}

		if(service) {
			ReturnedResults = false;

			this.onStart(service);
			//var p = document.getElementById(ParentId);
			var service_title = service.getAttribute('title');
			if(!GeoMOOSE.isDefined(service_title)) {
				service_title = serviceName;
			}

			var service_tab = GeoMOOSE.getTab(serviceName);
			var tab_contents_id = GeoMOOSE.id();
			var p = dojo.create("div", {
				'id' : tab_contents_id
			});

			if(GeoMOOSE.isDefined(service_tab)) {
				//service_tab.set('content', p);
				GeoMOOSE.changeTab(serviceName);
			} else {
				/* remove the old tabs */
				if(!parseBoolean(service.getAttribute('keep-others'), false)) {
					while(this.service_tabs.length > 0) {
						var tab_name = this.service_tabs.pop();
						GeoMOOSE.closeTab(tab_name);
					}
				}

				service_tab = new this.ServiceTabClass({
					'title' : service_title,
					'closable' : true,
					'name' : serviceName,
					'service_xml' : service
				});

				dojo.connect(service_tab, 'onServiceReturn', dojo.hitch(service_tab, this.onServiceReturn));

				if(parseBoolean(service.getAttribute('display'), true)) {
					this.service_tabs.push(serviceName);
					GeoMOOSE.addTab(serviceName, service_tab);
				}


			}

			if(parseBoolean(service.getAttribute('display'), true)) {
				/* don't try to select the tab if we really don't want to show it. */
				dijit.byId('tabs').selectChild(service_tab);
			}

			service_tab.start(settingsObj, forceStart);

		}
	},

	this.onServiceReturn = function(response) {
	}
}
