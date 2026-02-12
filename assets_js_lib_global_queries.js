// ** Core Constants & Initial Setup: **
//Initial constants (br_* variables)
//glob_const object (core configurations)
//glob_let object (runtime states)

const br_bipobj = br_get_local("bpdat", true),
    br_hasbip = (br_bipobj) ? true : false,
    br_bipid = (br_hasbip) ? br_bipobj.id : false,
    br_cashier_dat = br_get_local("cashier", true),
    br_is_cashier = (br_cashier_dat && br_cashier_dat.cashier) ? true : false,
    br_cashier_seedid = br_is_cashier ? br_cashier_dat.seedid : false,
    br_init = br_get_local("init", true),
    br_io = get_default_object(br_init, true),
    br_hostname = "bitrequest.github.io", // change if self hosted
    br_proxy = "https://www.bitrequest.app",
    lws_proxy = br_proxy + ":8050",
    br_localhostname = (br_hostname.indexOf("http") > -1) ? br_hostname.split("://").pop() : br_hostname,
    br_approot = "https://" + br_localhostname + "/",
    br_proxy_list = [{
            "proxy": "https://app.bitrequest.io",
            "display": true,
            "tor": false
        },
        {
            "proxy": "https://www.bitrequest.io",
            "display": true,
            "tor": false
        },
        {
            "proxy": br_proxy,
            "display": true,
            "tor": true
        }
    ],
    displayed_proxies = filter_object_array(br_proxy_list, "display", true),
    br_hosted_proxy = random_array_item(displayed_proxies), // load balance proxies
    tor_proxies = filter_object_array(br_proxy_list, "tor", true),
    br_androidpackagename = "io.bitrequest.app",
    br_useragent = navigator.userAgent || navigator.vendor || window.opera,
    br_lower_useragent = br_useragent.toLowerCase(),
    br_timezoneoffset = new Date().getTimezoneOffset(),
    br_timezone = br_timezoneoffset * 60000,
    br_has_ndef = ("NDEFReader" in window),
    br_referrer = document.referrer,
    br_exp_referrer = "android-app://" + br_androidpackagename,
    br_ref_match = (br_referrer && br_referrer.indexOf(br_exp_referrer) >= 0) ? true : false,
    br_inframe = (self !== top),
    br_w_loc = window.location,
    br_thishostname = br_w_loc.hostname,
    br_hostlocation = (br_thishostname === "" || br_thishostname === "localhost" || br_thishostname === "127.0.0.1") ? "local" :
    (br_thishostname === "bitrequest.github.io") ? "hosted" :
    (br_thishostname === br_hostname) ? "selfhosted" : "unknown",
    br_video = $("#qr-video")[0],
    init_qrscanner = br_hostlocation === "local" ? false : new QrScanner(br_video, result => set_scan_result(result), error => {
        console.log(error);
    }),
    glob_const = {
        "post_scan_timeout": 30000, // Preform extra tx lookup when closing paymentdialog after 30 seconds
        "android_standalone": window.matchMedia("(display-mode: standalone)").matches,
        "androidpackagename": br_androidpackagename,
        "approot": br_approot,
        "apptitle": "Bitrequest",
        "aws_bucket": "https://brq.s3.us-west-2.amazonaws.com/",
        "body": $("body"),
        "c_host": br_w_loc.origin + br_w_loc.pathname,
        "cacheperiodcrypto": 120000, //120000 = 2 minutes
        "cacheperiodfiat": 600000, //600000 = 10 minutes
        "cmc_icon_loc": "https://s2.coinmarketcap.com/static/img/coins/200x200/",
        "collect": $("#collect"), // collect sound effect
        "copycontent": $("#copyinput"),
        "deviceid": null,
        "drivepath": "https://content.googleapis.com",
        "eth_l2s": {
            "arbitrum one": 42161,
            "polygon pos": 137,
            "binance smart chain": 56,
            "base": 8453
        },
        "exp_referrer": br_exp_referrer,
        "has_bigint": hasbigint(),
        "has_ndef": br_has_ndef,
        "hosted_proxy": br_hosted_proxy,
        "hostlocation": br_hostlocation,
        "hostname": br_hostname,
        "html": $("html"),
        "inframe": br_inframe,
        "ios_standalone": navigator.standalone,
        "is_android_app": (br_ref_match) ? true : false, // android app fingerprint
        "is_ios_app": false, // ios app fingerprint
        "is_safari": is_safari(),
        "ln_socket": "wss://bitrequest.app:8030",
        "localhostname": br_localhostname,
        "lower_useragent": br_lower_useragent,
        "ls_support": test_local_storage(),
        "main_alchemy_node": "https://eth-mainnet.g.alchemy.com/v2/",
        "arbitrum_alchemy_node": "https://arb-mainnet.g.alchemy.com/v2/",
        "polygon_alchemy_node": "https://polygon-mainnet.g.alchemy.com/v2/",
        "base_alchemy_node": "https://base-mainnet.g.alchemy.com/v2/",
        "main_alchemy_socket": "wss://eth-mainnet.g.alchemy.com/v2/",
        "main_arbitrum_node": "https://arbitrum-mainnet.infura.io/v3/",
        "main_arbitrum_socket": "wss://arbitrum-mainnet.infura.io/ws/v3/",
        "main_polygon_node": "https://polygon-mainnet.infura.io/v3/",
        "main_polygon_socket": "wss://polygon-mainnet.infura.io/ws/v3/",
        "main_bnb_node": "https://bsc-mainnet.infura.io/v3/",
        "main_bnb_socket": "wss://bsc-mainnet.infura.io/ws/v3/",
        "main_eth_node": "https://mainnet.infura.io/v3/",
        "main_eth_socket": "wss://mainnet.infura.io/ws/v3/",
        "main_bc_ws": "ws://socket.blockcypher.com/v1/",
        "main_bc_wss": "wss://socket.blockcypher.com/v1/",
        "main_kas_wss": "wss://api.kaspa.org",
        "mempool_space": {
            "bitcoin": "https://mempool.space",
            "bitcoin-cash": null,
            "dogecoin": null,
            "litecoin": "https://litecoinspace.org"
        },
        "ndef": (br_has_ndef && !br_inframe) ? new NDEFReader() : false,
        "offline": (navigator.onLine === false),
        "ogtitle": $("meta[property='og:title']"),
        "overflow_limit": 25,
        "paymentdialogbox": $("#paymentdialogbox"),
        "paymentpopup": $("#payment"),
        "phpsupport": false,
        "proxy_list": br_proxy_list,
        "proxy_version": "0.032",
        "redirect_uri": br_w_loc.origin + br_w_loc.pathname + "?p=settings",
        "ref_match": br_ref_match,
        "referrer": br_referrer,
        "scanner": init_qrscanner,
        "scope": "https://www.googleapis.com/auth/drive.appdata",
        "sec_kas_wss": "wss://api-v2-do.kas.fyi",
        "stored_currencies": br_get_local("currencies", true),
        "supportsTouch": ("ontouchstart" in window || navigator.msMaxTouchPoints) ? true : false,
        "test_address": { // bip39 (All addresses / xpubs in this app are test addresses derived from the following testphrase, taken from https://github.com/bitcoinbook/bitcoinbook/blob/f8b883dcd4e3d1b9adf40fed59b7e898fbd9241f/ch05.asciidoc)
            "bitcoin": "bc1qg0azlj4w2lrq8jssrrz6eprt2fe7f7edm4vpd5",
            "bitcoin-cash": "qp5p0eur784pk8wxy2kzlz3ctnq5whfnuqqpp78u22",
            "dogecoin": "DKvWg8UhQSycj1J8QVxeBDkRpbjDkw3DiW",
            "ethereum": "0x2161DedC3Be05B7Bb5aa16154BcbD254E9e9eb68",
            "litecoin": "LZakyXotaE29Pehw21SoPuU832UhvJp4LG",
            "nano": "nano_1mbtirc4x3kixfy5wufxaqakd3gbojpn6gpmk6kjiyngnjwgy6yty3txgztq",
            "monero": "477h3C6E6C4VLMR36bQL3yLcA8Aq3jts1AHLzm5QXipDdXVCYPnKEvUKykh2GTYqkkeQoTEhWpzvVQ4rMgLM1YpeD6qdHbS",
            "xmrvk": "e4d63789cdfa2ec48571e93e47520690b2c6e11386c90448e8b357d1cd917c00"
        },
        "test_tx": {
            "bitcoin": "b84fc802ad3ead719583b6f87ab36c95ae6544a291f2c2b8abb328989703f64a",
            "bitcoin-cash": "f7b74b3208fccc600919f4181114a0858a28c7862ace5cba1f408fcfe7b5d147",
            "dogecoin": "4830dee8e225309e8a643895f637e604285a306b3e365302b64939fdaf4ccc79",
            "ethereum": "0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1",
            "litecoin": "a507149c0918d3a9403a39675c65929feb9c69c5cc5c412217b9ea48f0510ab6"
        },
        "thishostname": br_thishostname,
        "timezone": br_timezone,
        "timezoneoffset": br_timezoneoffset,
        "titlenode": $("title"),
        "token_cache": 604800,
        "useragent": br_useragent,
        "video": br_video,
        "w_loc": br_w_loc,
        "wl": navigator.wakeLock,
        "xinput": "input not allowed",
        "xss_alert": "xss attempt detected",
        "zeroplaceholder": parseFloat((0.00).toLocaleString(langcode, {
            "minimumFractionDigits": 2,
            "maximumFractionDigits": 2
        })).toFixed(2),
        "audio_buffers": {}
    },
    glob_let = {
        "post_scan": false,
        "angle": 0,
        "ap_id": null,
        "api_attempt": {},
        "apikey_fails": false,
        "backup_active": false,
        "backup_filename": null,
        "backup_result": null,
        "bipid": br_bipid,
        "bipobj": br_bipobj,
        "bipv": false,
        "block_overflow": {
            "l2": 0,
            "polling": 0,
            "proxy": 0,
            "rpc": 0,
            "socket": 0
        },
        "block_scan": 0,
        "blockswipe": false,
        "blocktyping": false,
        "cashier_dat": br_cashier_dat,
        "cashier_seedid": br_cashier_seedid,
        "changes": {}, //bip39
        "cp_timer": 0,
        "ctrl": false,
        "currencyscan": null,
        "hascam": false,
        "hasbip": br_hasbip,
        "init": br_init,
        "io": br_io,
        "is_btc": false,
        "is_cashier": br_is_cashier,
        "is_erc20t": null,
        "l2_fetched": {},
        "l2s": {},
        "lnd_confirm": false,
        "lnd_ph": false,
        "local": false,
        "localserver": false,
        "ndef_processing": null,
        "ndef_timer": 0,
        "new_address": false, // prevent double address entries
        "overflow_detected": false,
        "percent": 0,
        "phrasearray": null,
        "phraseverified": false, // core:
        "pinging": {},
        "prevkey": false,
        "proxy_attempts": {},
        "request_timer": 0,
        "resd": {},
        "rpc_attempts": {},
        "sa_timer": 0,
        "scantype": null,
        "scrollposition": 0,
        "socket_attempt": {},
        "sockets": {},
        "statuspush": [],
        "symbolcache": false,
        "test_derive": true,
        "test_rpc_call": null,
        "tor_proxies": tor_proxies,
        "tpto": 0, // tx_polling timer
        "tx_count": 1000000,
        "tx_list": [],
        "vk": null,
        "xmr_indexed": {
            "mempool": [],
            "blocks": []
        },
        "wakelock": false,
        "ws_timer": 0,
        "in_background": false,
        "background_timeout": 0,
        "audio_ctx": null
    }

// Global helpers
let request = null,
    helper = null;

// ** Core Storage Functions: **
//test_local_storage
//br_set_local
//br_get_local
//br_remove_local
//br_set_session
//br_get_session
//br_remove_session
//set_up
//is_safari

// ** Time & Date Utilities: **
//now_utc
//short_date
//format_datetime_string
//parse_datetime_string
//to_ts
//format_time_24h
//weekdays
//fulldateformat
//fulldateformat_markup

// ** String & Number Manipulation: **
//sanitize_string
//remove_diacritics
//capitalize
//str_match
//str_includes
//is_integer
//is_milliseconds
//trimdecimals
//tofixedspecial
//generate_hash
//cleanb64
//b64urldecode
//truncate_middle
//strip_quotes

// ** Object & Array Helpers: **
//is_btchain
//get_default_object
//exists
//is_array
//q_obj
//empty_obj
//adjust_objectarray
//dom_to_array
//clone
//objectkey_in_array
//objectkey_from_array
//value_in_array
//find_object_index
//get_next
//add_unique_items
//remove_array_items
//merge_by_key
//create_range_array

// ** DOM & UI Utilities: **
//play_audio
//init_audio_context
//load_audio
//shake
//vibrate
//getcc_icon
//click_pop
//highlight_json_syntax
//get_aws_icon_url
//visibility_change
//visible_tab
//get_vk

// ** Device & Platform Detection: **
//detect_device_type
//get_platform
//hasbigint

// ** URL & Parameter Handling: **
//get_search
//get_urlparameters
//parse_url_params
//scanmeta
//decode_entities
//inj
//inj_alert
//make_local

// ** API & Proxy Management: **
//api_proxy
//c_apiname
//br_result
//get_api_url
//get_api_data
//proxy_dat
//d_proxy
//all_global_proxies
//all_proxies
//filter_object_array
//fetch_aws
//br_offline

// ** Data Access & Query Functions: **
//is_openrequest
//get_setting
//set_setting
//get_requestli
//ch_pending
//get_addresslist
//filter_addressli
//filter_all_addressli
//get_address_data
//filter_list
//filter_list_match
//get_request_id
//get_currencyli
//get_homeli
//cs_node

// ** Cryptocurrency Functions: **
//get_coin_config
//active_coinsettings
//get_coin_metadata
//get_coinsettings
//get_coin_definition
//get_erc20_data
//get_erc20_settings
//add_prefix_to_keys
//get_cached_tokens

// ** Sanitizing URLS: **
//strip_key_from_url
//complete_url
//c_proxy
//is_valid_domain
//is_valid_ipv4
//is_valid_ipv6
//is_valid_localhost
//is_valid_onion
//is_websocket_url
//sanitize_url
//is_valid_url_or_ip

// ** URL schemes: **

//btc_urlscheme
//bch_urlscheme
//nano_urlscheme
//xmr_urlscheme
//bip21_urlscheme

// ** Animations: **
// loading_dots();

// ** Core Storage Functions: **

// Tests browser's localStorage API availability through write and remove operations
function test_local_storage() {
    const test_key = "testdat"; // Local storage
    try {
        localStorage.setItem(test_key, test_key);
        localStorage.removeItem(test_key);
        return true
    } catch (e) {
        return false
    }
}

// Persists data to localStorage with 'bitrequest_' prefix and optional JSON stringification
function br_set_local(pref, dat, str) {
    const storage_data = str ? JSON.stringify(dat ?? null) : dat;
    localStorage.setItem("bitrequest_" + pref, storage_data);
}

// Retrieves and optionally parses JSON data from localStorage with 'bitrequest_' prefix
function br_get_local(pref, parse) {
    const stored_data = localStorage.getItem("bitrequest_" + pref);
    return parse && stored_data !== null ? JSON.parse(stored_data) : stored_data;
}

// Deletes item with 'bitrequest_' prefix from localStorage
function br_remove_local(pref) {
    localStorage.removeItem("bitrequest_" + pref);
}

// Stores data in sessionStorage with 'bitrequest_' prefix and optional JSON stringification
function br_set_session(pref, dat, str) {
    const storage_data = str ? JSON.stringify(dat ?? null) : dat;
    sessionStorage.setItem("bitrequest_" + pref, storage_data);
}

// Retrieves and optionally parses JSON data from sessionStorage with 'bitrequest_' prefix
function br_get_session(pref, parse) {
    const stored_data = sessionStorage.getItem("bitrequest_" + pref);
    return parse && stored_data !== null ? JSON.parse(stored_data) : stored_data;
}

// Deletes item with 'bitrequest_' prefix from sessionStorage
function br_remove_session(pref) {
    sessionStorage.removeItem("bitrequest_" + pref);
}

// Checks if app is set up
function set_up() {
    return exists(glob_const.stored_currencies) ? true : false;
}

// checks useragent for safari browsers
function is_safari() {
    const is_chrome = br_lower_useragent.indexOf("chrome") > -1,
        is_chromium = br_lower_useragent.indexOf("chromium") > -1,
        is_safari = br_lower_useragent.indexOf("safari") > -1,
        is_chrome_ios = br_lower_useragent.indexOf("crios") > -1,
        is_firefox_ios = br_lower_useragent.indexOf("fxios") > -1;
    if (is_safari && !is_chrome && !is_chromium && !is_chrome_ios && !is_firefox_ios) {
        return true;
    } else {
        return false;
    }
}

// ** Time & Date Utilities: **

// Returns current UTC timestamp
function now_utc() {
    return Date.now();
}

// Formats timestamp into localized short date with time
function short_date(tx_time) {
    return new Date(tx_time).toLocaleString(langcode, {
        "day": "2-digit",
        "month": "2-digit",
        "year": "2-digit",
        "hour": "numeric",
        "minute": "numeric"
    })
}

// Combines date and time parts into standardized datetime string
function format_datetime_string(datetime_parts) {
    const [date, time] = datetime_parts,
    delimiter = time.includes(".") ? "." : "Z";
    return date + " " + time.split(delimiter)[0];
}

// Parses datetime string into JavaScript Date timestamp
function parse_datetime_string(date_string) {
    const [date, time] = date_string.split(" "),
        [year, month, day] = date.split("-"),
        [hours, minutes, seconds] = time.split(":");
    return new Date(year, parseInt(month, 10) - 1, day, hours, minutes, seconds);
}

// Converts ISO timestamp string to milliseconds since epoch
function to_ts(timestamp) {
    if (timestamp) {
        const time_parts = timestamp.split("T");
        return time_parts?.length ? parse_datetime_string(format_datetime_string(time_parts)).getTime() : null;
    }
    return null;
}

// Converts time to 24-hour format with leading zeros
function format_time_24h(date) {
    const hours = date.getHours().toString().padStart(2, "0"),
        minutes = date.getMinutes().toString().padStart(2, "0"),
        seconds = date.getSeconds().toString().padStart(2, "0");
    return " " + hours + ":" + minutes + ":" + seconds;
}

// Returns array of localized weekday names in user's language
function weekdays() {
    return [
        tl("sunday"),
        tl("monday"),
        tl("tuesday"),
        tl("wednesday"),
        tl("thursday"),
        tl("friday"),
        tl("saturday")
    ];
}

// Formats date object into localized full date string with optional markup
function fulldateformat(date, lang, markup) {
    const year = date.getFullYear(),
        current_year = new Date().getFullYear(),
        year_suffix = year == current_year ? "" : ", " + year,
        time = format_time_24h(date),
        time_markup = markup ? " | <div class='fdtime'>" + time + "</div>" : " | " + time;
    return weekdays()[date.getDay()] + ", " + date.toLocaleString(lang, {
        "month": "long"
    }) + " " + date.getDate() + year_suffix + time_markup;
}

// Creates HTML-formatted full date string with separated time component
function fulldateformat_markup(date, lang) {
    return weekdays()[date.getDay()] + " " + date.toLocaleString(lang, {
        "month": "long"
    }) + " " + date.getDate() + " | <div class='fdtime'>" + format_time_24h(date) + "</div>";
}

// ** String & Number Manipulation: **

// Sanitizes string by removing Unicode control characters and invalid code points
function sanitize_string(string) {
    const invalid_chars = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
    return string.replace(invalid_chars, "");
}

// Removes diacritical marks from string using Unicode normalization
function remove_diacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Transforms string to title case by uppercasing first character
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Performs case-insensitive bidirectional string matching
function str_match(str1, str2) {
    if (str1 && str2) {
        if (str1 === str2) return true
        return str_includes(str1, str2) || str_includes(str2, str1);
    }
    return false
}

// Executes case-insensitive substring search
function str_includes(main, chunk) {
    if (main && chunk) {
        const main_str = typeof main === "string" ? main : String(main),
            chunk_str = typeof chunk === "string" ? chunk : String(chunk),
            main_upper = main_str.toUpperCase(),
            chunk_upper = chunk_str.toUpperCase(),
            is_included = main_upper.includes(chunk_upper);
        return is_included;
    }
    return false
}

// Checks if (timestamp) is number
function is_integer(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
}

function to_integer(value) {
    if (is_integer(value)) {
        return value;
    }
    try {
        return parseInt(value, 10);
    } catch (e) {
        console.error(e);
    }
    return false
}

// Checks if timestamp is in seconds or milliseconds
function is_milliseconds(ts) {
    const digits = ts.toString().length;
    return digits >= 13;
}

// Truncates floating point number to specified decimal places
function trimdecimals(amount, decimals) {
    return Number(parseFloat(amount).toFixed(decimals));
}

// Converts scientific notation numbers to fixed-point decimal strings
function tofixedspecial(str, n) {
    if (str.indexOf("e+") < 0) {
        return str;
    }
    const decimal_str = str.replace(".", "").split("e+").reduce(function(p, b) {
        return p + "0".repeat(b - p.length + 1);
    }) + "." + "0".repeat(n);
    return decimal_str.slice(0, -1);
}

// Generates deterministic 32-bit hash from string using bit manipulation
function generate_hash(str) {
    if (str) {
        return Math.abs(str.split("").reduce(function(a, b) {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a
        }, 0));
    }
    return false
}

// Formats base64 strings for URL-safe usage by replacing '+' and '/' characters
function cleanb64(str) {
    return str.replace(/\+/g, "-").replace(/\//g, "_");
}

// Converts URL-safe base64 string to original format and attempts SJCL bit decoding
function b64urldecode(str) {
    const clean_str = cleanb64(str);
    if (is_hex(clean_str) === true) {
        return clean_str;
    }
    try {
        return from_bits(sjcl.codec.base64url.toBits(clean_str));
    } catch (e) {
        return false
    }
}

// Shorten long titles
function truncate_middle(str, start = 13, end = 15, limit = 35) {
    // Check if value is a string
    if (typeof str === "string") {
        // If the string is too short to truncate, return it as is
        if (str.length <= limit) {
            return str;
        }
        const first_part = str.substring(0, start),
            last_part = str.substring(str.length - end);
        return first_part + "...." + last_part;
    }
    return str;
}

function strip_quotes(str) {
    if (typeof str !== "string") {
        return str;
    }
    if (str.startsWith('"') && str.endsWith('"')) {
        return str.slice(1, -1);
    }
    return str;
}

// ** Object & Array Helpers: **

// Determines if currency is within predefined Bitcoin-family blockchains
function is_btchain(currency) {
    const btc_chains = ["bitcoin", "litecoin", "dogecoin", "bitcoin-cash"];
    return btc_chains.includes(currency);
}

// Returns empty object/array or provided object based on false input value
function get_default_object(object, obj) { // Default object
    return object || (obj === true ? {} : []);
}

// Validates if value is defined, non-null, and has length property greater than zero
function exists(val) {
    if (val == undefined || val == null || !val.length) {
        return false
    }
    return true
}

// Determines if input is Array using native Array.isArray method
function is_array(e) {
    return Array.isArray(e);
}

// Traverses nested object properties using dot notation path string
function q_obj(obj, path) {
    try {
        const path_parts = path.split(".");
        for (let i = 0; i < path_parts.length; i++) {
            if (obj === null || typeof obj !== "object") {
                return false
            }
            obj = obj[path_parts[i]];
        }
        return obj;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// Verifies if object has no enumerable properties using jQuery
function empty_obj(val) {
    return $.isEmptyObject(val);
    // future vanilla js
    // const str = JSON.stringify(val);
    // return str === "{}" || str === "[]";
}

// Updates specific properties of objects within array using ID matching
function adjust_objectarray(array, modifications) {
    const updated_array = array;
    $.each(modifications, function(i, mod) {
        const target_index = array.findIndex((obj => obj.id == mod.id));
        updated_array[target_index][mod.change] = mod.val;
    });
    return updated_array;
}

// Extracts data attributes from jQuery collection into array
function dom_to_array(dom, data_attr) {
    return dom.map(function() {
        return $(this).data(data_attr);
    }).get();
}

// Clone object
function clone(object) {
    return JSON.parse(JSON.stringify(object));
}

// Verifies if object key value exists array
function objectkey_in_array(array, key, val) {
    return (objectkey_from_array(array, key, val)) ? true : false
}

// Extracts object key value exists array
function objectkey_from_array(array, key, val) {
    const matched_item = array.find(obj => obj[key] === val);
    return matched_item || false;
}

// Verifies if key exists in provided array
function value_in_array(array, key) {
    if (empty_obj(array)) {
        return false
    }
    return array.some(key => key.key === key);
}

// Finds the index of an object in an array
function find_object_index(array, key, url) {
    return array.findIndex(item => {
        // Handle the case where the property might not exist
        if (!item[key]) return false

        // Remove trailing slashes for comparison
        const item_url = item[key].endsWith("/") ? item[key].slice(0, -1) : item[key],
            check_url = url.endsWith("/") ? url.slice(0, -1) : url;
        return item_url === check_url;
    });
}

// Finds the next value in an array if exists
function get_next(arr, value) {
    const index = arr.indexOf(value);
    return (index !== -1 && index < arr.length - 1) ? arr[index + 1] : false;
}

// Merge arrays without duplicates
function add_unique_items(target_array, source_array) {
    const existing_set = new Set(target_array),
        new_items = source_array.filter(item => !existing_set.has(item));
    target_array.push(...new_items);
    return target_array; // Returns what was added
}

// Remove items in one array from another array
function remove_array_items(main_array, items_to_remove) {
    const remove_set = new Set(items_to_remove);
    return main_array.filter(item => !remove_set.has(item));
}

function merge_by_key(array, new_item, key) {
    return [...array.filter(item => item[key] !== new_item[key]), new_item];
}

function create_range_array(start, end) {
    if (start > end) {
        return [];
    }
    const result = [];
    for (let i = start; i <= end; i++) {
        result.push(i);
    }
    return result;
}

// ** DOM & UI Utilities: **

// Play a sound from the buffer cache
function play_audio(audio, payment) {
    let selected = audio;
    if (payment) {
        const cc_settings = active_coinsettings(payment);
        selected = q_obj(cc_settings, "soundbytes.selected");
    }
    if (!selected || selected === "none") return;
    if (!glob_let.audio_ctx || !glob_const.audio_buffers[selected]) {
        return
    }

    function play_buffer() {
        if (glob_const.audio_buffers[selected] === "html") {
            const el = document.getElementById(selected);
            if (el) {
                el.currentTime = 0;
                el.play();
            }
            return
        }
        const source = glob_let.audio_ctx.createBufferSource();
        source.buffer = glob_const.audio_buffers[selected];
        source.connect(glob_let.audio_ctx.destination);
        source.start(0);
    }
    // Resume is async — wait for it before playing
    if (glob_let.audio_ctx.state === "suspended") {
        glob_let.audio_ctx.resume().then(play_buffer);
    } else {
        play_buffer();
    }
}

// Initialize AudioContext on first user interaction
function init_audio_context() {
    if (glob_let.audio_ctx) return;
    glob_let.audio_ctx = new(window.AudioContext || window.webkitAudioContext)();
    load_audio("funk", "assets_styles_sounds_funk.mp3");
    load_audio("cashier", "assets_styles_sounds_cashier.mp3");
    load_audio("collect", "assets_styles_sounds_collect.mp3");
    load_audio("blip", "assets_styles_sounds_blip.mp3");
    load_audio("waterdrop", "assets_styles_sounds_waterdrop.mp3");
    load_audio("howl", "assets_styles_sounds_howl.mp3");
    $(document).off("click touchstart", init_audio_context);
}

// Pre-load a sound file into a buffer
function load_audio(name, src) {
    if (location.protocol === "file:") {
        glob_const.audio_buffers[name] = "html";
        return
    }
    fetch(src)
        .then(function(response) {
            return response.arrayBuffer()
        })
        .then(function(arrayBuffer) {
            return glob_let.audio_ctx.decodeAudioData(arrayBuffer)
        })
        .then(function(buffer) {
            glob_const.audio_buffers[name] = buffer;
        })
        .catch(function(error) {
            console.warn("Failed to load audio: " + name, error);
        });
}

// Applies temporary shake animation to DOM element and triggers haptic feedback
function shake(node) {
    node.addClass("shake");
    setTimeout(function() {
        node.removeClass("shake");
        vibrate();
    }, 200);
}

// Activates device vibration API if available
function vibrate() {
    navigator.vibrate?.([100]);
}

// Constructs HTML img tag for cryptocurrency icon based on various IDs
function getcc_icon(cmcid, cpid, erc20) {
    if (erc20) {
        if (glob_const.offline) {
            return "<img src='" + c_icons("ph") + "' class='cmc_icon'/>";
        }
        return "<img src='" + glob_const.cmc_icon_loc + cmcid + ".png' class='cmc_icon'/>";
    }
    return "<img src='" + c_icons(cpid) + "' class='cmc_icon'/>";
}

// Schedules delayed click event trigger on specified element
function click_pop(element_id) {
    const click_timer = setTimeout(function() {
        $("#" + element_id).trigger("click");
    }, 1200, function() {
        clearTimeout(click_timer);
    });
}

// Formats JSON data with HTML syntax highlighting for invoice display
function highlight_json_syntax(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }
    const html_entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;"
    };
    json = json.replace(/[&<>]/g, function(match) {
        return html_entities[match];
    });
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        let css_class = "number";
        if (/^"/.test(match)) {
            css_class = /:$/.test(match) ? "key" : "string";
        } else if (/true|false/.test(match)) {
            css_class = "boolean";
        } else if (/null/.test(match)) {
            css_class = "null";
        }
        return "<span class='" + css_class + "'>" + match + "</span>";
    });
}

// Builds wallet icon URL with wallet name
function get_aws_icon_url(wallet_name, clas = "wallet_icon", ext = "png") {
    return "<img src='" + glob_const.aws_bucket + "img_icons_wallet-icons_" + wallet_name + "." + ext + "' class='" + clas + "' onerror=\"this.src='wp_holder.png'\">";
}

// Fires when app comes back to foreground
function visibility_change() {
    document.addEventListener("visibilitychange", () => {
        const is_request = (is_openrequest() === true),
            glob_search = glob_const.w_loc.search;
        if (visible_tab()) { // to foreground
            if (glob_let.in_background) {
                glob_let.in_background = false;
                const get_bg_dat = br_get_session("bg_time", true);
                if (get_bg_dat) {
                    const search = get_bg_dat.search,
                        search_change = search !== glob_search; // currently not fully working
                    if (is_request) {
                        if (search_change) {
                            cancel_paymentdialog();
                            setTimeout(function() {
                                loadurl();
                            }, 1000);
                            return
                        }
                        const saved_bg_time = get_bg_dat.time;
                        if (saved_bg_time) {
                            foreground_reconnect(saved_bg_time);
                        }
                        return
                    }
                    if (search_change) {
                        loadurl();
                    }
                }
            }
            return
        }
        br_set_session("bg_time", JSON.stringify({
            "time": now_utc(),
            "search": glob_search
        }));
        glob_let.in_background = true;
        if (is_request) {
            glob_let.background_timeout = setTimeout(() => {
                force_close_socket().then(() => {
                    clear_dialog_timeout();
                });
            }, 3500);
        }
    });
}

// Checks if tab is visible in foreground
function visible_tab() {
    if (document.hidden) {
        return false
    }
    return true
}

// Retrieves cached view key data for a Monero address from storage
function get_vk(address) {
    const ad_li = filter_addressli("monero", "address", address),
        ad_dat = (ad_li.length) ? ad_li.data() : {},
        ad_vk = ad_dat.vk;
    if (ad_vk && ad_vk != "") {
        return vk_obj(ad_vk);
    }
    return false
}

// ** Device & Platform Detection: **

// Rotates to next available proxy server while preventing request overflow
function get_next_proxy() {
    if (block_overflow("proxy")) return false // prevent overflow
    const proxies = all_proxies(),
        current = d_proxy(),
        current_index = proxies.indexOf(current),
        safe_index = current_index === -1 ? 0 : current_index,
        next_proxy = proxies[safe_index + 1],
        next_active = next_proxy || proxies[0],
        next_url = next_active.proxy;
    if (glob_let.proxy_attempts[next_url] !== true) {
        glob_let.rpc_attempts = {};
        set_setting("api_proxy", { // save next proxy
            "selected": next_url
        }, next_url);
        save_settings();
        reset_overflow("rpc");
        reset_overflow("l2");
        glob_let.apikey_fails = false;
        return next_url;
    }
    return false
}

// Identifies if request failure originated from proxy server
function is_proxy_fail(stc) {
    const proxies = all_proxies(),
        match = proxies.find(function(url) {
            return stc.includes(url);
        });
    return (match) ? true : false;
}

// Implements request limiting to prevent infinite loops and system overload
function block_overflow(type, limit) {
    if (glob_let.overflow_detected) return true
    glob_let.block_overflow[type]++;
    const max_limit = limit || glob_const.overflow_limit;
    if (glob_let.block_overflow[type] > max_limit) {
        glob_let.overflow_detected = true;
        const error_msg = "<h2 class='icon-warning'>Overflow detected</h2><br/><p><strong style='color:#F00'>Fatal error!</strong><br/>Please close the application ASAP.</p>";
        popdialog(error_msg, "canceldialog");
        return true
    }
    return false
}
// Resets overflow counters for specified or all request types
function reset_overflow(type) {
    glob_let.overflow_detected = false;
    if (type) {
        glob_let.block_overflow[type] = 0;
        return
    }
    glob_let.block_overflow = {
        "l2": 0,
        "rpc": 0,
        "polling": 0,
        "socket": 0,
        "proxy": 0
    };
}

// Parses Lightning Network connection string into URL and parameters
function renderlnconnect(str) {
    const url_parts = str.split("?"),
        base_url = url_parts[0],
        param_str = url_parts[1],
        protocol = base_url.includes("https://") ? "https://" : base_url.includes("http://") ? "http://" : "://",
        params = param_str ? parse_url_params(param_str) : false,
        clean_url = base_url.split(protocol).pop(),
        rest_url = params.lnconnect ? atob(params.lnconnect) : (protocol === "://") ? "https://" + clean_url : protocol + clean_url;
    params.resturl = rest_url;
    return params;
}

// Generates cryptographically secure random integer within specified range
function generate_random_number(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Returns random element from array using Math.random() distribution
function random_array_item(arr) {
    if (is_array(arr)) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
    return false
}

// Initializes API keys from encoded storage or triggers fresh key generation
function gk() {
    const stored_key = glob_let.io.k;
    if (stored_key) {
        const parsed_key = JSON.parse(atob(stored_key));
        if (parsed_key.if_id === "" || parsed_key.ga_id === "" || parsed_key.bc_id === "" || parsed_key.al_id === "") {
            fk();
            return
        }
        init_keys(stored_key, true);
        return
    }
    fk();
}

// Retrieves encryption keys via API proxy with automatic fallback
function fk() {
    api_proxy({
        "proxy": true,
        "custom": "gk",
        "api_url": "x" // dummy value, don't remove
    }).done(function(e) {
        const res = br_result(e);
        result = res.result,
            key_obj = result.k;
        if (key_obj) {
            init_keys(key_obj, false);
        }
    }).fail(function() {
        //init_keys();
    });
}

// Persists decrypted API keys to local storage with optional initialization
function init_keys(key_obj, set) { // set required keys
    const key_data = JSON.parse(atob(key_obj));
    to = key_data;
    glob_let.io.k = key_obj;
    if (set === false) {
        br_set_local("init", glob_let.io, true);
    }
}

// ** Check params ** //
// Processes URL parameters for routing and action dispatch
function check_params(params) {
    const url_params = params || get_urlparameters();
    if (url_params.xss) {
        return
    }
    if (url_params.i) {
        expand_shorturl(url_params.i);
        return
    }
    if (url_params.ro) {
        check_teaminvite(url_params.ro);
        return
    }
    if (url_params.sbu) {
        check_systembu(url_params.sbu);
    }
    if (url_params.csv) {
        check_csvexport(url_params.csv);
        return
    }
    if (url_params.p === "settings") {
        if (url_params.code) {
            validate_auth_state(url_params.code);
            return
        }
    }
    if (url_params.cl) {
        click_pop(url_params.cl);
        return
    }
    if (url_params.scheme) {
        check_intents(url_params.scheme);
        return
    }
    if (url_params.lnconnect) {
        render_lightning_interface();
        ln_connect();
    }
}

// ** Device & Platform Detection: **

// Identifies device type from user agent string and app environment flags
function detect_device_type() {
    const useragent = br_useragent;
    return (glob_const.is_android_app === true) ? "android-app" :
        (glob_let.is_ios_app === true) ? "apple-app" :
        (/iPad/.test(useragent)) ? "iPad" :
        (/iPhone/.test(useragent)) ? "iPhone" :
        (/Android/.test(useragent)) ? "Android" :
        (/Macintosh/.test(useragent)) ? "Macintosh" :
        (/Windows/.test(useragent)) ? "Windows" :
        "unknown";
}

// Maps device type to platform marketplace or environment category
function get_platform(device) {
    if (glob_const.supportsTouch) {
        if (glob_const.is_android_app === true || device === "Android" || device === "Windows") {
            return "playstore";
        } else if (device === "iPhone" || device === "iPad" || device === "Macintosh" || glob_let.is_ios_app === true) {
            return "appstore";
        }
    } else {
        if (device === "Windows" || device === "Macintosh") {
            return "desktop";
        }
    }
    return "unknown";
}

// Validates BigInt functionality through feature detection and mathematical operation test
function hasbigint() {
    // Check both existence and functionality
    return typeof BigInt === "function" &&
        typeof BigInt.prototype.toString === "function" &&
        (() => {
            try {
                // More comprehensive test
                return BigInt("9007199254740991") + BigInt(1) === BigInt("9007199254740992");
            } catch {
                return false
            }
        })();
}

// ** URL & Parameter Handling: **

// Extracts query string from URL if present, excluding the path
function get_search(str) {
    return str.includes("?") ? str.split("?").pop() : false;
}

// Retrieves URL parameters from current window location's search string
function get_urlparameters(str) {
    return parse_url_params(glob_const.w_loc.search.substring(1));
}

// Parses URL query string into object
// MODIFIED - Parses URL query string into an object securely
function parse_url_params(str) {
    const param_pairs = str.split("&"),
        param_obj = {};
    for (const pair of param_pairs) {
        // Ensure there is a key-value pair
        if (pair.indexOf("=") === -1) {
            continue;
        }
        const key_val = pair.split("="),
            decoded_key = decodeURIComponent(key_val[0]),
            decoded_val = key_val[1] ? decodeURIComponent(key_val[1].replace(/\+/g, " ")) : "";
        // Scan both the key and the value individually
        if (inj(decoded_key) || inj(decoded_val)) {
            return {
                "xss": true
            };
        }
        param_obj[decoded_key] = decoded_val;
    }
    const data_param = param_obj.d,
        meta_param = param_obj.m;

    if (data_param && scanmeta(data_param)) {
        param_obj.xss = true;
    }
    if (meta_param && scanmeta(meta_param)) {
        param_obj.xss = true;
    }
    return param_obj;
}

// Validates base64 encoded metadata
function scanmeta(val) {
    const decoded = (val?.length > 5) ? atob(val) : false,
        has_xss = inj(decoded);
    if (has_xss) { //xss detection
        return true
    }
    return false
}

function decode_entities(str) {
    return str.replace(/&(#(x?)([0-9a-fA-F]+)|([a-zA-Z]+));/gi, function(match, num, hex, code_hex, code_name) {
        if (num) {
            return String.fromCharCode(parseInt(code_hex, hex ? 16 : 10));
        } else if (code_name) {
            const named = {
                "amp": "&",
                "apos": "'",
                "ast": "*",
                "bsol": "\\",
                "colon": ":",
                "comma": ",",
                "commat": "@",
                "copy": "\u00A9",
                "dollar": "$",
                "equals": "=",
                "excl": "!",
                "grave": "`",
                "gt": ">",
                "hat": "^",
                "hyphen": "-",
                "lcub": "{",
                "lowbar": "_",
                "lpar": "(",
                "lsqb": "[",
                "lt": "<",
                "midast": "*",
                "num": "#",
                "percnt": "%",
                "period": ".",
                "plus": "+",
                "quest": "?",
                "quot": "\"",
                "rcub": "}",
                "reg": "\u00AE",
                "rpar": ")",
                "rsqb": "]",
                "semi": ";",
                "sol": "/",
                "tilde": "~",
                "verbar": "|"
            } [code_name.toLowerCase()];
            return named || match;
        }
        return match;
    });
}

function inj(val) {
    if (!val) {
        return false;
    }
    const value = typeof val === "string" ? val : String(val),
        is_likely_base64 = value.length > 200 && /^[A-Za-z0-9+/=]+$/.test(value);
    if (is_likely_base64) {
        try {
            const decoded = atob(value);
            return inj(decoded);
        } catch (e) {}
    }
    let url_decoded = value.replace(/\+/g, " "),
        prev = "",
        iterations = 0;
    const max_iterations = 10; // Prevent potential infinite loops
    while (url_decoded !== prev && iterations < max_iterations) {
        prev = url_decoded;
        try {
            url_decoded = decodeURIComponent(prev);
        } catch (e) {
            break;
        }
        iterations++;
    }
    let entity_decoded = url_decoded;
    if (/&(#|[\w]+);/i.test(url_decoded)) {
        entity_decoded = decode_entities(url_decoded);
    }
    const xss_pattern = /<\s*[\/]?\s*(script|img|svg|iframe|object|details|embed|style|math|link|video|audio|form|input|button|marquee|isindex|body|meta|base|applet|param|frameset|frame)|on\w+\s*=|javascript:|vbscript:|data:text\/(html|javascript)|expression\(|href\s*=\s*["']?\s*javascript:|src\s*=\s*["']?\s*(javascript:|data:)|formaction\s*=\s*["']?\s*javascript:|action\s*=\s*["']?\s*javascript:|style\s*=.*(?:expression|url\(javascript:)|(alert|confirm|prompt|eval)\s*[\(\`]/i;
    if (xss_pattern.test(value) || xss_pattern.test(url_decoded) || xss_pattern.test(entity_decoded)) {
        inj_alert(value);
        return true;
    }
    const encoded_script_pattern = /%3C\s*script|script\s*%3E|%3C\s*img|%3C\s*iframe|%3C\s*svg/i;
    if (encoded_script_pattern.test(value) || encoded_script_pattern.test(url_decoded)) {
        inj_alert(value);
        return true;
    }

    function check_base64(str) {
        const data_uri_regex = /data:(text\/(?:html|xml|xhtml)|application\/(?:xml|xhtml\+xml)|image\/svg\+xml|text\/javascript);base64,([A-Za-z0-9+/=]+)/i,
            match = str.match(data_uri_regex);
        if (match) {
            try {
                const base64_decoded = atob(match[2]);
                let base64_entity_decoded = base64_decoded;
                if (/&(#|[\w]+);/i.test(base64_decoded)) {
                    base64_entity_decoded = decode_entities(base64_decoded);
                }
                if (xss_pattern.test(base64_decoded) || xss_pattern.test(base64_entity_decoded)) {
                    return true;
                }
            } catch (e) {}
        }
        return false;
    }
    if (check_base64(value) || check_base64(url_decoded) || check_base64(entity_decoded)) {
        inj_alert(value);
        return true;
    }
    const encoding_pattern = /(?:&#[xX]?\d+;|%[0-9a-fA-F]{2}){3,}/;
    if (encoding_pattern.test(value)) {
        inj_alert(value);
        return true;
    }
    return false;
}

function inj_alert(val) {
    const i_err = glob_const.xinput || "Potential XSS pattern detected in value:";
    console.warn(i_err, val);
    if (is_opendialog()) {
        popnotify("error", i_err);
        return;
    }
    topnotify(i_err);
}

// Converts remote URLs to file:// protocol paths in local development environment
function make_local(url) {
    const current_path = glob_const.w_loc.pathname;
    return (glob_let.local || glob_let.localserver) ? (url.includes("?")) ? "file://" + current_path + "?" + url.split("?")[1] : current_path : url;
}

// ** API & Proxy Management: **

// Handles API requests through proxy with automatic failover and authentication
function api_proxy(ad, p_proxy) {
    const custom_url = ad.api_url || false,
        api_name = ad.api,
        api_url_data = custom_url ? {} :
        get_api_url({
            "api": api_name,
            "search": ad.search
        }),
        proxy_url = custom_url || api_url_data.api_url_key,
        active_proxy = p_proxy || d_proxy(),
        is_onion = proxy_url.includes(".onion"),
        payload = q_obj(ad, "params.data");
    // add tor proxy and stringify payload
    if (payload) {
        if (is_onion) {
            const random_proxy = random_array_item(glob_let.tor_proxies);
            if (random_proxy) {
                payload.tor_proxy = random_proxy.proxy;
            }
        }
        ad.params.data = JSON.stringify(payload);
    }
    glob_let.proxy_attempts[active_proxy] = true;
    if (api_url_data) {
        const proxy = ad.proxy,
            api_key = api_url_data.api_key,
            has_key = Boolean(api_key),
            no_key_needed = api_key === "no_key",
            is_key_valid = no_key_needed || has_key;
        if (proxy === false || (proxy !== true && is_key_valid)) {
            const params = ad.params,
                bearer = ad.bearer;
            params.url = proxy_url;
            if (bearer && api_key) {
                if (params.headers) {
                    params.headers["Authorization"] = "Bearer " + api_key;
                } else {
                    params.headers = {
                        "Authorization": "Bearer " + api_key
                    };
                }
            }
            return $.ajax(params);
        }
        // use api proxy
        ad.api = c_apiname(api_name);
        const api_path = "/proxy/v1/",
            root_url = ad.localhost ? "" : active_proxy,
            timeout = is_onion ? 30000 : ad.timeout || 5000,
            proxy_config = {
                "method": "POST",
                "cache": false,
                timeout,
                "url": root_url + api_path,
                "data": $.extend(ad, api_url_data, {
                    "nokey": no_key_needed
                })
            };
        return $.ajax(proxy_config);
    }
    return $.ajax();
}

// Normalizes API names for consistent proxy handling
function c_apiname(api_name) {
    if (api_name === "arbitrum one" || api_name === "polygon pos") return "infura";
    if (api_name === "binplorer") return "ethplorer";
    return api_name;
}

// Processes API response and handles proxy-specific data and version checks
function br_result(e) {
    const ping = e.ping,
        is_proxy = Boolean(ping);
    if (is_proxy && ping.br_cache) {
        const version = ping.br_cache.version;
        if (version < glob_const.proxy_version) {
            proxy_alert(version);
        } else {
            if (glob_const.html.hasClass("proxyupdate")) {
                glob_const.html.removeClass("proxyupdate");
                glob_const.body.removeClass("haschanges");
            }
        }
    }
    return {
        "proxy": is_proxy,
        "result": is_proxy ? (ping.br_cache ? ping.br_result : ping) : e
    }
}

// Constructs API endpoint URL with authentication parameters and search queries
function get_api_url(get) {
    const api = get.api,
        api_data = get_api_data(api);
    if (api_data) {
        const search = get.search || "",
            base_url = api_data.base_url,
            key_param = api_data.key_param || "",
            saved_key = $("#apikeys").data(api),
            key_value = saved_key || api_data.api_key,
            concat_char = (search) ? (search.indexOf("?") > -1 || search.indexOf("&") > -1) ? "&" : "?" : "",
            param_string = key_param !== "bearer" && saved_key ? concat_char + key_param + saved_key : "",
            full_url = base_url + search;
        return {
            "api_url": full_url,
            "api_url_key": full_url + param_string,
            "api_key": key_value,
            "ampersand": concat_char,
            "key_param": key_param
        }
    }
    return false
}

// Retrieves API configuration object by identifier from global config
function get_api_data(api_id) {
    return glob_config.apis.find(function(item) {
        return item.name === api_id;
    });
}

// Retrieves configuration data from API proxy DOM element
function proxy_dat() {
    return $("#api_proxy").data();
}

// Returns currently selected API proxy from configuration
function d_proxy() {
    return proxy_dat().selected;
}

// Returns (filtered) default proxy lists
function all_global_proxies(filter) {
    const global_proxies = glob_const.proxy_list,
        proxy_list = (filter) ? filter_object_array(global_proxies, filter, true) : global_proxies;
    return proxy_list;
}

// Concatenates default and custom proxy lists
function all_proxies(filter) {
    const proxy_data = proxy_dat(),
        custom_proxies = proxy_data.custom_proxies,
        proxy_list = all_global_proxies(filter);
    return proxy_list.concat(custom_proxies);
}

// Filters array by object key value
function filter_object_array(array, key, val) {
    return array.filter(item => item[key] === val);
}

// Constructs complete AWS S3 URL for given filename
function fetch_aws(filename, bckt) {
    const bucket_url = bckt || glob_const.aws_bucket;
    return bucket_url + filename;
}

// Offline notification
function br_offline(nf) {
    glob_const.paymentpopup.removeClass("live");
    if (nf) {
        notify(tl("youareoffline"), 500000, "yes");
    }
}

// ** Data Access & Query Functions: **

// Verifies if payment request form is open
function is_openrequest() {
    return ($("#request_front").length > 0) ? true : false;
}

// Retrieves specific data attribute from settings DOM element
function get_setting(setting, dat) {
    return $("#" + setting).data(dat);
}

// Updates settings DOM element data attributes and optional display text
function set_setting(setting, keypairs, title) {
    const settings_elem = $("#" + setting);
    settings_elem.data(keypairs);
    if (title) {
        settings_elem.find("p").text(title);
    }
}

// Queries request list items by matching specific data attribute
function get_requestli(data_key, data_value) {
    return $("#requestlist li.rqli").filter(function() {
        return $(this).data(data_key) === data_value;
    })
}

// Detects existing pending transaction requests by matching multiple attributes
function ch_pending(request_data) {
    return $("#requestlist li.rqli[data-address='" + request_data.address + "'][data-pending='scanning'][data-cmcid='" + request_data.cmcid + "']").length > 0;
}

// Retrieves DOM container for currency-specific address listings
function get_addresslist(currency) {
    return $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']");
}

// Filters address elements by matching specific data attribute
function filter_addressli(currency, data_key, data_value) {
    const address_items = get_addresslist(currency).children("li");
    return filter_list(address_items, data_key, data_value);
}

// Searches all address elements across currencies by data attribute
function filter_all_addressli(data_key, data_value) {
    return filter_list($(".adli"), data_key, data_value);
}

// Get address data from active address
function get_address_data(currency) {
    const use_random = cs_node(currency, "Use random address", true).selected,
        address_list = filter_addressli(currency, "checked", true),
        first_address = address_list.first(),
        manual_addresses = address_list.not(".seed"),
        address_count = manual_addresses.length,
        random_index = generate_random_number(1, address_count) - 1,
        selected_address = (use_random === true) ? (first_address.hasClass("seed")) ? first_address : manual_addresses.eq(random_index) : first_address;
    return selected_address.data();
}

// Filters any DOM collection by matching data attribute value
function filter_list(list, data_key, data_value) {
    return list.filter(function() {
        return $(this).data(data_key) === data_value;
    })
}

// Filters any DOM collection by matching data attribute value
function filter_list_match(list, data_key, data_value) {
    return list.filter(function() {
        return str_match($(this).data(data_key), data_value);
    })
}

// Filters the request id corresponding an open request
function get_request_id() {
    if (!is_openrequest()) return
    try {
        return filter_list_match($("#requestlist").find("li.rqli"), "rqdata", btoa(JSON.stringify(request.dataobject)).slice(0, -2)).data("requestid");
    } catch (err) {
        console.error(err.name, err.message);
        return false
    }
}

// Locates currency container in active currencies list
function get_currencyli(currency) {
    return $("#usedcurrencies > li[data-currency='" + currency + "']");
}

// Finds currency entry in available currencies list
function get_homeli(currency) {
    return $("#currencylist > li[data-currency='" + currency + "']");
}

// Retrieves currency settings node or data by identifier
function cs_node(currency, id, data) {
    const settings_node = $("#" + currency + "_settings .cc_settinglist li[data-id='" + id + "']");
    if (settings_node.length) {
        if (data) {
            const node_data = settings_node.data();
            if (node_data) {
                return node_data;
            }
        }
        return settings_node;
    }
    const coin_settings = get_coinsettings(currency);
    if (coin_settings) {
        return coin_settings[id];
    }
    return false
}

// ** Cryptocurrency Functions: **

// Fetches cryptocurrency configuration including ERC20 token handling
function get_coin_config(currency) {
    const coin_config = get_coin_definition(currency);
    if (coin_config) {
        const coin_data = coin_config.data,
            settings = coin_config.settings,
            config_object = {
                "currency": coin_data.currency,
                "ccsymbol": coin_data.ccsymbol,
                "cmcid": coin_data.cmcid,
                "monitored": true,
                "urlscheme": coin_data.urlscheme,
                "regex": coin_data.address_regex,
                "erc20": false
            };
        return config_object;
    } // if not it's probably erc20 token
    const currency_ref = get_currencyli(currency); // check if erc20 token is added
    if (currency_ref.length) {
        return $.extend(currency_ref.data(), glob_config.erc20_dat.data);
    } // else lookup erc20 data
    const token_list = get_cached_tokens();
    if (token_list) {
        const token_data = token_list.find(function(token) {
            return token.name === currency;
        });
        if (token_data) {
            const token_config = {
                "currency": token_data.name,
                "ccsymbol": token_data.symbol,
                "cmcid": token_data.cmcid.toString(),
                "contract": token_data.contract
            }
            return $.extend(token_config, glob_config.erc20_dat.data);
        }
    }
    return false
}

// Retrieves current cryptocurrency settings with local storage override
function active_coinsettings(currency) {
    const local_settings = br_get_local(currency + "_settings", true);
    return local_settings || get_coinsettings(currency);
}

// Returns combined cryptocurrency metadata and configuration
function get_coin_metadata(currency) {
    return get_coin_definition(currency) || get_erc20_data();
}

// Fetches cryptocurrency-specific settings configuration
function get_coinsettings(currency) {
    const coin_config = get_coin_definition(currency);
    if (coin_config) {
        return coin_config.settings;
    } // return erc20 settings
    return get_erc20_settings();
}

// Queries cryptocurrency definition from global configuration
function get_coin_definition(currency) {
    return glob_config.bitrequest_coin_data.find(function(coin) {
        return coin.currency === currency;
    });
}

// Retrieves global ERC20 token configuration template
function get_erc20_data() {
    return glob_config.erc20_dat;
}

// Returns default settings for ERC20 token handling
function get_erc20_settings() {
    return glob_config.erc20_dat.settings;
}

// Prepends specified prefix to all object keys
function add_prefix_to_keys(obj, prefix = "data-") {
    return Object.entries(obj).reduce((result, [key, value]) => {
        result[prefix + key] = value;
        return result;
    }, {});
}

// Retrieves cached ERC20 token data with optional timestamp validation
function get_cached_tokens(check) {
    const initial_tokens = br_get_local("erc20tokens_init", true);
    if (initial_tokens) {
        const cache_timestamp = initial_tokens.timestamp;
        if (cache_timestamp) {
            if (check) {
                const cache_age = now_utc() - cache_timestamp;
                // flush cache every week
                if (cache_age < glob_const.token_cache * 1000) {
                    return true
                } else {
                    return false
                }
            }
            const additional_tokens = br_get_local("erc20tokens", true);
            if (additional_tokens) {
                return initial_tokens.token_arr.concat(additional_tokens);
            }
        }
    }
    if (check) {
        return false
    }
    const ctrcts = contracts("br_all");
    if (ctrcts) {
        return ctrcts;
    }
    return false
}

// ** Sanitizing URLS: **

// Strips key from ws_url
function strip_key_from_url(url) {
    // Handle trailing slash
    const has_trailing_slash = url.endsWith("/"),
        url_without_trailing_slash = has_trailing_slash ? url.slice(0, -1) : url,
        protocol_end = url_without_trailing_slash.indexOf("://"),
        search_tart = protocol_end !== -1 ? protocol_end + 3 : 0,
        last_slash_index = url_without_trailing_slash.lastIndexOf("/", url_without_trailing_slash.length);
    // If no slash found after protocol, or only slash is in protocol, return original
    if (last_slash_index === -1 || last_slash_index < search_tart) {
        return url;
    }
    // Get the segment after the last slash
    const last_segment = url_without_trailing_slash.substring(last_slash_index + 1);
    // If longer than 20 characters, strip it
    if (last_segment.length > 20) {
        return url_without_trailing_slash.substring(0, last_slash_index + 1);
    }
    return url; // Return original if <= 20 chars
}

// Normalizes URL format with protocol and trailing slash
function complete_url(url) {
    const withProtocol = url.indexOf("://") > -1 ? url : "https://" + url;
    return withProtocol.slice(-1) === "/" ? withProtocol : withProtocol;
}

// Retrieves active proxy configuration from DOM data
function c_proxy() {
    return $("#api_proxy").data("selected");
}

// Domain name regex with support for paths and query parameters
function is_valid_domain(url) {
    const clean_url = sanitize_url(url);
    if (!clean_url) return false
    const domain_regex = /^(https?:\/\/|wss?:\/\/)?(www\.)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:[0-9]{1,5})?(\/[^\s]*)?$/i;
    return domain_regex.test(clean_url);
}

// IPv4 regex
function is_valid_ipv4(ip4) {
    const clean_ip4 = sanitize_url(ip4);
    if (!clean_ip4) return false
    const ipv4_regex = /^(https?:\/\/)?(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(:[0-9]{1,5})?(:[a-zA-Z0-9]+)?$/;
    return ipv4_regex.test(clean_ip4);
}

// IPv6 regex
function is_valid_ipv6(ip6) {
    const clean_ip6 = sanitize_url(ip6);
    if (!clean_ip6) return false
    const ipv6_regex = /^(https?:\/\/)?(\[)?(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))(\])?(\:[0-9]{1,5})?(:[a-zA-Z0-9]+)?$/;
    return ipv6_regex.test(clean_ip6);
}

// localhost regex
function is_valid_localhost(localhost) {
    const clean_localhost = sanitize_url(localhost);
    if (!clean_localhost) return false
    const localhost_regex = /^(https?:\/\/)?localhost(:[0-9]{1,5})?(:[a-zA-Z0-9]+)?$/i;
    return localhost_regex.test(clean_localhost);
}

// Onion address regex
function is_valid_onion(onion) {
    const clean_onion = sanitize_url(onion);
    if (!clean_onion) return false
    const onion_regex = /^(https?:\/\/)?([a-z2-7]{16}|[a-z2-7]{56})\.onion(:[0-9]{1,5})?(:[a-zA-Z0-9]+)?$/i;
    return onion_regex.test(clean_onion);
}

// Check if a URL is a WebSocket URL (ws:// or wss://)
function is_websocket_url(url) {
    const clean_url = sanitize_url(url);
    if (!clean_url) return false
    const websocket_regex = /^wss?:\/\//i;
    return websocket_regex.test(clean_url);
}

// sanitize_url string
function sanitize_url(input) {
    if (!input || typeof input !== "string") return false
    return input.trim();
}

// Validates if a string is a valid URL or IP address (IPv4 or IPv6)
function is_valid_url_or_ip(input) {
    const clean_url = sanitize_url(input);
    if (!clean_url) return false
    return is_valid_domain(clean_url) ||
        is_valid_ipv4(clean_url) ||
        is_valid_ipv6(clean_url) ||
        is_valid_localhost(clean_url) ||
        is_valid_onion(clean_url);
}

// ** URL schemes: **

// Generates the URL scheme for Bitcoin payments
function btc_urlscheme(payment, address, amount, is_zero, label, message) {
    const base_uri = payment + ":" + address;
    if (!is_zero) return base_uri + bip21_urlscheme(amount, label, message);
    return base_uri
}

// Generates Bitcoin Cash payment URI scheme
function bch_urlscheme(payment, address, amount, is_zero, label, message) {
    const cleaned_address = address.indexOf("bitcoincash:") > -1 ? address.split("bitcoincash:").pop() : address,
        base_uri = "bitcoincash:" + cleaned_address;
    if (!is_zero) return base_uri + bip21_urlscheme(amount, label, message);
    return base_uri
}

// Generates Nano payment URI scheme
function nano_urlscheme(payment, address, amount, is_zero, label, message) {
    const base_uri = "nano:" + address;
    if (is_zero) return base_uri;
    const amount_raw = nano_to_raw(amount);
    return base_uri + bip21_urlscheme(amount_raw, label, message);
}

// Generates XMR payment URI scheme
function xmr_urlscheme(payment, address, amount, is_zero, label, message) {
    const base_uri = "monero:" + address;
    if (is_zero) return base_uri;
    let label_str = "&recipient_name=Bitrequest",
        message_str = "";
    if (label) {
        label_str = "&recipient_name=" + encodeURIComponent(label);
    }
    if (message) {
        message_str = "&tx_description=" + encodeURIComponent(message);
    }
    return base_uri + "?tx_amount=" + amount + label_str + message_str;
}

// Generates Bip21 payment URI scheme
function bip21_urlscheme(amount, label, message) {
    let label_str = "&label=Bitrequest",
        message_str = "";
    if (label) {
        label_str = "&label=" + encodeURIComponent(label);
    }
    if (message) {
        message_str = "&message=" + encodeURIComponent(message);
    }
    return "?amount=" + amount + label_str + message_str;
}

// ** Animations: **

// loading_dots;
function loading_dots(text) {
    return "<div class='loading-container'>	<div class='loading-text'>" + text + "</div><div class='loading-dots'><div class='dot'></div><div class='dot'></div><div class='dot'></div></div></div>";
}