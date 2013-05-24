// Library to convert between NAD83 Lat/Lon and US National Grid
// Based on the FGDC-STS-011-2001 spec at http://www.fgdc.gov/standards/projects/FGDC-standards-projects/usng/fgdc_std_011_2001_usng.pdf
// Also based on the UTM library already in GeoMOOSE
// By Jim Klassen 4/2008
// (c)2008 City of Saint Paul released under the City of Saint Paul Open Source License

/*
 * Modified on 9/16/2011 by Duck to work with dojo dynloader. Modifications made 
 * under GeoMOOSE License.
 */

dojo.provide('GeoMOOSE.USNG');

window.UTM = function() {
	
	// Functions to convert between lat,lon and utm. Derived from visual basic
	// routines from Craig Perault. This assumes a NAD83 datum.
	
	// constants
	var MajorAxis = 6378137.0;
	var MinorAxis = 6356752.3;
	var Ecc = (MajorAxis * MajorAxis - MinorAxis * MinorAxis) / (MajorAxis * MajorAxis);
	var Ecc2 = Ecc / (1.0 - Ecc);
	var K0 = 0.9996;
	var E4 = Ecc * Ecc;
	var E6 = Ecc * E4;
	var degrees2radians = Math.PI / 180.0;
	
	// Computes the meridian distance for the GRS-80 Spheroid.
	// See equation 3-22, USGS Professional Paper 1395.
	function meridianDist(lat) {
		var c1 = MajorAxis * (1 - Ecc / 4 - 3 * E4 / 64 - 5 * E6 / 256);
		var c2 = -MajorAxis * (3 * Ecc / 8 + 3 * E4 / 32 + 45 * E6 / 1024);
		var c3 = MajorAxis * (15 * E4 / 256 + 45 * E6 / 1024);
		var c4 = -MajorAxis * 35 * E6 / 3072;
		
		return(c1 * lat + c2 * Math.sin(lat * 2) + c3 * Math.sin(lat * 4) + c4 * Math.sin(lat * 6));
	}
	
	// Convert lat/lon (given in decimal degrees) to UTM, given a particular UTM zone.
	this.fromLatLong = function(zone, latlon) {
		var utm = new OpenLayers.Geometry.Point();
		
		var centeralMeridian = -((30 - zone) * 6 + 3) * degrees2radians;
		
		var lat = latlon.y * degrees2radians;
		var lon = latlon.x * degrees2radians;
		
		var latSin = Math.sin(lat);
		var latCos = Math.cos(lat);
		var latTan = latSin / latCos;
		var latTan2 = latTan * latTan;
		var latTan4 = latTan2 * latTan2;
		
		var N = MajorAxis / Math.sqrt(1 - Ecc * (latSin*latSin));
		var c = Ecc2 * latCos*latCos;
		var a = latCos * (lon - centeralMeridian);
		var m = meridianDist(lat);
		
		var temp5 = 1.0 - latTan2 + c;
		var temp6 = 5.0 - 18.0 * latTan2 + latTan4 + 72.0 * c - 58.0 * Ecc2;
		var temp11 = Math.pow(a, 5);
		
		utm.x = K0 * N * (a + (temp5 * Math.pow(a, 3)) / 6.0 + temp6 * temp11 / 120.0) + 500000;
		
		var temp7 = (5.0 - latTan2 + 9.0 * c + 4.0 * (c*c)) * Math.pow(a,4) / 24.0;
		var temp8 = 61.0 - 58.0 * latTan2 + latTan4 + 600.0 * c - 330.0 * Ecc2;
		var temp9 = temp11 * a / 720.0;
		
		utm.y = K0 * (m + N * latTan * ((a * a) / 2.0 + temp7 + temp8 * temp9))
			
			return(utm);
	}
	
	function CSq(value) {
		return value*value;
	}
	
	// Convert UTM coordinates (given in meters) to Lat/Lon (in decimal degrees), given a particular UTM zone.
	this.toLatLong = function(zone, utm) {
		var latlon = new Point();
		
		var centeralMeridian = -((30 - zone) * 6 + 3) * degrees2radians;
		
		var temp1 = Math.sqrt(1.0 - Ecc);
		var ecc1 = (1.0 - temp1) / (1.0 + temp1);
		var ecc12 = ecc1 * ecc1;
		var ecc13 = ecc1 * ecc12;
		var ecc14 = ecc12 * ecc12;
		
		utm.x = utm.x - 500000.0;
		
		var m = utm.y / K0;
		var um = m / (MajorAxis * (1.0 - (Ecc / 4.0) - 3.0 * (E4 / 64.0) - 5.0 * (E6 / 256.0)));
		
		var temp8 = (1.5 * ecc1) - (27.0 / 32.0) * ecc13;
		var temp9 = ((21.0 / 16.0) * ecc12) - ((55.0 / 32.0) * ecc14);
		
		var latrad1 = um + temp8 * Math.sin(2 * um) + temp9 * Math.sin(4 * um) + (151.0 * ecc13 / 96.0) * Math.sin(6.0 * um);
		
		var latsin1 = Math.sin(latrad1);
		var latcos1 = Math.cos(latrad1);
		var lattan1 = latsin1 / latcos1;
		var n1 = MajorAxis / Math.sqrt(1.0 - Ecc * CSq(latsin1));
		var t2 = CSq(lattan1);
		var c1 = Ecc2 * CSq(latcos1);
		
		var temp20 = (1.0 - Ecc * CSq(latsin1));
		var r1 = MajorAxis * (1.0 - Ecc) / Math.sqrt(CSq(temp20) * temp20);
		
		var d1 = utm.x / (n1*K0);
		var d2 = CSq(d1);
		var d3 = d1 * d2;
		var d4 = CSq(d2);
		var d5 = d1 * d4;
		var d6 = CSq(d3);
		
		var t12 = CSq(t2);
		var c12 = CSq(c1);
		
		temp1 = n1 * lattan1 / r1;
		temp2 = 5.0 + 3.0 * t2 + 10.0 * c1 - 4.0 * c12 - 9.0 * Ecc2;
		temp4 = 61.0 + 90.0 * t2 + 298.0 * c1 + 45.0 * t12 - 252.0 * Ecc2 - 3.0 * c12;
		temp5 = (1.0 + 2.0 * t2 + c1) * d3 / 6.0;
		temp6 = 5.0 - 2.0 * c1 + 28.0 * t2 - 3.0 * c12 + 8.0 * Ecc2 + 24.0 * t12;
		
		latlon.y = (latrad1 - temp1 * (d2 / 2.0 - temp2 * (d4 / 24.0) + temp4 * d6 / 720.0)) * 180 / Math.PI;
		latlon.x = (centeralMeridian + (d1 - temp5 + temp6 * d5 / 120.0) / latcos1) * 180 / Math.PI;
		utm.x = utm.x + 500000.0;
		
		return (latlon);
	}
	
}

window.USNG = function() {
	
	// Converts a lat, lon point (NAD83) into a USNG coordinate string
	// of precision where precision indicates the number of digits used
	// per coordinate (0 = 100,000m, 1 = 10km, 2 = 1km, 3 = 100m, 4 = 10m, ...)
	this.fromLatLong = function(latlong, precision) {
		usng_string = new String();
		var lon = latlong.x;
		var lat = latlong.y;
		
		//
		// Find Grid Zone Designation
		//
		var GZnumber;
		var GZletter;
		
		while(lon < -180) {
			lon += 180;
		}
		while(lon > 180) {
			lon -= 180;
		}
		// -180 = 180W is grid 1... increment every 6 degrees going east
		// Note [-180, -174) is in grid 1, [-174,-168) is 2, [174, 180) is 60 
		GZnumber = Math.floor((lon - (-180.0)) / 6.0) + 1;
		
		if(! ((lat > -90) && (lat < 90) )) {
			return('error lat'+lat +' must be between in (-90,90)... no playing at the poles, yet');
		} else {
			a = new Array();
			a = ['C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X'];
			GZletter = a[Math.floor((lat - (-80.0)) / 8)]; 
		}
		
		//
		// Find the correct UTM Zone (ok... this is sneaky... it = GZnumber N or S)
		//
		
		var utm = new UTM();
		utm_pt = utm.fromLatLong(GZnumber, latlong);
		
		//
		// Now need to figure out which 100,000m grid square were in
		//
		var GridSq='';
		
		var GridSqSet = (GZnumber % 6);
		if(GridSqSet == 0) GridSqSet = 6;
		var NSLetters135 = ['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V'];
		var NSLetters246 = ['F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','A','B','C','D','E'];
		
		var EWLetters14 = ['A','B','C','D','E','F','G','H'];
		var EWLetters25 = ['J','K','L','M','N','P','Q','R'];
		var EWLetters36 = ['S','T','U','V','W','X','Y','Z'];
		
		var GridEIdx = Math.floor(utm_pt.x / 100000) - 1; //(should be [100000,9000000])
		var GridNIdx = Math.floor((utm_pt.y%2000000) / 100000);
		switch(GridSqSet) {
			case 1:
				GridSq = EWLetters14[GridEIdx] + NSLetters135[GridNIdx];
				break;
			case 2:
				GridSq = EWLetters25[GridEIdx] + NSLetters246[GridNIdx];
				break;
			case 3:
				GridSq = EWLetters36[GridEIdx] + NSLetters135[GridNIdx];
				break;
			case 4:
				GridSq = EWLetters14[GridEIdx] + NSLetters246[GridNIdx];
				break;
			case 5:
				GridSq = EWLetters25[GridEIdx] + NSLetters135[GridNIdx];
				break;
			case 6:
				GridSq = EWLetters36[GridEIdx] + NSLetters246[GridNIdx];
				break;
			default:
				alert("shouldn't get here");
		}

		
		// Calc Easting and Northing integer to 100,000s place
		var Easting = Math.floor(utm_pt.x % 100000).toString();
		var Northing = Math.floor(utm_pt.y % 100000).toString();
		
		while(Easting.length < 5) Easting = '0' + Easting;
		while(Northing.length < 5) Northing = '0' + Northing;
		
		// Add on any fractional digits, no '.'... this is flaky yet use toFixed(precision-6)?
		//Easting = Easting + ((utm_pt.x % 100000) - Math.floor(utm_pt.x % 100000)).toString();
		//Northing = Northing + ((utm_pt.y % 100000) - Math.floor(utm_pt.y % 100000)).toString();
		
		Easting = Easting.substr(0, precision);
		Northing = Northing.substr(0, precision);
		
		//usng_string = "UTM " + utm_pt.x + "," + utm_pt.y + "   " + String(GZnumber) + GZletter + GridSq + Easting + ' '+ Northing; 
		usng_string = String(GZnumber) + GZletter + " " + GridSq + " " + Easting + " " + Northing;
		return(usng_string);
	}
	
	
}

