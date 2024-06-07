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
//c_apiname
//br_result
//get_api_url
//get_next_proxy
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

function is_btchain(currency) {
    if (currency == "bitcoin" || currency == "litecoin" || currency == "dogecoin" || currency == "bitcoin-cash") {
        return true;
    }
    return false;
}

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
        apiname = ad.api,
        aud = (custom_url) ? {} :
        get_api_url({
            "api": apiname,
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
        ad.api = c_apiname(apiname);
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
        glob_proxy_attempts[set_proxy] = true;
        return $.ajax(proxy_data);
    }
    return $.ajax();
}

function c_apiname(apiname) {
    return (apiname == "arbitrum") ? "infura" :
        (apiname == "binplorer") ? "ethplorer" : apiname;
}

function br_result(e) {
    let ping = e.ping,
        proxy = (ping) ? true : false;
    if (proxy && ping.br_cache) {
        let version = ping.br_cache.version;
        if (version != glob_proxy_version) {
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

function get_next_proxy() {
    let proxies = all_proxies(),
        current_proxy = d_proxy(),
        c_index = proxies.indexOf(current_proxy),
        cc_index = (c_index == -1) ? 0 : c_index,
        next_i = proxies[cc_index + 1],
        next_p = (next_i) ? next_i : proxies[0];
    if (glob_proxy_attempts[next_p] !== true) {
        glob_api_attempts = {}, // reset cache and index
            glob_rpc_attempts = {};
        set_setting("api_proxy", { // save next proxy
            "selected": next_p
        }, next_p);
        savesettings();
        return next_p;
    }
    return false;
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

function renderlnconnect(str) {
    let spitsearch = str.split("?"),
        url = spitsearch[0],
        s_string = spitsearch[1],
        proto = (url.indexOf("https://") > -1) ? "https://" : (url.indexOf("http://") > -1) ? "http://" : "://",
        search = (s_string) ? renderparameters(s_string) : false,
        bare_url = url.split(proto).pop(),
        rest_url = (search.lnconnect) ? atob(search.lnconnect) : (proto == "://") ? "https://" + bare_url : proto + bare_url;
    search.resturl = rest_url;
    return search;
}

function cleanb64(str) {
    return str.replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urldecode(str) {
    let cstr = cleanb64(str);
    if (is_hex(cstr) === true) {
        return cstr;
    }
    try {
        return frombits(sjcl.codec.base64url.toBits(cstr));
    } catch (e) {
        return false;
    }
}

function get_search(str) {
    return (str.indexOf("?") > -1) ? str.split("?").pop() : false;
}

function geturlparameters(str) {
    return renderparameters(glob_w_loc.search.substring(1));
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
            notify(glob_xss_alert);
            return true
        }
        if (val_lower.indexOf("onerror") > -1) {
            vibrate();
            notify(glob_xss_alert);
            return true
        }
    }
    return false
}

function getrandomnumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function random_array_item(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
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
        if (glob_offline === true) {
            return "<img src='" + c_icons("ph") + "' class='cmc_icon'/>";
        }
        return "<img src='" + glob_cmc_icon_loc + cmcid + ".png' class='cmc_icon'/>";
    }
    return "<img src='" + c_icons(cpid) + "' class='cmc_icon'/>";
}

function getdevicetype() {
    let ua = glob_userAgent;
    return (glob_is_android_app === true) ? "android-app" :
        (glob_is_ios_app === true) ? "apple-app" :
        (/iPad/.test(ua)) ? "iPad" :
        (/iPhone/.test(ua)) ? "iPhone" :
        (/Android/.test(ua)) ? "Android" :
        (/Macintosh/.test(ua)) ? "Macintosh" :
        (/Windows/.test(ua)) ? "Windows" :
        "unknown";
};

function getplatform(device) {
    return (glob_supportsTouch) ?
        (glob_is_android_app === true || device == "Android" || device == "Windows") ? "playstore" :
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
    return new Date(txtime - glob_timezone).toLocaleString(glob_langcode, {
        "day": "2-digit", // numeric, 2-digit
        "month": "2-digit", // numeric, 2-digit, long, short, narrow
        "year": "2-digit", // numeric, 2-digit
        "hour": "numeric", // numeric, 2-digit
        "minute": "numeric"
    })
}

function weekdays(day) {
    return {
        "0": translate("sunday"),
        "1": translate("monday"),
        "2": translate("tuesday"),
        "3": translate("wednesday"),
        "4": translate("thursday"),
        "5": translate("friday"),
        "6": translate("saturday")
    };
}

function fulldateformat(date, lng, markup) {
    let year = date.getFullYear(),
        currentyear = new Date().getFullYear(),
        yearstring = (year == currentyear) ? "" : ", " + year,
        time = formattime(date),
        time_str = (markup) ? " | <div class='fdtime'>" + time + "</div>" : " | " + time;
    return weekdays()[date.getDay()] + ", " + date.toLocaleString(lng, {
        "month": "long"
    }) + " " + date.getDate() + yearstring + time_str;
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

function shake(node) {
    node.addClass("shake");
    setTimeout(function() {
        node.removeClass("shake");
        vibrate();
    }, 200);
}

function vibrate() {
    if (navigator.vibrate) {
        navigator.vibrate(100);
    }
}

function get_api_data(api_id) {
    let apipath = glob_br_config.apis.filter(function(val) {
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

function now_utc() {
    return Date.now() + glob_timezone;
}

function dom_to_array(dom, dat) {
    return dom.map(function() {
        return $(this).data(dat);
    }).get();
}

function proxy_dat() {
    return $("#api_proxy").data();
}

function d_proxy() {
    return proxy_dat().selected;
}

function all_proxies() {
    let pdat = proxy_dat(),
        cproxies = pdat.custom_proxies;
    return glob_proxy_list.concat(cproxies);
}

function fetch_aws(filename, bckt) {
    let bucket = (bckt) ? bckt : glob_aws_bucket;
    return bucket + filename;
}

function gk() {
    let k = glob_io.k;
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
    glob_io.k = ko;
    if (set === false) {
        br_set_local("init", glob_io, true);
    }
}

function makelocal(url) {
    let pathname = glob_w_loc.pathname;
    return (glob_local || glob_localserver) ? (url.indexOf("?") >= 0) ? "file://" + pathname + "?" + url.split("?")[1] : pathname : url;
}

function clean_str(string) {
    let iv = /[\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u037F-\u0383\u038B\u038D\u03A2\u0528-\u0530\u0557\u0558\u0560\u0588\u058B-\u058E\u0590\u05C8-\u05CF\u05EB-\u05EF\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB-\u07FF\u082E\u082F\u083F\u085C\u085D\u085F-\u089F\u08A1\u08AD-\u08E3\u08FF\u0978\u0980\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FC-\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A76-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0C00\u0C04\u0C0D\u0C11\u0C29\u0C34\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5A-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C80\u0C81\u0C84\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0D01\u0D04\u0D0D\u0D11\u0D3B\u0D3C\u0D45\u0D49\u0D4F-\u0D56\u0D58-\u0D5F\u0D64\u0D65\u0D76-\u0D78\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F5-\u13FF\u169D-\u169F\u16F1-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1878-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191D-\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C80-\u1CBF\u1CC8-\u1CCF\u1CF7-\u1CFF\u1DE7-\u1DFB\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20BB-\u20CF\u20F1-\u20FF\u218A-\u218F\u23F4-\u23FF\u2427-\u243F\u244B-\u245F\u2700\u2B4D-\u2B4F\u2B5A-\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E3C-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u312E-\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FCD-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA698-\uA69E\uA6F8-\uA6FF\uA78F\uA794-\uA79F\uA7AB-\uA7F7\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C5-\uA8CD\uA8DA-\uA8DF\uA8FC-\uA8FF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9E0-\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAA7C-\uAA7F\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F-\uABBF\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE27-\uFE2F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF]/g;
    return string.replace(iv, "");
}

function clear_accents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}