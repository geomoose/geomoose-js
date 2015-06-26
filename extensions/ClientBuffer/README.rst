Client Side Buffering Extension
===============================

This extension can add the ability to allow user-drawn areas to be buffered.  
It will modify the shape inline, so the original shape is not natively recoverable.

Pros
----

Users can see the buffered shapes in the client!

Cons
----

* Creates more dependencies. GeoMOOSE is already a fairly sizeable deliverable. JSTS is, itself, sizeable.
* Some confusion. There are now three different ways to do a buffer.
* Some browsers may bite the dust trying to calculate the buffers on more complex shapes. 

Requirements
------------

This requires the use of JSTS. The instructions below will install a tested version of JSTS using bower.

To install bower globally::

	npm install -g bower


Installing
----------

::

	# this will install all the required components
	bower install

	

Add JSTS and Client Buffer to `geomoose.html`
---------------------------------------------

::

	<script type="text/javascript" src="extensions/ClientBuffer/bower_components/jsts/lib/javascript.util.js"></script>
	<script type="text/javascript" src="extensions/ClientBuffer/bower_components/jsts/lib/jsts.js"></script>
	<script type="text/javascript" src="extensions/ClientBuffer/ClientBuffer.js"></script>

