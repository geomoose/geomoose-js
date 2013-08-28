#!/bin/sh

###########################################
# Change to same directory as this script #
###########################################

cd $(dirname "$0")

################################
# Update the Dojo Build System #
################################

# note: do this every time as patch_dojo.sh may change
#       in between builds where dojo doesn't need to be
#       extracted again.
if [ -d "dojo" ] ; then
	echo "Adding the build files for GeoMoose to the dojo build system."
	./patch_dojo.sh
fi

####################################
# Make sure build directory exists #
####################################

if [ ! -d ../build ] ; then
	echo "Creating build directory."
	mkdir -p ../build
fi

######################################
# Deploy dependencies (if necessary) #
######################################

# Build OpenLayers
if ([ ! -e "OpenLayers/build/OpenLayers.js" ] ) ; then
	(
		cd OpenLayers/build
		./build.py full
	)
fi

# OpenLayers
if ([ ! -e "../build/OpenLayers.js" ] || 
      [ "OpenLayers/build/OpenLayers.js" -nt "../build/OpenLayers.js" ]) ; then
	echo "Deploying OpenLayers."
	cp OpenLayers/build/OpenLayers.js ../build
	cp -a OpenLayers/theme ../build
	cp -a OpenLayers/img ../build
fi

# Build proj4js
if ([ ! -e "proj4js/lib/proj4js-compressed.js" ] ) ; then
	(
		cd proj4js/build
		./build.py
	)
fi

# proj4js
if ([ ! -e "../build/proj4js-compressed.js" ] || 
      [ "proj4js/lib/proj4js-compressed.js" -nt "../build/proj4js-compressed.js" ]) ; then
	echo "Deploying proj4js."
	cp proj4js/lib/proj4js-compressed.js ../build
fi

###########################
# Build GeoMoose and Dojo #
###########################

echo "Building GeoMOOSE and Dojo."
cd dojo/util/buildscripts && \
	./build_geomoose2.sh

############
# Finished #
############
echo "Done."
