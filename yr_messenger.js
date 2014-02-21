chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request);
    if (request.check) {
        var cont = document.getElementById('rift_container');
        if (cont) {
            riftStop();
        }
        tabId = request.tabId;
        videoElement = null;
        riftReady = false;
        videoId = request.oldVideoId;
        detectChangeVideo();
    } else if (request.pageAction) {
        if (riftReady) {
            if (moviePlayer.playerType === 'flash' && request.state === 1) {
                if (threedMovie && !html5_3d) {
                    document.location.href = document.location.href + '&feature=html5_3d';
                    return;
                }
            } else {
                rifting = !rifting;
                var mastHead = document.getElementById('masthead-positioner');
                if (mastHead) {
                    mastHead.style.display = rifting ? 'none' : '';
                }
                if (rifting) {
                    document.body.scrollTop = 0;
                    highestQualityMenuButton.click();
                    videoElement.onended = riftStop;
                    overayInit();
                } else {
                    riftStop();
                }
            }
        }
        sendMessage(false);
    }
});

function detectChangeVideo() {
    setTimeout(function () {
        moviePlayer = document.getElementById('movie_player');
        if (!moviePlayer) {
            detectChangeVideo();
            return;
        }
        if (moviePlayer && moviePlayer.tagName.toLowerCase() !== 'div') {
            moviePlayer.playerType = 'flash';
            console.log('set flash');
            var flashvars = parseArgs(moviePlayer.getAttribute('flashvars'));
            if (videoId == flashvars.video_id) {
                detectChangeVideo();
                return;
            }
            videoId = flashvars.video_id;
            threedMovie = !!flashvars.threed_module;
            riftReady = false; //threedMovie; 
        } else {
            var videoElements = document.getElementsByTagName('video');
            moviePlayer.playerType = 'html5';
            console.log('set html5');
            for (i = videoElements.length; i--;) {
                var elm = videoElements[i];
                if (elm.classList.contains('video-stream') && elm.classList.contains('html5-main-video')) {
                    if (videoId == elm.dataset.youtubeId) {
                        detectChangeVideo();
                        return;
                    }
                    var menuButtons = document.getElementsByClassName('ytp-menu-title');
                    for (var i = menuButtons.length; i--;) {
                        if (menuButtons[i].textContent === '画質') {
                            highestQualityMenuButton = menuButtons[i].parentNode.getElementsByClassName('ytp-drop-down-menu-button')[0];
                        } else {
                            if (menuButtons[i].textContent === '3D') {
                                html5_3d = true;
                            } else {
                                html5_3d = false;
                            }
                        }
                    }
                    videoElement = elm;
                    videoId = elm.dataset.youtubeId;
                    riftReady = true;
                    break;
                }
            }
            if (!videoElement) {
                // youtube動画以外のページ
                // manifest.jsonでマッチング設定してるからココには来ない(はず)
                riftReady = false;
                return;
            }
        }
        sendMessage(true);
    }, 10);
}

function riftStop() {
    if (animationHandle != null) {
        cancelAnimationFrame(animationHandle);
        animationHandle = null;
    }
    var cont = document.getElementById('rift_container');
    document.body.removeChild(cont);
    container = null;
    canvas = null;
    context = null;
    geometry = null;
    texture = null;
    scene = null;
    camera = null;
    renderer = null;
    rifting = false;
}

function sendMessage(check) {
    var sendData = {
        check: check,
        youtubeRift: true,
        riftReady: riftReady,
        playerType: moviePlayer.playerType,
        threedMovie: threedMovie,
        html5_3d: html5_3d,
        rifting: rifting,
        videoId: videoId,
        tabId: tabId
    }
    chrome.extension.sendMessage(sendData);
}

function parseArgs(flashvars){
    var vars = {};
    var spl = flashvars.split('&');
    for(var i = spl.length; i--;){
        var kvp = spl[i].split('=');
        vars[kvp[0]]= kvp[1];
    }
    return vars;
}

document.onkeydown = function (e) {
    if (e.keyCode == 90) { // zキー
        if (camera) {
            camera.position.z += 10;
        }
    } else if (e.keyCode == 88) {
        if (camera) {
            camera.position.z -= 10;
        }
    } else if (e.ctrlKey) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (drawMode === 'cover') {
            drawMode = 'contain';
        } else {
            drawMode = 'cover';
        }
    }
};



