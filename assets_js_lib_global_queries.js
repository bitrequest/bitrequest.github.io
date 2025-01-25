const br_bipobj = br_get_local("bpdat", true),
    br_hasbip = (br_bipobj) ? true : false,
    br_bipid = (br_hasbip) ? br_bipobj.id : false,
    br_cashier_dat = br_get_local("cashier", true),
    br_is_cashier = (br_cashier_dat && br_cashier_dat.cashier) ? true : false,
    br_cashier_seedid = (br_is_cashier) ? br_is_cashier.seedid : false,
    br_init = br_get_local("init", true),
    br_io = br_dobj(br_init, true),
    br_hostname = "bitrequest.github.io", // change if self hosted
    br_localhostname = (br_hostname.indexOf("http") > -1) ? br_hostname.split("://").pop() : br_hostname,
    br_approot = "https://" + br_localhostname + "/",
    br_proxy_list = [
        "https://app.bitrequest.io/",
        "https://www.bitrequest.io/",
        "https://www.bitrequest.app/"
    ],
    br_hosted_proxy = random_array_item(br_proxy_list), // load balance proxies
    br_firebase_dynamic_link_domain = "bitrequest.page.link",
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
    (br_thishostname === br_thishostname) ? "selfhosted" : "unknown",
    br_video = $("#qr-video")[0],
    glob_const = {
        "stored_currencies": br_get_local("currencies", true),
        "apptitle": "Bitrequest",
        "hostname": br_hostname,
        "localhostname": br_localhostname,
        "approot": br_approot,
        "ln_socket": "wss://bitrequest.app:8030",
        "proxy_list": br_proxy_list,
        "hosted_proxy": br_hosted_proxy,
        "proxy_version": "0.016",
        "firebase_dynamic_link_domain": br_firebase_dynamic_link_domain,
        "firebase_shortlink": "https://" + br_firebase_dynamic_link_domain + "/",
        "androidpackagename": br_androidpackagename,
        "phpsupport": false,
        "main_bc_ws": "ws://socket.blockcypher.com/v1/",
        "main_bc_wss": "wss://socket.blockcypher.com/v1/",
        "main_eth_node": "https://mainnet.infura.io/v3/",
        "main_arbitrum_node": "https://arbitrum-mainnet.infura.io/v3/",
        "main_polygon_node": "https://polygon-mainnet.infura.io/v3/",
        "main_bnb_node": "https://bsc-mainnet.infura.io/v3/",
        "main_alchemy_node": "https://eth-mainnet.g.alchemy.com/v2/",
        "main_eth_socket": "wss://mainnet.infura.io/ws/v3/",
        "main_arbitrum_socket": "wss://arbitrum-mainnet.infura.io/ws/v3/",
        "main_polygon_socket": "wss://polygon-mainnet.infura.io/ws/v3/",
        "main_bnb_socket": "wss://bsc-mainnet.infura.io/ws/v3/",
        "main_alchemy_socket": "wss://eth-mainnet.g.alchemy.com/v2/",
        "main_kas_wss": "wss://api.kaspa.org",
        "sec_kas_wss": "wss://api-v2-do.kas.fyi",
        "aws_bucket": "https://brq.s3.us-west-2.amazonaws.com/",
        "cmc_icon_loc": "https://s2.coinmarketcap.com/static/img/coins/200x200/",
        "ls_support": check_local(),
        "has_bigint": hasbigint(),
        "useragent": br_useragent,
        "lower_useragent": br_lower_useragent,
        "titlenode": $("title"),
        "ogtitle": $("meta[property='og:title']"),
        "html": $("html"),
        "body": $("body"),
        "paymentpopup": $("#payment"),
        "paymentdialogbox": $("#paymentdialogbox"),
        "copycontent": $("#copyinput"),
        "funk": $("#funk"), // funk sound effect
        "cashier": $("#cashier"), // cashier sound effect
        "collect": $("#collect"), // collect sound effect
        "blip": $("#blip"), // blip sound effect
        "waterdrop": $("#waterdrop"), // waterdrop sound effect
        "howl": $("#howl"), // howl sound effect
        "timezoneoffset": br_timezoneoffset,
        "timezone": br_timezone,
        "has_ndef": br_has_ndef,
        "supportsTouch": ("ontouchstart" in window || navigator.msMaxTouchPoints) ? true : false,
        "is_safari": (br_lower_useragent.indexOf("safari/") > -1 && br_lower_useragent.indexOf("android") == -1),
        "referrer": br_referrer,
        "exp_referrer": br_exp_referrer,
        "ref_match": br_ref_match,
        "android_standalone": window.matchMedia("(display-mode: standalone)").matches,
        "ios_standalone": navigator.standalone,
        "is_android_app": (br_ref_match) ? true : false, // android app fingerprint
        "is_ios_app": false, // ios app fingerprint
        "deviceid": null,
        "inframe": br_inframe,
        "offline": (navigator.onLine === false),
        "w_loc": br_w_loc,
        "c_host": br_w_loc.origin + br_w_loc.pathname,
        "thishostname": br_thishostname,
        "hostlocation": br_hostlocation,
        "wl": navigator.wakeLock,
        "after_scan_timeout": 30000, // Preform extra tx lookup when closing paymentdialog after 30 seconds
        "xss_alert": "xss attempt detected",
        "token_cache": 604800,
        "video": br_video,
        "scanner": new QrScanner(br_video, result => setResult(result), error => {
            console.log(error);
        }),
        "overflow_limit": 25,
        "ndef": (br_has_ndef && !br_inframe) ? new NDEFReader() : false,
        "cacheperiodcrypto": 120000, //120000 = 2 minutes
        "cacheperiodfiat": 600000, //600000 = 10 minutes
        "zeroplaceholder": parseFloat((0.00).toLocaleString(langcode, {
            "minimumFractionDigits": 2,
            "maximumFractionDigits": 2
        })).toFixed(2),
        "scope": "https://www.googleapis.com/auth/drive.appdata",
        "drivepath": "https://content.googleapis.com",
        "redirect_uri": br_w_loc.origin + br_w_loc.pathname + "?p=settings"
    },
    glob_let = {
        "socket_attempt": {},
        "api_attempt": {},
        "rpc_attempts": {},
        "proxy_attempts": {},
        "tx_list": [],
        "statuspush": [],
        "l2_fetched": {},
        "apikey_fails": false,
        "changes": {}, //bip39
        "test_derive": true,
        "phrasearray": null,
        "phraseverified": false, // core:
        "scrollposition": 0,
        "symbolcache": false,
        "hascam": false,
        "cp_timer": 0,
        "local": false,
        "localserver": false,
        "wakelock": false,
        "bipv": false,
        "bipobj": br_bipobj,
        "hasbip": br_hasbip,
        "bipid": br_bipid,
        "ndef": false,
        "ctrl": false,
        "cashier_dat": br_cashier_dat,
        "is_cashier": br_is_cashier,
        "cashier_seedid": br_cashier_seedid,
        "init": br_init,
        "io": br_io,
        "new_address": false, // prevent double address entries
        "sockets": {},
        "pinging": {},
        "currencyscan": null,
        "scantype": null,
        "backup_active": false,
        "backup_result": null,
        "backup_filename": null,
        "resd": {},
        "ap_id": null,
        "test_rpc_call": null,
        "is_erc20t": null,
        "is_btc": false,
        "lnd_confirm": false,
        "ndef_processing": null,
        "ndef_timer": 0,
        "ws_timer": 0,
        "l2s": {},
        "tpto": 0, // tx_polling timer
        "blockswipe": false,
        "angle": 0,
        "percent": 0,
        "sa_timer": 0,
        "request_timer": 0,
        "blocktyping": false,
        "lnd_ph": false,
        "prevkey": false,
        "block_scan": 0,
        "block_overflow": {
            "l2": 0,
            "rpc": 0,
            "polling": 0,
            "socket": 0,
            "proxy": 0
        },
        "overflow_detected": false
    }

// Global helpers
let request = null,
    helper = null;

//hasbigint

// Manage local storage

//check_local
//br_set_local
//br_set_session
//br_get_local
//br_get_session
//br_remove_local
//br_remove_session

// Helpers

//br_dobj
//exists
//br_issar
//q_obj
//empty_obj
//api_proxy
//c_apiname
//br_result
//get_api_url
//get_next_proxy
//is_proxy_fail
//block_overflow
//reset_overflow
//tofixedspecial
//get_search
//renderlnconnect
//cleanb64
//b64urldecode
//geturlparameters
//renderparameters
//scanmeta
//xss_search
//getrandomnumber
//random_array_item
//hashcode
//getcc_icon
//getdevicetype
//getplatform
//makedatestring
//short_date
//returntimestamp
//to_ts
//weekdays
//fulldateformat
//fulldateformatmarkup
//formattime
//playsound
//shake
//vibrate
//get_api_data
//str_match
//str_incudes
//trimdecimals
//adjust_objectarray
//now
//now_utc
//dom_to_array
//proxy_dat
//d_proxy
//all_proxies
//fetch_aws
//fk
//init_keys
//makelocal
//clean_str
//clear_accents
//capitalize

// ** Query helpers **//

//isopenrequest
//get_setting
//set_setting
//get_requestli
//ch_pending
//get_addresslist
//filter_addressli
//filter_all_addressli
//filter_list
//get_currencyli
//get_homeli
//cs_node
//getcoindata
//activecoinsettings
//getcoindat
//getcoinsettings
//get_erc20_data
//get_erc20_settings
//getcoinconfig
//add_prefix_to_keys
//check_params
//click_pop

// Checks if BigInt is supported in the current environment
function hasbigint() {
    // Check both existence and functionality
    return typeof BigInt === "function" &&
        typeof BigInt.prototype.toString === "function" &&
        (() => {
            try {
                // More comprehensive test
                return BigInt("9007199254740991") + BigInt(1) === BigInt("9007199254740992");
            } catch {
                return false;
            }
        })();
}

// Manage local storage

// Checks if local storage is available
function check_local() {
    const tdat = "testdat"; // Local storage
    try {
        localStorage.setItem(tdat, tdat);
        localStorage.removeItem(tdat);
        return true;
    } catch (e) {
        return false;
    }
}

// Sets an item in local storage with a prefix
function br_set_local(pref, dat, str) {
    const ddat = str ? JSON.stringify(dat ?? null) : dat;
    localStorage.setItem("bitrequest_" + pref, ddat);
}

// Sets an item in session storage with a prefix
function br_set_session(pref, dat, str) {
    const ddat = str ? JSON.stringify(dat ?? null) : dat;
    sessionStorage.setItem("bitrequest_" + pref, ddat);
}

// Gets an item from local storage with a prefix
function br_get_local(pref, parse) {
    const dat = localStorage.getItem("bitrequest_" + pref);
    return parse && dat !== null ? JSON.parse(dat) : dat;
}

// Gets an item from session storage with a prefix
function br_get_session(pref, parse) {
    const dat = sessionStorage.getItem("bitrequest_" + pref);
    return parse && dat !== null ? JSON.parse(dat) : dat;
}

// Removes an item from local storage with a prefix
function br_remove_local(pref) {
    localStorage.removeItem("bitrequest_" + pref);
}

// Removes an item from session storage with a prefix
function br_remove_session(pref) {
    sessionStorage.removeItem("bitrequest_" + pref);
}

// ** Helpers ** //

// Checks if a currency is a Bitcoin-like blockchain
function is_btchain(currency) {
    const btchains = ["bitcoin", "litecoin", "dogecoin", "bitcoin-cash"];
    return btchains.includes(currency);
}

// Returns a default object or array if the input is false
function br_dobj(object, obj) { // Default object
    return object || (obj === true ? {} : []);
}

// Checks if a value exists and is not empty
function exists(val) {
    if (val === undefined || val === null || !val.length) {
        return false;
    }
    return true;
}

// Checks if the input is an array
function br_issar(e) {
    return Array.isArray(e);
}

// Queries a nested object using a dot-notated path
function q_obj(obj, path) {
    try {
        const p_arr = path.split(".");
        for (let i = 0; i < p_arr.length; i++) {
            if (obj === null || typeof obj !== "object") {
                return false;
            }
            obj = obj[p_arr[i]];
        }
        return obj;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Checking if object is empty
function empty_obj(val) {
    return $.isEmptyObject(val);
    // future vanilla js
    // const str = JSON.stringify(val);
    // return str === "{}" || str === "[]";
}

// Handles API proxy requests
function api_proxy(ad, p_proxy) {
    const custom_url = ad.api_url || false,
        apiname = ad.api,
        aud = custom_url ? {} :
        get_api_url({
            "api": apiname,
            "search": ad.search
        }),
        set_proxy = p_proxy || d_proxy();
    glob_let.proxy_attempts[set_proxy] = true;
    if (aud) {
        const proxy = ad.proxy,
            api_key = aud.api_key,
            set_key = Boolean(api_key),
            nokey = api_key === "no_key",
            key_pass = nokey || set_key;
        if (proxy === false || (proxy !== true && key_pass)) {
            const params = ad.params,
                bearer = ad.bearer;
            params.url = custom_url || aud.api_url_key;
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
        ad.api = c_apiname(apiname);
        const api_location = "proxy/v1/",
            app_root = ad.localhost ? "" : set_proxy,
            proxy_data = {
                "method": "POST",
                "cache": false,
                "timeout": 5000,
                "url": app_root + api_location,
                "data": $.extend(ad, aud, {
                    "nokey": nokey
                })
            };
        return $.ajax(proxy_data);
    }
    return $.ajax();
}

// Corrects API name for specific cases
function c_apiname(apiname) {
    if (apiname === "arbitrum" || apiname === "polygon") return "infura";
    if (apiname === "binplorer") return "ethplorer";
    return apiname;
}

// Processes the result from an API request
function br_result(e) {
    const ping = e.ping,
        proxy = Boolean(ping);
    if (proxy && ping.br_cache) {
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
        "proxy": proxy,
        "result": proxy ? (ping.br_cache ? ping.br_result : ping) : e
    }
}

// Constructs the API URL with necessary parameters
function get_api_url(get) {
    const api = get.api,
        ad = get_api_data(api);
    if (ad) {
        const search = get.search || "",
            base_url = ad.base_url,
            key_param = ad.key_param || "",
            saved_key = $("#apikeys").data(api),
            key_val = saved_key || ad.api_key,
            ampersand = (search) ? (search.indexOf("?") > -1 || search.indexOf("&") > -1) ? "&" : "?" : "",
            api_param = key_param !== "bearer" && saved_key ? ampersand + key_param + saved_key : "",
            api_url = base_url + search;
        return {
            "api_url": api_url,
            "api_url_key": api_url + api_param,
            "api_key": key_val,
            "ampersand": ampersand,
            "key_param": key_param
        }
    }
    return false
}

// Gets the next available proxy from the list
function get_next_proxy() {
    if (block_overflow("proxy")) return false; // prevent overflow
    const proxies = all_proxies(),
        current_proxy = d_proxy(),
        c_index = proxies.indexOf(current_proxy),
        cc_index = c_index === -1 ? 0 : c_index,
        next_i = proxies[cc_index + 1],
        next_p = next_i || proxies[0];
    if (glob_let.proxy_attempts[next_p] !== true) {
        glob_let.rpc_attempts = {};
        set_setting("api_proxy", { // save next proxy
            "selected": next_p
        }, next_p);
        savesettings();
        reset_overflow("rpc");
        reset_overflow("l2");
        glob_let.apikey_fails = false;
        return next_p;
    }
    return false;
}

// Checks if failed connection is proxy 
function is_proxy_fail(stc) {
    const proxies = all_proxies(),
        match = proxies.find(function(url) {
            return stc.includes(url);
        });
    return (match) ? true : false;
}

// prevent overflow
function block_overflow(type, limit) {
    if (glob_let.overflow_detected) return true;
    glob_let.block_overflow[type]++;
    const overflow_limit = limit || glob_const.overflow_limit;
    if (glob_let.block_overflow[type] > overflow_limit) {
        glob_let.overflow_detected = true;
        const content = "<h2 class='icon-warning'>Overflow detected</h2><br/><p><strong style='color:#F00'>Fatal error!</strong><br/>Please close the application ASAP.</p>";
        popdialog(content, "canceldialog");
        return true;
    }
    return false;
}

// prevent overflow
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

// Converts scientific notation to fixed-point notation
function tofixedspecial(str, n) {
    if (str.indexOf("e+") < 0) {
        return str;
    }
    const convert = str.replace(".", "").split("e+").reduce(function(p, b) {
        return p + "0".repeat(b - p.length + 1);
    }) + "." + "0".repeat(n);
    return convert.slice(0, -1);
}

// Renders Lightning Network connection parameters
function renderlnconnect(str) {
    const spitsearch = str.split("?"),
        url = spitsearch[0],
        s_string = spitsearch[1],
        proto = url.includes("https://") ? "https://" : url.includes("http://") ? "http://" : "://",
        search = s_string ? renderparameters(s_string) : false,
        bare_url = url.split(proto).pop(),
        rest_url = search.lnconnect ? atob(search.lnconnect) : (proto === "://") ? "https://" + bare_url : proto + bare_url;
    search.resturl = rest_url;
    return search;
}

// Cleans base64 encoded string for URL use
function cleanb64(str) {
    return str.replace(/\+/g, "-").replace(/\//g, "_");
}

// Decodes base64 URL-safe string
function b64urldecode(str) {
    const cstr = cleanb64(str);
    if (is_hex(cstr) === true) {
        return cstr;
    }
    try {
        return frombits(sjcl.codec.base64url.toBits(cstr));
    } catch (e) {
        return false;
    }
}

// Extracts search parameters from a URL
function get_search(str) {
    return str.includes("?") ? str.split("?").pop() : false;
}

// Gets URL parameters from the current page
function geturlparameters(str) {
    return renderparameters(glob_const.w_loc.search.substring(1));
}

// Renders URL parameters into an object
function renderparameters(str) {
    const xss = xss_search(str);
    if (xss) {
        return {
            "xss": true
        }
    }
    const getvalues = str.split("&"),
        get_object = {};
    getvalues.forEach(function(val) {
        const keyval = val.split("=");
        get_object[decodeURIComponent(keyval[0])] = decodeURIComponent(keyval[1]);
    });
    const dp = get_object.d,
        mp = get_object.m;
    if (dp) {
        const isxx = scanmeta(dp);
        if (isxx) {
            get_object.xss = true;
        }
    }
    if (mp) {
        const isxx = scanmeta(mp);
        if (isxx) {
            get_object.xss = true;
        }
    }
    return get_object;
}

// Scans metadata for potential XSS attacks
function scanmeta(val) {
    const isd = (val?.length > 5) ? atob(val) : false,
        xssdat = xss_search(isd);
    if (xssdat) { //xss detection
        return true;
    }
    return false;
}

// Searches for potential XSS attacks in a string
function xss_search(val) {
    if (val) {
        const val_lower = val.toLowerCase();
        if (val_lower.includes("<scrip")) {
            vibrate();
            notify(glob_const.xss_alert);
            return true
        }
        if (val_lower.includes("onerror")) {
            vibrate();
            notify(glob_const.xss_alert);
            return true
        }
    }
    return false
}

// Generates a random number within a range
function getrandomnumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

// Selects a random item from an array
function random_array_item(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Generates a hash code from a string
function hashcode(str) {
    if (str) {
        return Math.abs(str.split("").reduce(function(a, b) {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a
        }, 0));
    }
    return false;
}

// Gets the cryptocurrency icon based on IDs
function getcc_icon(cmcid, cpid, erc20) {
    if (erc20) {
        if (glob_const.offline === true) {
            return "<img src='" + c_icons("ph") + "' class='cmc_icon'/>";
        }
        return "<img src='" + glob_const.cmc_icon_loc + cmcid + ".png' class='cmc_icon'/>";
    }
    return "<img src='" + c_icons(cpid) + "' class='cmc_icon'/>";
}

// Determines the device type
function getdevicetype() {
    const ua = br_useragent;
    return (glob_const.is_android_app === true) ? "android-app" :
        (glob_let.is_ios_app === true) ? "apple-app" :
        (/iPad/.test(ua)) ? "iPad" :
        (/iPhone/.test(ua)) ? "iPhone" :
        (/Android/.test(ua)) ? "Android" :
        (/Macintosh/.test(ua)) ? "Macintosh" :
        (/Windows/.test(ua)) ? "Windows" :
        "unknown";
};

// Determines the platform based on device type
function getplatform(device) {
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

// Creates a date string from date-time parts
function makedatestring(datetimeparts) {
    const [date, time] = datetimeparts,
    split = time.includes(".") ? "." : "Z";
    return date + " " + time.split(split)[0];
}

// Converts a date string to a timestamp
function returntimestamp(datestring) {
    const [date, time] = datestring.split(" "),
        [year, month, day] = date.split("-"),
        [hours, minutes, seconds] = time.split(":");
    return new Date(year, parseInt(month, 10) - 1, day, hours, minutes, seconds);
}

// Converts a timestamp string to milliseconds
function to_ts(ts) {
    if (ts) {
        const tstamp = ts.split("T");
        return tstamp?.length ? returntimestamp(makedatestring(tstamp)).getTime() : null;
    }
    return null;
}

// Formats a timestamp into a short date string
function short_date(txtime) {
    return new Date(txtime - glob_const.timezone).toLocaleString(langcode, {
        "day": "2-digit", // numeric, 2-digit
        "month": "2-digit", // numeric, 2-digit, long, short, narrow
        "year": "2-digit", // numeric, 2-digit
        "hour": "numeric", // numeric, 2-digit
        "minute": "numeric"
    })
}

// Returns an object with translated weekday names
function weekdays() {
    return [
        translate("sunday"),
        translate("monday"),
        translate("tuesday"),
        translate("wednesday"),
        translate("thursday"),
        translate("friday"),
        translate("saturday")
    ];
}

// Formats a date object into a full date string
function fulldateformat(date, lng, markup) {
    const year = date.getFullYear(),
        currentyear = new Date().getFullYear(),
        yearstring = year == currentyear ? "" : ", " + year,
        time = formattime(date),
        time_str = markup ? " | <div class='fdtime'>" + time + "</div>" : " | " + time;
    return weekdays()[date.getDay()] + ", " + date.toLocaleString(lng, {
        "month": "long"
    }) + " " + date.getDate() + yearstring + time_str;
}

// Formats a date with markup for full date display
function fulldateformatmarkup(date, lng) {
    return weekdays()[date.getDay()] + " " + date.toLocaleString(lng, {
        "month": "long"
    }) + " " + date.getDate() + " | <div class='fdtime'>" + formattime(date) + "</div>";
}

// Formats time as a string in HH:MM:SS format
function formattime(date) {
    const hours = date.getHours().toString().padStart(2, "0"),
        minutes = date.getMinutes().toString().padStart(2, "0"),
        seconds = date.getSeconds().toString().padStart(2, "0");
    return " " + hours + ":" + minutes + ":" + seconds;
}

// Plays an audio file and handles autoplay restrictions
function playsound(audio) {
    const promise = audio[0].play();
    if (promise) {
        promise.then(function() {
            // Autoplay started!
        }).catch(function(error) {
            console.error("Autoplay failed:", error);
        });
    }
}

// Adds and removes a shake class to an element and triggers vibration
function shake(node) {
    node.addClass("shake");
    setTimeout(function() {
        node.removeClass("shake");
        vibrate();
    }, 200);
}

// Triggers device vibration if supported
function vibrate() {
    navigator.vibrate?.([100]);
}

// Retrieves API data based on the API ID
function get_api_data(api_id) {
    return glob_config.apis.find(function(val) {
        return val.name === api_id;
    });
}

// Checks if one strings match (case-insensitive)
function str_match(str1, str2) {
    if (str1 && str2) {
        return str_incudes(str1, str2) || str_incudes(str2, str1);
    }
    return false
}

// Checks if one string contains another (case-insensitive)
function str_incudes(main, chunk) {
    if (main && chunk) {
        const main_upper = main.toUpperCase(),
            chunk_upper = chunk.toUpperCase(),
            includes = main_upper.includes(chunk_upper);
        return includes;
    }
    return false
}

// Trims a number to a specified number of decimal places
function trimdecimals(amount, decimals) {
    return Number(parseFloat(amount).toFixed(decimals));
}

// Adjusts properties of objects in an array based on provided modifications
function adjust_objectarray(array, mods) {
    const newarray = array;
    $.each(mods, function(i, val) {
        const index = array.findIndex((obj => obj.id == val.id));
        newarray[index][val.change] = val.val;
    });
    return newarray;
}

// Returns the current timestamp
function now() {
    return Date.now();
}

// Returns the current UTC timestamp
function now_utc() {
    return Date.now() + glob_const.timezone;
}

// Converts a jQuery object to an array of data attributes
function dom_to_array(dom, dat) {
    return dom.map(function() {
        return $(this).data(dat);
    }).get();
}

// Retrieves proxy data from the API proxy element
function proxy_dat() {
    return $("#api_proxy").data();
}

// Returns the selected proxy
function d_proxy() {
    return proxy_dat().selected;
}

// Returns all available proxies
function all_proxies() {
    const pdat = proxy_dat(),
        cproxies = pdat.custom_proxies;
    return glob_const.proxy_list.concat(cproxies);
}

// Constructs an AWS URL for a file
function fetch_aws(filename, bckt) {
    const bucket = bckt || glob_const.aws_bucket;
    return bucket + filename;
}

// Retrieves and processes key data
function gk() {
    const k = glob_let.io.k;
    if (k) {
        const pk = JSON.parse(atob(k));
        if (pk.if_id === "" || pk.ga_id === "" || pk.bc_id === "" || pk.al_id === "") {
            fk();
            return
        }
        init_keys(k, true);
        return
    }
    fk();
}

// Fetches key data using API proxy
function fk() {
    api_proxy({
        "proxy": true,
        "custom": "gk",
        "api_url": true
    }).done(function(e) {
        const res = br_result(e);
        result = res.result,
            ko = result.k;
        if (ko) {
            init_keys(ko, false);
        }
    }).fail(function() {
        //init_keys();
    });
}

// Initializes keys and stores them locally
function init_keys(ko, set) { // set required keys
    const k = JSON.parse(atob(ko));
    to = k;
    glob_let.io.k = ko;
    if (set === false) {
        br_set_local("init", glob_let.io, true);
    }
}

// Converts a URL to a local file path if necessary
function makelocal(url) {
    const pathname = glob_const.w_loc.pathname;
    return (glob_let.local || glob_let.localserver) ? (url.includes("?")) ? "file://" + pathname + "?" + url.split("?")[1] : pathname : url;
}

// Removes invalid characters from a string
function clean_str(string) {
    const iv = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
    return string.replace(iv, "");
}

function clear_accents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Capitalize a string
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ** Query helpers ** //

// See if request is opened
function isopenrequest() {
    return glob_const.paymentpopup.hasClass("active");
}

// Retrieves a setting value
function get_setting(setting, dat) {
    return $("#" + setting).data(dat);
}

// Sets a setting value and optionally updates its title
function set_setting(setting, keypairs, title) {
    const set_node = $("#" + setting);
    set_node.data(keypairs);
    if (title) {
        set_node.find("p").text(title);
    }
}

// Finds a request list item based on data attributes
function get_requestli(datakey, dataval) {
    return $("#requestlist li.rqli").filter(function() {
        return $(this).data(datakey) === dataval;
    })
}

// Checks if a pending request exists for the given data
function ch_pending(dat) {
    return $("#requestlist li.rqli[data-address='" + dat.address + "'][data-pending='scanning'][data-cmcid='" + dat.cmcid + "']").length > 0;
}

// Retrieves the address list for a given currency
function get_addresslist(currency) {
    return $("main #" + currency + " .content ul.pobox[data-currency='" + currency + "']");
}

// Filters address list items based on data attributes
function filter_addressli(currency, datakey, dataval) {
    const addressli = get_addresslist(currency).children("li");
    return filter_list(addressli, datakey, dataval);
}

// Filters all address list items based on data attributes
function filter_all_addressli(datakey, dataval) {
    return filter_list($(".adli"), datakey, dataval);
}

// Filters a list based on data attributes
function filter_list(list, datakey, dataval) {
    return list.filter(function() {
        return $(this).data(datakey) === dataval;
    })
}

// Retrieves the currency list item for a given currency
function get_currencyli(currency) {
    return $("#usedcurrencies > li[data-currency='" + currency + "']");
}

// Retrieves the home list item for a given currency
function get_homeli(currency) {
    return $("#currencylist > li[data-currency='" + currency + "']");
}

// Retrieves coin settings node or data
function cs_node(currency, id, data) {
    const coinnode = $("#" + currency + "_settings .cc_settinglist li[data-id='" + id + "']");
    if (coinnode.length) {
        if (data) {
            const coindat = coinnode.data();
            if (coindat) {
                return coindat;
            }
        }
        return coinnode;
    }
    const coindata = getcoinsettings(currency);
    if (coindata) {
        return coindata[id];
    }
    return false
}

// Retrieves coin data for a given currency
function getcoindata(currency) {
    const coindata_object = getcoinconfig(currency);
    if (coindata_object) {
        const coindata = coindata_object.data,
            settings = coindata_object.settings,
            cd_object = {
                "currency": coindata.currency,
                "ccsymbol": coindata.ccsymbol,
                "cmcid": coindata.cmcid,
                "monitored": true,
                "urlscheme": coindata.urlscheme,
                "regex": coindata.address_regex,
                "erc20": false
            };
        return cd_object;
    } // if not it's probably erc20 token
    const currencyref = get_currencyli(currency); // check if erc20 token is added
    if (currencyref.length > 0) {
        return $.extend(currencyref.data(), glob_config.erc20_dat.data);
    } // else lookup erc20 data
    const tokenobject = fetch_cached_erc20();
    if (tokenobject) {
        const erc20data = tokenobject.find(function(filter) {
            return filter.name === currency;
        });
        if (erc20data) {
            const fetched_data = {
                "currency": erc20data.name,
                "ccsymbol": erc20data.symbol,
                "cmcid": erc20data.cmcid.toString(),
                "contract": erc20data.contract
            }
            return $.extend(fetched_data, glob_config.erc20_dat.data);
        }
    }
    return false;
}

// Retrieves active coin settings for a given currency
function activecoinsettings(currency) {
    const saved_coinsettings = br_get_local(currency + "_settings", true);
    return saved_coinsettings || getcoinsettings(currency);
}

// Retrieves coin data for a given currency
function getcoindat(currency) {
    return getcoinconfig(currency) || get_erc20_data();
}

// Retrieves coin settings for a given currency
function getcoinsettings(currency) {
    const coindata = getcoinconfig(currency);
    if (coindata) {
        return coindata.settings;
    } // return erc20 settings
    return get_erc20_settings();
}

// Retrieves erc20 data
function get_erc20_data() {
    return glob_config.erc20_dat;
}

// Retrieves erc20 settings
function get_erc20_settings() {
    return glob_config.erc20_dat.settings;
}

// Retrieves coin configuration for a given currency
function getcoinconfig(currency) {
    return glob_config.bitrequest_coin_data.find(function(filter) {
        return filter.currency === currency;
    });
}

function add_prefix_to_keys(obj, prefix = "data-") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        acc[prefix + key] = value;
        return acc;
    }, {});
}

function fetch_cached_erc20(check) {
    const first_arr = br_get_local("erc20tokens_init", true);
    if (first_arr) {
        const timestamp = first_arr.timestamp;
        if (timestamp) {
            if (check) {
                const time_in_cache = now() - timestamp;
                // flush cache every week
                if (time_in_cache < glob_const.token_cache * 1000) {
                    return true;
                } else {
                    return false;
                }
            }
            const second_arr = br_get_local("erc20tokens", true);
            if (second_arr) {
                return first_arr.token_arr.concat(second_arr);
            }
        }
    }
    return false;
}

// ** Check params ** //

// Checks and processes URL parameters
function check_params(gets) {
    const lgets = gets || geturlparameters();
    if (lgets.xss) {
        return
    }
    if (lgets.i) {
        expand_shoturl(lgets.i);
        return
    }
    if (lgets.cl) {
        click_pop(lgets.cl);
    }
    const page = lgets.p;
    if (page === "settings") {
        if (lgets.ro) {
            check_teaminvite(lgets.ro);
        } else if (lgets.sbu) {
            check_systembu(lgets.sbu);
        } else if (lgets.csv) {
            check_csvexport(lgets.csv);
        } else if (lgets.code) {
            init_access(lgets.code);
        }
        return
    }
    if (lgets.scheme) {
        check_intents(lgets.scheme);
        return
    }
    if (lgets.lnconnect) {
        lm_function();
        ln_connect();
    }
}

// Triggers a click event after a delay
function click_pop(fn) {
    const timeout = setTimeout(function() {
        $("#" + fn).trigger("click");
    }, 1200, function() {
        clearTimeout(timeout);
    });
}