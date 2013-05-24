<?php
/*Copyright (c) 2009-2011, Dan "Ducky" Little & GeoMOOSE.org

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
 * GeoMOOSE 2 Select Service
 */

$DEBUG = false;

include('config.php');

# Turn off the warning reporting
if(!$DEBUG) {
	error_reporting(E_ERROR | E_PARSE);
}

$projection = $CONFIGURATION['projection'];
if(array_key_exists('projection', $_REQUEST) and isset($_REQUEST['projection'])) {
	$projection = urldecode($_REQUEST['projection']);
}
# Make it into an object.
$shape_projection = ms_newprojectionobj($projection);

$tempDirectory = $CONFIGURATION['temp'];

# Setup the buffer values.
# ** ALL BUFFERS ASSUME METERS **
# "shape_buffer" is a buffer of the input shapes. 
# "selection_buffer" is a buffer the shapes selected by shape + shape_buffer
$shape_buffer = 0;
if(array_key_exists('shape_buffer', $_REQUEST) and isset($_REQUEST['shape_buffer'])) {
	$shape_buffer = $_REQUEST['shape_buffer'];
}
$selection_buffer = 0;
if(array_key_exists('selection_buffer', $_REQUEST) and isset($_REQUEST['selection_buffer'])) {
	$selection_buffer = $_REQUEST['selection_buffer'];
}

# Get the Query Shape
$shape_wkt = urldecode($_REQUEST['shape']);

# Make this a global to make life easier layer.
$LATLONG_PROJ = ms_newprojectionobj('epsg:4326');

# store this for later.
$drawnShape = reprojectWkt($shape_wkt, ms_newprojectionobj($projection), $LATLONG_PROJ);

# This is the layer where shapes are selected from
$selectLayer = $_REQUEST['select_layer'];
# This is the layer from where feature information is queried
$queryLayer = $_REQUEST['query_layer'];



# Load the mapbook
$mapbook = getMapbook();

# If the shape is not a polygon, then we'll make it one so the logic below makes more sense.
if(strtoupper(substr($shape_wkt,0,7)) != 'POLYGON' and $selection_buffer == 0) {
	$selection_buffer = 0.0001;
}

# create the selection shape
$selectShape = ms_shapeObjFromWkt($shape_wkt);
# convert shape to wgs84 for internal uses.
$selectShape->project($shape_projection, $LATLONG_PROJ);
if($DEBUG) {
	error_log('selection shape before buffer: '.$selectShape->toWkt());
}

# buffer the shape, 
$selectShape = saneBuffer($selectShape, NULL, $selection_buffer);

if($DEBUG) {
	error_log('Selection buffer: '.$selection_buffer);
	error_log('wgs84 Selection Shape: '.$selectShape->toWkt());
}

# $queryShapes is our global bucket for shapes against which we are
# going to query the selected layer.
$queryShapes = array();
# Add the initial selection shape to the query shapes array
$queryShapes[] = $selectShape;


# If we have a query layer from which to pull shapes, we'll do that.
if(isset($queryLayer) and $queryLayer != null and $queryLayer != '') {
	$queryMap = getMapfile($mapbook, $queryLayer);
	$layer = array_reverse(explode('/', $queryLayer));
	$layer = $layer[0];

	$shapeLayersToQuery = array();

	# open the map.
	$map = ms_newMapObj($CONFIGURATION['root'].$queryMap);
	# get it's projection.
	$map_proj = $map->getProjection();
	# turn it into a real projection object if it's not null.
	if($map_proj != NULL) {
		$map_proj = ms_newprojectionobj($map_proj);
	}

	# Open the layers.
	if($layer == 'all') {
		for($i = 0; $i < $map->numlayers; $i++) {
			array_push($shapeLayersToQuery, $map->getLayer($i));
		}
	} else {
		array_push($shapeLayersToQuery, $map->getLayerByName($layer));
	}

	for($i = 0; $i < sizeof($shapeLayersToQuery); $i++) {
		# Use the inheritance between map and layer projections to get the current
		# layer's projection
		$layer_projection = $map_proj;
		if($shapeLayersToQuery[$i]->getProjection() != NULL) {
			$layer_projection = ms_newprojectionobj($shapeLayersToQuery[$i]->getProjection());
		}
		# use WKT to create a copy of the shape object (which is in wgs84)
		if($DEBUG) {
			error_log($selectShape->toWkt());
		}
		$layer_query_shape = ms_shapeObjFromWkt($selectShape->toWkt());
		# $layer_query_shape = saneBuffer($layer_query_shape, NULL, $shape_buffer, $DEBUG);
		# convert it to local coordinates.
		$layer_query_shape->project($LATLONG_PROJ, $layer_projection);


		# setup a dummy template so mapscript will query against the layer.
		$shapeLayersToQuery[$i]->set('template','dummy.html');
		# do the query.
		$shapeLayersToQuery[$i]->open();
		$shapeLayersToQuery[$i]->queryByShape($layer_query_shape);

		$layer = $shapeLayersToQuery[$i];
		while($shape = $layer->nextShape()) {
			# okay, now we normalize these shapes to 4326, I need something normal
			# just for a second.
			# add it to our querying stack for later.
			if($layer_query_shape->intersects($shape) == MS_TRUE or $shape->containsShape($layer_query_shape) == MS_TRUE) {
				if($layer_projection != NULL) {
					# convert the shape to wgs84 for internal use.
					$shape->project($layer_projection, $LATLONG_PROJ);
				}

				if($shape_buffer > 0) {
					$queryShapes[] = saneBuffer($shape, NULL, $shape_buffer, $DEBUG);
				} else {
					$queryShapes[] = $shape;
				}
			} else {
				if($DEBUG) { error_log('MISS SHAPE!'); }
			}
		}
		# close the layer up, we're done with it.
		$shapeLayersToQuery[$i]->close();
	}
}

# Build a massive shape
$queryShape = array_pop($queryShapes); # this should be the initial selection area.
foreach($queryShapes as $shape) {
	$queryShape = $queryShape->union($shape);
}

# Load up the select map.
$selectMap = getMapfile($mapbook, $selectLayer);
$map = ms_newMapObj($CONFIGURATION['root'].$selectMap);
$layersToQuery = array();

$layer = array_reverse(explode('/', $selectLayer));
$layer = $layer[0];
if($layer == 'all') {
	for($i = 0; $i < $map->numlayers; $i++) {
		array_push($layersToQuery, $map->getLayer($i));
	}
} else {
	array_push($layersToQuery, $map->getLayerByName($layer));
}

$foundShapes = array();
$attributes = false;
$results = '';

for($i = 0; $i < $map->numlayers; $i++) {
	$layer = $map->getLayer($i);
	$layer->set('status', MS_OFF);	# Turn off extraneous layers
	$layer->set('template', ''); # this should prevent layers from being queried.
}

$queryShapeWkt = $queryShape->toWkt();
foreach($layersToQuery as $layer) {
	# fresh query shape
	$q_shape = ms_shapeObjFromWkt($queryShapeWkt);
	# Use the map, or layer projection if available.
	$projection = $map->getProjection();
	if($layer->getProjection() != NULL) {
		$projection = $layer->getProjection();
	}
	if($projection != NULL) {
		# reproject the query shape as available.
		if($DEBUG) {
			error_log('Projection: '.$projection);
			error_log('wgs84 q_shape: '.$q_shape->toWkt());
		}
		$projection = ms_newProjectionObj($projection);
		$q_shape->project($LATLONG_PROJ, $projection);
		if($DEBUG) {
			error_log('Projected Shape: '.$q_shape->toWkt());
		}
	}
	
	$layer->set('template', $layer->getMetadata('select_record'));
	if($layer->getMetadata('select_header')) {
		$layer->set('header', $layer->getMetadata('select_header'));
	}
	if($layer->getMetadata('select_footer')) {
		$layer->set('footer', $layer->getMetadata('select_footer'));
	}
	$layer->set('status', MS_DEFAULT);

	$layer->open();
	# we'll need these for later.
	$attributes = $layer->getItems();
	# query by our nice large, and now localized query shape.
	if($DEBUG) {
		error_log('select.php :: q_shape :'.$q_shape->toWkt());
	}
	$layer->queryByShape($q_shape);

	while($shape = $layer->nextShape()) {
		# if we have a projection, convert the shape into latlong
		if($q_shape->intersects($shape) == MS_TRUE or $shape->containsShape($q_shape) == MS_TRUE) {
			if($projection != NULL) {
				$shape->project($projection, $LATLONG_PROJ);
			}
			$foundShapes[] = $shape;
		}
	}

	if($DEBUG) {
		error_log('Found shapes: ' . sizeof($foundShapes));
	}
	$results = $results . $map->processquerytemplate(array(), false);
}

$fields = array();
array_push($fields, 'wkt_geometry text');
foreach($attributes as $attribute) {
	array_push($fields, $attribute.' text');
}

$uniqueId = 'select_'.getmypid().time();
$sqlFilename = $tempDirectory.'/'.$uniqueId.'.db';

# make a sqlite connection
try {
	$sqlite = new PDO('sqlite:'.$sqlFilename);
} catch(Exception $e) {
	echo "Failed to connect!<Br/>";
	echo $sqlFilename."<br/>";
	echo $e->getMessage();
}

# create the featuers table

$sqlite->beginTransaction();
$sqlite->exec('create table features ('.implode(',', $fields).')');
$sqlite->commit();

# Set up a few variables for substitution later
$dict = array();
$dict['LAYER_TYPE'] = 'POLYGON';
$dict['UNIQUEID'] = $uniqueId;
$dict['QUERYID'] = $uniqueId;
$dict['SHAPEPATH'] = $tempDirectory;

$dict['SHAPE_WKT'] = $shape_wkt;
$dict['SELECT_LAYER'] = $selectLayer;
$dict['QUERY_LAYER'] = $queryLayer;
$dict['SHAPE_BUFFER'] = $shape_buffer;
$dict['SELECTION_BUFFER'] = $selection_buffer;
$dict['SHOW_FOLLOWUP'] = 'block';
if($shape_buffer > 0.1) {
	$dict['SHOW_FOLLOWUP'] = 'none';
}

$dict['PROJECTION'] = 'epsg:4326'; #$CONFIGURATION['projection'];

# Create the shapefile
if(sizeof($foundShapes) > 0 and $foundShapes[0]->type == MS_SHAPE_POINT) {
	$dict['LAYER_TYPE'] = 'POINT';
}

foreach($foundShapes as $shape) {
	$recordArray = array();
	array_push($recordArray, $shape->toWKT());
	foreach($attributes as $attribute) {
		array_push($recordArray, $shape->values[$attribute]);
	}
	$sqlite->beginTransaction();
	$insert_sql = "insert into features values ('".implode("','", $recordArray)."')";
	$sqlite->exec($insert_sql);

	if($DEBUG) {
		error_log($insert_sql);
	}
	$sqlite->commit();
}

$sqlite->beginTransaction();
$sqlite->exec('create table selection (wkt_geometry text, area text)');
$cursor = $sqlite->prepare("insert into selection values (?,?)");

$shape = ''; $shape_type = '';
$cursor->bindParam(1, $shape);
$cursor->bindParam(2, $shape_type);

$shape = $drawnShape; $shape_type = 'DRAWN';
$cursor->execute();

$shape = $queryShape->toWKT(); $shape_type = 'QUERY';
$cursor->execute();
$sqlite->commit();

# Form the mapfile.
$mapfile = implode('', file($CONFIGURATION['highlight_map']));
$mapfile = processTemplate($mapfile, $dict);

$mapfileOut = fopen($tempDirectory.'/'.$uniqueId.'.map', 'w+');
fwrite($mapfileOut, $mapfile);
fclose($mapfileOut);


# All that work for a dozen lines of output.
header('Content-type: application/xml');
print "<results>";
print "<script><![CDATA[";

# This could be extended to better represent the selection and query polygon shapes later.
# Right now, it sets the layer to use the mapserver_url and then points mapserver to the
# proper map.
print " GeoMOOSE.clearLayerParameters('highlight');";
print " GeoMOOSE.turnLayerOff('highlight/highlight');";
print " GeoMOOSE.changeLayerUrl('highlight', CONFIGURATION.mapserver_url);";
print " GeoMOOSE.updateLayerParameters('highlight', { 'map' : '".$tempDirectory."/".$uniqueId.".map', 'FORMAT' : 'image/png', 'TRANSPARENT' : 'true'});";
print " GeoMOOSE.turnLayerOn('highlight/highlight');";
print " GeoMOOSE.refreshLayers('highlight/highlight');";
print "]]></script>";
print "<html><![CDATA[";
print '<b>Found Shapes: </b>'.sizeof($foundShapes).'<br/>';
print "<b>Query ID: </b>" . $uniqueId.'<br/>';
print processTemplate($results, $dict);
print "]]></html></results>";

?>
