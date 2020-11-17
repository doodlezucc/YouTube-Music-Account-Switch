let yt;
let ytm;

let profile = {
    video: "",
    music: ""
};

function change() {
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: "auto_extract" });
        window.close();
    });
}

function load() {
    chrome.storage.local.get(["profile"], function(result) {
        console.log(result);
        if (!$.isEmptyObject(result)) {
            profile = result["profile"];
            yt.text(profile.video.name + " (" + profile.video.email + ")");
            ytm.text(profile.music.name + " (" + profile.music.email + ")");
        }
    });
}

$(document).ready(() => {
    yt = $("#yt");
    ytm = $("#ytm");
    load();
    $("button").on("click", function() {
        change();
    });
});