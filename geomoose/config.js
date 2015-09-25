/*
 * GeoMOOSE Site Configuration
 * This file should never be modified! Please use over rides
 * in the mapbook!
 */

var CONFIGURATION = {
	/** links_bar_html - HTML to be contained in the bar after the header and before the toolbar. */
	'links_bar_html' : "",
	/** waiting_html - Message to use when a user is waiting for something to load. */
	'waiting_html' : 'Loading...',
	/** mapserver_url - The URL to use for MapServer-type map sources. */
	'mapserver_url' : "",
	/** control_panel_side - Change which side on which the control panel resides. */
	'control_panel_side' : 'left',
	/** mapfile_root - The filesystem path on which all mapfiles reside. Used for Mapserver-type map sources. */
	'mapfile_root' : "",
	/** mapbook - The URL to the mapbook. Defaults to php/getmapbook.php. */
	'mapbook' : "php/getmapbook.php",
	/** fractional_zoom - Toggles whether 'in between' zooms or strict steps should be supported. */
	'fractional_zoom' : false,
	/** scales - List of scales to be used in the zoom-ladder. */
	'scales' : [1,2,4,8,16,32,64,128,256,500,1000,5000],
	/** max_extent - The maximum bounding box of the map. */
	'max_extent' : [189783.560000,4816309.330000,761653.524114,5472346.500000],
	/** initial_extent - The initial bounding box view of the map. */
	'initial_extent' : [410438.542057,5125011.551363637,540998.542057,5163644.278636363],
	/** projection - The projection to be used for the map. */
	'projection' : "EPSG:26915",
	/** ground_units - Set the ground units of the map. Defaults to 'm'. */
	'ground_units' : 'm',
	'coordinate_display' : {
		xy: true,	/** coordinate_display.xy - Toggle whether Ground Units will be displayed in the coordinate display. Defaults true. */
		latlon: true,	/** coordinate_display.latlon - Toggle whether Longitude and Latitude will be displayed in the coordinate display. Defaults true. */
		usng: true	/** coordinate_display.usng - Toggle whether U.S. National Grid will be displayed in the coordinate display. Defaults true. */
	},
	/** catalog_name - Set the catalog's label. Defaults to 'Catalog' */
	'catalog_name' : 'Catalog',
	/** group_checkboxes - Allow entire groups to be toggled on or off with a global checkbox. Defaults to true.  */
	'group_checkboxes' : true,
	/** flashy_bits - Toggles Animations on or off. Defaults to true*/
	'flashy_bits' : true,
	/** zoomto - Object representing the zoom to drop downs. */
	'zoomto' : {},
	/** jumpto_scales - Object containing the label:scale values for the scale jumper. */
	'jumpto_scales' : {
		'1:12000' : 12000,
		'1:2400' : 2400,
		'1:1200' : 1200,
		'1:120' : 120
	},
	/** startup_service - Service to call at startup. Defaults to false */
	'startup_service' : false,
	'toolbar' : {
		'show_labels' : false /** toolbar.show_labels - Toggles whether the toolbar should render all labels by default. Defaults to false. */
	},
	/** layer_control_order - Changes the display order of the layer controls.  Stored as an array. */
	'layer_control_order' : [
		'activate', 'popups', 
		'up','down',
		'fade','unfade',
		'refresh',
		'draw-point','draw-line','draw-polygon',
		'edit-shape', 'edit-attributes',
		'remove-feature', 'remove-all-features',
		'cycle','legend','metadata'
	],
	/** layer_controls - object containing objects describing the layer controls. */
	'layer_controls' : {
		'activate' : {on: false, tip: 'Activate ${layer} for use with layer contextual tools.'},
		'popups' : {on: false, tip: 'Show Floating Popups for ${layer}'},
		'draw-polygon' : {on: false, tip: 'Draw Polygon on ${layer}'},
		'draw-point' : {on: false, tip: 'Draw Point on ${layer}'},
		'draw-line' : {on: false, tip: 'Draw Line on ${layer}'},
		'edit-shape' : {on: false, tip: 'Edit a shape in ${layer}'},
		'edit-attributes' : {on: false, tip: 'Change attributes for a feature in ${layer}'},
		'remove-feature' : {on: false, tip: 'Remove Feature from ${layer}'},
		'remove-all-features' : {on: false, tip: 'Remove ALL Features from ${layer}'},
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
		/** layer_options.transitionEffect - OpenLayers defined transition effect for all layers. Defaults to null. */
		'transitionEffect': "null",
		/** layer_options.buffer - OpenLayers vector layer buffer radius. Defaults to 0. */
		'buffer': 0,
		/** layer_options.ratio - OpenLayers "ratio" for vector layers. Defaults to 1. */
		'ratio': 1
	},
	'catalog' : {
		/** catalog.toggle_controls - Turn on or off the ability to hide the layer controls in the catalog. Defaults to true. */
		'toggle_controls' : true,
		/** catalog.show_controls - Turn on or off the controls in the catalog. Defaults to true. */ 
		'show_controls' :  true
	},
	/** reference_map - Not yet implemented. */
	'reference_map' : {
		'enabled' : true,
		'maximized' : true,
		'width': 250,
		'height':  100,
		'minimum_ratio' : 10,
		'maximum_ratio' : 20
	},
	/** cursor - Object of CSS cursor definitions */
	'cursor' : {
		/** cursor.pan - CSS for pan tool. */
		pan: "url(cursors/pan.gif) 9 9,url(cursors/pan.cur),move",
		/** cursor.zoomout - CSS for zoomout tool. */
		zoomout: "url(cursors/zoomout2.gif) 5 5,url(cursors/zoomout2.cur),crosshair",
		/** cursor.zoomin - CSS for zoomin tool. */
		zoomin: "url(cursors/zoomin2.gif) 5 5,url(cursors/zoomin2.cur),crosshair",
		/** cursor.measure - CSS for measure tool. */
		measure: "url(cursors/measure2.gif),url(cursors/measure2.cur),crosshair",
		/** cursor.measurearea - CSS for measurearea tool. */
		measurearea: "url(cursors/measure2.gif),url(cursors/measure2.cur),crosshair"
	},
	'scale_line' : {
		/** scale_line.enabled - Toggle whether the scale lien should be displayed on the map. Defaults to true. */
		'enabled' : false,
		/** scale_line.top_units - What units to display on the top of the scale line. */
		'top_units' : 'ft',
		/** scale_line.bottom_units - What units to display on the bottom of the scale line. */
		'bottom_units' : 'mi',
		/** scale_line.width - The width, in pixels, of the scale line. */
		'width' : 200
	},
	/** measure_tool - options for the measure tools. */
	'measure_tool' : {
		/** measure_tool.precision - Number of digits to display in the readings. */
		'precision' : 3,
		/** measure_tool.style - OpenLayers style object. */
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
		/** measure_tool.line_units - Default units to use for Line measurements. */
		'line_units' : 'ft',
		/** measure_tool.area_units - Default units to use for Area measurements. */
		'area_units' : 'acre'
	},
	/** default_tool - Tool to default to when GeoMOOSE.activateDefaultTool is called. */
	default_tool: 'pan',
	/** popups - options for controlling the behavior of popups. */
	popups: {
		/** popups.left_offset - This is used in conjunction with popup CSS styling to properly position the mouse after a popup has been dragged. */
		left_offset: 43,
		/** popups.clearOnMove - Toggle whether popups should clear themselves when the user moves from the focus. */
		clearOnMove: true
	},
	/** services - Options for controlling the behaviour of services. */
	services: {
		/** services.disable_hidden_tabs - Toggle whether to disable tables when they have been hidden. Defaults to false. */
		disable_hidden_tabs: false,
		highlight_layer: 'highlight/highlight',
		/** services.disable_others - Toggle whether tools and other tabs should be disabled when starting a service. */
		disable_others: true,
		/** services.cancel_label - The label for the cancel button in the service tab. */
		cancel_label: 'Close',

		/** services.tools - default tools for spatial steps. */
		tools: {
			/** services.tools.pan - Show the pan tool for spatial steps. */ 
			'pan' : {
				'status' : true,
				'title': 'Navigate'
			}, 
			/** services.tools.edit-polygon - Show the edit polygon tool for spatial steps. */ 
			'edit-polygon' : {
				'status' : false,
				'title' : 'Edit Polygon'
			},
			/** services.tools.point - Show the edit draw point for spatial steps. */ 
			'point' : {
				'status' : true,
				'title' : 'Draw Point'
			}, 
			/** services.tools.line - Show the edit draw line for spatial steps. */ 
			'line' : {
				'status' : true,
				'title' : 'Draw Line'
			}, 
			/** services.tools.polgon - Show the edit draw polgon for spatial steps. */ 
			'polygon' : {
				'status' : true,
				'title' : 'Draw Polygon'
			},
			/** services.tools.box - Show the edit draw box for spatial steps. */ 
			'box' : {
				'status' : false,
				'title' : 'Draw Box'
			},
			/** services.tools.select_feature - Select a shape from a vector layer. */
			'select_feature' : {
				'status' : false,
				'title' : 'Select a Drawing'
			}
		}
	},
	/** messages - Object of error messages. */
	messages: {
		/** messages.requirement_failure - Shown when the user does not fill in a required feild. */ 
		requirement_failure : 'You forgot to fill in a required field!',
		/** messages.invalid_tool - Shown when a user tries to start a tool which is not properly configured. */
		invalid_tool : 'SERVICE CONFIGURATION ERROR! Drawing tool %TOOL% not available!',
		/** messages.service_config_error - Shown when an admin does not properly configure the tools for a service. */
		service_config_error : 'SERVICE CONFIGURATION ERROR! You must specify a default tool when setting "show-tools" to "true"!',
		/** messages.mapbook_invalid - Shown when the server does not return a valid mapbook contents. */
		mapbook_invalid: 'Could not load a mapbook. If you are the system administrator, you should look into this, if you are not the system administrator you should tell them about this. Suggestions: <ol><li>The mapbook may not be returning XML.</li><li>The mapbook may be returning malformed XML.</li><li>PHP may not be responding.</li></ol>',
		/** message.mapbook_version - Shown when a user tries to load a 1.X version of the mapbook. */
		mapbook_version : 'Specified mapbook version %VERSION% is older than 2.0. No promises this will work.',
		/** mapbook_param_error - Shown when the mapbook contains an invalid <param> tag. */
		mapbook_param_error : 'Error reading the value of "%FIELD%", please check your mapbook configuration.',
		/** messages.service_return_error - Shown when a service failes to return valid XML. */
		service_return_error : '<b>The service you called did not return valid XML.</b> If you are the system administrator, you should look into this, if you are not the system administrator you should tell them about this.'
	}
};
