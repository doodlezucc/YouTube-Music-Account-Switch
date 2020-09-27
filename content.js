const Pages = {
	NONE: -1,
	VIDEO: 0,
	MUSIC: 1
};

let profile = {
	page: Pages.NONE,
	music: null,
	video: null
};

let lastPage = Pages.NONE;

function save(page, cb) {
	profile.page = page;
	chrome.storage.local.set({ profile: profile }, function() {
		cb();
	});
}

function load() {
	chrome.storage.local.get(["profile"], function(result) {
		if (!$.isEmptyObject(result)) {
			profile = result.profile;
			lastPage = profile.page;
			switchAccount();
		}
	});
}

function switchAccount() {
	let onMusic = document.location.href.startsWith("https://music.");
	if (lastPage != Pages.MUSIC && onMusic) {
		displaySwitching();
		switchOnMusic();
		return true;
	} else if (lastPage != Pages.VIDEO && !onMusic) {
		displaySwitching();
		switchOnVideo();
		return true;
	}
	return false;
}

function isEmail(s) {
	return s.includes("@");
}

function switchOnMusic() {
	for (let acc of extractAccounts()) {
		const em = isEmail(profile.music);
		if ((em && acc.email === profile.music) || (!em && acc.name === profile.music)) {
			save(Pages.MUSIC, () => document.location.href = acc.switch_url);
		}
	}
}

/**
 * @param {() => JQuery} queryFn 
 * @param {(jq: JQuery)} cb 
 */
function findAsap(queryFn, cb) {
	let jq = queryFn();
	if (jq.length) {
		cb(jq);
	}

	const interval = setInterval(() => {
		jq = queryFn();
		if (jq.length) {
			clearInterval(interval);
			cb(jq);
		}
	}, 50);
}

function switchOnVideo() {
	const popupObserver = new MutationObserver((mutations) => {
		for (let m of mutations) {
			if (m.addedNodes.length) {
				if (m.addedNodes[0].nodeName === "IRON-DROPDOWN") {
					$(m.addedNodes).find("#submenu").first().each(function() {
						const submenu = $("ytd-popup-container #submenu");

						if (!isEmail(profile.video)) {
							findAsap(() => submenu.find("ytd-account-item-renderer"), (accounts) => {
								accounts.each(function() {
									if ($(this).find("#channel-title").text().trim() === profile.video) {
										save(Pages.VIDEO, () => { $(this).click() });
										return false;
									}
								});
							});
						} else {
							findAsap(() => submenu.find("ytd-account-item-section-renderer"), (sections) => {
								sections.each(function() {
									if ($(this).find("a").text().trim() === profile.video) {
										save(Pages.VIDEO, () => { $(this).find("ytd-account-item-renderer").first().click() });
										return false;
									}
								});
							});
						}

						findAsap(() => $(m.addedNodes).find("ytd-compact-link-renderer"), (links) => links.get(3).click());
					});
				}
			}
		}
	});
	findAsap(() => $("ytd-popup-container"), (jq) => {
		console.log("found popup container!");
		popupObserver.observe(jq[0], { childList: true });
		findAsap(() => $("#avatar-btn"), (jq) => {
			console.log("found avatar btn!");
			jq.click();
		});
	});
}

function extractAccounts() {
	let json;
	$(document.head).children("script").each(function() {
		const text = this.textContent;
		if (text.substr(0, 10).trim().startsWith("ytcfg")) {
			const q = "\"ACCOUNTS\"";
			if (text.includes(q)) {
				const start = text.indexOf(q) + q.length + 1;
				const jsonString = text.slice(start, text.indexOf("]", start) + 1);
				json = JSON.parse(jsonString);
				return false;
			}
		}
	});
	return json;
}

function displaySwitching() {
	const thing = $("<ytmas/>")
		.addClass("switch")
		.append(
			$("<div/>")
				.append(
					$("<h2/>").text("Switching account...")
				)
		)
		.appendTo(document.body);
	setTimeout(() => {
		thing.addClass("show");
	}, 10);
}

function displayAccountManager() {
	const accounts = extractAccounts();
	const row = function(label, id) {
		return $("<tr/>").append(
			$("<td/>").text(label + ":"),
			$("<td/>").append(
				$("<select/>")
					.attr("id", id)
					.append(jQuery.map(accounts, acc => $("<option/>").text(acc.email)))
					.append($("<option/>").text("Enter name instead..."))
					.on("change", function() {
						if (this.value.endsWith("...")) {
							$(this).replaceWith(
								$("<input/>")
									.attr("id", id)
									.attr("placeholder", "Name or email address...")
							);
							$("ytmas").find("#" + id).focus();
						}
					})
			)
		);
	}

	$("<ytmas/>").append(
		$("<div/>")
			.addClass("ytmas init")
			.append(
				$("<span/>").append(
					$("<img/>").attr("src", chrome.runtime.getURL("icon.png")),
					$("<h1/>").text("Setup your YouTube accounts"),
				),
				$("<div/>"),
				$("<p/>").text("Pick your preferred Google account for each site."),
				$("<table/>").append(
					row("YouTube", "yt"),
					row("YouTube Music", "ytm")
				),
				$("<button/>").text("Save").on("click", () => {
					profile.video = $("ytmas #yt").val();
					profile.music = $("ytmas #ytm").val();
					lastPage = Pages.NONE;
					$("ytmas > div").remove();
					switchAccount();
				})
			)
	).appendTo(document.body);
}

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (!sender.tab) {
		if (request.action === "auto_extract") {
			displayAccountManager();
		} else if (request.action === "apply_changes") {
			profile = request.profile;
			lastPage = Pages.NONE;
			switchAccount();
		}
	}
});

$(document).ready(() => {
	load();
});