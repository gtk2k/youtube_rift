var riftReady = false;
var threedMovie = false;
var rifting = false;
var videoElement;
var moviePlayer;
var videoWidth, videoHeight;
var container;
var canvas;
var context;
var riftifyOptions = {};
var riftWidth = 1280 / 2;
var riftHeight = 800;
var geometry, texture, scene, camera, renderer;
var animationHandle = null;
var drawMode = 'cover';
var videoId = null;
var html5_3d;
var tabId;
var highestQualityMenuButton;

function overayInit() {
    container = document.createElement('div');
    container.id = 'rift_container';
    container.style.position = 'absolute';
    container.style.left = 0;
    container.style.top = 0;
    container.style.zIndex = 1000;
    container.style.width = window.innerWidth + 'px';
    container.style.height = window.innerHeight + 'px';
    document.body.appendChild(container);

    canvas = document.createElement('canvas');
    videoWidth = canvas.width = videoElement.videoWidth;
    videoHeight = canvas.height = videoElement.videoHeight;
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

/*
  This source code customized from mediaplayer.js in RiftThree.js 
  https://github.com/carstenschwede/RiftThree
*/
var vertex =
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
    camera = new THREE.PerspectiveCamera(120, window.innerWidth / window.innerHeight, 1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);
    container.appendChild(renderer.domElement);
    var index = 0;
    if (document.location.hash) {
        index = parseInt(document.location.hash.replace("#", "")) || 0;
    }
    var stereoType = {
        uv: function (uv, left, right) {
            left.push(new THREE.Vector2(uv.x * 0.5, uv.y));
            right.push(new THREE.Vector2(uv.x * 0.5 + 0.5, uv.y));
        },
        geometry: "plane"
    };

    texture = new THREE.Texture(canvas);
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.generateMipmaps = false;

    var materialVideo = new THREE.ShaderMaterial({
        uniforms: {
            texture: { type: "t", value: texture }
        },
        vertexShader: vertex,
        fragmentShader: fragment,
        side: THREE.DoubleSide
    });


    var left = [], right = [];
    stereoType.uv({ x: 0, y: 0 }, left, right);
    stereoType.uv({ x: canvas.width, y: canvas.height }, left, right);

    var geometrySize = {
        width: 1000,
        height: 1000 * canvas.height / (canvas.width / 2)
    };
    geometry = new THREE.PlaneGeometry(geometrySize.width, geometrySize.height, 1, 1);
    geometry.computeTangents();
    camera.position.z = 470;

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
    animationHandle = requestAnimationFrame(animate);
    if (texture) texture.needsUpdate = true;
    if (html5_3d) {
        if (drawMode === 'cover') {
            var vw = videoElement.videoWidth / 2, vh = videoElement.videoHeight;
            var drawWidth = vw * 4 / 5;
            var leftDrawLeft = (vw - drawWidth) / 2;
            var rightDrawLeft = riftWidth + vw / 2;
            context.drawImage(videoElement, leftDrawLeft, 0, drawWidth, vh, 0, 0, riftWidth, riftHeight);
            context.drawImage(videoElement, rightDrawLeft, 0, drawWidth, vh, riftWidth, 0, riftWidth, riftHeight);
        } else {
            context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, riftHeight / 4, riftWidth * 2, riftHeight / 2);
        }
    } else {
        if (drawMode === 'cover') {
            var vw = videoElement.videoWidth, vh = videoElement.videoHeight;
            var drawWidth = vw * 4 / 5;
            var drawLeft = (vw - drawWidth) / 2;
            context.drawImage(videoElement, drawLeft, 0, drawWidth, vh, 0, 0, riftWidth, riftHeight);
            context.drawImage(videoElement, drawLeft, 0, drawWidth, vh, riftWidth, 0, riftWidth, riftHeight);
        } else {
            context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, riftHeight / 4, riftWidth, riftHeight / 2);
            context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, riftWidth, riftHeight / 4, riftWidth, riftHeight / 2);
        }
    }
    renderer.render(scene, camera);
}