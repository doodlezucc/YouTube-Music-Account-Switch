chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [new chrome.declarativeContent.PageStateMatcher({
                pageUrl: { hostSuffix: '.youtube.com' },
            })],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
    });
    chrome.tabs.create({ url: "https://music.youtube.com" }, function(tab) {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.sendMessage(tab.id, { action: "auto_extract" });
            }
        });
    });
});