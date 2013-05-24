/*
 * GeoMOOSE Site Configuration
 * This file should never be modified! Please use over rides
 * in the mapbook!
 */

var CONFIGURATION = {
	'links_bar_html' : "",
	'waiting_html' : 'Loading...',
	'mapserver_url' : "",
	'control_panel_side' : 'left',
	'mapfile_root' : "",
	'mapbook' : "php/getmapbook.php",
	'fractional_zoom' : false,
	'scales' : [1,2,4,8,16,32,64,128,256,500,1000,5000],
	'max_extent' : [189783.560000,4816309.330000,761653.524114,5472346.500000],
	'initial_extent' : [410438.542057,5125011.551363637,540998.542057,5163644.278636363],
	'projection' : "EPSG:26915",
	'ground_units' : 'm',
	'coordinate_display' : {
		xy: true,	/* Ground Units */
		latlon: true,	/* Longitude and Latitude */
		usng: true	/* U.S. National Grid */
	},
	'catalog_name' : 'Catalog',
	'group_checkboxes' : true,
	'flashy_bits' : true,
	'zoomto' : {},
	'jumpto_scales' : {
		'1:12000' : 12000,
		'1:2400' : 2400,
		'1:1200' : 1200,
		'1:120' : 120
	},
	'startup_service' : false,
	'toolbar' : {
		'show_labels' : false
	},
	'layer_control_order' : ['activate', 'up','down','fade','unfade','refresh','cycle','legend','metadata'],
	'layer_controls' : {
		'activate' : {on: false, tip: 'Activate ${layer} for use with layer contextual tools.'},
		/* Up and down are essentially deprecated, Duck 06/09/2012 */
		'up' : {on: false, tip: 'Move ${layer} up on the stack'},
		'down' : {on: false, tip: 'Move ${layer} down on the stack'},
		'fade' : {on: true, change_percent: 10, tip: 'Fade ${layer}'},
		'unfade' : {on: true, change_percent: 10, tip: 'Unfade ${layer}'},
		'refresh' : {on: false, tip: 'Manually refresh ${layer}'},
		'cycle' : {on: false, tip: 'Refresh ${layer} every 10 seconds', seconds: 10},
		'legend' : {on: true, tip: 'Show legend for ${layer}'},
		'metadata' : {on: true, tip: 'Show metadata for ${layer}'}
	},
	'layer_options' : {
		'transitionEffect': "null",
		'buffer': 0,
		'ratio': 1
	},
	'catalog' : {
		'toggle_controls' : true,
		'show_controls' :  true
	},
	'reference_map' : {
		'enabled' : true,
		'maximized' : true,
		'width': 250,
		'height':  100,
		'minimum_ratio' : 10,
		'maximum_ratio' : 20
	},
	'cursor' : {
		pan: "url(cursors/pan.gif) 9 9,url(cursors/pan.cur),move",
		zoomout: "url(cursors/zoomout2.gif) 5 5,url(cursors/zoomout2.cur),crosshair",
		zoomin: "url(cursors/zoomin2.gif) 5 5,url(cursors/zoomin2.cur),crosshair",
		measure: "url(cursors/measure2.gif),url(cursors/measure2.cur),crosshair",
		measurearea: "url(cursors/measure2.gif),url(cursors/measure2.cur),crosshair"
	},
	'scale_line' : {
		'enabled' : true,
		'top_units' : 'ft',
		'bottom_units' : 'mi',
		'width' : 200
	},
	'measure_tool' : {
		'precision' : 3,
		'style' : {
			"Point" : {
				pointRadius: 4,
				graphicName: "square",
				fillColor: "white",
				fillOpacity: 1,
				strokeWidth: 1,
				strokeOpacity: 1,
				strokeColor: "#333333"
			},
			"Line" : {
				strokeWidth: 2,
				strokeColor: "#FF0000"
			},
			"Polygon" : {
				strokeWidth: 2,
				strokeColor: "#FF0000",
				fillColor: "#00FF00",
				fillOpacity: .5
			}
		},
		'line_units' : 'ft',
		'area_units' : 'acre',
		'show_heading' : false
	},
	popups: {
		autosize: false
	},
	messages: {
		requirement_failure : 'You forgot to fill in a required field!',
		invalid_tool : 'SERVICE CONFIGURATION ERROR! Drawing tool %TOOL% not available!',
		service_config_error : 'SERVICE CONFIGURATION ERROR! You must specify a default tool when setting "show-tools" to "true"!',
		mapbook_invalid: 'Could not load a mapbook. If you are the system administrator, you should look into this, if you are not the system administrator you should tell them about this. Suggestions: <ol><li>The mapbook may not be returning XML.</li><li>The mapbook may be returning malformed XML.</li><li>PHP may not be responding.</li></ol>',
		mapbook_version : 'Specified mapbook version %VERSION% is older than 2.0. No promises this will work.',
		mapbook_param_error : 'Error reading the value of "%FIELD%", please check your mapbook configuration.',
		service_return_error : '<b>The service you called did not return valid XML.</b> If you are the system administrator, you should look into this, if you are not the system administrator you should tell them about this.'
	}
};
