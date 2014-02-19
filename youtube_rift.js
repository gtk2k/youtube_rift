// コンテント
var riftReady = false;
var rifting = false;
var player;
var videoWidth, videoHeight;
var container;
var canvas;
var context;
var riftifyOptions = {};
var riftWidth = 1280 / 2;
var riftHeight = 800;
var geometry, texture, scene, camera, renderer, media;
var drawMode = 'direct';

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.check) {
        var videoElements = document.getElementsByTagName('video');
        console.log(document.location.href, videoElements);
        for (i = videoElements.length; i--;) {
            var elm = videoElements[i];
            if (elm.classList.contains('video-stream') && elm.classList.contains('html5-main-video')) {
                player = elm;
                riftReady = true;
                break;
            }
        }
    } else if (request.pageAction) {
        rifting = !rifting;
        if (rifting) overayInit();
    }
    sendResponse({ riftReady: riftReady, rifting: rifting });
});

document.addEventListener('keydown', function (e) {
    if (e.shiftKey) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (drawMode === 'sbs') {
            drawMode = 'direct';
        } else {
            drawMode = 'sbs';
        }
    }
});

function overayInit(){
    container = document.createElement('div');
    container.id = 'rift_container';
    container.style.position = 'absolute';
    container.style.left = 0;
    container.style.top = 0;
    container.style.zIndex = 1000;
    container.style.width = window.innerWidth + 'px';
    container.style.height = window.innerHeight + 'px';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);

    canvas = document.createElement('canvas');
    videoWidth = canvas.width = player.videoWidth;
    videoHeight = canvas.height = player.videoHeight;
    canvas.width = 1280;
    canvas.height = 800;
    canvas.style.width = videoWidth + 'px';
    canvas.style.height = videoHeight + 'px';
    canvas.id = 'rift_canvas';
    context = canvas.getContext('2d');
    //container.appendChild(canvas);
    init();
    animate();
}



var vertex =
    'uniform sampler2D texture;\n' +
    'uniform sampler2D dispTexture;\n' +
    'uniform float uDisplacementScale;\n' +
    'uniform float uDisplacementBias;\n' +
    'uniform float fNumImages;\n' +
    'uniform float bL;\n' +
    'uniform float bLD;\n' +
    'uniform float bL_D;\n' +
    'uniform float bD;\n' +
    'uniform float bLR;\n' +
    'uniform float bLRD;\n' +
    'uniform float bLRDL;\n' +
    'uniform float bLRDR;\n' +
    'varying vec2 vUv;\n' +
    'void main() {\n' +
    '    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n' +
    '    vUv = uv;\n' +
    '    gl_Position = projectionMatrix * mvPosition;\n' +
    '}';

var fragment =
    'uniform sampler2D texture;\n' +
    'varying vec2 vUv;\n' +
    'void main() {\n' +
    '    gl_FragColor =  texture2D(texture, vUv);\n' +
    '}';
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 1, 10000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    var index = 0;
    if (document.location.hash) {
        index = parseInt(document.location.hash.replace("#", "")) || 0;
    }
    var stereoTypeKey = 'LR';
    var stereoType = {
        uv: function (uv, left, right) {
            left.push(new THREE.Vector2(uv.x * 0.5, uv.y));
            right.push(new THREE.Vector2(uv.x * 0.5 + 0.5, uv.y));
        },
        geometry: "plane"
    };

    texture = new THREE.Texture(canvas);
    var properties = {
        width: canvas.width,
        height: canvas.height,
    };
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.generateMipmaps = false;

    var uniforms = {
        texture: { type: "t", value: texture },
        fBrightess: { type: "f", value: 1.0 },
        fContrast: { type: "f", value: 1.0 },
        fSaturation: { type: "f", value: 1.6 },
        fGamma: { type: "f", value: 0.8 },
        uDisplacementBias: { type: "f", value: 0.0 },
        uDisplacementScale: { type: "f", value: 400.0 },
        bRL: { type: "f", value: 0 }
    };

    var materialVideo = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide
    });


    var left = [], right = [];
    stereoType.uv({ x: 0, y: 0 }, left, right);
    stereoType.uv({ x: properties.width, y: properties.height }, left, right);

    var pixelSize = {
        width: Math.floor(left[1].x - left[0].x),
        height: Math.floor(left[1].y - left[0].y),
        ar: 0
    };

    pixelSize.ar = pixelSize.width / pixelSize.height;
    var ar = pixelSize.ar;//properties.width/properties.height;
    var geometrySize = {
        width: 1000,
        height: 0
    };

    geometrySize.height = Math.floor(geometrySize.width / ar);

    var depthResolution = 0.1;
    var segmentSize = {
        width: Math.floor(geometrySize.width * depthResolution),
        height: Math.floor(geometrySize.height * depthResolution)
    };

    if (!stereoType.disp) {
        segmentSize.width = segmentSize.height = 1;
    }

    geometry = new THREE.PlaneGeometry(geometrySize.width, geometrySize.height, segmentSize.width, segmentSize.height);
    geometry.computeTangents();
    camera.position.z = 450;

    geometry.stereoType = stereoType;
    riftifyOptions.geometriesWith3DTextures = [geometry];

    var movieScreen = new THREE.Mesh(geometry, materialVideo);

    movieScreen.position.set(0, 0, 0);

    scene.add(movieScreen);

    window.addEventListener('resize', onWindowResize, false);
    window.renderer = renderer;
    window.RiftThree(renderer, riftifyOptions);
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (texture) texture.needsUpdate = true;
    if (drawMode === 'sbs') {
        var vw = player.videoWidth, vh = player.videoHeight;
        var leftDrawWidth = vw * 4 / 5;
        var leftDrawLeft = (vw - leftDrawWidth) / 2;
        var leftDrawHeight = vh;
        context.drawImage(player, leftDrawLeft, 0, leftDrawWidth, leftDrawHeight, 0, 0, riftWidth, riftHeight);
        context.drawImage(player, leftDrawLeft, 0, leftDrawWidth, leftDrawHeight, riftWidth, 0, riftWidth, riftHeight);

    } else {
        context.drawImage(player, 0, 0, player.videoWidth, player.videoHeight, 0, riftHeight / 4, riftWidth * 2, riftHeight / 2);
    }
    renderer.render(scene, camera);
}