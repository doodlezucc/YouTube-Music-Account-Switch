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

function change(cb) {
	profile.page = onMusic ? Pages.MUSIC : Pages.VIDEO;
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


const onMusic = document.location.href.startsWith("https://music.");

function switchAccount() {
	if ((lastPage != Pages.MUSIC && onMusic) || (lastPage != Pages.VIDEO && !onMusic)) {
		performAccountSwitch();
		return true;
	}
	return false;
}

function isEmail(s) {
	return s.includes("@");
}

function getSignInUrl(accIndex) {
	return ytcfg.data_.SIGNIN_URL.replace("0", accIndex);
}

/**
 * @param {() => JQuery} queryFn 
 * @param {(jq: JQuery)} cb 
 */
function findAsap(queryFn, cb) {
	let jq = queryFn();
	if (jq.length) {
		cb(jq);
		return;
	}

	const interval = setInterval(() => {
		jq = queryFn();
		if (jq.length) {
			clearInterval(interval);
			cb(jq);
		}
	}, 50);
}

function performAccountSwitch() {
	displaySwitching();
	extractAccounts((accounts) => {
		let targetAcc = onMusic ? profile.music : profile.video;
		for (let acc of accounts) {
			if (acc.name === targetAcc.name && acc.email === targetAcc.email) {
				change(() => {
					acc.switchFn();
				});
				break;
			}
		}
	});
}

function openYTAccountChangeDialog(cb) {
	const popupContainerTag = (onMusic ? "ytmusic" : "ytd") + "-popup-container";
	const avatarBtnQuery = onMusic ? "ytmusic-settings-button > paper-icon-button" : "#avatar-btn";
	const popupObserver = new MutationObserver((mutations) => {
		for (let m of mutations) {
			if (m.addedNodes.length) {
				if (m.addedNodes[0].nodeName === "IRON-DROPDOWN") {
					$(m.addedNodes).find("#submenu").first().each(function() {
						findAsap(() => $(m.addedNodes).find("ytd-compact-link-renderer"), (links) => {
							links.get(onMusic ? 2 : 3).click();
						});
						cb($(popupContainerTag + " #submenu"));
					});
				}
			}
		}
	});
	findAsap(() => $(popupContainerTag), (jq) => {
		popupObserver.observe(jq[0], { childList: true });
		findAsap(() => $(avatarBtnQuery), (jq) => {
			jq.click();
		});
	});
}

class YTAccount {
	constructor(name, email, switchFn) {
		this.name = name;
		this.email = email;
		this.switchFn = switchFn;
	}
}

/**
 * 
 * @param {(accounts: Array.<YTAccount>)} cb 
 */
function extractAccounts(cb) {
	openYTAccountChangeDialog((submenu) => {
		const accounts = [];
		findAsap(() => submenu.find("ytd-account-item-section-renderer"), (sections) => {
			sections.each(function() {
				const email = (onMusic ? $(this).find("yt-formatted-string") : $(this).find("a"))[0].textContent.trim();
				$(this).find("ytd-account-item-renderer").each(function() {
					const html = this;
					const name = $(this).find("#channel-title").text().trim();
					accounts.push(new YTAccount(name, email, () => { html.click() }));
				});
			});
			cb(accounts);
		});
	});
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
	extractAccounts((accounts) => {
		const row = function(label, id, account) {
			let i = 0;
			if (account) {
				accounts.forEach((acc, index) => {
					if (acc.name === account.name && acc.email === account.email) {
						i = index;
					}
				});
			}
			return $("<tr/>").append(
				$("<td/>").text(label + ":"),
				$("<td/>").append(
					$("<select/>")
						.attr("id", id)
						.append(
							jQuery.map(accounts, (acc, index) => $("<option/>").text(acc.name + " (" + acc.email + ")").val(index))
						).val(i)
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
						row("YouTube", "yt", profile.video),
						row("YouTube Music", "ytm", profile.music)
					),
					$("<button/>").text("Save").on("click", () => {
						profile.video = accounts[$("ytmas #yt").val()];
						profile.music = accounts[$("ytmas #ytm").val()];
						lastPage = Pages.NONE;
						$("ytmas > div").remove();
						displaySwitching();
						change(() => {
							profile.music.switchFn();
						});
					})
				)
		).appendTo(document.body);
	});
}

chrome.runtime.onMessage.addListener(function(request, sender) {
	if (!sender.tab) {
		if (request.action === "auto_extract") {
			displayAccountManager();
		}
	}
});

$(document).ready(() => {
	load();
});