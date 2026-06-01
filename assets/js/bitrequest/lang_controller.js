// To add tour own translation copy the file assets/js/bitrequest/lang/en.js and replace the filename with your countrycode suffix.
// Read further instruction in your copied file

const langcode = setlangcode(); // set saved or system language

$(document).ready(function() {
    init_tl();
});

function init_tl() {
    // Globals
    cancelbttn = tl("cancelbttn");
    okbttn = tl("okbttn");
    $(".tl_page1").text(tl("currencies"));
    $(".tl_page2").text(tl("requests"));
    $(".tl_page3").text(tl("settings"));
    $(".tl_page4").text(tl("payoff"));
    $("#canceldialog").text(cancelbttn);
    $("#execute").text(okbttn);
    $("#add_erc20 .icon-plus").text(tl("more"));
    $("#scanner_toolbar > p").text(tl("encodeyoraddress"));
}

function lang_dat(lang) {
    const lower = lang.toLowerCase(),
        single = lower.split("-")[0];
    return {
        "lower": lower,
        "single": single
    };
}

function setlangcode() {
    const settingcache = localStorage.getItem("bitrequest_settings");
    if (settingcache) { // get saved language
        const parse_cache = JSON.parse(settingcache),
            lang_settings = parse_cache[2];
        if (lang_settings) {
            const setlang = lang_settings.selected,
                sl_length = setlang.length;
            if (sl_length && sl_length < 7) {
                const translation = tl("obj");
                if (translation[setlang]) {
                    return setlang;
                }
            }
        }
    }
    // get system language
    return systemlang();
}

function systemlang() { // get system language
    const language = navigator.language || navigator.userLanguage,
        lang = lang_dat(language),
        lang_lower = lang.lower,
        lang_single = lang.single,
        translation = tl("obj"),
        tl_long = translation[lang_lower],
        tl_short = translation[lang_single];
    return (tl_long) ? lang_lower :
        (tl_short) ? lang_single : "en";
}

const tl_cache = {}; // resolved no-data strings, keyed "langcode:id" (langcode is const per session)

function tl(id, dat) {
    if (id === "obj") {
        const languages = {};
        $.each(LANG_META, function(code, meta) {
            const fn = window[meta.fn];
            languages[code] = {
                "lang": meta.lang,
                "flag": meta.flag,
                "obj": typeof fn === "function" ? fn(id, dat || {}) : null
            };
        });
        return languages;
    }
    // No-data lookups are deterministic per language — memoize so each lang function
    // (which rebuilds its full ~500-key object per call) runs at most once per id
    // instead of on every call. Calls WITH data interpolate and bypass the cache.
    if (!dat) {
        const key = langcode + ":" + id,
            cached = tl_cache[key];
        if (cached !== undefined) {
            return cached;
        }
        return tl_cache[key] = tl_resolve(id, {});
    }
    return tl_resolve(id, dat);
}

// Resolve via the selected language, fall back to English, then the raw id.
function tl_resolve(id, data) {
    try {
        const selected_meta = LANG_META[langcode],
            selected_fn = selected_meta && window[selected_meta.fn],
            selected_string = (typeof selected_fn === "function") ? selected_fn(id, data) : null;
        if (selected_string) {
            return selected_string;
        }
        if (langcode === "en") {
            return id;
        }
        const en_string = (typeof window.lang_en === "function") ? window.lang_en(id, data) : null;
        return en_string || id;
    } catch (err) {
        console.error(err.name, err.message);
        const en_string = (typeof window.lang_en === "function") ? window.lang_en(id, data) : null;
        return en_string || id;
    }
}

// translate and clear accents
function transclear(id, dat) {
    const translate = tl(id, dat);
    if (translate) {
        return remove_diacritics(translate);
    }
    return translate;
}

// Languages that don't render in PDF Helvetica / WinAnsiEncoding
const pdf_unsafe_langs = ["zh-cn", "hi", "ja"];

// Translate for PDF/CSV — falls back to English for non-Latin scripts
function pdf_tl(id, dat) {
    if (pdf_unsafe_langs.indexOf(langcode) === -1) {
        return transclear(id, dat);
    }
    return lang_en(id, dat || {}) || id;
}

// Langcode for PDF/CSV date formatting
function pdf_langcode() {
    return pdf_unsafe_langs.indexOf(langcode) === -1 ? langcode : "en";
}