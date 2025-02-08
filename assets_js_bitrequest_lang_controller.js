// To add tour own translation copy the file assets_js_bitrequest_lang_en.js and replace the filename with your countrycode suffix.
// Read further instruction in your copied file

const langcode = setlangcode(); // set saved or system language

$(document).ready(function() {
    //br_get_local
    init_tl();
    //lang_dat
    //setlangcode
    //systemlang
    //translate
    //transclear
});

function init_tl() {
    // Globals
    cancelbttn = translate("cancelbttn");
    okbttn = translate("okbttn");
    $(".tl_page1").text(translate("currencies"));
    $(".tl_page2").text(translate("requests"));
    $(".tl_page3").text(translate("settings"));
    $(".tl_page4").text(translate("payoff"));
    $(".tl_page5").attr("placeholder", translate("accountsettings"));
    $(".tl_page6").text(translate("iwouldliketogetpaid"));
    $(".tl_page6").text(translate("iwouldliketogetpaid"));
    $("#canceldialog").text(cancelbttn);
    $("#execute").text(okbttn);
    $("#add_erc20 .icon-plus").text(translate("more"));
    $("#scanner_toolbar > p").text(translate("encodeyoraddress"));
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
                const translation = translate("obj");
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
        translation = translate("obj"),
        tl_long = translation[lang_lower],
        tl_short = translation[lang_single];
    return (tl_long) ? lang_lower :
        (tl_short) ? lang_single : "en";
}

function translate(id, dat) {
    const data = (dat) ? dat : {},
        languages = {
            "en": {
                "lang": "English",
                "flag": "🇺🇲",
                "obj": lang_en(id, data)
            },
            "nl": {
                "lang": "Dutch",
                "flag": "🇾🇪",
                "obj": lang_nl(id, data)
            },
            "fr": {
                "lang": "French",
                "flag": "🇨🇵",
                "obj": lang_fr(id, data)
            }
        }
    if (id == "obj") {
        return languages;
    }
    try {
        const lang_string = languages[langcode].obj;
        if (lang_string) {
            return lang_string;
        }
        // use english if string is not found.
        return languages.en.obj;
    } catch (err) {
        console.error(err.name, err.message);
        // use english if language is not found.
        return languages.en.obj;
    }
}

// translate and clear accents
function transclear(id, dat) {
    const tl = translate(id, dat);
    if (tl) {
        return remove_diacritics(tl);
    }
    return tl;
}