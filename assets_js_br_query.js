function lss(dat, pref, ss, ns) {
    ddat = (ns) ? dat : JSON.stringify(dat);
    if (ss) {
        sessionStorage.setItem("bitrequest_" + pref, ddat);
    }
    localStorage.setItem("bitrequest_" + pref, ddat);
}

function lsg(pref, ss) {
    if (ss) {
        return sessionStorage.getItem("bitrequest_" + pref);
    }
    return localStorage.getItem("bitrequest_" + pref);
}

function br_issar(e) {
    try {
        if ($.isArray(e)) {
            return "jaap";
        }
        return "f1"
    } catch (e) {
        console.error(e.name, e.message);
        return "f2"
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