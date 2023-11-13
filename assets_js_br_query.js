// Manage local storage

//check_cookie
//check_local
//br_set_local
//br_set_session
//br_get_local
//br_get_session
//br_remove_local
//br_remove_session

// Helpers

//exists
//br_issar
//q_obj

// Manage local storage

function check_cookie() {
    if (navigator.cookieEnabled) { // Cookie support
        return true;
    }
    alert("Seems like your browser does not allow cookies... Please enable cookies if you want to continue using this app.");
    return false;
}

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