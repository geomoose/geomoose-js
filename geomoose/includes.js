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

dojo.require('dojo.fx');
dojo.require('dijit.layout.BorderContainer');
dojo.require('dijit.layout.TabContainer');
dojo.require('dojox.widget.Standby');

dojo.registerModulePath('GeoMOOSE', '../../../geomoose/GeoMOOSE');
dojo.require('GeoMOOSE.Popup');
dojo.require('GeoMOOSE.Application');

dojo.require('GeoMOOSE.Handler.Box');
dojo.require('GeoMOOSE.Handler.MeasurePath');
dojo.require('GeoMOOSE.Control.Measure');
dojo.require('GeoMOOSE.Control.DeleteFeature');

dojo.require('GeoMOOSE.Dialog.AttributeEditor');
dojo.require('GeoMOOSE.Dialog.Download');

dojo.require('GeoMOOSE.MapSource');
dojo.require('GeoMOOSE.MapSource.Vector');
dojo.require('GeoMOOSE.MapSource.Vector.WFS');

dojo.require('GeoMOOSE.MapSource.WMS');
dojo.require('GeoMOOSE.MapSource.MapServer');
dojo.require('GeoMOOSE.MapSource.TMS');
dojo.require('GeoMOOSE.MapSource.XYZ');
dojo.require('GeoMOOSE.MapSource.Google');
dojo.require('GeoMOOSE.MapSource.AGS');


dojo.require('GeoMOOSE.Tab');
dojo.require('GeoMOOSE.Tab.Service');
dojo.require('GeoMOOSE.Tab.Catalog');
dojo.require('GeoMOOSE.Tab.Catalog.LayerControl');
dojo.require('GeoMOOSE.Tab.Catalog.LayerControl.Activate');
dojo.require('GeoMOOSE.Tab.Catalog.LayerControl.Popups');
dojo.require('GeoMOOSE.Tab.Catalog.LayerControl.Up');
dojo.require('GeoMOOSE.Tab.Catalog.LayerControl.Fade');
dojo.require('GeoMOOSE.Tab.Catalog.LayerControl.Legend');

dojo.require('GeoMOOSE.ServiceManager');

dojo.require('GeoMOOSE.UI.Toolbar');
dojo.require('GeoMOOSE.Layout.Default');
dojo.require('GeoMOOSE.UI.CoordinateDisplay');
dojo.require('GeoMOOSE.UI.ScaleJumper');
dojo.require('GeoMOOSE.UI.ZoomTo');
dojo.require('GeoMOOSE.UI.LinksBar');

dojo.require('GeoMOOSE.Tool.MeasureArea');
