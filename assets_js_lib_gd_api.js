$(document).ready(function() {
    init_access();
    // t_expired
    // fetch_creds
    // fetch_access
    // refcb
    // lca_obj
    // init_login_dialog
    // oauth_pop_delay
    // oauth_pop
    gd_login_trigger();
    submit_gdbu_dialog();
    // g_login
    // gdlogin_callbacks
    // adjust_sp
    // g_logout
    // activate
    // deactivate
    // gdlogout_callbacks
    drive_backup_trigger();
    // update_appdata
    // createfile
    lad_trigger();
    // list_appdata
    deletefile_trigger()
    // deletefile
    // gd_pass
});

// ** Google api **

// Validates and initializes authentication based on access key or global password
function init_access(ak) {
    if (ak) {
        fetch_creds(ak);
        return
    }
    const p = gd_pass();
    if (p.pass) {
        glob_const.html.addClass("gdauth");
        return
    }
    if (!p.active) {
        return
    }
}

// Handles token expiration by either triggering Google login or OAuth popup
function t_expired(expired, callback) {
    if (glob_const.hostlocation === "local") {
        return
    }
    if (expired === "norefresh") {
        if (callback === "gcb") {
            g_login();
            return
        }
        oauth_pop_delay(true);
        return
    }
    fetch_access(lnurl_decode_c(expired), callback);
}

// Makes API request to fetch OAuth credentials using an authorization code
function fetch_creds(k) {
    if (k) {
        api_proxy({
            "custom": "fetch_creds",
            "api_url": true,
            "proxy": true,
            "code": decodeURIComponent(k),
            "redirect_uri": glob_const.redirect_uri,
            "grant_type": "authorization_code"
        }).done(function(e) {
            if (e) {
                const data = br_result(e);
                if (data) {
                    const result = data.result;
                    if (result) {
                        const error = result.error;
                        if (error) {
                            const ed = result.error_description,
                                em = (ed) ? " || " + ed : "";
                            notify(error + em);
                            return
                        }
                        const ga_token = result.access_token;
                        if (ga_token) {
                            const jt = {
                                "created": now(),
                                "active": true,
                                "access_token": ga_token,
                                "expires_in": result.expires_in
                            };
                            br_set_local("dat", JSON.stringify(jt));
                            const rt = result.refresh_token;
                            if (rt) {
                                const jtobj = {
                                    "d": lnurl_encode("xz", rt)
                                }
                                br_set_local("rt", JSON.stringify(jtobj));
                            }
                            gdlogin_callbacks();
                            if (glob_const.body.hasClass("showstartpage")) { // only show when logged in
                                trigger_restore();
                            }
                            const timeout = setTimeout(function() {
                                history.pushState({
                                    "pagename": "settings"
                                }, "", glob_const.redirect_uri);
                            }, 5000, function() {
                                clearTimeout(timeout);
                            });
                        }
                    }
                }
            }
        }).fail(function(e) {
            console.error("error", e);
        }).always(function(e) {});
    }
}

// Requests new access token using a refresh token and updates local storage
function fetch_access(rt, callback) {
    if (rt) {
        api_proxy({
            "custom": "fetch_creds",
            "api_url": true,
            "proxy": true,
            "refresh_token": rt,
            "grant_type": "refresh_token"
        }).done(function(e) {
            if (e) {
                const data = br_result(e);
                if (data) {
                    const result = data.result;
                    if (result) {
                        const error = result.error;
                        if (error) {
                            const ed = result.error_description,
                                em = ed ? " || " + ed : "";
                            if (ed.indexOf("expired") >= 0 || ed.indexOf("revoked") >= 0) {
                                br_remove_local("rt");
                                oauth_pop_delay();
                                return;
                            }
                            notify(error + em);
                            return
                        }
                        const ga_token = result.access_token;
                        if (ga_token) {
                            const jt = {
                                "created": now(),
                                "active": true,
                                "access_token": ga_token,
                                "expires_in": result.expires_in
                            };
                            br_set_local("dat", JSON.stringify(jt));
                            refcb(callback);
                        }
                    }
                }
            }
        }).fail(function(e) {
            console.error("error", e);
        });
    }
}

// Executes post-refresh callbacks and updates UI authentication state
function refcb(cb) {
    glob_const.html.addClass("gdauth");
    if (cb) {
        if (cb === "uad") {
            const p = gd_pass();
            if (p.pass) {
                update_appdata(p);
                return
            }
        }
        if (cb === "gcb") {
            adjust_sp();
        }
    }
}

// Retrieves and parses the access token data from local storage
function lca_obj() {
    const bdat = br_get_local("dat", true);
    if (bdat) {
        return bdat;
    }
    return false;
}

// Retrieves and decodes the refresh token from local storage
function rt_obj() {
    const rtdat = br_get_local("rt", true);
    return rtdat ? rtdat.d : false;
}

// Determines appropriate login flow based on current authentication state
function init_login_dialog(p) {
    if (glob_const.hostlocation === "local") {
        notify(translate("ganot"));
        return
    }
    if (p.expired) {
        t_expired(p.expired, "gcb");
        return
    }
    if (p.active) {
        g_login();
        return
    }
    if (p.token) {
        activate();
        gdlogin_callbacks();
    }
}

// Schedules OAuth popup display with configurable delay and abort option
function oauth_pop_delay(ab) {
    canceldialog();
    const timeout = setTimeout(function() {
        oauth_pop(ab);
    }, 1200, function() {
        clearTimeout(timeout);
    });
}

// Renders and displays Google Drive authentication dialog with consent options
function oauth_pop(ab) {
    const cbx = ab ? render_html([{
            "div": {
                "id": "pk_confirmwrap",
                "class": "cb_wrap",
                "attr": {
                    "data-checked": "false"
                },
                "content": [{
                    "span": {
                        "class": "checkbox"
                    }
                }]
            },
            "span": {
                "content": translate("stopgauth")
            }

        }]) : "",
        ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "div": {
                                "class": "inputwrap",
                                "content": "<p><strong>" + translate("gauthsafely") + "</strong><br/>" + translate("gauthsync") + "</p>"
                            },
                        },
                        {
                            "div": {
                                "class": "inputwrap",
                                "content": "<div id='oauth_onload'><span class='icon-google2'></span>" + translate("signin") + "</div>"
                            }
                        }
                    ]
                }
            },
            {
                "div": {
                    "id": "pk_confirm",
                    "class": "noselect",
                    "content": cbx
                }
            },
            {
                "input": {
                    "class": "submit",
                    "attr": {
                        "type": "submit",
                        "value": translate("okbttn")
                    }
                }
            }
        ],
        content = template_dialog({
            "id": "gdbu_dialog",
            "icon": "icon-googledrive",
            "title": translate("backuptogd"),
            "elements": ddat
        });
    popdialog(content, "triggersubmit");
}

// Binds click handler to Google Drive login button
function gd_login_trigger() {
    $(document).on("click", "#oauth_onload", function() {
        g_login();
    })
}

// Handles Google Drive backup dialog form submission and logout confirmation
function submit_gdbu_dialog() {
    $(document).on("click", "#gdbu_dialog input.submit", function(e) {
        e.preventDefault();
        const gdbu_dialog = $("#gdbu_dialog"),
            gd_checkbox = gdbu_dialog.find("#pk_confirmwrap"),
            gd_checked = gd_checkbox.data("checked");
        if (gd_checked == true) {
            g_logout();
            return
        }
        g_login();
    })
}

// Initiates OAuth flow for Google Drive authentication
function g_login() {
    if (glob_const.hostlocation === "local") {
        notify(translate("ganot"));
        return
    }
    const p = gd_pass();
    if (p.pass) {
        gdlogin_callbacks();
        return
    }
    if (!p.active && !p.expired) {
        if (p.token) {
            activate();
            gdlogin_callbacks();
            return
        }
    }
    const consent = p.expired == "norefresh" ? "&prompt=consent" : "",
        login_uri = "https://accounts.google.com/o/oauth2/auth?client_id=" + to.ga_id + "&redirect_uri=" + glob_const.redirect_uri + "&response_type=code&scope=" + glob_const.scope + "&access_type=offline" + consent;
    glob_const.w_loc.href = login_uri;
}

// Updates UI and triggers data sync after successful Google Drive authentication
function gdlogin_callbacks(close) {
    glob_const.html.addClass("gdauth");
    notify(translate("gdsignedin"));
    resetchanges();
    adjust_sp();
    if (close) {
        canceldialog();
    }
}

// Updates switch panel state after successful Google Drive authentication
function adjust_sp() {
    const switch_panel = $("#popup.showpu .switchpanel");
    if (switch_panel.length) {
        switch_panel.addClass("true").removeClass("false");
        const lad = $("#listappdata");
        if (lad.length) {
            list_appdata();
            return
        }
        $("#changelog").slideUp(300);
        return
    }
}

// Initiates Google Drive logout process with user confirmation
function g_logout() {
    const result = confirm(translate("stopgdalert"));
    if (result) {
        deactivate();
        gdlogout_callbacks();
    }
}

// Sets authentication state to active in local storage
function activate() {
    const bdat = lca_obj();
    if (bdat) {
        bdat.active = true;
        br_set_local("dat", JSON.stringify(bdat));
    }
}

// Sets authentication state to inactive in local storage
function deactivate() {
    const bdat = lca_obj();
    if (bdat) {
        bdat.active = false;
        br_set_local("dat", JSON.stringify(bdat));
    }
}

// Updates UI and cleans up state after Google Drive logout
function gdlogout_callbacks() {
    glob_const.html.removeClass("gdauth");
    notify(translate("gdsignedout"));
    const switch_panel = $("#popup.showpu .switchpanel");
    if (switch_panel.length) {
        switch_panel.removeClass("true").addClass("false");
        $("#changelog").slideDown(300);
        return
    }
    resetchanges();
    canceldialog();
}

// Binds click handler to Drive Backup toggle switch
function drive_backup_trigger() {
    $(document).on("click", "#gdtrigger .switchpanel", function() {
        const p = gd_pass();
        if (p.pass) {
            g_logout();
            return
        }
        init_login_dialog(p);
    })
}

// Updates Google Drive app data with rate limiting and error handling
function update_appdata(p) {
    const gd_timer = br_get_session("gd_timer"); // prevent Ddos
    if (gd_timer && (now() - gd_timer) < 3000) {
        return;
    }
    const token = p.token;
    if (!token) {
        return
    }
    const bu_id = br_get_local("backupfile_id");
    if (bu_id) {
        br_set_session("gd_timer", now());
        const ddat = {
            "api_url": glob_const.drivepath + "/upload/drive/v3/files/" + bu_id + "?uploadType=media&alt=json",
            "proxy": false,
            "params": {
                "method": "PATCH",
                "dataType": "json",
                "contentType": "application/json",
                "headers": {
                    "Authorization": "Bearer " + token
                },
                "data": complilebackup()
            }
        };
        api_proxy(ddat).done(function(e) {
            // Success handling if needed  
        }).fail(function(xhr, stat, err) {
            if (textStatus === "error") {
                const error_object = xhr;
                if (error_object) {
                    const resp_obj = error_object.responseJSON;
                    if (resp_obj) {
                        const resp = resp_obj.error;
                        if (resp) {
                            if (resp.code === 401) {
                                notify(translate("unauthorized"));
                                return
                            }
                            if (resp.code === 404) {
                                createfile(token); // create file
                                return
                            }
                        }
                    }
                }
                notify(translate("error"));
            }
        });
        return
    }
    createfile(token) // create file
}

// Creates new app data file in Google Drive with metadata
function createfile(token) {
    const jt = gd_pass(),
        jtp = jt.pass,
        pass = token || (jtp ? jt.token : false),
        backup = complilebackup();
    if (pass) {
        const file = new Blob([backup], {
                "type": "text/plain"
            }),
            description = {
                "modified": now_utc(),
                "device": getdevicetype(),
                "deviceid": glob_const.deviceid
            },
            metadata = {
                "name": complilefilename(),
                "parents": ["appDataFolder"],
                "mimeType": "text/plain",
                "description": JSON.stringify(description)
            },
            form = new FormData(),
            xhr = new XMLHttpRequest();
        form.append("metadata", new Blob([JSON.stringify(metadata)], {
            "type": "application/json"
        }));
        form.append("file", file);
        xhr.open("post", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id");
        xhr.setRequestHeader("Authorization", "Bearer " + pass);
        xhr.responseType = "json";
        xhr.onload = function() {
            const response_id = xhr.response.id;
            if (response_id) {
                br_set_local("backupfile_id", response_id.toString());
            }
        };
        xhr.send(form);
    }
}

// Binds click handler to app data listing trigger
function lad_trigger() {
    $(document).on("click", "#listappdata .switchpanel", function() {
        list_appdata();
    })
}

// Fetches and displays list of Google Drive app data files
function list_appdata() {
    const p = gd_pass();
    if (!p.pass) {
        init_login_dialog(p);
        return
    }
    const thistrigger = $("#listappdata .switchpanel"),
        backuplist = $("#gd_backuplist"),
        importjsonlist = $("#importjson");
    if (backuplist.find("li").length) {
        if (thistrigger.hasClass("true")) {
            thistrigger.removeClass("true");
            backuplist.slideUp(300);
            importjsonlist.slideDown(300);
            return
        }
        thistrigger.addClass("true");
        backuplist.slideDown(300);
        importjsonlist.slideUp(300);
        return
    }
    api_proxy({
        "api_url": glob_const.drivepath + "/drive/v3/files?pageSize=10&spaces=appDataFolder&fields=*",
        "proxy": false,
        "params": {
            "method": "GET",
            "headers": {
                "Authorization": "Bearer " + p.token
            }
        }
    }).done(function(e) {
        const filelist = e.files;
        if (filelist.length) {
            const sorted_filelist = filelist.sort(function(a, b) { // sort array by timestamp
                    const amod = a.modifiedTime,
                        bmod = b.modifiedTime,
                        d1 = amod ? to_ts(amod) : 2,
                        d2 = bmod ? to_ts(bmod) : 1;
                    return d2 - d1; // descending order
                }),
                gdbackuppush = [];
            $.each(sorted_filelist, function(i, value) {
                const description = JSON.parse(value.description),
                    device = description.device,
                    device_id = description.deviceid,
                    dmod = short_date(description.modified),
                    mod = short_date(to_ts(value.modifiedTime)),
                    trash = (device_id === glob_const.deviceid) ? "<div class='purge_bu icon-bin'></div>" : "",
                    gdbackups = "<li data-gdbu_id='" + value.id + "' data-device-id='" + device_id + "' data-device='" + device + "'><div class='restorefile icon-" + device + "' title='" + device + " (Created: " + dmod + ")'>" + mod + "<span class='lmodified'> (" + (value.size / 1000).toFixed(0) + " KB)</div>" + trash + "</li>";
                gdbackuppush.push(gdbackups);
            });
            backuplist.prepend(gdbackuppush.join("")).slideDown(300);
        } else {
            backuplist.prepend("<li>No files found</li>").slideDown(300);
        }
        importjsonlist.slideUp(300);
        thistrigger.addClass("true");
    }).fail(function(xhr, stat, err) {
        if (stat === "error") {
            if (err === "Unauthorized") {
                thistrigger.removeClass("true");
                backuplist.slideUp(300);
                importjsonlist.slideDown(300);
                notify(translate("unauthorized"));
                return
            }
            if (err === "Not Found") {
                createfile(); // create file
                return
            }
            notify(translate("error"));
        }
    });
}

// Binds click handler to file deletion buttons
function deletefile_trigger() {
    $(document).on("click", ".purge_bu", function() {
        const p = gd_pass();
        if (!p.pass) {
            init_login_dialog(p);
            return
        }
        const thislist = $(this).parent("li"),
            fileid = thislist.attr("data-gdbu_id"),
            result = confirm(translate("deletefile", {
                "file": thislist.text()
            }));
        if (result) {
            deletefile(fileid, thislist, p.token);
        }
    })
}

// Deletes specified file from Google Drive app data
function deletefile(fileId, thislist, pass) {
    api_proxy({
        "api_url": glob_const.drivepath + "/drive/v3/files/" + fileId,
        "proxy": false,
        "params": {
            "method": "DELETE",
            "headers": {
                "Authorization": "Bearer " + pass
            }
        }
    }).done(function(e) {
        if (thislist) {
            thislist.slideUp(300);
            notify(translate("filedeleted"));
        }
    }).fail(function(xhr, stat, err) {
        if (stat === "error") {
            if (err === "Not Found") {
                notify(translate("error") + ": " + translate("filenotfound"));
                return
            }
            notify(translate("error"));
        }
    });
}

// Retrieves and validates current Google Drive authentication state
function gd_pass() {
    const jt = {
            "token": false,
            "active": false,
            "expired": false,
            "pass": false
        },
        bdat = lca_obj(),
        rtoken = rt_obj(),
        can_refresh = rtoken || "norefresh";
    if (bdat) {
        const token = bdat.access_token,
            ttime = (now() - bdat.created) + 60000,
            extime = bdat.expires_in * 1000,
            expired = (ttime > extime),
            expirin = (extime - ttime),
            active = bdat.active;
        if (token) {
            jt.token = token;
            jt.expires_in = expirin;
            if (expired) {
                jt.expired = can_refresh;
            }
            if (active) {
                jt.active = true;
            }
        }
        if (token && !expired && active) {
            glob_const.html.addClass("gdauth");
            jt.pass = true;
        } else {
            glob_const.html.removeClass("gdauth");
        }
    } else {
        jt.expired = can_refresh;
    }
    return jt;
}