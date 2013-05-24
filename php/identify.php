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
 * File: identify.php
 * Provides drill-down identify functionality.
 */

include('config.php');

# Debug flag.
$DEBUG = false;

if(!$DEBUG) {
	# Turn off the warning reporting in production
	error_reporting(E_ERROR | E_PARSE);
}


$projection = $CONFIGURATION['projection'];
if(array_key_exists('projection', $_REQUEST) and isset($_REQUEST['projection'])) {
	$projection = urldecode($_REQUEST['projection']);
}

$shape = urldecode($_REQUEST['shape']);

$visibleLayers = urldecode($_REQUEST['layers']);
$hiddenLayers = urldecode($_REQUEST['hidden_layers']);

$layersList = explode(':', $visibleLayers);
$layersList = array_merge($layersList, explode(':', $hiddenLayers));
$layersList = array_unique($layersList);

$mapbook = getMapbook();
$msXML = $mapbook->getElementsByTagName('map-source');

$layersToIdentify = array();
for($i = 0; $i < $msXML->length; $i++) {
	$node = $msXML->item($i);
	$file = $node->getElementsByTagName('file');
	$layers = $node->getElementsByTagName('layer');
	$msType = strtolower($node->getAttribute('type'));
	$queryable = false;
	if($node->hasAttribute('queryable')) {
		$queryable = parseBoolean($node->getAttribute('queryable'));
	} else {
		if($msType == 'mapserver') {
			$queryable = true;
		} else if($msType == 'wms') {
			$queryable = false;
		}
	}

	if($queryable) {
		for($l = 0; $l < $layers->length; $l++) {
			$layer = $layers->item($l);
			$path = $node->getAttribute('name').'/'.$layer->getAttribute('name');
			$identify = false;
			foreach($layersList as $ll) {
				if($path == $ll) {
					$identify = true;
				}
			}
			if($identify == true) {
				$nodeName = 'file';
				$params = '';
				if($msType == 'wms') {
					$nodeName = 'url';
					$paramElms = $node->getElementsByTagName('param');
					foreach($paramElms as $p) {
						$params = $params . '&' . $p->getAttribute('name') . '=' . $p->getAttribute('value');
					}
				}
				array_push($layersToIdentify, $msType.':'.$layer->getAttribute('name').':'.$node->getElementsByTagName($nodeName)->item(0)->nodeValue.$params);

			}
		}
	}
}

# Setup the Query Shape
$queryShape = ms_shapeObjFromWkt($shape);

# Generate the HTML from the Identify Function
$substArray = array();
$content = '';

if($queryShape->type == MS_SHAPE_POINT) {
	$point = $queryShape->line(0)->point(0);
	$substArray['mapx'] = $point->x;
	$substArray['mapy'] = $point->y;
} else {
	$point = $queryShape->getCentroid();
	$substArray['mapx'] = $point->x;
	$substArray['mapy'] = $point->y;
}



# Needed WMS Information
$wmsBBOX = ($point->x - 100). ',' . ($point->y - 100) . ',' . ($point->x + 100) . ',' . ($point->y + 100);
$wmsHeaderTemplate = implode('', file($CONFIGURATION['wms_header']));
$wmsRecordTemplate = implode('', file($CONFIGURATION['wms_record']));
$wmsFooterTemplate = implode('', file($CONFIGURATION['wms_footer']));

foreach($layersToIdentify as $mf) {
	$info = explode(':', $mf);
	if($info[0] == 'mapserver') {
		$path = $info[2];
		if(substr($path,0,1) == '.') {
			$path = $CONFIGURATION['root'].$path;
		}
		$map = ms_newMapObj($path);
		$q_shape = NULL;
		# This makes a slightly dangerous assumption, that if
		# you defined a map projection, the rest of the layers match.
		# Unfortunately, we query at the map level.  This is still a massive improvement
		# over <= 2.4 because before we ignored projection issues altogether.
		$map_proj = $map->getProjection();
		if($DEBUG) {
			error_log("Map Projection: ".$map_proj);
			error_log("Input Projection: ".$projection);
		}
		if($map_proj != NULL) {
			# turn it into a real projection object.
			$map_proj = ms_newprojectionobj($map_proj);
			# get the projection object from the CGI
			$shape_proj = ms_newprojectionobj($projection);
			# convert the shape into the appropriate coordinate system
			# using "reprojectWKT" from config.php
			$q_shape = ms_shapeObjFromWkt(reprojectWKT($queryShape->toWkt(), $shape_proj, $map_proj)); 
			if($DEBUG) {
				error_log('Input WKT: '.$queryShape->toWkt());
				error_log('Projected WKT: '.$q_shape->toWkt());
			}
		} else {
			$q_shape = $queryShape;
		}

		for($i = 0; $i < $map->numlayers; $i++) {
			$layer = $map->getLayer($i);
			if($info[1] == 'all' || $info[1] == $layer->name) {
				$layer->set('status', MS_DEFAULT);
				$layer->set('template', $layer->getMetaData('identify_record'));

				$max_features = $layer->getMetaData('identify_max_features');
				if($max_features) {
					$layer->set('maxfeatures', $max_features);
				}
			} else {
				$layer->set('status', MS_OFF);
			}
		}
		if($queryShape->type == MS_SHAPE_POINT) {
			$point = $q_shape->line(0)->point(0);
			$map->queryByPoint($point, MS_MULTIPLE, -1);
			$substArray['mapx'] = $point->x;
			$substArray['mapy'] = $point->y;
		} else {
			$map->queryByShape($q_shape);
		}
		$results = $map->processquerytemplate(array(), false);
		$content = $content . $results;
	} else if($info[0] == 'wms') {
		$wmsUrl = $info[2].'&SERVICE=WMS&VERSION=1.1.0&REQUEST=GetFeatureInfo&WIDTH=100&HEIGHT=100&X=50&Y=50&EXCEPTIONS=application/vnd.ogc.se_xml&LAYERS='.$info[1].'&QUERY_LAYERS='.$info[1].'&BBOX='.$wmsBBOX.'&SRS='.$projection.'&STYLES=&INFO_FORMAT=application/vnd.ogc.gml';
		#print '<a href="'.$wmsUrl.'"> WMS Link</a><br/>';

		# Resolve the url if relative
		$firstCh = substr($wmsUrl, 0, 1);
		if($firstCh == '/') {
			$wmsUrl = 'http://localhost'.$wmsUrl;
		} else {
			# Return an error here once error handling has been created.
		}

		# Fetch the GML
		$curlHandle = curl_init($wmsUrl);
		curl_setopt($curlHandle, CURLOPT_RETURNTRANSFER, 1);
		$gml = curl_exec($curlHandle);
		curl_close($curlHandle);

		# Now Parse the GML according to the gml_template
		$results = '';
		$gmlDoc = new DOMDocument();
		$gmlDoc->loadXML($gml);

		$gmlLayers = $gmlDoc->documentElement->childNodes;
		foreach($gmlLayers as $layer) {
			if($layer->childNodes->length > 0) {
				foreach($layer->childNodes as $feature) {
					$splitPos = strpos($feature->tagName, '_feature');
					$featureDict = array();
					if(!($splitPos === false)) {
						$featureDict['FEATURE_TITLE'] = substr($feature->tagName, 0, $splitPos-1);
						$featureLines = array();
						$results = $results . processTemplate($wmsHeaderTemplate, $featureDict);
						foreach($feature->childNodes as $attr) {
							if(substr($attr->tagName, 0, 3) != 'gml') {
								$featureDict['NAME'] = str_replace('_', ' ', $attr->tagName);

								$featureDict['VALUE'] = $attr->firstChild->nodeValue;
								$results = $results . processTemplate($wmsRecordTemplate, $featureDict);
							}

						}
						$featureDict['NAME']  = '';
						$featureDict['VALUE'] = '';
						$results = $results . processTemplate($wmsFooterTemplate, $featureDict);

					}
				}
			}
		}
		$content = $content . $results;
	}
}

$headerArray = file($CONFIGURATION['identify_header']);
$footerArray = file($CONFIGURATION['identify_footer']);

$contents = implode('', array_merge($headerArray, array($content)));
$footer_contents = implode('', $footerArray);

header('Content-type: application/xml');
print "<results>";
print "<script>";
print " GeoMOOSE.clearLayerParameters('highlight');";
print " GeoMOOSE.turnLayerOff('highlight/highlight');";
print "</script>";
print "<html><![CDATA[";
print processTemplate($contents, $substArray);
print "]]></html>";
print "<footer><![CDATA[";
print processTemplate($footer_contents, $substArray);
print "]]></footer>";
print "</results>";
?>
