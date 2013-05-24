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

$address = $_REQUEST['address'];
$googlekey = $_REQUEST['googlekey'];

$streetaddress = $address;

$url = "http://maps.google.com/maps/geo?output=xml&key=$googlekey";

$request_url = $url . "&q=" . urlencode($streetaddress);

$xml = simplexml_load_file($request_url) or die("url not loading");

$status = $xml->Response->Status->code;

if (strcmp($status, "200") == 0) {
      // Successful geocode
      $resolvedaddress = $xml->Response->name;

//print_r($xml);

 $coordinates = $xml->Response->Placemark->Point->coordinates;
      $coordinatesSplit = explode(",", $coordinates);
      // Format: Longitude, Latitude, Altitude
      $lat = $coordinatesSplit[1];
      $lng = $coordinatesSplit[0];

 header('Content-type: application/xml');
      print "<results>";
      print "<script>";
      print "<![CDATA[";
      print "";
      print "var p = new OpenLayers.Geometry.Point($lng,$lat);OpenLayers.Projection.transform(p,new OpenLayers.Projection('WGS84'),Map.getProjectionObject());GeoMOOSE.zoomToPoint(p.x,p.y,100);GeoMOOSE.addPopup(p.x,p.y,150,50,'<b>Address Resolved To:</b> <br/> $resolvedaddress');";
      print "]]>";
      print "</script>";
      print "<html>";
      print "<![CDATA[";
      print "";
      print "<b>Address Resolved To:</b> <br/> $resolvedaddress";
      print "]]>";
      print"</html>";
      print "</results>";
} else{
  header('Content-type: application/xml');
  print "<results>";
  print "<script>";
  print "</script>";
  print "<html>";
  print "<![CDATA[";
  print "";
  print "<h3><p style='color:red'>Unable to resolve address.</p></h3>";
  print "]]>";
  print"</html>";
  print "</results>";
}

?>
