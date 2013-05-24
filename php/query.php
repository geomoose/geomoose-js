<?php
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
# GeoMOOSE Query Service
# (c) 2009-2012 Dan "Ducky" Little
#

include('config.php');

$DEBUG = false;

$LATLONG_PROJ = ms_newprojectionobj('epsg:4326');

# Turn off the warning reporting
if(!$DEBUG) {
	error_reporting(E_ERROR | E_PARSE);
}

class Comparitor {
	protected $p = array();

	public function __construct($msFormat, $sqlFormat) {
		$this->p['ms'] = $msFormat;
		$this->p['sql'] = $sqlFormat;
	}

	public function toMapServer($field_name, $value) {
		return sprintf($this->p['ms'], strtoupper($field_name), $value);
	}

	public function toSQL($field_name, $value) {
		return sprintf($this->p['sql'], $field_name, $value);
	}

}

class Operator {
	protected $ms_format = "";
	protected $sql_format = "";

	public function __construct($msFormat, $sqlFormat) {
		$this->ms_format = $msFormat;
		$this->sql_format = $sqlFormat;
	}

	public function toMapServer($v) {
		return sprintf($this->ms_format, $v);
	}

	public function toSQL($v) { 
		return sprintf($this->sql_format, $v);
	}
}

#
# In is "special" and requires a dedicated class
# Mostly, to deal with the fact that value = an array and
# different datasets will want to deal with the delimiter
# in a variable fashion. Frankly, we need more SQL injection filtering.
#
class InComparitor {
	protected $p = array();
	public function __construct() {
		$this->p['delim'] = ';';
	}

	public function setDelim($d) {
		$this->p['delim'] = $d;
	}

	public function convert_value($value, $out_delim) {
		return implode($out_delim, explode($this->p['delim'], $value));
	}

	public function toMapServer($field_name, $value) {
		return sprintf('"[%s]" in "%s"', $field_name, $this->convert_value($value, ","));
	}

	public function toSQL($field_name, $value) {
		return sprintf("%s in ('%s')", $field_name, $this->convert_value($value, "','"));
	}
}

$comparitors = array();
# string specific operations
# mapserver doesn't quite honor this the way I'd like it to but at the very least,
# the SQL databases will support it.
$comparitors['eq-str'] = new Comparitor('"[%s]" == "%s"', "%s = '%s'");
$comparitors['like'] = new Comparitor('"[%s]" =~ /.*%s.*/', "%s like '%%%s%%'");
$comparitors['left-like'] = new Comparitor('"[%s]" =~ /.*%s/', "%s like '%%%s'");
$comparitors['right-like'] = new Comparitor('"[%s]" =~ /%s.*/', "%s like '%s%%'");
$comparitors['like-icase'] = new Comparitor('"[%s]" ~* "%s"', "upper(%s) like '%%'||upper('%s')||'%%'");
$comparitors['left-like-icase'] = new Comparitor('"[%s]" ~* "%s$"', "%s like '%%'||upper('%s')");
$comparitors['right-like-icase'] = new Comparitor('"[%s]" ~* "^%s"', "%s like upper('%s')||'%%'");

# all other types
$comparitors['eq'] = new Comparitor('[%s] == %s', "%s = %s");
$comparitors['ge'] = new Comparitor('[%s] >= %s', '%s >= %s');
$comparitors['gt'] = new Comparitor('[%s] > %s', '%s > %s');
$comparitors['le'] = new Comparitor('[%s] <= %s', '%s <= %s');
$comparitors['lt'] = new Comparitor('[%s] < %s', '%s < %s');

$comparitors['in'] = new InComparitor();

$operators = array();

# MS, SQL formats
# this is probably a little redundant but C'est la Vie.
$operators['init'] = new Operator('(%s)', '%s');
$operators['and'] = new Operator('AND (%s)', 'and %s');
$operators['or'] = new Operator('OR (%s)', 'or %s');
$operators['nand'] = new Operator('AND (NOT (%s))', 'and not (%s)');
$operators['nor'] = new Operator('OR (NOT (%s))', 'or not (%s)');

class Predicate {
	protected $self = array();
	
	/*
	 * field_name = Field Name to search
	 * value = value to test against
	 * operator = operator class
	 * comparitor = comparitor class
	 * blank_okay (boolean) = set whether or not a blank value should be evaluated
	 */

	public function __construct($layer, $field_name, $value, $operator, $comparitor, $blank_okay = true) {
		$this->self['layer'] = $layer;
		$this->self['fname'] = $field_name;
		$this->self['val'] = $value;
		$this->self['op'] = $operator;
		$this->self['comp'] = $comparitor;
		$this->self['blank'] = $blank_okay;
	}

	public function getLayer() {
		return $this->self['layer'];
	}

	public function toMapServer() {
		if(((string)$this->self['val'] == '') and $this->self['blank']) {
			return '';
		}
		return $this->self['op']->toMapServer($this->self['comp']->toMapServer($this->self['fname'], $this->self['val']));
	}

	public function toSQL() {
		return $this->self['op']->toSQL($this->self['comp']->toSQL($this->self['fname'], $this->self['val']));
	}
}


$predicates = array();

# the mode!
$mode = get_request_icase('mode');
if(!isset($mode)) {
	if(get_request_icase('service') == 'WMS') {
		$mode = 'map';
	}
}
$highlightResults = parseBoolean(get_request_icase('highlight'));
$zoomToFirst = parseBoolean(get_request_icase('zoom_to_first'));

# layers to search
$query_layers = array();
$query_layers[0] = get_request_icase('layer0');

# this will check to see which template format should be used
# query/itemquery/select/popup/etc.
$query_templates = array();
$query_templates[0] = get_request_icase('template0');

if($DEBUG) {
	error_log("Got parameters.<br/>");
}

# get set of predicates
# I've only allowed for 255 right now... people will have to deal with this
for($i = 0; $i < 255; $i++) {
#	if(array_key_exists('operator'.$i, $_REQUEST) and $_REQUEST['operator'.$i] != NULL or $i == 0) {
	if(isset_icase('operator'.$i) or get_request_icase('operator'.$i) != NULL or $i == 0) {
		# see if the layer is different
		$layer = $query_layers[0];
		if(isset_icase('layer'.$i)) {
			$layer = get_request_icase('layer'.$i);
		}
		
		$template = $query_templates[0];
		if(isset_icase('template'.$i)) {
			$template = get_request_icase('template'.$i);
		}

		if(!in_array($layer, $query_layers) and $i > 0) {
			$query_layers[] = $layer;
			$query_templates[] = $template;
		}
		# check the opeartor
		$operator = false; $comparitor = false;

		if($i == 0) {
			$operator = $operators['init'];
		} else if(isset_icase('operator'.$i) and $operators[get_request_icase('operator'.$i)]) {
			$operator = $operators[get_request_icase('operator'.$i)];
		} else {
			# return error saying no valid operator found
		}

		if(isset_icase('comparitor'.$i) and $comparitors[get_request_icase('comparitor'.$i)]) {
			$comparitor = $comparitors[get_request_icase('comparitor'.$i)];
		} else {
			# return error saying there is no valid comparitor
		}

		$blank_okay = true;
		if(isset_icase('blanks'.$i) and strtolower(get_request_icase('blanks'.$i)) == 'false') {
			$blank_okay = false;
		}


		# if a value is not set for subsequent inputs, use the first input
		# this allows queries to permeate across multiple layers
		if(isset_icase('value'.$i)) {
			$value = urldecode(get_request_icase('value'.$i));
			$p = new Predicate($layer, get_request_icase('fieldname'.$i), $value, $operator, $comparitor, $blank_okay);
			$predicates[] = $p;
		}

	}
}

if($DEBUG) {
	error_log("Parsed.<br/>");
}

#
# Iterate through the layers and build the results set.
#

# Load the mapbook
$mapbook = getMapbook();
$msXML = $mapbook->getElementsByTagName('map-source');

# content stores the HTML results
$content = '';
$totalResults = 0;
$firstResult = false;

# store the features so we can render a map later
$resultFeatures = array();

# These are all the connection types, we ID the ones to be used as SQL versus MS regular expressions
# MS_INLINE, MS_SHAPEFILE, MS_TILED_SHAPEFILE, MS_SDE, MS_OGR, MS_TILED_OGR, MS_POSTGIS, MS_WMS, MS_ORACLESPATIAL, MS_WFS, MS_GRATICULE, MS_MYGIS, MS_RASTER, MS_PLUGIN
$SQL_LAYER_TYPES = array(MS_POSTGIS, MS_ORACLESPATIAL);
$NOT_SUPPORTED = array(MS_INLINE, MS_SDE, MS_WMS, MS_WFS, MS_GRATICULE, MS_RASTER, MS_PLUGIN, MS_OGR);

for($la = 0; $la < sizeof($query_layers); $la++) {

	# get the layer.
	for($map_source_i = 0; $map_source_i < $msXML->length; $map_source_i++) {
		$node = $msXML->item($map_source_i);
		$layers = $node->getElementsByTagName('layer');
		for($l = 0; $l < $layers->length; $l++) {
			$layer = $layers->item($l);
			$layerName = $layer->getAttribute('name');
			$path = $node->getAttribute('name').'/'.$layerName;
			if($path == $query_layers[$la]) {
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
					$predicate_strings = array();
					$is_sql = in_array($queryLayer->connectiontype, $SQL_LAYER_TYPES);
					for($i = 0; $i < sizeof($predicates); $i++) {
						if($predicates[$i]->getLayer() == $query_layers[$la]) {
							if($is_sql) {
								$predicate_strings[] = $predicates[$i]->toSQL();
							} else {
								$predicate_strings[] = $predicates[$i]->toMapServer();
							}
						}
					}
					# the filter string.
					$filter_string = implode(' ', $predicate_strings);

					# diag message
					if($DEBUG) {
	 				  error_log( 'Search Layer: '.$query_layers[$la].' Template: '.$query_templates[$la].' FILTER: '.$filter_string);
					  error_log( $is_sql);
					  error_log( $queryLayer->getMetaData($query_templates[$la]));
					}

					$queryLayer->set('status', MS_DEFAULT);

					if($queryLayer->getMetadata('itemquery_header')) {
						$queryLayer->set('header', $queryLayer->getMetadata('itemquery_header'));
					}
					if($queryLayer->getMetadata('itemquery_footer')) {
						$queryLayer->set('footer', $queryLayer->getMetadata('itemquery_footer'));
					}
					# we no long need to delineate between handling of SQL and Shapefile type layers.
					if($filter_string) {
						# WARNING! This will clobber existing filters on a layer.  
						if($is_sql) {
							$queryLayer->setFilter($filter_string);
						} else {
							$queryLayer->setFilter('('.$filter_string.')');
						}

					}
					$queryLayer->set('template', $queryLayer->getMetaData($query_templates[$la]));

					$ext = $queryLayer->getExtent();
					if($DEBUG) {
						error_log(implode(',', array($ext->minx,$ext->miny,$ext->maxx,$ext->maxy)));
						error_log("<br/>extent'd.<br/>");
					}
					#$queryLayer->setFilter($filter_string);
					#$queryLayer->set('filteritem', 'PARC_CODE');
					#$queryLayer->setFilter('1');
					#$queryLayer->setFilter('[PARC_CODE] == 1');
					#$queryLayer->queryByRect($queryLayer->getExtent());
					#$queryLayer->whichShapes($queryLayer->getExtent());
					#$queryLayer->whichShapes($ext);


					$queryLayer->open();
					if($DEBUG) { error_log('queryLayer opened'); }
					$queryLayer->queryByRect($ext);
					if($DEBUG) { error_log('queryLayer queried'); }

					$numResults = 0;

					$projection = $map->getProjection();
					if($queryLayer->getProjection() != NULL) {
						$projection = $queryLayer->getProjection();
					}
					if($projection != NULL) {
						# reproject the query shape as available.
						$projection = ms_newProjectionObj($projection);
					}
	
					for($i = 0; $i < $queryLayer->getNumResults(); $i++) {	
						$shape = $queryLayer->getShape($queryLayer->getResult($i));
						if($projection) {
							$shape->project($projection, $LATLONG_PROJ);
						}
						$resultFeatures[] = $shape;
						$numResults += 1;
					}
					if($DEBUG) { error_log('queryLayer iterated through.'); }

					$totalResults += $numResults;
					if($DEBUG) {
						error_log('Total Results: '.$numResults);
					}

					if($DEBUG) { error_log('qLayer finished'); }

					$map->queryByRect($ext);
					$results = $map->processquerytemplate(array(), MS_FALSE);
					if($DEBUG) { error_log('Results from MS: '.$results); }
					$content = $content . $results;
				}
			}
		}
	}

}

# 
# Didn't find any results
# so we're going to just say, "I found nothing" to the user and quit.
#
if($totalResults == 0) {
	header('Content-type: text/xml');
	print '<results><html><![CDATA[';
	print implode('', file($CONFIGURATION['query_miss']));
	print ']]></html></results>';
	exit(0);
}

if($mode == 'search') {
	header('Content-type: text/xml');
	print "<results n='".$totalResults."'>";
	print "<script><![CDATA[";
	$qlayers = implode(':', $query_layers);
	print "GeoMOOSE.turnLayerOn('$qlayers');\n";

	if($highlightResults) {
		print "GeoMOOSE.changeLayerUrl('highlight', './php/query.php');";
		$partial_params = array();
		foreach($_REQUEST as $p => $v) {
			if($p != 'mode') {
				array_push($partial_params, sprintf("'%s' : '%s'", $p, $v));
			}
		}
		$partial_params[] = "'TRANSPARENT' : 'true'";
		$partial_params[] = "'FORMAT' : 'image/png'";
		$partial_params[] = "'LAYERS' : 'highlight'";
		print "GeoMOOSE.clearLayerParameters('highlight');";
		print "GeoMOOSE.updateLayerParameters('highlight', {".implode(',',$partial_params)."});";
		print "GeoMOOSE.turnLayerOn('highlight/highlight');";
		print "GeoMOOSE.refreshLayers('highlight/highlight');";
	}

	# If there is only one results ... zoom to it!
	# or zoom to the first result if requested.
	if(($totalResults == 1 and $firstResult != false) or ($totalResults >= 1 and $zoomToFirst == true)) {
		$bounds = $firstResult->bounds;
		printf('GeoMOOSE.zoomToExtent(%f,%f,%f,%f);', $bounds->minx, $bounds->miny, $bounds->maxx, $bounds->maxy);
	}
	print "]]></script>";
	print "<html><![CDATA[";

	if(!array_key_exists('query_header', $CONFIGURATION) or $CONFIGURATION['query_header'] == NULL) {
		$CONFIGURATION['query_header'] = $CONFIGURATION['itemquery_header'];
	}

	if(!array_key_exists('query_footer', $CONFIGURATION) or $CONFIGURATION['query_footer'] == NULL) {
		$CONFIGURATION['query_footer'] = $CONFIGURATION['itemquery_footer'];
	}

	$headerArray = file($CONFIGURATION['query_header']);
	$footerArray = file($CONFIGURATION['query_footer']);
	$contents = implode('', array_merge($headerArray, array($content), $footerArray));
	print $contents;

	print "]]></html>";
	print "</results>";
} elseif($mode == 'map') {
	$path = '';

	$dict = array();
	$mapfile = implode('', file($path.'itemquery/highlight.map'));
	$mapfile = processTemplate($mapfile, $dict);

	$highlight_map = ms_newMapObjFromString($mapfile); 
	$polygonsLayer = $highlight_map->getLayerByName('polygons');
	$pointsLayer = $highlight_map->getLayerByName('points');
	$linesLayer = $highlight_map->getLayerByName('lines');

	$poly_features = '';

	for($i = 0; $i < sizeof($resultFeatures); $i++) {
		if($resultFeatures[$i]->type == MS_SHAPE_POINT) {
			$pointsLayer->addFeature($resultFeatures[$i]);
		} elseif($resultFeatures[$i]->type == MS_SHAPE_POLYGON) {
			$polygonsLayer->addFeature($resultFeatures[$i]);
		} elseif($resultFeatures[$i]->type == MS_SHAPE_LINE) {
			$linesLayer->addFeature($resultFeatures[$i]);
		}
	}

	# get the WMS parameters.
	$request = ms_newowsrequestobj();
	$request->loadparams();

	# handle the wms request
	ms_ioinstallstdouttobuffer();

	$highlight_map->owsdispatch($request);
	$contenttype = ms_iostripstdoutbuffercontenttype();

	# put the image out to the stdout with the content-type attached
	header('Content-type: '.$contenttype);
	ms_iogetStdoutBufferBytes();
	ms_ioresethandlers();
} else if($mode == 'results') {
	header("Content-type: text/plain");
	print $content;
} else {
	header('Content-type: text/html');
	print '<html><body>Error! Unknown mode!</body></html>';
}

?>
