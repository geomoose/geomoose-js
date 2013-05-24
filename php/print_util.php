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


function normalizePath($my_path_components, $url) {
	if(substr($url, 0, 7) == 'http://' or substr($url, 0, 8) == 'https://') {
		return $url;
	} elseif($url[0] == '/') {
		return 'http://localhost'.$url;
	} else {
		return 'http://localhost'.implode('/',$my_path_components).'/'.$url;
	}
}

$downloadCount = 0;
function getImage($url,$debug=false) {
	global $downloadCount, $CONFIGURATION;
#	$dlFileName = $outputFileName.'2';

	$dlFileName = $CONFIGURATION['temp'].'print_'.time().$downloadCount;
	$downloadCount += 1;
	if($debug) {
		error_log('GET IMAGE: '.$url);
	}
	$ch = curl_init($url);


	$outfile = fopen($dlFileName, "w");
	curl_setopt($ch, CURLOPT_FILE, $outfile);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_exec($ch);

	$mimetype = curl_getinfo($ch,CURLINFO_CONTENT_TYPE);
	curl_close($ch);
	fclose($outfile);

	$image = false;

	if(!(strpos($mimetype,'png') === false)) {
		$image = imagecreatefrompng($dlFileName);
	} elseif(!(strpos($mimetype,'gif') === false)) {
		$image = imagecreatefromgif($dlFileName);
	} elseif (!(strpos($mimetype,'jpeg') === false)) {
		$image = imagecreatefromjpeg($dlFileName);
	}

	return $image;
}

function normalizeURL($url) {
	global $CONFIGURATION;

	$mapserverUrl = $CONFIGURATION['mapserver_url'];

	$server = 'http://'.$CONFIGURATION['server_name'];
	if((int)$_SERVER['SERVER_PORT'] != 80) {
		$server = $server . ':' . $_SERVER['SERVER_PORT'];
	}

	$path_components = explode('/', $_SERVER['SCRIPT_NAME']);
	array_pop($path_components); # Remove script name
	array_pop($path_components); # Remove the php directory reference
	$serverRoot = implode('/', $path_components).'/';

	$normalized_url = null;

	if(substr($url,0,4)  == 'http') {
		# Do nothing as this url is absolute enough or our purposes.
		$normalized_url = $url;
	} else if($url[0] == '/') {
		$normalized_url = $server . $url;
	} else if($url[0] == '.') {
		$normalized_url = $server . $serverRoot . substr($url, 1);
	} else {
		$normalized_url = $server . $serverRoot . $url;
	}

	return $normalized_url;
}


function getWMSImage($layer, $mapW, $mapH, $extent, $debug=false) {
	global $CONFIGURATION;

	$url = $layer['url'];

	if(substr($url, sizeof($url)-2, 1) != '?') {
		$url = $url.'?';
	}

	$url = $url . 'SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&EXCEPTIONS=application%2Fvnd.ogc.se_inimage';

	# See if we specify the format in the params...
	if($layer['params']['format']) {
		$format = $layer['params']['format'];
		unset($layer['params']['format']);
	} else if($layer['params']['FORMAT']) {
		$format = $layer['params']['FORMAT'];
		unset($layer['params']['FORMAT']);
	} else {
		$format = 'image/jpeg';
	}

	# See if we specify the srs in the params...
	if($layer['params']['srs']) {
		$srs = $layer['params']['srs'];
		unset($layer['params']['srs']);
	} else if($layer['params']['SRS']) {
		$srs = $layer['params']['SRS'];
		unset($layer['params']['SRS']);
	} else {
		$srs = $CONFIGURATION['projection'];
	}

	# format the URL with our known parameters
	$url = $url . '&SRS='.$srs;
	$url = $url . '&FORMAT='.$format;
	$url = $url . '&WIDTH='.$mapW;
	$url = $url . '&HEIGHT='.$mapH;
	$url = $url . '&BBOX='.implode(',', $extent);
	$url = $url . '&LAYERS='.implode(',', $layer['layers']);

	# add the rest of the params to the URL:
	foreach($layer['params'] as $k=>$v) {
		$url = $url . '&' . $k . '=' . $v;
	}

	return getImage(normalizeURL($url), $debug);
}

function getAgsImage($layer, $mapW, $mapH, $extent, $debug=false) {
	global $CONFIGURATION;

	$url = $layer['url'];

	if(substr($url, sizeof($url)-2, 1) != '?') {
		$url = $url.'?';
	}

	# See if we specify the format in the params...
	if($layer['params']['format']) {
		$format = $layer['params']['format'];
		unset($layer['params']['format']);
	} else if($layer['params']['FORMAT']) {
		$format = $layer['params']['FORMAT'];
		unset($layer['params']['FORMAT']);
	} else {
		$format = 'JPEG';
	}

	# See if we specify the srs in the params...
	if($layer['params']['srs']) {
		$srs = $layer['params']['srs'];
		unset($layer['params']['srs']);
	} else if($layer['params']['SRS']) {
		$srs = $layer['params']['SRS'];
		unset($layer['params']['SRS']);
	} else {
		$srs = $CONFIGURATION['projection'];
	}

	$url = $url . '&F=image';
	$url = $url . '&SRS='.$srs;
	$url = $url . '&FORMAT='.$format;
	$url = $url . '&SIZE='.$mapW.','.$mapH;
	$url = $url . '&BBOX='.implode(',', $extent);

	# add the rest of the params to the URL:
	foreach($layer['params'] as $k=>$v) {
		$url = $url . '&' . $k . '=' . $v;
	}

	return getImage(normalizeURL($url), $debug);
}

function renderImage($mapbook, $layers_json,  $mapImageWidth, $mapImageHeight, $extent, $debug=false) {
	global $CONFIGURATION;

	$mapserverUrl = $CONFIGURATION['mapserver_url'];

	# setup a blank image with a white background.
	$printImage = imagecreatetruecolor($mapImageWidth, $mapImageHeight);
	$colorWhite =  imagecolorallocate($printImage, 255, 255, 255);
	imagefill($printImage, 0, 0, $colorWhite);

	$opacities = array();
	#echo "<br>".$layers_json;
	#echo "end json<br><br>";

	for($i = 0; $i < sizeof($layers_json); $i++) {
		$layer = $layers_json[$i];
		$image = null;
		$opacity = 100.0;

		if($layer["type"] == 'wms') {
			#echo "<br>WMS LAyer";
			$image = getWMSImage($layer, $mapImageWidth, $mapImageHeight, $extent, $debug);
		} elseif($layer["type"] == 'vector') {
			#echo "<br>VEctor Layer";
			$image = renderVector($layer, $mapImageWidth, $mapImageHeight, $extent);
		} elseif($layer["type"] == 'ags') {
			#echo "<br>AcgGIS Layer";
			$image = getAgsImage($layer, $mapImageWidth, $mapImageHeight, $extent, $debug);
		}
		if($image) {
			imagecopymerge_alpha($printImage, $image, 0, 0, 0, 0, $mapImageWidth, $mapImageHeight, (float)$opacity);
		}
	}

	//LK Hack for adding scalebar to prints

#	$scalebarUrl = $server . $mapserverUrl . "?map=" . $CONFIGURATION['root'] . "scalebar.map&mode=map&layers=all&mapext=";
#	$scalebarUrl .= implode('+', $extent);
#	$scalebarUrl .= "&map_size=";
#	$scalebarUrl .= $mapImageWidth . '+' . $mapImageHeight;
#	$scalebar = getImage($scalebarUrl);
#	ImageCopyMerge($printImage, $scalebar, 0, 0, 0, 0, $mapImageWidth, $mapImageHeight, 100);

	# now add the sketches on top of the map...
#	renderVector($sketches,$extent,$printImage,$mapImageWidth, $mapImageHeight);

#	renderVector($vector,$extent, $printImage, $mapImageWidth, $mapImageHeight);

	return $printImage;
}


function renderVector($layer,$mapW,$mapH,$extent) {
	global $CONFIGURATION;
	# setup a blank image with a white background.
	$layer_image= imagecreatetruecolor($mapW, $mapH);
	$white =  imagecolorallocatealpha($layer_image, 255, 255, 255, 127);
	imagefill($layer_image, 0, 0, $white);

	$features = $layer['features'];
	$n_features = sizeof($features);

	$mapfile = file_get_contents('print/print_shape_header.map');

#	echo "<br>" ; echo json_encode($layer);

	for($i = 0; $i < $n_features; $i++) {
		$shape = ms_shapeObjFromWKT($features[$i]['geometry']);
		# discover the layer type
		$layer_type = null;
		if($shape->{type} == MS_SHAPE_POLYGON) {
			$layer_type = 'POLYGON';
		} elseif($shape->{type} == MS_SHAPE_POINT) {
			$layer_type = 'POINT';
		} elseif($shape->{type} == MS_SHAPE_LINE) {
			$layer_type = 'LINE';
		}

		$layer_string = '';
		if($layer_type != null) {
			# setup the basic layer definition
			$layer_string .= "\nLAYER\nSTATUS DEFAULT\nTYPE ".$layer_type."\n";
			# and add a feature.
			$layer_string .= "\nFEATURE\nWKT '".$features[$i]['geometry']."'\nEND";

			# now create a class, and apply some styles.
			$layer_string .= "\nCLASS\n";

			# add a label as necessary
			if($features[$i]['style']['label']) {
				$layer_string .= "\n".'TEXT "'.$features[$i]['style']['label'].'"';
				$layer_string .= "\nLABEL\nPOSITION CC\nTYPE TRUETYPE\nFONT 'vera_sans'\nSIZE 10\nCOLOR 0 0 0\nEND";
			}

			# start a style
			# do the fill style
			foreach(array('fill','stroke') as $prefix) {
				$layer_string .= "\nSTYLE";
				$outline_width_set = false;
				foreach($features[$i]['style'] as $k=>$v) {
					switch($k) {
						case 'fillColor':
							if($prefix == 'fill') {
								$layer_string .= "\nCOLOR \"".colorToHex(translateColor($v))."\"";
							}
							break;
						case $prefix.'Opacity':
							$layer_string .= "\nOPACITY ". (floatval($v) * 100);
							break;
						case 'strokeColor':
							if($prefix == 'stroke') {
								$layer_string .= "\nOUTLINECOLOR \"".colorToHex(translateColor($v))."\"";
								if($outline_width_set == false) {
									$layer_string .= "\nWIDTH 4";
								}
							}
							break;
						case $prefix.'Width':
							$layer_string .= "\nWIDTH ".$v;
							$outline_width_set = true;
							break;
					}
				}

				# close the style
				$layer_string .= "\nEND";
			}


			# close somethings out.
			$layer_string .= "\nEND"; # end the class
			$layer_string .= "\nEND"; # end the layer
		}
		$mapfile .= $layer_string;
	}

	$mapfile .= "\nEND"; # the mapfile

	# get some unique identifiers.
	$uniqueId = 'sketch_'.time().getmypid();
	$tempDir = $CONFIGURATION['temp'];
	$filename_root = $tempDir.'/'.$uniqueId;
	$filename_map = $filename_root . '.map';
	$filename_png = $filename_root . '.png';

	# write the mapfile out to the disk
	$f = fopen($filename_map, 'w');
	fwrite($f, $mapfile);
	fclose($f);

#	echo "<br>";
#	echo json_encode($layer);
#	echo $filename_map;

	$sketch_map = ms_newMapObj($filename_map, $CONFIGURATION['root']);
	$sketch_map->setExtent($extent[0], $extent[1], $extent[2], $extent[3]);
	$sketch_map->setSize($mapW, $mapH);

	$sketches_image = $sketch_map->prepareImage();
	$sketches_image = $sketch_map->draw();

	$sketches_image->saveImage($filename_png);
	return ImageCreateFromPng($filename_png);
}

function imagecopymerge_alpha($dst_im, $src_im, $dst_x, $dst_y, $src_x, $src_y, $src_w, $src_h, $pct){

    // from:  http://www.php.net/manual/en/function.imagecopymerge.php#92787
    // creating a cut resource
    $cut = imagecreatetruecolor($src_w, $src_h);
    // copying that section of the background to the cut
    imagecopy($cut, $dst_im, 0, 0, $dst_x, $dst_y, $src_w, $src_h);

    // placing the foreground now
    imagecopy($cut, $src_im, 0, 0, $src_x, $src_y, $src_w, $src_h);


    imagecopymerge($dst_im, $cut, $dst_x, $dst_y, $src_x, $src_y, $src_w, $src_h, $pct);

}

# returns a 3 element array containing r,g,b as integers between 0 and 255
function translateColor($color, $fixWhite=false) {
	$basic_colors = array('aqua' => array(0,255,255), 'black' => array(0,0,0), 'blue' => array(0,0,255), 'fuchsia' => array(255,0,255), 'gray' => array(128,128,128), 'grey' => array(128,128,128), 'green' => array(0,128,0), 'lime' => array(0,255,0), 'maroon' => array(128,0,0), 'navy' => array(0,0,128), 'olive' => array(128,128,0), 'purple' => array(128,0,128), 'red' => array(255,0,0), 'silver' => array(192,192,192), 'teal' => array(0,128,128), 'white' => array(255,255,255), 'yellow' => array(255,255,0));
	$out_color = array();
	if($basic_colors[$color]) {
		$out_color = $basic_colors[$color];
	}

	# Six character hex code
	if(preg_match('/\#....../', $color)) {
		$r = substr($color, 1,2);
		$g = substr($color, 3,2);
		$b = substr($color, 5,2);
		$out_color = array(hexdec($r), hexdec($g), hexdec($b));
	# Three character hex code
	} elseif (preg_match('/\#.../', $color)) {
		$r = substr($color, 1,1);
		$g = substr($color, 2,1);
		$b = substr($color, 3,1);
		$r = $r.$r;
		$g = $g.$g;
		$b = $b.$b;
		$out_color = array(hexdec($r), hexdec($g), hexdec($b));
	# CSS RGB
	} elseif (preg_match('/rgb\(.+\)/', $color)) {

	}

	if($fixWhite == true) {
		# this prevents mapserver from nixing hte color while converting to transparent.
		if($out_color[0] == 255 and $out_color[1] == 255 and $out_color[2] == 255) {
			$out_color[2] = 254;
		}
	}
	return $out_color;
}

function colorToHex($color_array) {
	return sprintf("#%02x%02x%02x", $color_array[0], $color_array[1], $color_array[2]);
}

?>
