const glob_scope = "https://www.googleapis.com/auth/drive.appdata",
    glob_drivepath = "https://content.googleapis.com",
    glob_redirect_uri = glob_w_loc.origin + glob_w_loc.pathname + "?p=settings";

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
    Drive_Backup_trigger();
    // updateappdata
    // createfile
    lad_trigger();
    // listappdata
    deletefiletrigger()
    // deletefile
    // GD_pass
});

// ** Google api **

function init_access(ak) {
    if (ak) {
        fetch_creds(ak);
        return
    }
    let p = GD_pass();
    if (p.pass) {
        glob_html.addClass("gdauth");
        return
    }
    if (!p.active) {
        return
    }
}

function t_expired(expired, callback) {
    if (glob_hostlocation == "local") {
        return
    }
    if (expired == "norefresh") {
        if (callback == "gcb") {
            g_login();
            return
        }
        oauth_pop_delay(true);
        return
    }
    fetch_access(lnurl_decode_c(expired), callback);
}

function fetch_creds(k) {
    if (k) {
        api_proxy({
            "custom": "fetch_creds",
            "api_url": true,
            "proxy": true,
            "code": decodeURIComponent(k),
            "redirect_uri": glob_redirect_uri,
            "grant_type": "authorization_code"
        }).done(function(e) {
            if (e) {
                let data = br_result(e);
                if (data) {
                    let result = data.result;
                    if (result) {
                        let error = result.error;
                        if (error) {
                            let ed = result.error_description,
                                em = (ed) ? " || " + ed : "";
                            notify(error + em);
                            return
                        }
                        let ga_token = result.access_token;
                        if (ga_token) {
                            let jt = {
                                "created": now(),
                                "active": true,
                                "access_token": ga_token,
                                "expires_in": result.expires_in
                            };
                            br_set_local("dat", JSON.stringify(jt));
                            let rt = result.refresh_token;
                            if (rt) {
                                let jtobj = {
                                    "d": lnurl_encode("xz", rt)
                                }
                                br_set_local("rt", JSON.stringify(jtobj));
                            }
                            gdlogin_callbacks();
                            if (glob_body.hasClass("showstartpage")) { // only show when logged in
                                trigger_restore();
                            }
                            let timeout = setTimeout(function() {
                                history.pushState({
                                    "pagename": "settings"
                                }, "", glob_redirect_uri);
                            }, 5000, function() {
                                clearTimeout(timeout);
                            });
                        }
                    }
                }
            }
        }).fail(function(e) {
            console.log(e);
        }).always(function(e) {});
    }
}

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
                let data = br_result(e);
                if (data) {
                    let result = data.result;
                    if (result) {
                        let ga_token = result.access_token;
                        if (ga_token) {
                            let jt = {
                                "created": now(),
                                "active": true,
                                "access_token": ga_token,
                                "expires_in": result.expires_in
                            };
                            br_set_local("dat", JSON.stringify(jt));
                            refcb(callback);
                        }
                        let error = result.error;
                        if (error) {
                            let ed = result.error_description,
                                em = (ed) ? " || " + ed : "";
                            if (ed.indexOf("expired") >= 0 || ed.indexOf("revoked") >= 0) {
                                br_remove_local("rt");
                                oauth_pop_delay();
                                return;
                            }
                            notify(error + em);
                            return
                        }
                    }
                }
            }
        }).fail(function(e) {
            console.log(e);
        });
    }
}

function refcb(cb) {
    glob_html.addClass("gdauth");
    if (cb) {
        if (cb == "uad") {
            let p = GD_pass();
            if (p.pass) {
                updateappdata(p);
                return
            }
        }
        if (cb == "gcb") {
            adjust_sp();
        }
    }
}

function lca_obj() {
    let bdat = br_get_local("dat", true);
    if (bdat) {
        return bdat;
    }
    return false;
}

function rt_obj() {
    let rtdat = br_get_local("rt", true);
    if (rtdat) {
        return rtdat.d;
    }
    return false;
}

function init_login_dialog(p) {
    if (glob_hostlocation == "local") {
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

function oauth_pop_delay(ab) {
    canceldialog();
    let timeout = setTimeout(function() {
        oauth_pop(ab);
    }, 1200, function() {
        clearTimeout(timeout);
    });
}

function oauth_pop(ab) {
    let cbx = (ab) ? render_html([{
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

function gd_login_trigger() {
    $(document).on("click", "#oauth_onload", function() {
        g_login();
    })
}

function submit_gdbu_dialog() {
    $(document).on("click", "#gdbu_dialog input.submit", function(e) {
        e.preventDefault();
        let gdbu_dialog = $("#gdbu_dialog"),
            gd_checkbox = gdbu_dialog.find("#pk_confirmwrap"),
            gd_checked = gd_checkbox.data("checked");
        if (gd_checked == true) {
            g_logout();
            return
        }
        g_login();
    })
}

function g_login() {
    if (glob_hostlocation == "local") {
        notify(translate("ganot"));
        return
    }
    let p = GD_pass();
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
    let consent = (p.expired == "norefresh") ? "&prompt=consent" : "",
        login_uri = "https://accounts.google.com/o/oauth2/auth?client_id=" + to.ga_id + "&redirect_uri=" + glob_redirect_uri + "&response_type=code&scope=" + glob_scope + "&access_type=offline" + consent;
    glob_w_loc.href = login_uri;
}

function gdlogin_callbacks(close) {
    glob_html.addClass("gdauth");
    notify(translate("gdsignedin"));
    resetchanges();
    adjust_sp();
    if (close) {
        canceldialog();
    }
}

function adjust_sp() {
    let switch_panel = $("#popup.showpu .switchpanel");
    if (switch_panel.length) {
        switch_panel.addClass("true").removeClass("false");
        let lad = $("#listappdata");
        if (lad.length) {
            listappdata();
            return
        }
        $("#changelog").slideUp(300);
        return
    }
}

function g_logout() {
    let result = confirm(translate("stopgdalert"));
    if (result === true) {
        deactivate();
        gdlogout_callbacks();
    }
}

function activate() {
    let bdat = lca_obj();
    if (bdat) {
        bdat.active = true;
        br_set_local("dat", JSON.stringify(bdat));
    }
}

function deactivate() {
    let bdat = lca_obj();
    if (bdat) {
        bdat.active = false;
        br_set_local("dat", JSON.stringify(bdat));
    }
}

function gdlogout_callbacks() {
    glob_html.removeClass("gdauth");
    notify(translate("gdsignedout"));
    let switch_panel = $("#popup.showpu .switchpanel");
    if (switch_panel.length) {
        switch_panel.removeClass("true").addClass("false");
        $("#changelog").slideDown(300);
        return
    }
    resetchanges();
    canceldialog();
}

function Drive_Backup_trigger() {
    $(document).on("click", "#gdtrigger .switchpanel", function() {
        let p = GD_pass();
        if (p.pass) {
            g_logout();
            return
        }
        init_login_dialog(p);
    })
}

function updateappdata(p) {
    let gd_timer = br_get_session("gd_timer"); // prevent Ddos
    if (gd_timer) {
        let interval = 3000;
        if ((now() - gd_timer) < interval) {
            return
        }
    }
    let token = p.token;
    if (token) {
        let bu_id = br_get_local("backupfile_id");
        if (bu_id) {
            br_set_session("gd_timer", now());
            let ddat = {
                "api_url": glob_drivepath + "/upload/drive/v3/files/" + bu_id + "?uploadType=media&alt=json",
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
            api_proxy(ddat).done(function(e) {}).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                if (textStatus == "error") {
                    let error_object = jqXHR;
                    if (error_object) {
                        let resp_obj = error_object.responseJSON;
                        if (resp_obj) {
                            let resp = resp_obj.error;
                            if (resp) {
                                if (resp.code == 401) {
                                    notify(translate("unauthorized"));
                                    return
                                }
                                if (resp.code == 404) {
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
}

function createfile(token) {
    let jt = GD_pass(),
        jtp = jt.pass,
        pass = (token) ? token : (jtp) ? jt.token : false,
        backup = complilebackup();
    if (pass) {
        let file = new Blob([complilebackup()], {
                "type": "text/plain"
            }),
            description = {
                "modified": now_utc(),
                "device": getdevicetype(),
                "deviceid": glob_deviceid
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
        xhr.onload = () => {
            let response_id = xhr.response.id,
                response_id_string = response_id.toString();
            br_set_local("backupfile_id", response_id_string);
        };
        xhr.send(form);
    }
}

function lad_trigger() {
    $(document).on("click", "#listappdata .switchpanel", function() {
        listappdata();
    })
}

function listappdata() {
    let p = GD_pass();
    if (p.pass) {
        let thistrigger = $("#listappdata .switchpanel"),
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
            "api_url": glob_drivepath + "/drive/v3/files?pageSize=10&spaces=appDataFolder&fields=*",
            "proxy": false,
            "params": {
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer " + p.token
                }
            }
        }).done(function(e) {
            let filelist = e.files;
            if (filelist.length) {
                let sorted_filelist = filelist.sort(function(a, b) { // sort array by timestamp
                        let amod = a.modifiedTime,
                            bmod = b.modifiedTime,
                            d1 = (amod) ? to_ts(amod) : 2,
                            d2 = (bmod) ? to_ts(bmod) : 1;
                        return d2 - d1; // descending order
                    }),
                    gdbackuppush = [];
                $.each(sorted_filelist, function(i, value) {
                    let description = JSON.parse(value.description),
                        device = description.device,
                        device_id = description.deviceid,
                        dmod = short_date(description.modified),
                        mod = short_date(to_ts(value.modifiedTime)),
                        trash = (device_id == glob_deviceid) ? "<div class='purge_bu icon-bin'></div>" : "",
                        gdbackups = "<li data-gdbu_id='" + value.id + "' data-device-id='" + device_id + "' data-device='" + device + "'><div class='restorefile icon-" + device + "' title='" + device + " (Created: " + dmod + ")'>" + mod + "<span class='lmodified'> (" + (value.size / 1000).toFixed(0) + " KB)</div>" + trash + "</li>";
                    gdbackuppush.push(gdbackups);
                });
                backuplist.prepend(gdbackuppush.join("")).slideDown(300);
            } else {
                backuplist.prepend("<li>No files found</li>").slideDown(300);
            }
            importjsonlist.slideUp(300);
            thistrigger.addClass("true");
        }).fail(function(jqXHR, textStatus, errorThrown) {
            if (textStatus == "error") {
                if (errorThrown == "Unauthorized") {
                    thistrigger.removeClass("true");
                    backuplist.slideUp(300);
                    importjsonlist.slideDown(300);
                    notify(translate("unauthorized"));
                    return
                }
                if (errorThrown == "Not Found") {
                    createfile(); // create file
                    return
                }
                notify(translate("error"));
            }
        });
        return
    }
    init_login_dialog(p);
}

function deletefiletrigger() {
    $(document).on("click", ".purge_bu", function() {
        let p = GD_pass();
        if (p.pass) {
            let thislist = $(this).parent("li"),
                fileid = thislist.attr("data-gdbu_id"),
                result = confirm(translate("deletefile", {
                    "file": thislist.text()
                }));
            if (result === true) {
                deletefile(fileid, thislist, p.token);
            }
            return
        }
        init_login_dialog(p);
    })
}

function deletefile(fileId, thislist, pass) {
    api_proxy({
        "api_url": glob_drivepath + "/drive/v3/files/" + fileId,
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
    }).fail(function(jqXHR, textStatus, errorThrown) {
        if (textStatus == "error") {
            if (errorThrown == "Not Found") {
                notify(translate("error") + ": " + translate("filenotfound"));
                return
            }
            notify(translate("error"));
        }
    });
}

function GD_pass() {
    let jt = {
            "token": false,
            "active": false,
            "expired": false,
            "pass": false
        },
        bdat = lca_obj(),
        rtoken = rt_obj(),
        can_refresh = (rtoken) ? rtoken : "norefresh";
    if (bdat) {
        let token = bdat.access_token,
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
        if (token && expired === false && active) {
            glob_html.addClass("gdauth");
            jt.pass = true;
        } else {
            glob_html.removeClass("gdauth");
        }
    } else {
        jt.expired = can_refresh;
    }
    return jt;
}