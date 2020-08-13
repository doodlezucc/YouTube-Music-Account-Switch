let yt;
let ytm;

let profile = {
    video: "",
    music: ""
};

function save() {
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, { action: "apply_changes", profile: { video: yt.val(), music: ytm.val() } });
        window.close();
    });
}

function load() {
    chrome.storage.sync.get(["profile"], function(result) {
        console.log(result);
        if (!$.isEmptyObject(result)) {
            profile = result["profile"];
            yt.val(profile.video);
            ytm.val(profile.music);
        }
    });
}

$(document).ready(() => {
    yt = $("#yt");
    ytm = $("#ytm");
    load();
    $("button").on("click", function() {
        save();
    });
});