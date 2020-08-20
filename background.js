chrome.runtime.onInstalled.addListener(function() {
    chrome.tabs.create({ url: "https://music.youtube.com" }, function(tab) {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === "complete" && tabId === tab.id) {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.sendMessage(tab.id, { action: "auto_extract" });
            }
        });
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, _info, tab) {
    console.log(tab);
    if (tab.status === "complete" && tab.url.includes(".youtube.com/")) {
        chrome.pageAction.show(tabId);
    } else {
        chrome.pageAction.hide(tabId);
    }
});