// バックグラウンド
var dicRiftReady = {};

//chrome.extension.onConnect.addListener(function (port) {
//    console.log(port.name);
//    console.assert(port.name == 'youtuberift');
//    port.onMessage.addListener(function (msg) {
//        chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
//            if (msg.check) {
//                dicRiftReady[tabs[0].id] = msg.riftReady;
//                if (msg.riftReady) {
//                    chrome.pageAction.show(tabs[0].id);
//                    chrome.pageAction.onClicked.addListener(function (tab) {
//                        if (riftReady) {
//                            port.postMessage(tab.id, { pageAction: 'click' });
//                        }
//                    });
//                } else {
//                    chrome.pageAction.hide(tabs[0].id);
//                }
//            } else {
//                riftReady = dicRiftReady[tabs[0].id] || false;
//                if (riftReady) {
//                    chrome.pageAction.setIcon({
//                        path: response.rifting ? "24_on.png" : "24_off.png",
//                        tabId: tabs[0].id
//                    });
//                } else {
//                    chrome.pageAction.setIcon({
//                        path: "24_disable.png",
//                        tabId: tabs[0].id
//                    });
//                }
//            }
//        });
//    });
//});

chrome.webNavigation.onCompleted.addListener(function (o) {
    console.log(o.url);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { check: true }, function (response) {
            if (response) {
                dicRiftReady[tabs[0].id] = response.riftReady;
                if (response.riftReady) {
                    chrome.pageAction.show(tabs[0].id);
                    chrome.pageAction.setIcon({
                        path: response.riftReady ? response.rifting ? "24_on.png" : "24_off.png" : "24_disable.png",
                        tabId: tabs[0].id
                    });
                    chrome.pageAction.onClicked.addListener(function (tab) {
                        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                            if (dicRiftReady[tabs[0].id]) {
                                chrome.tabs.sendMessage(tabs[0].id, { pageAction: 'click' }, function (response) {
                                    chrome.pageAction.setIcon({
                                        path: response.rifting ? "24_on.png" : "24_off.png",
                                        tabId: tabs[0].id
                                    });
                                });
                            }
                        });
                    });
                } else {
                    chrome.pageAction.hide(tabs[0].id);
                }
            }
        });
    });
}, { url: [{ urlPrefix: 'http://www.youtube.com/' }, { urlPrefix: 'https://www.youtube.com/' }] });
