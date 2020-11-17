chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "https://music.youtube.com" }, function(tab) {
            chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (info.status === "complete" && tabId === tab.id) {
                    chrome.tabs.onUpdated.removeListener(listener);
                }
            });
        });
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, _info, tab) {
    if (tab.status === "complete" && tab.url.includes(".youtube.com/")) {
        chrome.pageAction.show(tabId);
    } else {
        chrome.pageAction.hide(tabId);
    }
});