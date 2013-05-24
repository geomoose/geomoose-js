<?php
/*Copyright (c) 2009, Dan "Ducky" Little & GeoMOOSE.org

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
THE SOFTWARE.*/

/*
 * File: getmapbook.php
 * Returns the mapbook.
 * Replacing this file is the root of being able to handle dynamic mapbooks
 * based on cookie logins or whatever other creative methodology you
 * wish to persue.
 */

include('config.php');

$mapbook = getMapbook();

# Add the local mapserver and path settings to the mapbook. 

$conf = $mapbook->getElementsByTagName('configuration')->item(0);

/*
 * Method: create_param
 * Creates a synthetic param to deliver with the mapbook.
 *
 * Parameters:
 *  $name - Name of the param.
 *  $value - The value of hte param.
 *
 * Returns:
 *  A <param/> element.
 */
function create_param($name,$value) {
	global $mapbook;
	$param = $mapbook->createElement('param');	
	$param->setAttribute("name", $name);
	$param->appendChild($mapbook->createTextNode($value));
	return $param;
}

$conf->appendChild(create_param('mapserver_url',$CONFIGURATION['mapserver_url']));
$conf->appendChild(create_param('mapfile_root',$CONFIGURATION['root']));

header('Content-type: application/xml;text/xml');
print $mapbook->saveXML();

?>
