
/*
//BOOKMARKLET FOR EXAMPLES
var cmd = "function loadJS(path,callback) {var script = document.createElement('script');script.type = 'text/javascript';script.async = true;script.onload = callback;script.src = path;document.getElementsByTagName('head')[0].appendChild(script);};loadJS('//raw.github.com/carstenschwede/RiftThree/master/lib/RiftThree.js', function() {window.RiftThree();});";
var i = document.getElementById('viewer');
var p = document.getElementById('panel');
if (i && p) {
	var is = i.style, ps = p.style, iD,s;
	ps.zIndex = 2;
	ps.bottom = is.left = 0;
	is.width = ps.width = "100%";
	ps.height = "100px";
	iD = i.contentWindow.document;
	s = iD.createElement('script');
	s.text = cmd;
	iD.getElementsByTagName("head")[0].appendChild(s);
} else {
	eval(cmd);
}
*/

function loadJS(path, callback) { var script = document.createElement('script'); script.async = true; script.onload = callback; script.src = path; document.body.appendChild(script); }
var vrError = false;

;(function(window) {
	if (window.RiftThree !== undefined) return;
	var calls = [];
	var ready = false;
	window.RiftThree = function(renderer,options) {
		//if (ready) {
			riftify(renderer,options);
		//} else {
		//	calls.push([renderer,options]);
		//}
	};
	var riftify = function(renderer,options) {
	    var riftEnabled = true, stackSize = 0;
	    var xRotation, yRotation, zRotation, wRotation;

		

		/*********************************************/
		//Setup options
		/*********************************************/
		options = options || {};
		options.useHeadTracking = options.useHeadTracking === undefined ? true : options.useHeadTracking;
		options.assignKeys = options.assignKeys === undefined ? true : options.assignKeys;
		options.scale = options.scale || 1.0;


		/*********************************************/
		//Load media
		/*********************************************/
		["Left","Right"].forEach(function(side) {
			options["pre" + side] = options["pre"+side] || [];

			if (typeof(options["pre"+side]) == "function") {
				options["pre"+side] = [options["pre"+side]];
			}
		});


		/*********************************************/
		//Calculate UV TexMaps for Left/Right Eye
		/*********************************************/
		options.geometriesWith3DTextures = options.geometriesWith3DTextures || [];
		options.geometriesWith3DTextures.forEach(function(geometry) {
			var mappingLeft = [];
			var mappingRight = [];

			geometry.faceVertexUvs[0].forEach(function(uvs) {
				var mappedLeft = [];
				var mappedRight = [];
				uvs.forEach(function(uv) {
					geometry.stereoType.uv(uv,mappedLeft,mappedRight);
				});
				mappingLeft.push(mappedLeft);
				mappingRight.push(mappedRight);
			});

			mappingLeft = [mappingLeft];
			mappingRight = [mappingRight];

			var alternating = 0;
			options.preLeft.push(function() {
				if (options.alternate) {
					geometry.faceVertexUvs = (alternating ? mappingLeft : mappingRight);
				} else {
					geometry.faceVertexUvs = mappingLeft;
				}
				geometry.uvsNeedUpdate = true;
			});

			options.preRight.push(function() {
				if (options.alternate) {
					geometry.faceVertexUvs = (alternating ? mappingLeft : mappingRight);
				} else {
					geometry.faceVertexUvs = mappingRight;
				}
				geometry.uvsNeedUpdate = true;
				alternating = !alternating;
			});
		});


		/*********************************************/
		//Create actuall OculusRiftEffect
		/*********************************************/
		var effect = new THREE.OculusRiftEffect( renderer, options );
		effect.setSize( window.innerWidth, window.innerHeight );

		window.addEventListener( 'resize', function() {
			effect.setSize( window.innerWidth, window.innerHeight );
		}, false );


		window.toggleRift = function () {
		    riftEnabled = !riftEnabled;
		    stackSize = 0;
		    if (onWindowResize) onWindowResize();
		};
		window.getRotation = function () {
		    return {
		        x: xRotation,
		        y: yRotation,
		        z: zRotation,
		        w: wRotation
		    };
		}

		vr.load(function(error) {
			if (error) {
			    console.log('Unable to load vr.js for headtracking: ' + error.toString());
			    vrError = true;
			}
		});

		var vrstate = new vr.State();

		var absoluteTracking = true;
		var initQuaternion = false;
		
		/*********************************************/
		//Overwrite actual renderer so we don't have
		//to change OculusRiftEffect.js
		//Messy
		/*********************************************/

		var defaultRenderer = renderer.render;
		var tempQuat = new THREE.Quaternion();

		renderer.render = function(a,camera) {
			if (!riftEnabled) {
				defaultRenderer.apply(renderer,arguments);
				return;
			}
			if (stackSize === 0) {
				stackSize = 4;
				effect.render.apply(effect,arguments);
			} else {
				stackSize--;
				defaultRenderer.apply(renderer,arguments);
			}
		};
	};

	var self = this;
	calls.forEach(function (call) {
	    riftify.apply(self, call);
	});
	//loadJS(chrome.extension.getURL("vr.js"), function () {
	//    loadJS(chrome.extension.getURL("OculusRiftEffect.js"), function () {
	//		ready = true;
			
	//	});
	//});

})(window);