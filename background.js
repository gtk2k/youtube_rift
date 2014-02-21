// バックグラウンド
var dicState = {};
var dicPageStatus = {};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab){
    if (changeInfo && changeInfo.status == 'complete') {
        dicState[tabId] = 0;
        var oldVideoId = null;
        if (dicPageStatus[tabId]) {
            oldVideoId = dicPageStatus[tabId].videoId;
        }
        delete dicPageStatus[tabId];
        console.log('Tab updated: ' + tab.url);
        chrome.tabs.sendMessage(tabId, { check: true, state: dicState[tabId], tabId: tabId, oldVideoId: oldVideoId });
    }
});

chrome.extension.onMessage.addListener(function (msg) {
    dicPageStatus[msg.tabId] = {};
    Object.keys(msg).forEach(function (key) {
        dicPageStatus[msg.tabId][key] = msg[key];
    });
    setIcon(msg, msg.tabId);
});

chrome.webNavigation.onBeforeNavigate.addListener(function (tab) {
    delete dicPageStatus[tab.tabId];
    console.log('onBeforeNavigate', tab.tabId);
    chrome.tabs.sendMessage(tab.tabId, { stop: true });
}, { url: [{ urlPrefix: 'http://www.youtube.com/watch' }, { urlPrefix: 'https://www.youtube.com/watch' }] });

chrome.pageAction.onClicked.addListener(function (tab) {
    chrome.tabs.sendMessage(tab.id, { pageAction: 'click', tabId: tab.id, state: dicState[tab.id] });
});

function setIcon(response, tabId) {
    if (response) {
        console.log(response.playerType);
        chrome.pageAction.show(tabId);
        if (!response.riftReady) {
            chrome.pageAction.setIcon({ path: "64_disable.png", tabId: tabId });
        } else if (response.rifting) {
            chrome.pageAction.setIcon({ path: "64_on.png", tabId: tabId });
        } else {
            if (response.playerType === 'html5') {
                chrome.pageAction.setIcon({ path: "64_off.png", tabId: tabId });
            } else if (response.playerType === 'flash' && response.threedMovie) {
                chrome.pageAction.setIcon({ path: "64_yellow.png", tabId: tabId });
            }
        }
    }
}