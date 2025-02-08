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
function fetch_creds(auth_code) {
    if (auth_code) {
        api_proxy({
            "custom": "fetch_creds",
            "api_url": true,
            "proxy": true,
            "code": decodeURIComponent(auth_code),
            "redirect_uri": glob_const.redirect_uri,
            "grant_type": "authorization_code"
        }).done(function(response) {
            if (response) {
                const parsed_data = br_result(response);
                if (parsed_data) {
                    const auth_result = parsed_data.result;
                    if (auth_result) {
                        const error = auth_result.error;
                        if (error) {
                            const error_desc = auth_result.error_description,
                                error_msg = (error_desc) ? " || " + error_desc : "";
                            notify(error + error_msg);
                            return
                        }
                        const access_token = auth_result.access_token;
                        if (access_token) {
                            const token_data = {
                                "created": now(),
                                "active": true,
                                "access_token": access_token,
                                "expires_in": auth_result.expires_in
                            };
                            br_set_local("dat", JSON.stringify(token_data));
                            const refresh_token = auth_result.refresh_token;
                            if (refresh_token) {
                                const encoded_token = {
                                    "d": lnurl_encode("xz", refresh_token)
                                }
                                br_set_local("rt", JSON.stringify(encoded_token));
                            }
                            gdlogin_callbacks();
                            if (glob_const.body.hasClass("showstartpage")) { // only show when logged in
                                trigger_restore();
                            }
                            const redirect_timer = setTimeout(function() {
                                history.pushState({
                                    "pagename": "settings"
                                }, "", glob_const.redirect_uri);
                            }, 5000, function() {
                                clearTimeout(redirect_timer);
                            });
                        }
                    }
                }
            }
        }).fail(function(error) {
            console.error("error", error);
        }).always(function(response) {});
    }
}

// Requests new access token using a refresh token and updates local storage
function fetch_access(refresh_token, callback) {
    if (refresh_token) {
        api_proxy({
            "custom": "fetch_creds",
            "api_url": true,
            "proxy": true,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }).done(function(response) {
            if (response) {
                const parsed_data = br_result(response);
                if (parsed_data) {
                    const auth_result = parsed_data.result;
                    if (auth_result) {
                        const error = auth_result.error;
                        if (error) {
                            const error_desc = auth_result.error_description,
                                error_msg = error_desc ? " || " + error_desc : "";
                            if (error_desc.indexOf("expired") >= 0 || error_desc.indexOf("revoked") >= 0) {
                                br_remove_local("rt");
                                oauth_pop_delay();
                                return;
                            }
                            notify(error + error_msg);
                            return
                        }
                        const access_token = auth_result.access_token;
                        if (access_token) {
                            const token_data = {
                                "created": now(),
                                "active": true,
                                "access_token": access_token,
                                "expires_in": auth_result.expires_in
                            };
                            br_set_local("dat", JSON.stringify(token_data));
                            refcb(callback);
                        }
                    }
                }
            }
        }).fail(function(error) {
            console.error("error", error);
        });
    }
}

// Executes post-refresh callbacks and updates UI authentication state
function refcb(callback) {
    glob_const.html.addClass("gdauth");
    if (callback) {
        if (callback === "uad") {
            const pass_data = gd_pass();
            if (pass_data.pass) {
                update_appdata(pass_data);
                return
            }
        }
        if (callback === "gcb") {
            adjust_sp();
        }
    }
}

// Retrieves and parses the access token data from local storage
function lca_obj() {
    const stored_token = br_get_local("dat", true);
    if (stored_token) {
        return stored_token;
    }
    return false;
}

// Retrieves and decodes the refresh token from local storage
function rt_obj() {
    const stored_refresh = br_get_local("rt", true);
    return stored_refresh ? stored_refresh.d : false;
}

// Determines appropriate login flow based on current authentication state
function init_login_dialog(auth_state) {
    if (glob_const.hostlocation === "local") {
        notify(translate("ganot"));
        return
    }
    if (auth_state.expired) {
        t_expired(auth_state.expired, "gcb");
        return
    }
    if (auth_state.active) {
        g_login();
        return
    }
    if (auth_state.token) {
        activate();
        gdlogin_callbacks();
    }
}

// Schedules OAuth popup display with configurable delay and abort option
function oauth_pop_delay(abort_option) {
    canceldialog();
    const popup_timer = setTimeout(function() {
        oauth_pop(abort_option);
    }, 1200, function() {
        clearTimeout(popup_timer);
    });
}

// Renders and displays Google Drive authentication dialog with consent options
function oauth_pop(abort_option) {
    const checkbox_html = abort_option ? render_html([{
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
        dialog_elements = [{
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
                    "content": checkbox_html
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
        dialog_content = template_dialog({
            "id": "gdbu_dialog",
            "icon": "icon-googledrive",
            "title": translate("backuptogd"),
            "elements": dialog_elements
        });
    popdialog(dialog_content, "triggersubmit");
}

// Binds click handler to Google Drive login button
function gd_login_trigger() {
    $(document).on("click", "#oauth_onload", function() {
        g_login();
    })
}

// Handles Google Drive backup dialog form submission and logout confirmation
function submit_gdbu_dialog() {
    $(document).on("click", "#gdbu_dialog input.submit", function(event) {
        event.preventDefault();
        const dialog = $("#gdbu_dialog"),
            checkbox = dialog.find("#pk_confirmwrap"),
            is_checked = checkbox.data("checked");
        if (is_checked == true) {
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
    const auth_state = gd_pass();
    if (auth_state.pass) {
        gdlogin_callbacks();
        return
    }
    if (!auth_state.active && !auth_state.expired) {
        if (auth_state.token) {
            activate();
            gdlogin_callbacks();
            return
        }
    }
    const consent_param = auth_state.expired == "norefresh" ? "&prompt=consent" : "",
        auth_url = "https://accounts.google.com/o/oauth2/auth?client_id=" + to.ga_id + "&redirect_uri=" + glob_const.redirect_uri + "&response_type=code&scope=" + glob_const.scope + "&access_type=offline" + consent_param;
    glob_const.w_loc.href = auth_url;
}

// Updates UI and triggers data sync after successful Google Drive authentication
function gdlogin_callbacks(close_dialog) {
    glob_const.html.addClass("gdauth");
    notify(translate("gdsignedin"));
    resetchanges();
    adjust_sp();
    if (close_dialog) {
        canceldialog();
    }
}

// Updates switch panel state after successful Google Drive authentication
function adjust_sp() {
    const switch_panel = $("#popup.showpu .switchpanel");
    if (switch_panel.length) {
        switch_panel.addClass("true").removeClass("false");
        const app_data_list = $("#listappdata");
        if (app_data_list.length) {
            list_appdata();
            return
        }
        $("#changelog").slideUp(300);
        return
    }
}

// Initiates Google Drive logout process with user confirmation
function g_logout() {
    const user_confirmed = confirm(translate("stopgdalert"));
    if (user_confirmed) {
        deactivate();
        gdlogout_callbacks();
    }
}

// Sets authentication state to active in local storage
function activate() {
    const stored_token = lca_obj();
    if (stored_token) {
        stored_token.active = true;
        br_set_local("dat", JSON.stringify(stored_token));
    }
}

// Sets authentication state to inactive in local storage
function deactivate() {
    const stored_token = lca_obj();
    if (stored_token) {
        stored_token.active = false;
        br_set_local("dat", JSON.stringify(stored_token));
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
        const auth_state = gd_pass();
        if (auth_state.pass) {
            g_logout();
            return
        }
        init_login_dialog(auth_state);
    })
}

// Updates Google Drive app data with rate limiting and error handling
function update_appdata(auth_state) {
    const last_update = br_get_session("gd_timer"); // prevent Ddos
    if (last_update && (now() - last_update) < 3000) {
        return;
    }
    const access_token = auth_state.token;
    if (!access_token) {
        return
    }
    const backup_id = br_get_local("backupfile_id");
    if (backup_id) {
        br_set_session("gd_timer", now());
        const request_data = {
            "api_url": glob_const.drivepath + "/upload/drive/v3/files/" + backup_id + "?uploadType=media&alt=json",
            "proxy": false,
            "params": {
                "method": "PATCH",
                "dataType": "json",
                "contentType": "application/json",
                "headers": {
                    "Authorization": "Bearer " + access_token
                },
                "data": complilebackup()
            }
        };
        api_proxy(request_data).done(function(response) {
            // Success handling if needed  
        }).fail(function(xhr, status, error) {
            if (textStatus === "error") {
                const error_response = xhr;
                if (error_response) {
                    const error_json = error_response.responseJSON;
                    if (error_json) {
                        const error_details = error_json.error;
                        if (error_details) {
                            if (error_details.code === 401) {
                                notify(translate("unauthorized"));
                                return
                            }
                            if (error_details.code === 404) {
                                createfile(access_token); // create file
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
    createfile(access_token) // create file
}

// Creates new app data file in Google Drive with metadata
function createfile(access_token) {
    const token_data = gd_pass(),
        token_valid = token_data.pass,
        final_token = access_token || (token_valid ? token_data.token : false),
        backup_content = complilebackup();
    if (final_token) {
        const file_blob = new Blob([backup_content], {
                "type": "text/plain"
            }),
            file_meta = {
                "modified": now_utc(),
                "device": getdevicetype(),
                "deviceid": glob_const.deviceid
            },
            file_config = {
                "name": complilefilename(),
                "parents": ["appDataFolder"],
                "mimeType": "text/plain",
                "description": JSON.stringify(file_meta)
            },
            form_data = new FormData(),
            request = new XMLHttpRequest();
        form_data.append("metadata", new Blob([JSON.stringify(file_config)], {
            "type": "application/json"
        }));
        form_data.append("file", file_blob);
        request.open("post", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id");
        request.setRequestHeader("Authorization", "Bearer " + final_token);
        request.responseType = "json";
        request.onload = function() {
            const file_id = request.response.id;
            if (file_id) {
                br_set_local("backupfile_id", file_id.toString());
            }
        };
        request.send(form_data);
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
    const auth_state = gd_pass();
    if (!auth_state.pass) {
        init_login_dialog(auth_state);
        return
    }
    const list_trigger = $("#listappdata .switchpanel"),
        backup_list = $("#gd_backuplist"),
        import_list = $("#importjson");
    if (backup_list.find("li").length) {
        if (list_trigger.hasClass("true")) {
            list_trigger.removeClass("true");
            backup_list.slideUp(300);
            import_list.slideDown(300);
            return
        }
        list_trigger.addClass("true");
        backup_list.slideDown(300);
        import_list.slideUp(300);
        return
    }
    api_proxy({
        "api_url": glob_const.drivepath + "/drive/v3/files?pageSize=10&spaces=appDataFolder&fields=*",
        "proxy": false,
        "params": {
            "method": "GET",
            "headers": {
                "Authorization": "Bearer " + auth_state.token
            }
        }
    }).done(function(response) {
        const files = response.files;
        if (files.length) {
            const sorted_files = files.sort(function(a, b) { // sort array by timestamp
                    const time_a = a.modifiedTime,
                        time_b = b.modifiedTime,
                        timestamp_a = time_a ? to_ts(time_a) : 2,
                        timestamp_b = time_b ? to_ts(time_b) : 1;
                    return timestamp_b - timestamp_a; // descending order
                }),
                backup_items = [];
            $.each(sorted_files, function(i, file) {
                const file_meta = JSON.parse(file.description),
                    device_type = file_meta.device,
                    device_id = file_meta.deviceid,
                    created_date = short_date(file_meta.modified),
                    modified_date = short_date(to_ts(file.modifiedTime)),
                    delete_btn = (device_id === glob_const.deviceid) ? "<div class='purge_bu icon-bin'></div>" : "",
                    backup_html = "<li data-gdbu_id='" + file.id + "' data-device-id='" + device_id + "' data-device='" + device_type + "'><div class='restorefile icon-" + device_type + "' title='" + device_type + " (Created: " + created_date + ")'>" + modified_date + "<span class='lmodified'> (" + (file.size / 1000).toFixed(0) + " KB)</div>" + delete_btn + "</li>";
                backup_items.push(backup_html);
            });
            backup_list.prepend(backup_items.join("")).slideDown(300);
        } else {
            backup_list.prepend("<li>No files found</li>").slideDown(300);
        }
        import_list.slideUp(300);
        list_trigger.addClass("true");
    }).fail(function(xhr, status, error) {
        if (status === "error") {
            if (error === "Unauthorized") {
                list_trigger.removeClass("true");
                backup_list.slideUp(300);
                import_list.slideDown(300);
                notify(translate("unauthorized"));
                return
            }
            if (error === "Not Found") {
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
        const auth_state = gd_pass();
        if (!auth_state.pass) {
            init_login_dialog(auth_state);
            return
        }
        const list_item = $(this).parent("li"),
            file_id = list_item.attr("data-gdbu_id"),
            user_confirmed = confirm(translate("deletefile", {
                "file": list_item.text()
            }));
        if (user_confirmed) {
            deletefile(file_id, list_item, auth_state.token);
        }
    })
}

// Deletes specified file from Google Drive app data
function deletefile(file_id, list_item, access_token) {
    api_proxy({
        "api_url": glob_const.drivepath + "/drive/v3/files/" + file_id,
        "proxy": false,
        "params": {
            "method": "DELETE",
            "headers": {
                "Authorization": "Bearer " + access_token
            }
        }
    }).done(function(response) {
        if (list_item) {
            list_item.slideUp(300);
            notify(translate("filedeleted"));
        }
    }).fail(function(xhr, status, error) {
        if (status === "error") {
            if (error === "Not Found") {
                notify(translate("error") + ": " + translate("filenotfound"));
                return
            }
            notify(translate("error"));
        }
    });
}

// Retrieves and validates current Google Drive authentication state
function gd_pass() {
    const auth_state = {
            "token": false,
            "active": false,
            "expired": false,
            "pass": false
        },
        stored_token = lca_obj(),
        refresh_token = rt_obj(),
        can_refresh = refresh_token || "norefresh";
    if (stored_token) {
        const access_token = stored_token.access_token,
            elapsed_time = (now() - stored_token.created) + 60000,
            expiry_time = stored_token.expires_in * 1000,
            is_expired = (elapsed_time > expiry_time),
            time_remaining = (expiry_time - elapsed_time),
            is_active = stored_token.active;
        if (access_token) {
            auth_state.token = access_token;
            auth_state.expires_in = time_remaining;
            if (is_expired) {
                auth_state.expired = can_refresh;
            }
            if (is_active) {
                auth_state.active = true;
            }
        }
        if (access_token && !is_expired && is_active) {
            glob_const.html.addClass("gdauth");
            auth_state.pass = true;
        } else {
            glob_const.html.removeClass("gdauth");
        }
    } else {
        auth_state.expired = can_refresh;
    }
    return auth_state;
}