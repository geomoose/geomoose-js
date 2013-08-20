#!/bin/bash

DOJO_DIR=dojo

#
# Create the dojo profile file.
#
cat > $DOJO_DIR/util/buildscripts/profiles/geomoose2.profile.js <<"END_OF_FILE"
dependencies = {
        //Strip all console.* calls except console.warn and console.error. This is basically a work-around
        //for trac issue: http://bugs.dojotoolkit.org/ticket/6849 where Safari 3's console.debug seems
        //to be flaky to set up (apparently fixed in a webkit nightly).
        //But in general for a build, console.warn/error should be the only things to survive anyway.
        stripConsole: "normal",

        layers: [
                {
                        name: "dojo.js",
                        dependencies: [
                                "dojo.dojo",
                                "dojo.base",
                                "dijit.dijit",
                                "dojox.widget",
                                "site.includes",
                                "gm.includes"
                        ]
                }
        ],

        prefixes: [
                ["gm", "../../../geomoose"],
                ["site", "../../../site"],
                ["extensions", "../../../extensions"],
                ["GeoMOOSE", "../../../geomoose/GeoMOOSE"]
        ]
}
END_OF_FILE

#
# Create the build script
#
cat > $DOJO_DIR/util/buildscripts/build_geomoose2.sh <<"END_OF_SCRIPT"
#!/bin/bash

FAKE_USER_INCLUDES=0
USER_INCLUDES=../../../../site/includes.js
if [ -e $USER_INCLUDES ]
then
        # do nothing
        echo "Found User Includes."
else
        echo "User includes not found ... faking."
        FAKE_USER_INCLUDES=1
        touch $USER_INCLUDES
fi

./build.sh action=clean,release profile=geomoose2 version=2.6 releaseName=geomoose2.6

BUILD_DIR=../../../../build
RELEASE_DIR=../../release/geomoose2.6

echo "Moving files to build directory..."
mkdir -p $BUILD_DIR/dojo
cp $RELEASE_DIR/dojo/dojo.js $BUILD_DIR/dojo/dojo.js

mkdir -p $BUILD_DIR/dojo/nls
mkdir -p $BUILD_DIR/dojo/resources

cp -r $RELEASE_DIR/dojo/nls/* $BUILD_DIR/dojo/nls
cp -r $RELEASE_DIR/dojo/resources/* $BUILD_DIR/dojo/resources

mkdir -p $BUILD_DIR/dijit
cp -r $RELEASE_DIR/dijit/{themes,icons} $BUILD_DIR/dijit

echo "Done."

if [ $FAKE_USER_INCLUDES = 1 ]
then
        rm $USER_INCLUDES
fi
END_OF_SCRIPT

# Make the script executable
chmod +x $DOJO_DIR/util/buildscripts/build_geomoose2.sh
