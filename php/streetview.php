<?php
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
 * Code contributed by Brian Fischer @ Houston Engineering
 */

$xy = explode(",",$_REQUEST['xy']);

//header( 'Location: http://maps.live.com/default.aspx?v=2&FORM=LMLTCP&cp=' . $xy[0] . '~' . $xy[1] . '&style=b&');

header( 'Location: http://maps.google.com/maps?hl=en&ie=UTF8&spn=0.115896,0.239639&z=12&layer=c&cbll=' . $xy[1] . ',' . $xy[0] . '&cbp=12,0,,0,-4.1&view=map&ll=' . $xy[1] . ',' . $xy[0]);

?>
