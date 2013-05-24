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

# I'd really prefer to use the PIN but I'll use the OBJECTID for now.

# Turn off the warning reporting

$DEBUG = false;

if(!$DEBUG) {
	error_reporting(E_ERROR | E_PARSE);
}

include('config.php');
include('print_util.php');

require('fpdf/fpdf.php');
require('fpdi/fpdi.php');


$path = explode('/', $_REQUEST['src']);

# Load the mapbook
$mapbook = getMapbook();
$mapfile = getMapfile($mapbook, $_REQUEST['src']);

$mapObj = ms_newMapObj($CONFIGURATION['root'].$mapfile);
$layer = false;
if($path[1] == 'all') {
	$layer = $mapObj->getLayer(0); # Don't use all...
} else {
	$layer = $mapObj->getLayerByName($path[1]);
}

if($layer == false) {
	header("Content-type: text/plain");
	print 'Could not open src: '.$_REQUEST['src'];
#	exit(0);
}

# Open the template 
$template_info = new DOMDocument();
$template_info->load('../../conf/feature_report/'.$layer->getMetadata('feature_report'));

# get the query information and set it on the layer
$query_info = $template_info->getElementsByTagName('query')->item(0);
$qItem = $query_info->getAttribute('item');
$layer->set('filteritem', $qItem);
$layer->setFilter(str_replace('%qstring%', $_REQUEST[$qItem], $query_info->getAttribute('string')));

$shape = false;
$layer->set('template', 'dummy.html');
$layer->set('status', MS_DEFAULT);
$layer->queryByRect($mapObj->extent);
$layer->open();
$shape = $layer->nextShape();
#$result = $layer->getNextResult(0);
#$shape = $layer->getShape($result);
$layer->close();

# Open the PDF Template
$pdf = new FPDI();
$template = $template_info->getElementsByTagName('template')->item(0)->firstChild->nodeValue;
$pdf->setSourceFile('../../conf/feature_report/'.$template);

$tplidx = $pdf->importPage(1, '/MediaBox');
$templateSize = array(((float)8.5)*72,((float)11)*72); 

$pdf->SetAutoPageBreak(false);

$pdf->addPage('P', $templateSize);
$pdf->useTemplate($tplidx, 0, 0, $templateSize[0], $templateSize[1]);


# Set the map location
$map_info = $template_info->getElementsByTagName('map')->item(0);
$imageW = ((float)$map_info->getAttribute('w'))*72;
$imageH = ((float)$map_info->getAttribute('h'))*72;
$imageX = ((float)$map_info->getAttribute('x'))*72;
$imageY = ((float)$map_info->getAttribute('y'))*72;

$mapObj->setExtent($shape->bounds->minx,$shape->bounds->miny,$shape->bounds->maxx,$shape->bounds->maxy);
$mapObj->setSize($imageW, $imageH);
#$mapObj->selectOutputFormat('agg/jpeg');
$mapObj->selectOutputFormat('JPEG');
$image = $mapObj->prepareImage();
$image = $mapObj->draw();

# Save the image using a unique name
$uniqueId = 'print_'.time().getmypid();
$tempDir = $CONFIGURATION['temp'];
$image->saveImage($tempDir.$uniqueId.'_pdf.jpg');
$pdf->Image($tempDir.$uniqueId.'_pdf.jpg', $imageX, $imageY, $imageW, $imageH);


$pdf->SetTextColor(0,0,0);
$pdf->SetFont('Helvetica', '', 32);

$fields = $template_info->getElementsByTagName('field');
for($i = 0; $i < $fields->length; $i++) {
	$field = $fields->item($i);

	$pdf->SetXY(((float)$field->getAttribute('x'))*72, ((float)$field->getAttribute('y'))*72);
	$printString = $field->getAttribute('title').' '.$field->getAttribute('src');
	$format = '%s';
	if($field->getAttribute('format')) {
		$format = $field->getAttribute('format');
	}
	foreach($shape->values as $k => $v) {
		$printString = str_replace('%'.$k.'%', sprintf($format, $v), $printString);
	}
	$pdf->Cell(0,.25,$printString);
}


#header('Content-type: application/pdf');
#$pdf->Output();

$pdf->Output($tempDir.$uniqueId.'.pdf');

header('Content-type: application/xml');
print '<results>';
print '<script>';
print 'GeoMOOSE.download("'.$uniqueId.'","pdf");';
print '</script>';
print '<html></html>';
print '</results>';

?>
