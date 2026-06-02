// Single source of truth for supported language metadata.
// Read by both the inline bootstrap in index.html and tl() in lang_controller.js.
const LANG_META = {
    "en": {
        "lang": "English",
        "flag": "🇺🇸",
        "fn": "lang_en"
    },
    "nl": {
        "lang": "Dutch",
        "flag": "🇳🇱",
        "fn": "lang_nl"
    },
    "fr": {
        "lang": "French",
        "flag": "🇫🇷",
        "fn": "lang_fr"
    },
    "es": {
        "lang": "Spanish",
        "flag": "🇪🇸",
        "fn": "lang_es"
    },
    "de": {
        "lang": "German",
        "flag": "🇩🇪",
        "fn": "lang_de"
    },
    "zh-cn": {
        "lang": "Chinese",
        "flag": "🇨🇳",
        "fn": "lang_zh_cn"
    },
    "hi": {
        "lang": "Hindi",
        "flag": "🇮🇳",
        "fn": "lang_hi"
    },
    "ja": {
        "lang": "Japanese",
        "flag": "🇯🇵",
        "fn": "lang_ja"
    },
    "ai": {
        "lang": "AI",
        "flag": "🤖",
        "fn": "lang_ai"
    },
    "ia": {
        "lang": "Deep AI",
        "flag": "👾",
        "fn": "lang_ai2"
    }
};

// Pick saved/system language and synchronously inject the matching script tag.
// Runs here (parser-blocking, after LANG_META) so document.write lands before the
// deferred app bundle that calls tl().
(function() {
    const SUPPORTED = Object.keys(LANG_META);
    function pick_lang() {
        try {
            const cache = localStorage.getItem("bitrequest_settings");
            if (cache) {
                const parsed = JSON.parse(cache),
                    saved = parsed && parsed[2] && parsed[2].selected;
                if (saved && saved.length > 0 && saved.length < 7 && SUPPORTED.indexOf(saved) > -1) {
                    return saved;
                }
            }
        } catch (e) {}
        const nav_lang = (navigator.language || navigator.userLanguage || "en").toLowerCase();
        if (SUPPORTED.indexOf(nav_lang) > -1) return nav_lang;
        const short = nav_lang.split("-")[0];
        return SUPPORTED.indexOf(short) > -1 ? short : "en";
    }
    const lang = pick_lang();
    if (lang !== "en") {
        document.write('<script src="assets/js/bitrequest/lang/' + lang.replace(/-/g, "_") + '.js"><\/script>');
    }
})();