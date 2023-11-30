var gapi, // Keep var
    google,
    tokenClient;
const scope = "https://www.googleapis.com/auth/drive.appdata",
    drivepath = "https://content.googleapis.com";

$(document).ready(function() {
    // gapi_load
    // init_login_dialog
    // oauth_pop
    gd_login_trigger();
    submit_gdbu_dialog();
    // g_login
    // set_gatoken
    // gdlogin_callbacks
    // g_logout
    // gdlogout_callbacks
    Drive_Backup_trigger();
    // updateappdata
    // createfile
    lad_trigger();
    // listappdata
    deletefiletrigger();
    // deletefile
    // GD_pass
    // has_token
    // a_dat
    // cashed_token
});

// ** Google api **

function gapi_load() {
    if (hostlocation == "local") {
        return
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
        "client_id": to.ga_id,
        "scope": scope,
        "callback": set_gatoken
    });
    if (gapi) {
        gapi.load("client:auth2", function() {
            gapi.client.init({
                "discoveryDocs": ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
            });
        });
    }
}

function init_login_dialog(direct) {
    if (hostlocation == "local") {
        return
    }
    let ctoken = cashed_token();
    if (ctoken) {
        let oa_timer = br_get_local("oa_timer");
        if (oa_timer) {
            let interval = 3600000; // show every hour
            if ((now() - oa_timer) < interval) {
                return
            }
        }
        br_set_local("oa_timer", now());
        setTimeout(function() {
            if (direct) {
                tokenClient.requestAccessToken();
                return
            }
            if ($("#popup").hasClass("showpu") || paymentpopup.hasClass("showpu")) {
                return
            }
            oauth_pop(true);
        }, 5000);
    }
}

function oauth_pop(ab) {
    if (body.hasClass("showstartpage")) { // only show when logged in
        return
    }
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
                "content": "Stop using Google Drive Backup."
            }

        }]) : "",
        ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                            "div": {
                                "class": "inputwrap",
                                "content": "<p><strong>Safely backup your appdata.</strong><br/>Sync your data securely with Google Drive.</p>"
                            },
                        },
                        {
                            "div": {
                                "class": "inputwrap",
                                "content": "<div id='oauth_onload'><span class='icon-google2'></span>Back up now</div>"
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
                        "value": "ok"
                    }
                }
            }
        ],
        content = template_dialog({
            "id": "gdbu_dialog",
            "icon": "icon-googledrive",
            "title": "Back up to Google Drive",
            "elements": ddat
        });
    popdialog(content, "triggersubmit");
    br_set_local("oa_timer", now());
}

function gd_login_trigger() {
    $(document).on("click", "#oauth_onload", function() {
        let pass = GD_pass();
        g_login(pass);
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
        let pass = GD_pass();
        g_login(pass);
    })
}

function g_login(tob) {
    if (hostlocation == "local") {
        notify("GoogleAuth not available");
        return
    }
    if (tob && tob.cached === false) {
        tokenClient.requestAccessToken({
            "prompt": "none"
        });
        return
    }
    tokenClient.requestAccessToken();
}

function set_gatoken(e) {
    if (e.error) {
        if (e.error == "interaction_required") {
            notify("error: access denied");
            return
        }
        notify("error");
        return
    }
    let access_token = e.access_token;
    if (access_token) {
        let token_object = {
            "access_token": access_token,
            "expires_in": e.expires_in,
            "created": now()
        }
        br_set_local("a_dat", btoa(JSON.stringify(token_object)));
        let pass = GD_pass();
        if (pass) {
            updateappdata(pass);
        } else {
            init_login_dialog();
        }
        gdlogin_callbacks();
    }
}

function gdlogin_callbacks() {
    html.addClass("gdauth");
    notify("Successfully signed in");
    resetchanges();
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
    canceldialog();
}

function g_logout() {
    let result = confirm("Are you sure you want to stop using Google Drive Backup?");
    if (result === true) {
        let token = has_token();
        if (token) {
            gapi.client.setToken("");
        }
        br_remove_local("a_dat");
        gdlogout_callbacks();
    }
}

function gdlogout_callbacks() {
    html.removeClass("gdauth");
    notify("Successfully signed out");
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
        if (body.hasClass("ios")) {
            notify("GoogleAuth unavailable for IOS App at the moment");
            return
        }
        let pass = GD_pass();
        if (pass) {
            g_logout();
            return
        }
        g_login(pass);
    })
}

function updateappdata(pass) {
    let bu_id = br_get_local("backupfile_id");
    if (bu_id) {
        if (pass.token) {
            let gd_timer = br_get_session("gd_timer"); // prevent Ddos
            if (gd_timer) {
                let interval = 3000;
                if ((now() - gd_timer) < interval) {
                    return
                }
            }
            br_set_session("gd_timer", now());
            api_proxy({
                "api_url": drivepath + "/upload/drive/v3/files/" + bu_id + "?uploadType=media&alt=json",
                "proxy": false,
                "params": {
                    "method": "PATCH",
                    "dataType": "json",
                    "contentType": "application/json",
                    "headers": {
                        "Authorization": "Bearer " + pass.token
                    },
                    "data": complilebackup()
                }
            }).done(function(e) {}).fail(function(jqXHR, textStatus, errorThrown) {
                if (textStatus == "error") {
                    let error_object = jqXHR;
                    if (error_object) {
                        let resp_obj = error_object.responseJSON;
                        if (resp_obj) {
                            let resp = resp_obj.error;
                            if (resp) {
                                console.log(resp);
                                if (resp.code == 401) {
                                    //oauth_pop(true); // log in
                                    notify("Unauthorized");
                                    return
                                }
                                if (resp.code == 404) {
                                    createfile(pass); // create file
                                    return
                                }
                            }
                        }
                    }
                    notify("error");
                }
            });
            return
        }
    }
    createfile(pass) // create file
}

function createfile(tob) {
    let pass = (tob) ? tob : GD_pass();
    if (pass) {
        let file = new Blob([complilebackup()], {
                "type": "text/plain"
            }),
            description = {
                "modified": now() + timezone,
                "device": getdevicetype(),
                "deviceid": deviceid
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
        xhr.setRequestHeader("Authorization", "Bearer " + pass.token);
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
    if (body.hasClass("ios")) {
        notify("GoogleAuth unavailable for IOS App at the moment");
        return false;
    }
    let pass = GD_pass();
    if (pass) {
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
            "api_url": drivepath + "/drive/v3/files?pageSize=10&spaces=appDataFolder&fields=*",
            "proxy": false,
            "params": {
                "method": "GET",
                "headers": {
                    "Authorization": "Bearer " + pass.token
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
                        trash = (device_id == deviceid) ? "<div class='purge_bu icon-bin'></div>" : "",
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
                    notify("Unauthorized");
                    return
                }
                if (errorThrown == "Not Found") {
                    createfile(); // create file
                    return
                }
                notify("error");
            }
        });
        return
    }
    g_login(pass);
}

function deletefiletrigger() {
    $(document).on("click", ".purge_bu", function() {
        let pass = GD_pass();
        if (pass) {
            let thislist = $(this).parent("li"),
                fileid = thislist.attr("data-gdbu_id"),
                result = confirm("Delete " + thislist.text() + "?");
            if (result === true) {
                deletefile(fileid, thislist, pass);
            }
            return
        }
        init_login_dialog();
    })
}

function deletefile(fileId, thislist, tob) {
    api_proxy({
        "api_url": drivepath + "/drive/v3/files/" + fileId,
        "proxy": false,
        "params": {
            "method": "DELETE",
            "headers": {
                "Authorization": "Bearer " + tob.token
            }
        }
    }).done(function(e) {
        if (thislist) {
            thislist.slideUp(300);
            notify("File deleted");
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        if (textStatus == "error") {
            if (errorThrown == "Not Found") {
                notify("Error: File not found");
                return
            }
            notify("error");
        }
    });
}

function GD_pass() {
    if (gapi) {
        if (gapi.client) {
            let token = has_token();
            if (token) {
                html.addClass("gdauth");
                return {
                    "token": token,
                    "cached": false,
                    "expired": false
                }
            }
            let s_token = a_dat();
            if (s_token) {
                html.addClass("gdauth");
                return s_token
            }
        }
    }
    html.removeClass("gdauth");
    return false;
}

function has_token() {
    let token = gapi.client.getToken();
    if (token) {
        if (token.access_token) {
            return token.access_token;
        }
    }
    return false
}

function a_dat() {
    let token_dat = cashed_token();
    if (token_dat) {
        let token_object = JSON.parse(atob(token_dat)),
            ga_token = token_object.access_token;
        if (ga_token) {
            let expired = (now() - token_object.created) > (token_object.expires_in * 1000);
            if (expired) {
                return false;
            }
            return {
                "token": ga_token,
                "cached": true,
                "expired": expired
            };
        }
    }
    return false;
}

function cashed_token() {
    let token_dat = br_get_local("a_dat");
    if (token_dat) {
        return token_dat
    }
    return false;
}