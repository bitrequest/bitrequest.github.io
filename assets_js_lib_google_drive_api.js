var gapi,
    GoogleAuth,
    user,
    scope = "https://www.googleapis.com/auth/drive.appdata"; // useragent of ios app
$(document).ready(function() {
    if (gapi) {
        if (geturlparameters().rd) { // Ios app workaround
            setTimeout(function() {
                trigger_restore();
            }, 1000);
        }
        // ** Google api **

        Drive_Backup_trigger();
        //authenticate
        //loadClient
        //updateappdata
        //updatemeta
        //createfile
        listappdata();
        deletefiletrigger();
        //deletefile
        //GD_auth
    }
});

// ** Google api **

function gapi_load(redirect) {
    if (gapi) {
        gapi.load("client:auth2", function() {
            var rdirect = (redirect === true) ? "redirect" : "";
            gapi.client.init({
                "client_id": to.ga_id,
                "scope": scope,
                "ux_mode": rdirect,
                "redirect_uri": "https://" + window.location.hostname + "/?p=settings&rd=1"
            }).then(function() {
                GoogleAuth = gapi.auth2.getAuthInstance();
                user = GoogleAuth.currentUser.get();
                loadClient();
            });
        });
    }
}

function Drive_Backup_trigger() {
    $(document).on("click", "#gdtrigger .switchpanel", function() {
        if (body.hasClass("ios")) {
            notify("GoogleAuth unavailable for IOS App at the moment");
            return false;
        }
        if (GD_auth() === true) {
            var thistrigger = $(this),
                changelog = $("#changelog");
            if (thistrigger.hasClass("true")) {
                thistrigger.removeClass("true");
                changelog.slideDown(300);
                html.removeClass("gdauth");
            } else {
                thistrigger.addClass("true");
                changelog.slideUp(300);
                html.addClass("gdauth");
            }
        } else {
            authenticate().then(loadClient);
        }
    })
}

function authenticate() {
    if (GoogleAuth) {
        return GoogleAuth.signIn().then(function() {
                html.addClass("gdauth");
                $("#gdtrigger .switchpanel").addClass("true");
                setTimeout(function() {
                    $("#listappdata .switchpanel").trigger("click");
                    if (GD_auth() === true) {
                        updateappdata();
                        body.removeClass("haschanges");
                        html.addClass("gdauth");
                    }
                }, 500);
            },
            function(err) {
                //console.error("Error signing in", err);
            });
    } else {
        var content = "<h2 class='icon-bin'>Sorry!</h2><p>Google drive access not allowed from this domain</p><div id='api_signin'>Please apply for google OAuth token <a href='https://console.developers.google.com/apis/credentials' target='_blank'>here</a></div>";
        canceldialog();
        setTimeout(function() {
            popdialog(content, "alert", "canceldialog");
        }, 800);
    }
}

function loadClient() {
    return gapi.client.load("https://content.googleapis.com/discovery/v1/apis/drive/v3/rest").then(function() {
            console.log("GAPI client loaded for API");
            setTimeout(function() {
                html.addClass("gdauth");
            }, 500);
        },
        function(err) {
            console.error("Error loading GAPI client for API", err);
        });
}

function updateappdata() {
    var requestdata = {
        "path": "/upload/drive/v3/files/" + localStorage.getItem("bitrequest_backupfile_id"),
        "method": "PATCH",
        "params": {
            "uploadType": "media"
        },
        "body": complilebackup()
    }
    return gapi.client.request(requestdata).then(function(response) {
            updatemeta();
        },
        function(err) {
            if (err = 404) { // file does not exist
                createfile() // create file
            }
        });
}

function updatemeta() {
    var description = {
        "modified": $.now() + timezone,
        "device": getdevicetype(),
        "deviceid": deviceid
    }
    return gapi.client.drive.files.update({
            "fileId": localStorage.getItem("bitrequest_backupfile_id"),
            "resource": {
                "description": JSON.stringify(description)
            }
        })
        .then(function(response) {
                //console.log("Response", response);
            },
            function(err) {
                console.error("Execute error", err);
            });
}

function createfile() {
    var file = new Blob([complilebackup()], {
        type: "text/plain"
    });
    var description = {
        "modified": $.now() + timezone,
        "device": getdevicetype(),
        "deviceid": deviceid
    }
    var metadata = {
        "name": complilefilename(),
        "parents": ["appDataFolder"],
        "mimeType": "text/plain",
        "description": JSON.stringify(description)
    };
    var form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], {
        "type": "application/json"
    }));
    form.append("file", file);
    var xhr = new XMLHttpRequest();
    xhr.open("post", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id");
    xhr.setRequestHeader("Authorization", "Bearer " + user.getAuthResponse().access_token);
    xhr.responseType = "json";
    xhr.onload = () => {
        var response_id = xhr.response.id,
        	response_id_string = response_id.toString();
        localStorage.setItem("bitrequest_backupfile_id", response_id_string);
    };
    xhr.send(form);
}

function listappdata() {
    $(document).on("click", "#listappdata .switchpanel", function() {
        if (body.hasClass("ios")) {
            notify("GoogleAuth unavailable for IOS App at the moment");
            return false;
        }
        if (GD_auth() === true) {
            var thistrigger = $(this),
                backuplist = $("#gd_backuplist"),
                importjsonlist = $("#importjson");
            if (backuplist.find("li").length) {
                if (thistrigger.hasClass("true")) {
                    thistrigger.removeClass("true");
                    backuplist.slideUp(300);
                    importjsonlist.slideDown(300);
                    html.removeClass("gdauth");
                } else {
                    thistrigger.addClass("true");
                    backuplist.slideDown(300);
                    importjsonlist.slideUp(300);
                    html.addClass("gdauth");
                }
            } else {
                return gapi.client.drive.files.list({
                    "spaces": ["appDataFolder"],
                    "pageSize": 10,
                    "fields": "*"
                }).then(function(response) {
                        // Handle the results here (response.result has the parsed body).
                        var filelist = response.result.files,
                            sorted_filelist = filelist.sort(function(a, b) { // sort array by timestamp
                                var d1 = JSON.parse(a.description).modified,
                                    d2 = JSON.parse(b.description).modified;
                                return d2 - d1; // d2-d1 for descending order
                            }),
                            gdbackuppush = [];
                        $.each(sorted_filelist, function(i, value) {
                            var description = JSON.parse(value.description),
                                device = description.device,
                                device_id = description.deviceid,
                                trash = (device_id == deviceid) ? "<div class='purge_bu icon-bin'></div>" : "",
                                gdbackups = "<li data-gdbu_id='" + value.id + "' data-device-id='" + device_id + "' data-device='" + device + "'><div class='restorefile icon-" + device + "' title='" + device + "'>" + new Date(description.modified - timezone).toLocaleString(language) + "<span class='lmodified'> (" + (value.size / 1000).toFixed(0) + " KB)</div>" + trash + "</li>";
                            gdbackuppush.push(gdbackups);
                        });
                        if (filelist.length > 0) {
                            backuplist.prepend(gdbackuppush.join("")).slideDown(300);
                        } else {
                            backuplist.prepend("<li>No files found</li>").slideDown(300);
                        }
                        importjsonlist.slideUp(300);
                        thistrigger.addClass("true");
                        html.addClass("gdauth");
                    },
                    function(err) {
                        console.log(err);
                    });
            }
        } else {
            authenticate().then(loadClient);
        }
    })
}

function deletefiletrigger() {
    $(document).on("click", ".purge_bu", function() {
        if (GD_auth() === true) {
            var thislist = $(this).parent("li"),
                fileid = thislist.attr("data-gdbu_id"),
                result = confirm("Delete " + thislist.text() + "?");
            if (result === true) {
                deletefile(fileid, thislist);
            }
        } else {
            authenticate().then(loadClient);
        }
    })
}

function deletefile(fileId, thislist) {
    return gapi.client.drive.files.delete({
            "fileId": fileId
        })
        .then(function(response) {
                console.log("Response", response);
                thislist.slideUp(300);
                notify("File deleted");
            },
            function(err) {
                console.error("Execute error", err);
            });
}

function GD_auth() {
    if (user && user.hasGrantedScopes(scope)) {
        return true;
    } else {
        return false;
    }
}

function GD_auth_class() {
    if (user && user.hasGrantedScopes(scope)) {
        html.addClass("gdauth");
        return true;
    } else {
        html.removeClass("gdauth");
        return false;
    }
}