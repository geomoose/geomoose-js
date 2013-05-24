<?php
#
# File: config.php
# Does some basic boostrapping of the GeoMOOSE PHP environment.
# This file could as well be a "util.php" or a "helpers.php" but "config.php"
# will be sticking for now as there is substantial momentum.
#

/*Copyright (c) 2009-2012, Dan "Ducky" Little & GeoMOOSE.org

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

#
# This is meant to allow specific environmental includes for
# GeoMOOSE 2 PHP Services.  Substantive configuraiton options
# should be added to settings.ini
#

/* Check for the required libraries
 * g2/curl are used for printing. If you're not using printing
 * you can avoid using these modules.
 *
 * mapscript and dbase are used for most operations using them
 * cannot be avoided
 */

if(!extension_loaded('gd') && !extension_loaded('gd2')) {
#	dl('php_gd2.'.PHP_SHLIB_SUFFIX);
}

if(!extension_loaded('curl')) {
#	dl('php_curl.'.PHP_SHLIB_SUFFIX);
}

if(!extension_loaded('MapScript')) {
#	dl('php_mapscript.'.PHP_SHLIB_SUFFIX);
}

# Load the configration file
$CONFIGURATION = parse_ini_file('../../conf/settings.ini');

function parseLocalConf() {
	global $CONFIGURATION;
	$local_conf = array();
	try {
		$local_conf = parse_ini_file('../../conf/local_settings.ini');
	} catch(Exception $e) {
		# ignore ...
	}
	$CONFIGURATION = array_merge($CONFIGURATION, $local_conf);
}

# run it upon inclusion
parseLocalConf();


function getMapbook() {
	global $CONFIGURATION;
	$mapbook = new DOMDocument();
	$mapbook->load('../../conf/'.$CONFIGURATION['mapbook']);
	return $mapbook;
}

function getUsername() {
	session_start();
	return $_SESSION['username'];
}


# Select Functionality ONLY works for Mapserver Layers
function getMapfile($mb, $layerName) {
	$services = $mb->getElementsByTagName('map-source');
	$mapfiles = array();
	for($i = 0; $i < $services->length; $i++) {
		$service = $services->item($i);
		$root = $service->getAttribute('name');
		$layers = $service->getElementsByTagName('layer');
		for($l = 0; $l < $layers->length; $l++) {
			$layer = $layers->item($l);
			$path = $root.'/'.$layer->getAttribute('name');
			if($path == $layerName) {
				return $service->getElementsByTagName('file')->item(0)->nodeValue;
			}
		}
	}
	return null;
}

# get a source based on it's name
function getMapSource($mb, $layerName) {
	$services = $mb->getElementsByTagName('map-source');
	$mapfiles = array();
	for($i = 0; $i < $services->length; $i++) {
		if($services->item($i)->getAttribute('name') == $layerName) {
			return $services->item($i);
		}
	}
	return null;
}

#
# Function: reprojectWKT
# Casts basic WKT strings between various projections.
# Useful when data projections do not match incoming projections.
#
# Parameters:
#  inWkt - The WKT of the shape to reproject
#  inProjection - MapServer ProjectionObj for the incoming WKT.
#  outProjection - Target Projection.
#
# Returns:
#  Reprojected WKT string.
#

function reprojectWKT($inWkt, $inProjection, $outProjection) {
	$in_shape = ms_shapeObjFromWkt($inWkt);
	$in_shape->project($inProjection, $outProjection);
	return $in_shape->toWkt();
}

#
# Function: getUtmProjection
# Get an apporpiate UTM projection for the shape.  Possibly because UTM
# preserves distance.
#
# Parameters:
#  longitude - The longitude of a shape
#
# Returns:
#  A EPSG string.
#
function getUtmProjection($longitude) {
	$code = (int)(ceil(((float)$longitude) / 6.0 + 30) + 32601);
	return 'EPSG:'.$code;
}

#
# Function: saneBuffer
# Buffers a shape in a projection that actually honors distance.
# This is important because projections like Web Mercator and LatLong do
# not have such honor.
#
# Parameters:
#  inShape - MapScript shapeObj
#  inProjection - MapServer ProjectionObj for the incoming WKT.  If set to NULL, assumes shape is in WGS84.
#  meters - Distance in meters to buffer.
#
# Results:
#  A properly (sanely) buffered MapScript shapeObj
#
function saneBuffer($inShape, $inProjection, $meters, $debug=false) {
	$wgs84 = ms_newprojectionobj('epsg:4326'); 
	# if inProjection is NULL, we assume wgs84
	if($inProjection != NULL) {
		$shape = ms_shapeObjFromWkt(reprojectWkt($inShape->toWkt(), $inProjection, $wgs84));
	} else {
		$shape = $inShape;
	}

	$utm_projection =  ms_newprojectionobj(getUtmProjection($shape->bounds->minx)); 

	if($debug) {
		error_log('saneBuffer :: MINX :'.$shape->bounds->minx);
		error_log('saneBuffer :: SELECTED ZONE :'.getUtmProjection($shape->bounds->minx));
	}

	$shape->project($wgs84, $utm_projection);
	# I have no idea why, but if I don't call this, the whole thing creates an
	# invalid geometry, circa PHP MapScript 6.0.1, 20 January 2012
	$shape->toWkt();
	if($debug) {
		error_log('saneBuffer :: UTM PROJECTED SHAPE :'.$shape->toWkt());
	}

	$shape = $shape->buffer(floatval($meters));
	if($inProjection == NULL) {
		# convert it back to WGS84 
		$shape->project($utm_projection, $wgs84);
	} else {
		# back to native coordinates.
		$shape->project($utm_projection, $inProjection);
	}
	# Again, with PHP MapScript 6.0.2, I need to run toWkt
	# to have the projections "take".
	$shape->toWkt();
	if($debug) {
		error_log('saneBuffer :: Back to projection :'.$shape->toWkt());
	}
	return $shape;
}

#
# Method: get_request_icase
# Try to get both the lower and uppercase version of the parameter
# from "$_REQUEST"
#
# Parameters:
#  param_name
#
# Returns:
#  God willing, the passed in parameter value.
#

function get_request_icase($param_name) {
	$lower_case = strtolower($param_name);
	$upper_case = strtoupper($param_name);

	$value = NULL;
	if(isset($_REQUEST[$lower_case])) {
		$value = $_REQUEST[$lower_case];
	}
	if(!isset($value)) {
		$value = $_REQUEST[$upper_case];
	}
	return $value;
}

#
# Method: isset_icase
# Checks to see if either the upper or lower case
# versions of a parameter value are set.
#
# Parameters:
#  param_name
#
# Returns:
#  Boolean
#

function isset_icase($param_name) {
	$lower_case = strtolower($param_name);
	$upper_case = strtoupper($param_name);

	return (isset($_REQUEST[$lower_case]) or isset($_REQUEST[$upper_case]));
}


#
# Method: processTemplate
# Hokey-GeoMOOSE template processing utility.
#
# Parameters:
#  $str - A string with "[STUFF]" tags
#  $dict - An associative array with keys matching "STUFF"
#
# Returns:
#  Formatted string.
#
function processTemplate($str, $dict) {
	foreach($dict as $k => $v) {
		$str = str_replace('['.$k.']', $v, $str);
	}
	return $str;
}

#
# Method: parseBoolean
# Parses a string for a boolean value.
#
function parseBoolean($str) {
	$str = strtolower($str);
	return ($str == 'true' || $str == 'on' || $str == '1');
}
?>
