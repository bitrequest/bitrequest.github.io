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
//api_proxy
//br_result
//get_api_url
//tofixedspecial
//renderlnconnect_url
//get_search
//renderlnconnect
//b64urldecode
//geturlparameters
//renderparameters
//scanmeta
//xss_search
//getrandomnumber
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
//vibrate
//get_api_data
//str_match
//trimdecimals
//adjust_objectarray
//now
//dom_to_array
//d_proxy
//fetch_aws

// Manage local storage

function check_local() {
    let tdat = "testdat"; // Local storage
    try {
        localStorage.setItem(tdat, tdat);
        localStorage.removeItem(tdat);
        return true;
    } catch (e) {
        return false;
    }
}

function br_set_local(pref, dat, str) {
    let ddat = (str) ? JSON.stringify(dat) : dat;
    localStorage.setItem("bitrequest_" + pref, ddat);
}

function br_set_session(pref, dat, str) {
    let ddat = (str) ? JSON.stringify(dat) : dat;
    sessionStorage.setItem("bitrequest_" + pref, ddat);
}

function br_get_local(pref, parse) {
    let dat = localStorage.getItem("bitrequest_" + pref);
    return (parse) ? JSON.parse(dat) : dat;
}

function br_get_session(pref, parse) {
    let dat = sessionStorage.getItem("bitrequest_" + pref);
    return (parse) ? JSON.parse(dat) : dat;
}

function br_remove_local(pref) {
    localStorage.removeItem("bitrequest_" + pref);
}

function br_remove_session(pref) {
    sessionStorage.removeItem("bitrequest_" + pref);
}

// Helpers

function br_dobj(object, obj) { // Default object
    if (object) {
        return object;
    }
    return (obj === true) ? {} : [];
}

function exists(val) {
    if (val === undefined || val === null || !val.length) {
        return false;
    }
    return true;
}

function br_issar(e) {
    try {
        if ($.isArray(e)) {
            return true;
        }
        return false;
    } catch (e) {
        //console.error(e.name, e.message);
        return false;
    }
}

function q_obj(obj, path) {
    try {
        const p_arr = path.split(".");
        if ($.isArray(p_arr) && p_arr.length > 1) {
            for (let v of p_arr) {
                if (!obj[v]) {
                    obj = false;
                    break
                }
                obj = obj[v];
            }
            return obj;
        }
        return false
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

function api_proxy(ad, p_proxy) {
    let custom_url = (ad.api_url) ? ad.api_url : false,
        aud = (custom_url) ? {} :
        get_api_url({
            "api": ad.api,
            "search": ad.search
        });
    if (aud) {
        let proxy = ad.proxy,
            api_key = aud.api_key,
            set_key = (api_key) ? true : false,
            nokey = (api_key == "no_key") ? true : false,
            key_pass = (nokey === true || set_key === true);
        if (proxy === false || (proxy !== true && key_pass === true)) {
            let params = ad.params,
                bearer = ad.bearer;
            params.url = (custom_url) ? custom_url : aud.api_url_key;
            if (bearer && api_key) {
                if (params.headers) {
                    params.headers["Authorization"] = "Bearer " + api_key;
                } else {
                    let auth = {
                        "Authorization": "Bearer " + api_key
                    }
                    params.headers = auth;
                }
            }
            return $.ajax(params);
        }
        // use api proxy
        let api_location = "proxy/v1/",
            set_proxy = (p_proxy) ? p_proxy : d_proxy(),
            app_root = (ad.localhost) ? "" : set_proxy,
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

function br_result(e) {
    let ping = e.ping,
        proxy = (ping) ? true : false;
    if (proxy && ping.br_cache) {
        let version = ping.br_cache.version;
        if (version != proxy_version) {
            proxy_alert(version);
        }
    }
    return {
        "proxy": proxy,
        "result": (proxy) ? (ping.br_cache) ? ping.br_result : ping : e
    }
}

function get_api_url(get) {
    let api = get.api,
        ad = get_api_data(api);
    if (ad) {
        let search = (get.search) ? get.search : "",
            base_url = ad.base_url,
            key_param = (ad.key_param) ? ad.key_param : "",
            saved_key = $("#apikeys").data(api),
            key_val = (saved_key) ? saved_key : ad.api_key,
            ampersand = (search) ? (search.indexOf("?") > -1 || search.indexOf("&") > -1) ? "&" : "?" : "",
            api_param = (key_param != "bearer" && saved_key) ? ampersand + key_param + saved_key : "",
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

function tofixedspecial(str, n) {
    if (str.indexOf("e+") < 0) {
        return str;
    }
    let convert = str.replace(".", "").split("e+").reduce(function(p, b) {
        return p + Array(b - p.length + 2).join(0);
    }) + "." + Array(n + 1).join(0);
    return convert.slice(0, -1);
}

function renderlnconnect_url(str, imp) {
    let str_obj = renderlnconnect(str, imp),
        implementation = (str_obj.imp) ? "&imp=" + str_obj.imp : "",
        lnconnecturl = w_loc.pathname + "?resturl=" + str_obj.resturl + "&macaroon=" + str_obj.macaroon + implementation;
    return lnconnecturl;
}

function renderlnconnect(str, imp) {
    let spitsearch = str.split("?"),
        url = spitsearch[0],
        s_string = spitsearch[1],
        proto = (url.indexOf("https://") > -1) ? "https://" : (url.indexOf("http://") > -1) ? "http://" : "://",
        search = (s_string) ? renderparameters(s_string) : false,
        bare_url = url.split(proto).pop(),
        rest_url = (search.lnconnect) ? atob(search.lnconnect) : (proto == "://") ? "https://" + bare_url : proto + bare_url;
    search.resturl = rest_url;
    if (imp) {
        search.imp = imp;
    }
    return search;
}

function b64urldecode(str) {
    if (is_hex(str) === true) {
        return str;
    }
    try {
        return frombits(sjcl.codec.base64url.toBits(str));
    } catch (e) {
        return false;
    }
}

function get_search(str) {
    return (str.indexOf("?") > -1) ? "?" + str.split("?").pop() : false;
}

function geturlparameters(str) {
    return renderparameters(w_loc.search.substring(1));
}

function renderparameters(str) {
    let xss = xss_search(str);
    if (xss) {
        return {
            "xss": true
        }
    }
    let getvalues = str.split("&"),
        get_object = {};
    $.each(getvalues, function(i, val) {
        let keyval = val.split("=");
        get_object[keyval[0]] = keyval[1];
    });
    let dp = get_object.d,
        mp = get_object.m;
    if (dp) {
        let isxx = scanmeta(dp);
        if (isxx) {
            get_object.xss = true;
        }
    }
    if (mp) {
        let isxx = scanmeta(mp);
        if (isxx) {
            get_object.xss = true;
        }
    }
    return get_object;
}

function scanmeta(val) {
    let isd = (val && val.length > 5) ? atob(val) : false,
        xssdat = xss_search(isd);
    if (xssdat) { //xss detection
        return true
    }
    return false
}

function xss_search(val) {
    if (val) {
        let val_lower = val.toLowerCase();
        if (val_lower.indexOf("<scrip") > -1) {
            vibrate();
            notify(xss_alert);
            return true
        }
        if (val_lower.indexOf("onerror") > -1) {
            vibrate();
            notify(xss_alert);
            return true
        }
    }
    return false
}

function getrandomnumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function hashcode(str) {
    if (str) {
        return Math.abs(str.split("").reduce(function(a, b) {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a
        }, 0));
    }
    return false;
}

function getcc_icon(cmcid, cpid, erc20) {
    if (erc20) {
        if (offline === true) {
            return "<img src='" + c_icons("ph") + "' class='cmc_icon'/>";
        }
        return "<img src='" + cmc_icon_loc + cmcid + ".png' class='cmc_icon'/>";
    }
    return "<img src='" + c_icons(cpid) + "' class='cmc_icon'/>";
}

function getdevicetype() {
    let ua = userAgent;
    return (is_android_app === true) ? "android-app" :
        (is_ios_app === true) ? "apple-app" :
        (/iPad/.test(ua)) ? "iPad" :
        (/iPhone/.test(ua)) ? "iPhone" :
        (/Android/.test(ua)) ? "Android" :
        (/Macintosh/.test(ua)) ? "Macintosh" :
        (/Windows/.test(ua)) ? "Windows" :
        "unknown";
};

function getplatform(device) {
    return (supportsTouch === true) ?
        (is_android_app === true || device == "Android" || device == "Windows") ? "playstore" :
        (device == "iPhone" || device == "iPad" || device == "Macintosh" || is_ios_app === true) ? "appstore" : "unknown" :
        (device == "Windows") ? "desktop" :
        (device == "Macintosh") ? "desktop" : "unknown";
}

function makedatestring(datetimeparts) {
    let split = (datetimeparts.indexOf(".") > -1) ? "." : "Z";
    return datetimeparts[0] + " " + datetimeparts[1].split(split)[0];
}

function returntimestamp(datestring) {
    let datetimeparts = datestring.split(" "),
        timeparts = datetimeparts[1].split(":"),
        dateparts = datetimeparts[0].split("-");
    return new Date(dateparts[0], parseInt(dateparts[1], 10) - 1, dateparts[2], timeparts[0], timeparts[1], timeparts[2]);
}

function to_ts(ts) {
    if (ts) {
        let tstamp = ts.split("T");
        return (tstamp) ? returntimestamp(makedatestring(tstamp)).getTime() : null;
    }
    return null;
}

function short_date(txtime) {
    return new Date(txtime - timezone).toLocaleString(language, {
        "day": "2-digit", // numeric, 2-digit
        "month": "2-digit", // numeric, 2-digit, long, short, narrow
        "year": "2-digit", // numeric, 2-digit
        "hour": "numeric", // numeric, 2-digit
        "minute": "numeric"
    })
}

function weekdays(day) {
    return {
        "0": "Sunday",
        "1": "Monday",
        "2": "Tuesday",
        "3": "Wednesday",
        "4": "Thursday",
        "5": "Friday",
        "6": "Saturday"
    };
}

function fulldateformat(date, lng) {
    return weekdays()[date.getDay()] + " " + date.toLocaleString(lng, {
        "month": "long"
    }) + " " + date.getDate() + " | " + formattime(date);
}

function fulldateformatmarkup(date, lng) {
    return weekdays()[date.getDay()] + " " + date.toLocaleString(lng, {
        "month": "long"
    }) + " " + date.getDate() + " | <div class='fdtime'>" + formattime(date) + "</div>";
}

function formattime(date) {
    let h = date.getHours(),
        m = date.getMinutes(),
        s = date.getSeconds(),
        hours = (h < 10) ? "0" + h : h,
        minutes = (m < 10) ? "0" + m : m,
        seconds = (s < 10) ? "0" + s : s;
    return " " + hours + ":" + minutes + ":" + seconds;
}

function playsound(audio) {
    let promise = audio[0].play();
    if (promise) {
        promise.then(_ => {
            // Autoplay started!
        }).catch(error => {
            // Fallback
        });
    }
}

function vibrate() {
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
}

function get_api_data(api_id) {
    let apipath = br_config.apis.filter(function(val) {
        return val.name == api_id;
    });
    return apipath[0];
}

function str_match(add1, add2) {
    if (add1 && add2) {
        let a1u = add1.toUpperCase(),
            a2u = add2.toUpperCase();
        if (a1u.indexOf(a2u) >= 0) {
            return true
        }
    }
    return false
}

function trimdecimals(amount, decimals) {
    let round_amount = parseFloat(amount).toFixed(decimals);
    return parseFloat(round_amount.toString());
}

function adjust_objectarray(array, mods) {
    let newarray = array;
    $.each(mods, function(i, val) {
        let index = array.findIndex((obj => obj.id == val.id));
        newarray[index][val.change] = val.val;
    });
    return newarray;
}

function now() {
    return Date.now();
}

function dom_to_array(dom, dat) {
    return dom.map(function() {
        return $(this).data(dat);
    }).get();
}

function d_proxy() {
    return $("#api_proxy").data("selected");
}

function fetch_aws(filename, bckt) {
    let bucket = (bckt) ? bckt : aws_bucket;
    return bucket + filename;
}

function gk() {
    let k = io.k;
    if (k) {
        let pk = JSON.parse(atob(k));
        if (pk.if_id == "" || pk.ad_id == "" || pk.ga_id == "" || pk.bc_id == "") {
            fk();
            return
        }
        init_keys(k, true);
        return
    }
    fk();
}

function fk() {
    api_proxy({
        "proxy": true,
        "custom": "gk",
        "api_url": true
    }).done(function(e) {
        let ko = e.k;
        if (ko) {
            init_keys(ko, false);
        }
    }).fail(function() {
        //init_keys();
    });
}

function init_keys(ko, set) { // set required keys
    let k = JSON.parse(atob(ko));
    to = k;
    let ga_set = (k.ga_id != "");
    if (ga_set) {
        setTimeout(function() {
            gapi_load();
        }, 1000);
    }
    io.k = ko;
    if (set === false) {
        br_set_local("init", io, true);
    }
}