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

include('config.php');

# Turn off the warning reporting
# error_reporting(E_ERROR | E_PARSE);

$layer = $_REQUEST['layer'];
$shape = $_REQUEST['shape'];

$layersToSearch = explode(':', $layer);
$layersToSearch = $layersToSearch[0]; //See ticket #24 LK 11/16/10
$queryShape = ms_shapeObjFromWkt($shape);

$mapbook = getMapbook();
$msXML = $mapbook->getElementsByTagName('map-source');

# Array to store the popups found.
$content = '';
for($i = 0; $i < $msXML->length; $i++) {
	$node = $msXML->item($i);
	$layers = $node->getElementsByTagName('layer');
	for($l = 0; $l < $layers->length; $l++) {
		$layer = $layers->item($l);
		$layerName = $layer->getAttribute('name');
		$path = $node->getAttribute('name').'/'.$layerName;
		if($path == $layersToSearch) {
			$file = $node->getElementsByTagName('file')->item(0)->firstChild->nodeValue;
			# Okay, now it's time to cook
			if(substr($file,0,1) == '.') {
				$file = $CONFIGURATION['root'].$file;
			}

			$map = ms_newMapObj($file);

			# Create an array of query layers
			$queryLayers = array();
			if($layerName == 'all') {
				for($ml = 0; $ml < $map->numlayers; $ml++) {
					array_push($queryLayers, $map->getLayer($ml));
				}
			} else {
				# Turn on the specific layer
				array_push($queryLayers, $map->getLayerByName($layerName));
			}

			# Iterate through the queryLayers...
			foreach($queryLayers as $queryLayer) {
				$queryLayer->set('template', $queryLayer->getMetaData('popups'));
				$queryLayer->set('status', MS_DEFAULT);

				if($queryShape->type == MS_SHAPE_POINT) {
					$point = $queryShape->line(0)->point(0);
					$queryLayer->queryByPoint($point, MS_MULTIPLE, -1);
				} else {
					$queryLayer->queryByShape($queryShape);
				}
			}
			$results = $map->processquerytemplate(array(), false);
			$content = $content . $results;
		}
	}
}

$select_point = false;
if($queryShape->type == MS_SHAPE_POINT) {
	$select_point = $queryShape->line(0)->point(0);
} else {
	$select_point = $shape->getCentroid();
}

$content = str_replace('[mousex]', $select_point->x, $content);
$content = str_replace('[mousey]', $select_point->y, $content);

header('Content-type: text/xml');
print "<results>";
print "<script><![CDATA[";
print "]]></script>";
print $content;
print "</results>";
?>
