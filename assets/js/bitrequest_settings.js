//globals
var deviceid = hashcode(getdevicetype() + navigator.appName + navigator.appCodeName),
    caches,
    resd = {};

$(document).ready(function() {

    // ** Settings **

    // Account name
    editaccount();
    submitaccount();

    // Contact form
    edit_contactform_trigger();
    //edit_contactform;
    type_contactform();
    submit_contactform();

    // Standard fiat currency
    editcurrency();
    toggle_defaultcurrency();
    autocompletecurrency();
    submitcurrency();

    // CSV Export
    csvexport_trigger();
    submit_csvexport();
    //complile_csv
    //render_csv
    share_csv();
    check_csvexport();
    submit_csvdownload();

    // Bip32 passphrase
    trigger_bip32();
    hide_seed_panel_trigger();
    //hide_seed_panel

    // Pincode
    editpin();
    locktime();
    submit_locktime();

    // Back up
    backupdatabasetrigger();
    //backupdatabase
    sbu_switch();
    sharebu();
    check_systembu();
    //systembu_expired
    restore_systembu();
    backupcd();
    //complilebackup
    //complilefilename
    submitbackup();

    // Restore backup

    restorefrombackup();
    //trigger_restore
    restorebackup();
    submitrestore();
    //restore
    //check_backup
    //isteaminvite
    submit_GD_restore();
    //scan_restore
    //restore_algo
    //restore_callback
    //s_decode
    //pin_dialog
    submit_pin_dialog();
    //restore_cb_init_addresses
    //restore_callback_file
    //restore_callback_gd
    //dphrase_dialog
    submit_dphrase();
    //keep_current_seed
    //restore_bu_seed
    //bu_oldseed
    compare_seeds();
    //cs_callback
    //compare_seeds_callback
    //restorestorage

    // Cache control
    cachecontrol();
    clearcache();
    reset_coinsettings();
    //reset_coinsettings_function
    reset_settings();
    //reset_settings_popup
    backupdatabasetrigger2();
    //reset_settings_function

    // Choose theme
    edittheme();
    //popthemedialog
    pickthemeselect();
    canceltheme();
    submittheme();

    // Url shortener
    urlshortener();
    togglebl();
    pick_urlshortener_select();
    submit_urlshortener_select();

    // Cryptocurrency price api
    editccapi();
    pickcmcapiselect();
    submitccapi();

    // Fiat price api
    editfiatxrapi();
    pickfiatxrapiselect();
    submitfiatxrapi();

    // API keys	
    apikeys();
    api_input_change();
    submitapi();
    //checkapikey
    //json_check_apikey
    //api_fail
    //update_api_attr
    //complement_apisettings

    // API Proxy
    pick_api_proxy();
    //test_append_proxy
    //proxy_option_li
    submit_proxy();
    hide_custom_proxy_field();
    //test_custom_proxy
    remove_proxy();
    //complete_url

    // PERMISSIONS
    permissions();
    submit_permissions();

    // TEAM INVITE
    team_invite_trigger()
    //team_invite
    //complile_teaminvite
    //adjust_object
    share_teaminvite()
    check_teaminvite();
    install_teaminvite_trigger()
    //install_teaminvite    
});

// ** Settings **

// Account name
function editaccount() {
    $(document).on("click", "#accountsettings", function() {
        var content = "\
		<div class='formbox' id='accountformbox'>\
			<h2 class='icon-user'>Account name</h2>\
			<div class='popnotify'></div>\
			<div class='popform'>\
				<input type='text' value='" + $(this).data("selected") + "'/>\
				<input type='submit' class='submit' value='OK'/>\
			</div>\
		</div>";
        popdialog(content, "alert", "triggersubmit");
    })
}

function submitaccount() {
    $(document).on("click", "#accountformbox input.submit", function(e) {
        e.preventDefault();
        var thisinput = $(this).prev("input"),
            thisvalue = thisinput.val();
        if (thisvalue.length < 1) {
            popnotify("error", "Name is required");
            thisinput.focus();
            return false;
        }
        set_setting("accountsettings", {
            "selected": thisvalue
        }, thisvalue);
        canceldialog();
        notify("Data saved");
        savesettings();
    })
}

// Standard fiat currency
function editcurrency() {
    $(document).on("click", "#currencysettings", function() {
        var currencysettings = $("#currencysettings"),
            switchmode = currencysettings.data("default"),
            currency = currencysettings.data("selected"),
            symbolstringarray = JSON.parse(localStorage.getItem("bitrequest_symbols")),
            symbollist = "";
        $.each(symbolstringarray, function(key, value) {
            if (key == "BTC") { // remove from list
            } else {
                symbollist += "<span data-id='1' data-pe='none'>" + key + " | " + value + "</span>";
            }
        });
        var content = "\
		<div class='formbox' id='currencyformbox'>\
			<h2 class='icon-coin-dollar'>Enter currency</h2>\
			<div class='popnotify'></div>\
			<div class='popform validated'>\
				<div class='selectbox'>\
					<input type='text' value='" + currency + "' placeholder='Pick currency'/>\
					<div class='selectarrows icon-menu2' data-pe='none'></div>\
					<div class='options'>" + symbollist + "</div>\
				</div>\
				<input type='submit' class='submit' value='OK'/>\
			</div>\
			<div id='toggle_defaultcurrency' class='clearfix'>\
				<h3>Set as default" + switchpanel(switchmode, " global") + "</h3>\
			</div>\
		</div>";
        popdialog(content, "alert", "triggersubmit");
    })
}

function toggle_defaultcurrency() {
    $(document).on("mouseup", "#toggle_defaultcurrency .switchpanel", function(e) {
        $(this).addClass("dc_changed");
    })
}

function autocompletecurrency() {
    $(document).on("input", "#currencyformbox input:first", function() {
        var thisinput = $(this),
            thisform = thisinput.closest(".popform"),
            thisvalue = thisinput.val().toUpperCase(),
            options = thisform.find(".options");
        thisform.removeClass("validated");
        $("#currencyformbox .options > span").each(function() {
            var thisoption = $(this),
                thistext = thisoption.text(),
                currencysymbol = thistext.split(" | ")[0];
            thisoption.removeClass("show");
            if (currencysymbol === thisvalue) {
                thisform.addClass("validated");
                thisinput.val(thistext)[0].setSelectionRange(0, 999);
            } else if (currencysymbol.match("^" + thisvalue)) {
                thisoption.addClass("show");
            }
        });
    })
}

function submitcurrency() {
    $(document).on("click", "#currencyformbox input.submit", function(e) {
        e.preventDefault();
        var localcurrency = get_setting("currencysettings", "currencysymbol");
        thisform = $(this).closest(".popform"),
            thisinput = thisform.find("input:first"),
            thisinputvalue = thisinput.val();
        $("#currencyformbox .options > span").each(function() {
            if (thisinputvalue == $(this).text()) {
                thisform.addClass("validated");
            }
        });
        var defaultcurrency_switch = $("#toggle_defaultcurrency .switchpanel");
        if (thisform.hasClass("validated")) {
            var switchchange = (defaultcurrency_switch.hasClass("dc_changed")),
                values = thisinputvalue.split(" | "),
                currencysymbol = values[0],
                currency = values[1],
                currencysymbollc = currencysymbol.toLowerCase();
            if (currencysymbollc == localcurrency && switchchange === false) {
                canceldialog();
            } else {
                var dc_output = (defaultcurrency_switch.hasClass("true")) ? true : false;
                set_setting("currencysettings", {
                    "currencysymbol": currencysymbollc,
                    "selected": thisinputvalue,
                    "default": dc_output
                }, thisinputvalue);
                canceldialog();
                notify("Currency saved");
                savesettings();
            }
        } else {
            popnotify("error", "currency '" + thisinputvalue.toUpperCase() + "' not supported");
            thisinput.focus();
        }
        return false;
    });
}

// SECURITY //

// Pincode
function editpin() {
    $(document).on("click", "#pinsettings", function() {
        if (haspin() === true) {
            var content = pinpanel(" pinwall reset");
            showoptions(content, "pin");
        } else {
            var content = pinpanel();
            showoptions(content, "pin");
        }
    })
}

function locktime() {
    $(document).on("click", "#locktime, #lock_time", function() {
        var locktime = get_setting("pinsettings", "locktime"),
            thiscurrency = "eur",
            content = "<div class='formbox' id='locktime_formbox'><h2 class='icon-clock'>Pin lock time</h2><div class='popnotify'></div><ul class='conf_options noselect'><li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>0</span> 0 minutes</div></li><li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>60000</span> 1 minute</div></li><li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>300000</span> 5 minutes</div></li><li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>600000</span> 10 minutes</div></li><li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>900000</span> 15 minutes</div></li><li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>1800000</span> 30 minutes</div></li><li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>never</span> never</div></li></ul><div class='popform'><input value='" + locktime + "' type='hidden'><input type='submit' class='submit' value='OK' data-currency='" + thiscurrency + "'></div>";
        popdialog(content, "alert", "triggersubmit");
        var currentli = $("#locktime_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() == locktime
        });
        currentli.find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    })
}

function submit_locktime() {
    $(document).on("click", "#locktime_formbox input.submit", function(e) {
        e.preventDefault();
        var thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisvalue = thistrigger.prev("input").val(),
            titlepin = (thisvalue == "never") ? "pincode disabled" : "pincode activated";
        set_setting("pinsettings", {
            "locktime": thisvalue,
            "selected": titlepin
        }, titlepin);
        canceldialog();
        canceloptions();
        savesettings();
    })
}

// Bip32 passphrase
function trigger_bip32() {
    $(document).on("click", "#bip39_passphrase", function() {
        if (hasbip === true) {
            all_pinpanel({
                "func": manage_bip32
            })
        } else {
            manage_bip32();
        }
    })
}

function hide_seed_panel_trigger() {
    $(document).on("click", "#seed_steps .seed_step .ss_header .icon-cross", function() {
        hide_seed_panel();
    })
}

function hide_seed_panel() {
    body.removeClass("seed_dialog");
    $("#seed_panel").attr("class", "");
    sleep();
}

// Back up
function backupdatabasetrigger() {
    $(document).on("click", "#backup, #alert", function() {
        backupdatabase();
    })
}

function backupdatabase() {
    var jsonencode = complilebackup(),
        filename = complilefilename(),
        changespush = [];
    $.each(changes, function(key, value) {
        if (value > 0) {
            var changekey = "<li>" + value + " changes in '" + key + "'</li>";
        }
        changespush.push(changekey);
    });
    var gd_active = (GD_auth_class() === true),
        showhidechangelog = (gd_active === true) ? "display:none" : "display:block",
        changenotification = (gd_active === false && body.hasClass("haschanges")) ? "<p>You have " + $("#alert > span").text() + " changes in your app. Please backup your data.</p>" : "",
        gdtrigger = "<div id='gdtrigger' class='clearfix'><h3 class='icon-googledrive'>Backup with Google Drive" + switchpanel(gd_active, " custom") + "</h3></div>",
        backupheader = (GoogleAuth) ? "" : "<h2 class='icon-download'>Backup App data</h2>",
        content = "\
		<div class='formbox' id='backupformbox'>\
			" + backupheader + "\
			<div class='popnotify'></div>\
			<div id='dialogcontent'>\
				<div id='ad_info_wrap'>\
					<ul>\
						<li class='clearfix pad'><strong><span class='icon-googledrive'></span> Backup with Google Drive: </strong><div id='gdtrigger' class='ait'>" + switchpanel(gd_active, " custom") + "</div></li>" +
        "</ul>\
				</div>\
				<div id='changelog' style='" + showhidechangelog + "'>" +
        changenotification +
        "<ul>" + changespush.join("") + "</ul>\
					<div id='custom_actions'>\
						<br/>\
						<a href='data:text/json;charset=utf-16le;base64," + jsonencode + "' download='" + filename + "' title='" + filename + "' id='triggerdownload' class='button icon-download' data-date='" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_').replace(/\:/g, '_') + "' data-lastbackup='" + filename + "' download>DOWNLOAD BACKUP</a>\
					</div>\
				</div>\
			</div>\
		</div>\
		<div id='backupactions'>\
			<div id='share_bu' data-url='" + jsonencode + "' class='util_icon icon-share2'></div>\
			<div id='backupcd'>CANCEL</div>\
		</div>";
    popdialog(content, "alert", "triggersubmit", null, true);
}

function sbu_switch() {
    $(document).on("mouseup", "#toggle_sbu_span .switchpanel", function() {
        var thistrigger = $(this),
            thisvalue = (thistrigger.hasClass("true")) ? true : false;
        if (thisvalue === true) {
            var result = confirm("Include encrypted seed in backup? Make sure you keep track of your backup files!");
            if (result === false) {
                thistrigger.removeClass("true").addClass("false");
                return false;
            }
        }
        set_setting("backup", {
            "sbu": thisvalue
        });
        savesettings();
        //canceldialog();
    })
}

function sharebu() {
    $(document).on("click", "#share_bu", function() {
        var result = confirm("Share system backup ?");
        if (result === true) {
            loader(true);
            loadertext("generate system backup");
            var accountname = $("#accountsettings").data("selected");
            api_proxy({
                "custom": "system_bu",
                "api_url": true,
                "proxy": true,
                "params": {
                    "url": $(this).attr("data-url"),
                    "account": btoa(accountname)
                }
            }).done(function(e) {
                var br_cache = e.ping.br_cache,
                    filetime = br_cache.created_utc,
                    filetimesec = (filetime) ? filetime * 1000 : $.now(),
                    filetime_format = new Date(filetimesec).toLocaleString(language),
                    sharedtitle = "System Backup " + accountname + " (" + filetime_format + ")";
                shorten_url(sharedtitle, approot + "?p=settings&sbu=" + br_cache.filename, approot + "/img/system_backup.png", true);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                closeloader();
            });
        }
    })
}

function check_systembu() {
    var url_params = geturlparameters();
    if (url_params.p == "settings") {
        var sbu = url_params.sbu;
        if (sbu) {
            api_proxy({
                "custom": "get_system_bu",
                "api_url": true,
                "proxy": true,
                "params": sbu
            }).done(function(e) {
                var ping = e.ping;
                if (ping) {
                    var br_cache = e.ping.br_cache,
                        server_time = br_cache.utc_timestamp,
                        filetime = br_cache.created_utc,
                        filetimesec = (filetime) ? filetime * 1000 : $.now(),
                        filetime_format = new Date(filetimesec).toLocaleString(language),
                        br_result = e.ping.br_result,
                        base64 = br_result.base64,
                        account = atob(br_result.account),
                        sharedtitle = "System Backup " + account + " (" + filetime_format + ")",
                        bu_date = filetime_format.replace(/\s+/g, '_').replace(/\:/g, '_'),
                        cache_time = br_cache.cache_time,
                        expires_in = (filetime + cache_time) - server_time,
                        filename = "bitrequest_system_backup_" + encodeURIComponent(account) + "_" + bu_date + ".json",
                        cd = countdown(expires_in * 1000),
                        cd_format = countdown_format(cd),
                        cf_string = (cd_format) ? "Expires in " + cd_format : "File expired",
                        content = "\
						<div class='formbox' id='system_backupformbox'>\
							<h2 class='icon-download'>System Backup</h2>\
							<div class='popnotify'></div>\
							<div id='dialogcontent'>\
								<h1>" + sharedtitle + "</h1>\
								<div class='error' style='margin-top:1em;padding:0.3em 1em'>" + cf_string + "</div>\
								<div id='changelog'>\
									<div id='custom_actions'>\
										<br/>\
										<a href='data:text/json;charset=utf-16le;base64," + base64 + "' download='" + filename + "' title='" + filename + "' id='triggerdownload' class='button icon-download' data-date='" + bu_date + "' data-lastbackup='" + filename + "' download>DOWNLOAD BACKUP</a>\
									<div id='restore_bu' data-base64='" + base64 + "' data-filename='" + filename + "' class='button icon-share2'>INSTALL BACKUP</div>\
									</div>\
								</div>\
							</div>\
						</div>\
						<div id='backupactions'>\
							<div id='backupcd'>CANCEL</div>\
						</div>";
                    popdialog(content, "alert", "triggersubmit", null, true);
                } else {
                    systembu_expired();
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                systembu_expired();
            });
        }
    }
}

function systembu_expired() {
    var content = "\
		<div class='formbox' id='system_backupformbox'>\
			<h2 class='icon-download'>File Expired</h2>\
		</div>\
		<div id='backupactions'>\
			<div id='backupcd'>CANCEL</div>\
		</div>";
    popdialog(content, "alert", "triggersubmit", null, true);
}

function restore_systembu() {
    $(document).on("click", "#system_backupformbox #restore_bu", function() {
        var result = confirm("INSTALL SYSTEM BACKUP? ALL YOUR PREVIOUS APP DATA WILL BE REPLACED");
        if (result === true) {
            var this_bttn = $(this),
                bu_dat = this_bttn.attr("data-base64"),
                j_filename = this_bttn.attr("data-filename"),
                j_object = JSON.parse(atob(bu_dat));
            restore(j_object, j_filename)
        }
    })
}

function backupcd() {
    $(document).on("click", "#backupcd", function() {
        canceldialog();
    })
}

function complilebackup() {
    var jsonfile = [];
    for (var key in localStorage) {
        var value = localStorage.getItem(key);
        if (value === null ||
            key == "bitrequest_symbols" ||
            key == "bitrequest_changes" ||
            key == "bitrequest_erc20tokens" ||
            key == "bitrequest_editurl" ||
            key == "bitrequest_recent_requests" ||
            key == "bitrequest_backupfile_id" ||
            key == "bitrequest_appstore_dialog" ||
            key == "bitrequest_init" ||
            key == "bitrequest_k" ||
            key == "bitrequest_awl" ||
            key == "bitrequest_tp") {} else if (key == "bitrequest_bpdat") { // only backup ecrypted seed
            if (test_derive === true && get_setting("backup", "sbu") === true) {
                var val_obj = JSON.parse(value);
                val_obj.dat = null;
                jsonfile.push('"' + key + '":' + JSON.stringify(val_obj));
            }
        } else {
            jsonfile.push('"' + key + '":' + value);
        }
    }
    return btoa("{" + jsonfile + "}");
}

function complilefilename() {
    return "bitrequest_backup_" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_').replace(/\:/g, '_') + ".json";
}

function submitbackup() {
    $(document).on("click", "#triggerdownload", function(e) {
        if (body.hasClass("ios")) {
            e.preventDefault();
            notify("Downloads for IOS App unavailable at the moment");
            return false;
        }
        var thisnode = $(this),
            href = thisnode.attr("href"),
            title = thisnode.attr("title"),
            result = confirm("Download: " + title + "?");
        if (result === false) {
            e.preventDefault();
            return false;
        }
        var lastsaved = "last backup: <span class='icon-folder-open'>" + thisnode.attr("data-date") + "</span>",
            lastbackup = thisnode.attr("data-lastbackup");
        set_setting("backup", {
            "titlebackup": lastsaved,
            "lastbackup": lastbackup,
            "device": "folder-open"
        }, lastsaved);
        canceldialog();
        savesettings();
        resetchanges();
        notify("Downloaded: " + lastbackup);
    })
}

// Restore backup
function restorefrombackup() {
    $(document).on("click", "#restore, #rshome", function() {
        trigger_restore();
    })
}

function trigger_restore() {
    backup_active = false;
    var restorenode = $("#restore"),
        backupnode = $("#backup"),
        lastfileused = restorenode.data("fileused"),
        lastdevice = restorenode.data("device"),
        deviceused = (lastdevice == "folder-open") ? "" : "google-drive",
        lastfileusedstring = (lastfileused) ? "<p class='icon-" + deviceused + "'>Last restore: <span class='icon-" + lastdevice + "'>" + lastfileused + "</span></p>" : "",
        lastbackup = backupnode.data("lastbackup"),
        lastbudevice = backupnode.data("device"),
        lastbackupdevice = (lastbudevice == "folder-open") ? "" : "google-drive",
        lastbackupstring = (lastbackup) ? "<p class='icon-" + lastbackupdevice + "'>Last backup: <span class='icon-" + lastbudevice + "'>" + lastbackup + "</span></p>" : "",
        gd_active = (GD_auth_class() === true),
        switchmode = (gd_active === true) ? " true" : "",
        listappdata = "<div id='listappdata'><h3 class='icon-googledrive'>Restore from Google drive:" + switchpanel(gd_active, " custom") + "</h3></div>",
        showhidegd = (gd_active === true) ? "display:none" : "display:block",
        content = "\
		<div class='formbox' id='restoreformbox'>\
			<h2 class='icon-upload'>Restore App data</h2>\
			<div class='popnotify'></div>\
			<div id='gd_meta'>" + lastfileusedstring + lastbackupstring + "</div>\
			" + listappdata + "\
			<div id='backupswrap'>\
				<ul id='gd_backuplist'></ul>\
				<div id='importjson' style='" + showhidegd + "'>\
					<h3 class='icon-folder-open'>Restore from file</h3>\
					<input type='file' id='fileupload'/>\
					<input type='submit' class='submit' value='OK'/>\
				</div>\
			</div>";
    popdialog(content, "alert", "triggersubmit");
    if (gd_active === true) {
        $("#listappdata .switchpanel").trigger("click");
    }
}

function restorebackup() {
    $(document).on("change", "#fileupload", function(n) {
        backup_result = null,
            backup_filename = null;
        var file = this.files[0],
            filesize = file.size,
            filetype = file.type;
        backup_filename = file.name;
        if (filesize > 5242880) {
            var filesizewarningtext = "Filesize too big";
            topnotify(filesizewarningtext);
            popnotify(filesizewarningtext);
            return false;
        } else {
            if (filetype == "application/json") {
                var reader = new FileReader();
                reader.onload = function(e) {
                    backup_result = e.target.result,
                        backup_active = true;
                };
                reader.readAsDataURL(file);
            } else {
                var filetypewarningtext = "Filetype '" + filetype + "' not supported";
                topnotify(filetypewarningtext);
                return false;
            }
        }
    })
}

function submitrestore() {
    $(document).on("click", "#restoreformbox input.submit", function(e) {
        e.preventDefault();
        var switchpanel = $("#popup #listappdata .switchpanel");
        if (switchpanel.hasClass("true")) {
            topnotify("Select a Backup file");
        } else {
            if (backup_active === true) {
                var jsonobject = JSON.parse(atob(backup_result.substr(backup_result.indexOf(",") + 1)));
                restore(jsonobject, backup_filename)
            } else {
                topnotify("Select a Backup file");
            }
        }
    })
}

function restore(jsonobject, bu_filename) {
    var cbu = check_backup(jsonobject);
    if (cbu === false) {
        return false
    }
    var result = confirm("Restore " + bu_filename + "?");
    if (result === true) {
        var is_team_invite = isteaminvite(jsonobject);
        if (is_team_invite === true) {
            install_teaminvite(jsonobject, bu_filename, false);
        } else {
            scan_restore(jsonobject);
            var pass_dat = {
                "jasobj": jsonobject,
                "filename": bu_filename,
                "type": "file"
            };
            restore_algo(pass_dat);
        }
    }
}

function check_backup(jsonobject) {
    var cashier_entry = jsonobject.bitrequest_cashier,
        is_team_invite = (cashier_entry && cashier_entry.cashier) ? true : false;
    if (cashier_dat && cashier_dat.cashier && !is_team_invite) {
        notify("Backup type not allowed in cashiers mode");
        return false;
    }
    return true;
}

function isteaminvite(jsonobject) {
    var cashier_entry = jsonobject.bitrequest_cashier;
    return (cashier_entry && cashier_entry.cashier) ? true : false;
}

function submit_GD_restore() {
    $(document).on("click", "#gd_backuplist .restorefile", function() {
        var thisfield = $(this).parent("li"),
            thisdevice = thisfield.attr("data-device"),
            result = confirm("Restore " + thisfield.text() + " from " + thisdevice + " device?");
        if (result === true) {
            var thisfileid = thisfield.attr("data-gdbu_id");
            return gapi.client.drive.files.get({
                "fileId": thisfileid,
                "alt": "media"
            }).then(function(response) {
                    var jsonobject = JSON.parse(atob(response.body));
                    scan_restore(jsonobject);
                    var pass_dat = {
                        "jasobj": jsonobject,
                        "filename": thisfield.text(),
                        "thisfileid": thisfileid,
                        "thisdevice": thisdevice,
                        "thisdeviceid": thisfield.attr("data-device-id"),
                        "type": "gd"
                    };
                    restore_algo(pass_dat);
                },
                function(err) {
                    console.log(err)
                });
        }
    })
}

function scan_restore(jsonobject) {
    resd = {
        "pcnt": 0
    }
    var bpdat = jsonobject.bitrequest_bpdat;
    if (bpdat) {
        resd.sbu = true;
        var can_dec = (bpdat.dat) ? s_decode(bpdat) : s_decode(bpdat.datenc);
        resd.samebip = (bpdat.id == bipid);
        resd.bpdat = can_dec;
    }
}


function restore_algo(pass_dat) {
    var cbu = check_backup(pass_dat);
    if (cbu === false) {
        return false
    }
    if (resd.sbu) { // has seed backup
        if (resd.samebip === true) {
            // keep existing phrase
            restore_callback(pass_dat, false);
        } else {
            if (hasbip === true) {
                dphrase_dialog(pass_dat);
            } else {
                // import and check decode
                if (resd.bpdat) {
                    restore_callback(pass_dat, true);
                } else {
                    pin_dialog(pass_dat, "restore_callback");
                }
            }
        }
    } else {
        restore_callback(pass_dat, false);
    }
}

function restore_callback(pass_dat, newphrase) {
    var type = pass_dat.type;
    if (type) {
        if (type == "gd") {
            restore_callback_gd(pass_dat, newphrase);
        } else if (type == "file") {
            restore_callback_file(pass_dat, newphrase);
        } else {}
    }
}

function s_decode(pdat, phash) {
    var pinhash = (phash) ? phash : $("#pinsettings").data("pinhash");
    if (pinhash) {
        var keystring = ptokey(pinhash, pdat.id),
            decrypt = aes_dec(pdat.dat, keystring);
        if (decrypt) {
            var unquote = decrypt.replace(/['"]+/g, ""),
                dec = JSON.parse(atob(unquote)),
                pid = dec.pid;
            if (pid) {
                var dec_obj = {
                    "dat": unquote,
                    "id": pid
                }
                return dec_obj;
            }
        }
    }
    return false;
}

function pin_dialog(pass_dat, cb) {
    canceldialog();
    var pinsettings = $("#pinsettings").data(),
        current_timeout = pinsettings.timeout;
    if (current_timeout) {
        var timeleft = current_timeout - $.now();
        if (timeleft > 0) {
            lockscreen(current_timeout);
            return false;
        }
    }
    var content = $("<div class='formbox' id='pindialog'>\
		<h2><span class='icon-lock'></span>Enter your 4 digit pin</h2>\
		<div class='popnotify'></div>\
		<div class='popform'>\
			<input type='password' value=''/>\
			<input type='submit' class='submit' value='OK'/>\
		</div>\
	</div>").data({
        "pass_dat": pass_dat,
        "cb": cb
    });
    setTimeout(function() {
        popdialog(content, "alert", "triggersubmit");
    }, 700);
}

function submit_pin_dialog() {
    $(document).on("click", "#pindialog input.submit", function(e) {
        e.preventDefault();
        var thisinput = $(this).prev("input"),
            thisvalue = thisinput.val();
        if (thisvalue.length) {
            var dialog = $("#dialog"),
                pdat = $("#pindialog").data(),
                pass_dat = pdat.pass_dat
            jasobj = pass_dat.jasobj;
            if (jasobj) {
                var pbdat = jasobj.bitrequest_bpdat,
                    pbdat_eq = (pbdat.dat) ? pbdat : pbdat.datenc,
                    can_dec = s_decode(pbdat_eq, hashcode(thisvalue)),
                    pinsettings = $("#pinsettings").data();
                if (can_dec) {
                    resd.pcnt = 0;
                    var callback = pdat.cb;
                    clearpinlock();
                    if (callback) {
                        resd.bpdat = can_dec;
                        if (callback == "restore_callback") {
                            restore_callback(pass_dat, true);
                        } else if (callback == "bu_oldseed") {
                            bu_oldseed(pass_dat);
                        } else if (callback == "cs_callback") {
                            cs_callback(pass_dat);
                        }
                    }
                    notify("Succes!");
                } else {
                    if (resd.pcnt > 1) {
                        pinsettings.timeout = $.now() + 300000; // 5 minutes
                        topnotify("Max attempts exeeded");
                        var result = confirm("Restore without seed?");
                        if (result === true) {
                            restore_callback(pass_dat, false);
                        } else {}
                        resd.pcnt = 0;
                        canceldialog();
                    } else {
                        resd.pcnt = resd.pcnt + 1;
                    }
                    savesettings();
                    shake(dialog);
                    thisinput.val("");
                }
            }
        } else {
            popnotify("error", "Enter your 4 digit pin");
        }
        return false;
    })
}

function restore_cb_init_addresses() {
    localStorage.setItem("bitrequest_tp", $.now());
    var initdat = localStorage.getItem("bitrequest_init"),
        iodat = (initdat) ? JSON.parse(initdat) : {};
    delete iodat.bipv;
    localStorage.setItem("bitrequest_init", JSON.stringify(iodat));
}

function restore_callback_file(pass_dat, np) {
    var newphrase = (hasbip === true) ? np : true;
    restorestorage(pass_dat.jasobj, newphrase);
    rendersettings(["restore", "backup", "pinsettings"]); // exclude restore and backup settings
    var lastrestore = "last restore: <span class='icon-folder-open'>" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_') + "</span>";
    set_setting("restore", {
        "titlerestore": lastrestore,
        "fileused": pass_dat.filename,
        "device": "folder-open"
    }, lastrestore);
    savesettings();
    if (newphrase === true) {
        restore_cb_init_addresses();
    }
    notify("file restored");
    canceldialog();
    window.location.href = window.location.pathname + "?p=settings";
}

function restore_callback_gd(pass_dat, np) {
    var newphrase = (hasbip === true) ? np : true;
    restorestorage(pass_dat.jasobj, newphrase);
    rendersettings(["restore", "backup", "pinsettings"]); // exclude restore and backup settings
    var lastrestore = "last restore: <span class='icon-googledrive'>" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_') + "</span>";
    set_setting("restore", {
        "titlerestore": lastrestore,
        "fileused": pass_dat.filename,
        "device": pass_dat.thisdevice
    }, lastrestore);
    setTimeout(function() {
        savesettings();
        createfile(); // create new file from backup
        if (pass_dat.thisdeviceid == deviceid) {
            deletefile(pass_dat.thisfileid) // delete old backup file
        }
        if (newphrase === true) {
            restore_cb_init_addresses();
        }
        canceldialog();
        setTimeout(function() {
            window.location.href = window.location.pathname + "?p=settings";
        }, 300);
    }, 300);
}

function dphrase_dialog(pass_dat) {
    canceldialog();
    var content = $("<div class='formbox' id='importseedbox'>\
		<h2><span class='icon-warning' style='color:#B33A3A'></span>Warning. Backup contains different seed</h2>\
		<div class='popnotify'></div><br/>\
		<ul class='conf_options noselect'>\
			<li><div class='pick_conf'><div class='radio icon-radio-checked2'></div><span>Use seed from Backup</span></div></li>\
			<li><div class='pick_conf'><div class='radio icon-radio-unchecked'></div><span>Keep current seed</span></div></li>\
		</ul>\
		<div id='compare_seeds' class='ref'>Compare seeds</div>\
		<div id='compare_box'>\
			<div id='bu_sbox' class='swrap'>\
				<strong>Backup Seed</strong>\
				<div class='sbox'></div>\
			</div>\
			<div id='ext_sbox' class='swrap'>\
				<strong>Current Seed</strong>\
				<div class='sbox'></div>\
			</div>\
		</div>\
		<div class='popform'>\
			<input type='hidden' value='Use seed from Backup'/>\
			<input type='submit' class='submit' value='OK'/>\
		</div>\
	</div>").data(pass_dat);
    setTimeout(function() {
        popdialog(content, "alert", "triggersubmit");
    }, 700);
}

function submit_dphrase() {
    $(document).on("click", "#importseedbox input.submit", function(e) {
        e.preventDefault();
        var thistrigger = $(this),
            thisvalue = thistrigger.prev("input").val();
        if (thisvalue == "Use seed from Backup") {
            restore_bu_seed();
        } else if (thisvalue == "Keep current seed") {
            keep_current_seed();
        }
        return false;
    })
}

function keep_current_seed() {
    var result = confirm("Are you sure you want to keep your existing seed?");
    if (result === true) {
        var is_dialog = $("#importseedbox"),
            bu_dat = is_dialog.data();
        restore_callback(bu_dat, false);
    }
}

function restore_bu_seed() {
    var is_dialog = $("#importseedbox"),
        bu_dat = is_dialog.data();
    if (resd.bpdat) {} else {
        if (is_dialog.hasClass("verified")) {} else {
            pin_dialog(bu_dat, "bu_oldseed")
            return false;
        }
    }
    bu_oldseed(bu_dat);
}

function bu_oldseed(bu_dat) {
    canceldialog();
    manage_bip32({
        "type": "restore",
        "dat": bu_dat
    });
    var phrase = ls_phrase_obj(),
        words = phrase.pob;
    verify_phrase(words, 4);
    $("#seed_steps").removeClass("checked");
    $("#seed_step3").addClass("replace");
    seed_nav(3);
}

function compare_seeds() {
    $(document).on("click", "#compare_seeds", function() {
        var comparebox = $("#compare_box");
        if (comparebox.is(":visible")) {
            comparebox.slideUp(200);
        } else {
            var checktext = $("#ext_sbox .sbox").text();
            if (checktext.length < 20) {
                var is_dialog = $("#importseedbox"),
                    bu_dat = is_dialog.data(),
                    jasobj = bu_dat.jasobj;
                if (jasobj) {
                    var pbdat = jasobj.bitrequest_bpdat,
                        pbdat_eq = (pbdat.dat) ? pbdat : pbdat.datenc;
                    if (pbdat_eq) {
                        if (resd.bpdat) {} else {
                            var enterpin = prompt("Enter your 4 digit pin"),
                                can_dec = s_decode(pbdat_eq, hashcode(enterpin));
                            if (can_dec) {
                                resd.bpdat = can_dec;
                                is_dialog.addClass("verified");
                                cs_callback(true)
                            } else {
                                popnotify("error", "wrong pin");
                                shake(is_dialog);
                            }
                            return false;
                        }
                    }
                }
                cs_callback()
            } else {
                comparebox.slideDown(200);
            }
        }
    })
}

function cs_callback(pass) {
    var existing_so = ls_phrase_obj(),
        backup_so = ls_phrase_obj_parsed(resd.bpdat),
        compare = {
            "s1": existing_so.pob.slice(0, 3),
            "s2": backup_so.pob.slice(0, 3)
        };
    if (pass === true) {
        compare_seeds_callback(compare);
    } else {
        all_pinpanel({
            "func": compare_seeds_callback,
            "args": compare
        }, true)
    }
}

function compare_seeds_callback(compare) {
    $("#ext_sbox .sbox").text(compare.s1.join(" ") + " ...");
    $("#bu_sbox .sbox").text(compare.s2.join(" ") + " ...");
    $("#compare_box").slideDown(200);
}

function restorestorage(jsonobject, newphrase) {
    $.each(jsonobject, function(key, value) {
        if (key == "bitrequest_bpdat") {
            if (test_derive === true && newphrase === true) {
                if (resd.bpdat) {
                    localStorage.setItem(key, JSON.stringify(resd.bpdat));
                }
            }
        } else {
            localStorage.setItem(key, JSON.stringify(value));
        }
    });
    localStorage.removeItem("bitrequest_cashier");
    localStorage.removeItem("bitrequest_teamid");
    resd = {};
}

// Cache control
function cachecontrol() {
    $(document).on("click", "#cachecontrol", function() {
        var playstorelink = "https://play.google.com/store/apps/details?id=io.bitrequest.app",
            appstorelink = "https://itunes.apple.com/us/app/bitrequest/id1484815377?ls=1&mt=8",
            appstore_url = (is_android_app === true) ? playstorelink :
            (body.hasClass("ios")) ? appstorelink : playstorelink,
            lfu = (offline === true) ? "" : (supportsTouch === true) ? "<br/><a href='" + appstore_url + "' class='exit button'>Look for updates</a>" : "",
            content = "\
				<div class='formbox' id='cacheformbox'>\
					<h2 class='icon-database'>Cache control</h2>\
					<div class='popnotify'></div>\
					<div class='popform'>" + lfu + "<br/><br/><div class='button' id='clearcache'>Clear cache</div>\
						<br/><br/><div id='reset_settings' class='button'>\
							<span>Reset app data</span>\
						</div>\
					</div>\
					<div id='backupactions'>\
						<div class='cancel_dialog customtrigger'>CANCEL</div>\
					</div>\
				</div>";
        popdialog(content);
    })
}

function clearcache() {
    $(document).on("click", "#clearcache", function() {
        var result = confirm("Clear app cache?");
        if (result === true) {
            if (caches !== undefined) {
                caches.keys().then(function(names) {
                    if (names) {
                        $.each(names, function(i, value) {
                            caches.delete(value);
                        });
                        window.location.href = window.location.pathname + "?p=settings";
                    }
                });
            } else {
                topnotify("Unable to clear cache");
            }
            localStorage.removeItem("bitrequest_init");
        }
    })
}

function reset_coinsettings() {
    $(document).on("click", ".reset_cc_settings", function() {
        var thistrigger = $(this),
            currency = thistrigger.attr("data-currency");
        popdialog("<h2 class='icon-bin'>Reset " + currency + " settings?</h2>", "alert", "reset_coinsettings_function", thistrigger);
    })
}

function reset_coinsettings_function(trigger) {
    var currency = trigger.attr("data-currency"),
        result = confirm("Are you sure you want to reset " + currency + " settings?");
    if (result === true) {
        var coinsettings = getcoinsettings(currency);
        localStorage.setItem("bitrequest_" + currency + "_settings", JSON.stringify(coinsettings));
        append_coinsetting(currency, coinsettings, false);
        canceldialog();
        notify(currency + " settings reset to default");
    }
}

function reset_settings() {
    $(document).on("click", "#reset_settings", function() {
        canceldialog();
        all_pinpanel({
            "func": reset_settings_popup
        })
    })
}

function reset_settings_popup() {
    var content = "<h2 class='icon-bin'>Reset app data?</h2>\
	<p class='warning'>!! All data will be deleted. Make sure you have a backup.</p>\
	<div class='button' id='backup2'><span>Backup app data</span></div>";
    setTimeout(function() {
        popdialog(content, "alert", "reset_settings_function", $("#reset_settings"));
    }, 250);
}

function backupdatabasetrigger2() {
    $(document).on("click", "#backup2", function() {
        $(this).remove();
        backupdatabase();
    })
}

function reset_settings_function(trigger) {
    var result = confirm("Are you sure you want to reset? All data will be lost! Make sure you have a backup.");
    if (result === true) {
        for (key in localStorage) {
            if (key != "bitrequest_active" && key != "bitrequest_erc20tokens" && key != "bitrequest_symbols") {
                localStorage.removeItem(key);
            }
        }
        canceldialog();
        notify("App data deleted");
        location.reload(true);
    }
}

// Choose theme
function edittheme() {
    $(document).on("click", "#themesettings", function() {
        var theme = $("#themesettings").data("selected"),
            content = "\
			<div class='formbox' id='themeformbox'>\
				<h2 class='icon-paint-format'>Choose a theme</h2>\
				<div class='popnotify'></div>\
				<div class='popform'>\
					<div class='selectbox'>\
						<input type='text' value='" + theme + "' placeholder='Pick a theme' readonly='readonly' autofocus/>\
						<div class='selectarrows icon-menu2' data-pe='none'></div>\
						<div class='options'></div>\
					</div>\
					<input type='submit' class='submit' value='OK'/>\
				</div>\
				<div id='backupactions'>\
					<div id='submittheme' class='customtrigger'>CHOOSE THEME</div>\
					<div id='canceltheme' class='customtrigger'>CANCEL</div>\
				</div>\
			</div>";
        popthemedialog(content);
        $.getJSON(approot + "api/custom/?themes", function(data) {
            var options = $("#themeformbox").find(".options");
            $.each(data, function(key, value) {
                options.append("<span data-pe='none'>" + value + "</span>");
            });
        });
    })
}

function popthemedialog(content) {
    $("#dialogbody").append(content);
    body.addClass("themepu");
    $("#popup").addClass("active showpu");
}

function pickthemeselect() {
    $(document).on("click", "#themeformbox .selectbox > .options span", function() {
        $("link#theme").attr("href", "assets/styles/themes/" + $(this).text());
    })
}

function canceltheme() {
    $(document).on("click", "#canceltheme", function() {
        $("link#theme").attr("href", "assets/styles/themes/" + $("#themesettings").data("selected"));
        canceldialog();
    })
}

function submittheme() {
    $(document).on("click", "#submittheme", function() {
        var thisvalue = $("#themeformbox").find("input:first").val();
        set_setting("themesettings", {
            "selected": thisvalue
        }, thisvalue);
        canceldialog();
        notify("Data saved");
        savesettings();
    })
}

// CSV Export
function csvexport_trigger() {
    $(document).on("click", "#csvexport", function() {
        var rq_arr = JSON.parse(localStorage.getItem("bitrequest_requests")),
            archive_arr = JSON.parse(localStorage.getItem("bitrequest_archive")),
            has_requests = (rq_arr && !$.isEmptyObject(rq_arr)),
            has_archive = (archive_arr && !$.isEmptyObject(archive_arr));
        if (has_requests === true || has_archive === true) {
            var filename = "bitrequest_csv_export_" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_').replace(/\:/g, '_') + ".csv",
                show_archive = (has_requests === true) ? "false" : "true";
            content = "\
				<div class='formbox' id='exportcsvbox'>\
					<h2 class='icon-table'>Export CSV</h2>\
					<div class='popnotify'></div>\
					<div id='ad_info_wrap'>\
						<ul id='ecsv_options'>\
							<li class='escv_heading'>\
								<strong>Info</strong>\
							</li>\
							<li id='escv_from'>\
								<span>From</span><div class='switchpanel true global'><div class='switch'></div></div>\
							</li>\
							<li id='escv_desc'>\
								<span>Description</span><div class='switchpanel true global'><div class='switch'></div></div>\
							</li>\
							<li id='escv_address'>\
								<span>Receiving address</span><div class='switchpanel true global'><div class='switch'></div></div>\
							</li>\
							<li class='escv_heading'>\
								<strong>Status</strong>\
							</li>\
							<li id='escv_paid'>\
								<span>Paid</span><div class='switchpanel true global'><div class='switch'></div></div>\
							</li>\
							<li id='escv_ins'>\
								<span>Insufficient</span><div class='switchpanel true global'><div class='switch'></div></div>\
							</li>\
							<li id='escv_new'>\
								<span>New</span><div class='switchpanel false global'><div class='switch'></div></div>\
							</li>\
							<li id='escv_pending'>\
								<span>Pending</span><div class='switchpanel false global'><div class='switch'></div></div>\
							</li>\
							<li class='escv_heading'>\
								<strong>Type</strong>\
							</li>\
							<li id='escv_pos'>\
								<span>Point of Sale</span><div class='switchpanel true global'><div class='switch'></div></div>\
							</li>\
							<li id='escv_outgoing'>\
								<span>Outgoing</span><div class='switchpanel true global'><div class='switch'></div></div>\
							</li>\
							<li id='escv_incoming'>\
								<span>Incoming</span><div class='switchpanel false global'><div class='switch'></div></div>\
							</li>\
							<li class='noline'>\
								<strong></strong>\
							</li>\
							<li id='escv_archive'>\
								<span>Include archive</span><div class='switchpanel global " + show_archive + "'><div class='switch'></div></div>\
							</li>\
							<li id='escv_receipt'>\
								<span>Include receipt (PDF download)</span><div class='switchpanel false global'><div class='switch'></div></div>\
							</li>\
						</ul>\
					</div>\
					<div id='dialogcontent'>\
						<div id='custom_actions'>\
							<br/>\
							<a href='' download='" + filename + "' title='" + filename + "' id='trigger_csvexport' class='button icon-download' download>DOWNLOAD</a>\
						</div>\
					</div>\
				</div>\
				<div id='backupactions'>\
					<div id='share_csv' data-url='' class='util_icon icon-share2'></div>\
					<div id='backupcd'>CANCEL</div>\
				</div>";
            popdialog(content, "alert", "triggersubmit", null, true);
        } else {
            playsound(funk);
            notify("No requests to export");
        }
    })
}

function submit_csvexport() {
    $(document).on("click", "#trigger_csvexport", function(e) {
        if (body.hasClass("ios")) {
            e.preventDefault();
            notify("Downloads for IOS App unavailable at the moment");
            return false;
        }
        var thisnode = $(this),
            csv_encode = complile_csv(),
            d_url = "data:text/csv;charset=utf-16le;base64," + csv_encode;
        thisnode.attr("href", d_url);
        var title = thisnode.attr("title"),
            result = confirm("Download: " + title + "?");
        if (result === false) {
            e.preventDefault();
            return false;
        }
        canceldialog();
        notify("CSV Downloaded");
    })
}

function complile_csv() {
    var rq_arr = JSON.parse(localStorage.getItem("bitrequest_requests")),
        archive_arr = JSON.parse(localStorage.getItem("bitrequest_archive")),
        has_archive = (archive_arr && !$.isEmptyObject(archive_arr)),
        csv_arr = [],
        options_li = $("#exportcsvbox #ecsv_options"),
        op_from = options_li.find("li#escv_from .switchpanel"),
        op_desc = options_li.find("li#escv_desc .switchpanel"),
        op_address = options_li.find("li#escv_address .switchpanel"),
        op_paid = options_li.find("li#escv_paid .switchpanel"),
        op_ins = options_li.find("li#escv_ins .switchpanel"),
        op_new = options_li.find("li#escv_new .switchpanel"),
        op_pending = options_li.find("li#escv_pending .switchpanel"),
        op_pos = options_li.find("li#escv_pos .switchpanel"),
        op_outgoing = options_li.find("li#escv_outgoing .switchpanel"),
        op_incoming = options_li.find("li#escv_incoming .switchpanel"),
        op_receipt = options_li.find("li#escv_receipt .switchpanel"),
        op_archive = options_li.find("li#escv_archive .switchpanel"),
        incl_from = (op_from.hasClass("true")) ? true : false,
        incl_desc = (op_desc.hasClass("true")) ? true : false,
        incl_address = (op_address.hasClass("true")) ? true : false,
        incl_paid = (op_paid.hasClass("true")) ? true : false,
        incl_ins = (op_ins.hasClass("true")) ? true : false,
        incl_new = (op_new.hasClass("true")) ? true : false,
        incl_pending = (op_pending.hasClass("true")) ? true : false,
        incl_pos = (op_pos.hasClass("true")) ? true : false,
        incl_outgoing = (op_outgoing.hasClass("true")) ? true : false,
        incl_incoming = (op_incoming.hasClass("true")) ? true : false,
        incl_receipt = (op_receipt.hasClass("true")) ? true : false,
        incl_archive = (op_archive.hasClass("true")) ? true : false,
        rq_obj = (has_archive === true && incl_archive) ? rq_arr.concat(archive_arr) : rq_arr;
    $.each(rq_obj, function(i, val) {
        var request = {},
            payment = val.payment,
            address = val.address,
            amount = val.amount,
            uoa = val.uoa,
            status = val.status,
            rqname = (val.requestname) ? val.requestname : "",
            description = (val.requesttitle) ? val.requesttitle : "",
            type = val.requesttype,
            timestamp = val.timestamp,
            receivedamount = val.receivedamount,
            ccsymbol = val.currencysymbol,
            fiatvalue = val.fiatvalue,
            fiatcurrency = val.fiatcurrency,
            pts = val.paymenttimestamp,
            pdf_url = get_pdf_url(val),
            received_ts = (pts) ? short_date(pts) : "",
            txhash = (val.txhash) ? val.txhash : "";
        if (incl_paid === false && status == "paid") {} else if (incl_ins === false && status == "insufficient") {} else if (incl_new === false && status == "new") {} else if (incl_pending === false && status == "pending") {} else if (incl_pos === false && type == "local") {} else if (incl_outgoing === false && type == "outgoing") {} else if (incl_incoming === false && type == "incoming") {} else {
            if (incl_from) {
                request["from"] = rqname;
            }
            if (incl_desc) {
                request.description = description;
            }
            request.payment = payment;
            request.status = status;
            var rq_type = (type == "local") ? "point of sale" : type;
            request.type = rq_type;
            request.created = short_date(timestamp);
            request["request amount"] = amount + " " + uoa;
            var ra_val = (receivedamount) ? receivedamount + " " + ccsymbol : "";
            request["amount received"] = ra_val;
            var fv = (fiatvalue) ? fiatvalue.toFixed(2) + " " + fiatcurrency : "";
            request["fiat value"] = fv;
            request["received on"] = received_ts;
            if (incl_address) {
                request["receiving address"] = address;
            }
            request.txhash = txhash;
            if (incl_receipt) {
                request["PDF download (receipt)"] = pdf_url;
            }
            csv_arr.push(request);
        }
    });
    var csv_body = render_csv(csv_arr),
        b64_body = btoa(csv_body);
    return b64_body;

}

function render_csv(arr) {
    var header_arr = [],
        inner_header_arr = [],
        body_arr = [];
    $.each(arr[0], function(key, value) {
        inner_header_arr.push(key);
    });
    header_arr.push(inner_header_arr.join(","));
    $.each(arr, function(i, val) {
        var inner_body_arr = [];
        $.each(val, function(key, value) {
            var ctd = value.replace(/,/g, ".");
            inner_body_arr.push(ctd);
        });
        body_arr.push(inner_body_arr.join(","));
    });
    var doc_arr = header_arr.concat(body_arr);
    return doc_arr.join("\n");
}

function share_csv() {
    $(document).on("click", "#share_csv", function() {
        var csv_encode = complile_csv(),
            result = confirm("Share csv export?");
        if (result === true) {
            loader(true);
            loadertext("generate system backup");
            var accountname = $("#accountsettings").data("selected");
            api_proxy({
                "custom": "system_bu",
                "api_url": true,
                "proxy": true,
                "params": {
                    "url": csv_encode,
                    "account": btoa(accountname)
                }
            }).done(function(e) {
                var br_cache = e.ping.br_cache,
                    filetime = br_cache.created_utc,
                    filetimesec = (filetime) ? filetime * 1000 : $.now(),
                    filetime_format = new Date(filetimesec).toLocaleString(language),
                    sharedtitle = "CSV Export " + accountname + " (" + filetime_format + ")";
                shorten_url(sharedtitle, approot + "?p=settings&csv=" + br_cache.filename, approot + "/img/system_backup.png", true);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                closeloader();
            });
        }
    })
}

function check_csvexport() {
    var url_params = geturlparameters();
    if (url_params.p == "settings") {
        var csv = url_params.csv;
        if (csv) {
            api_proxy({
                "custom": "get_system_bu",
                "api_url": true,
                "proxy": true,
                "params": csv
            }).done(function(e) {
                var ping = e.ping;
                if (ping) {
                    var br_cache = e.ping.br_cache,
                        server_time = br_cache.utc_timestamp,
                        filetime = br_cache.created_utc,
                        filetimesec = (filetime) ? filetime * 1000 : $.now(),
                        filetime_format = new Date(filetimesec).toLocaleString(language),
                        br_result = e.ping.br_result,
                        base64 = br_result.base64,
                        account = atob(br_result.account),
                        sharedtitle = "CSV Export " + account + " (" + filetime_format + ")",
                        bu_date = filetime_format.replace(/\s+/g, '_').replace(/\:/g, '_'),
                        cache_time = br_cache.cache_time,
                        expires_in = (filetime + cache_time) - server_time,
                        filename = "bitrequest_csv_export_" + encodeURIComponent(account) + "_" + bu_date + ".csv",
                        cd = countdown(expires_in * 1000),
                        cd_format = countdown_format(cd),
                        cf_string = (cd_format) ? "Expires in " + cd_format : "File expired",
                        content = "\
						<div class='formbox' id='system_backupformbox'>\
							<h2 class='icon-download'>CSV Export</h2>\
							<div class='popnotify'></div>\
							<div id='dialogcontent'>\
								<h1>" + sharedtitle + "</h1>\
								<div class='error' style='margin-top:1em;padding:0.3em 1em'>" + cf_string + "</div>\
								<div id='changelog'>\
									<div id='custom_actions'>\
										<br/>\
										<a href='data:text/csv;charset=utf-16le;base64," + base64 + "' download='" + filename + "' title='" + filename + "' id='trigger_csvdownload' class='button icon-download' data-date='" + bu_date + "' data-lastbackup='" + filename + "' download>DOWNLOAD CSV</a>\
									</div>\
								</div>\
							</div>\
						</div>\
						<div id='backupactions'>\
							<div id='backupcd'>CANCEL</div>\
						</div>";
                    popdialog(content, "alert", "triggersubmit", null, true);
                } else {
                    systembu_expired();
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                systembu_expired();
            });
        }
    }
}

function submit_csvdownload() {
    $(document).on("click", "#trigger_csvdownload", function(e) {
        if (body.hasClass("ios")) {
            e.preventDefault();
            notify("Downloads for IOS App unavailable at the moment");
            return false;
        }
        var thisnode = $(this),
            href = thisnode.attr("href"),
            title = thisnode.attr("title"),
            result = confirm("Download: " + title + "?");
        if (result === false) {
            e.preventDefault();
            return false;
        }
        canceldialog();
        notify("CSV Downloaded");
    })
}

// Url shortener
function urlshortener() {
    $(document).on("click", "#url_shorten_settings", function() {
        var us_settings = $("#url_shorten_settings"),
            us_data = us_settings.data(),
            us_source = us_data.selected,
            us_val = (us_source == "inactive") ? "firebase" : us_source,
            firebase_apikey = (us_data.fbapikey) ? us_data.fbapikey : "",
            bitly_accestoken = (us_data.bitly_at) ? us_data.bitly_at : "",
            us_active = us_data.us_active,
            us_is_active = (us_active == "active"),
            shformclass = (us_is_active === true) ? "" : " hide",
            firebase_class = (us_val == "bitly") ? " hide" : "",
            bitly_class = (us_val == "firebase") ? " hide" : "",
            headericon = (us_val == "firebase") ? "icon-firebase" : "icon-bitly",
            content = "\
			<div class='formbox' id='usformbox'>\
				<h2 class='icon-link'>Choose URL shortener</h2>\
				<div class='popnotify'></div>\
				<div id='toggle_urlshortener' class='clearfix'>\
					<h3 class='" + headericon + "'>Enable url shortener" + switchpanel(us_is_active, " global") + "</h3>\
				</div>\
				<div class='popform" + shformclass + "' data-currentapi='" + us_val + "'>\
					<div class='selectbox'>\
						<input type='text' value='" + us_val + "' placeholder='Choose URL shortener' readonly='readonly'/>\
						<div class='selectarrows icon-menu2' data-pe='none'></div>\
						<div class='options'>\
							<span data-pe='none'>firebase</span>\
							<span data-pe='none'>bitly</span>\
						</div>\
					</div>\
					<input type='text' value='" + firebase_apikey + "' placeholder='Firebase API key' class='firebase_api_input" + firebase_class + "'data-apikey='" + firebase_apikey + "' data-checkchange='" + firebase_apikey + "'/>\
					<input type='text' value='" + bitly_accestoken + "' placeholder='Bitly API key' class='bitly_api_input" + bitly_class + "'data-apikey='" + bitly_accestoken + "' data-checkchange='" + bitly_accestoken + "'/>\
					<input type='submit' class='submit' value='OK'/>\
				</div>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
    })
}

function togglebl() {
    $(document).on("mouseup", "#toggle_urlshortener .switchpanel", function(e) {
        var thispanel = $(this),
            thisform = $("#usformbox .popform"),
            us_state,
            us_title;
        if (thispanel.hasClass("true")) {
            var thisinput = thisform.find("input:first"),
                thisvalue = thisinput.val(),
                us_state = "active",
                us_title = thisvalue;
            thisform.slideDown(300);
        } else {
            var result = confirm("Are you sure you want to disable url shortening? This can affect the workflow of this app");
            if (result === true) {
                var us_state = "inactive",
                    us_title = "inactive";
                thisform.slideUp(300);
            } else {
                thispanel.addClass("true").removeClass("false");
                e.preventDefault();
                return false;
            }
        }
        set_setting("url_shorten_settings", {
            "selected": us_title,
            "us_active": us_state
        }, us_title);
        savesettings();
        thispanel.addClass("us_changed");
    })
}

function pick_urlshortener_select() {
    $(document).on("click", "#usformbox .selectbox > .options span", function() {
        var thisselect = $(this),
            thisvalue = thisselect.text(),
            thisform = thisselect.closest(".popform"),
            firebase_api_input = thisform.find("input.firebase_api_input"),
            bitly_api_input = thisform.find("input.bitly_api_input"),
            dialogheader = $("#usformbox h3");
        if (thisvalue == "firebase") {
            firebase_api_input.removeClass("hide");
            bitly_api_input.addClass("hide");
            dialogheader.attr("class", "icon-firebase");
        } else {
            firebase_api_input.addClass("hide");
            bitly_api_input.removeClass("hide");
            dialogheader.attr("class", "icon-bitly")
        }
    })
}

function submit_urlshortener_select() {
    $(document).on("click", "#usformbox input.submit", function(e) {
        e.preventDefault();
        var thisform = $(this).closest(".popform"),
            currentapi = thisform.attr("data-currentapi"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            firebase_api_input = thisform.find("input.firebase_api_input"),
            bitly_api_input = thisform.find("input.bitly_api_input"),
            firebase_apival = firebase_api_input.val(),
            bitly_apival = bitly_api_input.val(),
            firebase_checkchange = firebase_api_input.attr("data-checkchange"),
            bitly_checkchange = bitly_api_input.attr("data-checkchange"),
            toggle_urlshortener = $("#toggle_urlshortener .switchpanel");
        if (thisvalue == currentapi && firebase_checkchange == firebase_apival && bitly_checkchange == bitly_apival && !toggle_urlshortener.hasClass("us_changed")) { // check for changes
            canceldialog();
            return false;
        } else {
            var us_active = (toggle_urlshortener.hasClass("true"));
            if (thisvalue != currentapi || toggle_urlshortener.hasClass("us_changed")) {
                var us_state = (us_active === true) ? "active" : "inactive",
                    us_title = (us_active === true) ? thisvalue : "inactive";
                set_setting("url_shorten_settings", {
                    "selected": us_title,
                    "us_active": us_state
                }, us_title);
            }
            if (us_active === true) {
                var current_firebase_key = firebase_api_input.attr("data-apikey"),
                    current_bitly_key = bitly_api_input.attr("data-apikey");
                if (firebase_apival != current_firebase_key) {
                    if (firebase_checkchange == firebase_apival) {
                        popnotify("error", "Enter a valid API key");
                    } else {
                        firebase_api_input.attr("data-checkchange", firebase_apival);
                        checkapikey("firebase", firebase_apival, true)
                    }
                } else if (bitly_apival != current_bitly_key) {
                    if (bitly_checkchange == bitly_apival) {
                        popnotify("error", "Enter a valid API key");
                    } else {
                        bitly_api_input.attr("data-checkchange", bitly_apival);
                        checkapikey("bitly", bitly_apival, true)
                    }
                } else {
                    canceldialog();
                    notify("Data saved");
                    savesettings();
                }
            } else {
                canceldialog();
                notify("Data saved");
                savesettings();
            }
        }
    })
}

// Cryptocurrency price api
function editccapi() {
    $(document).on("click", "#cmcapisettings", function() {
        var cc_apisettings = $("#cmcapisettings").data(),
            ccapisrc = cc_apisettings.selected,
            cmcapikey = cc_apisettings.cmcapikey,
            cmcapikeyval = (cc_apisettings.cmcapikey) ? cc_apisettings.cmcapikey : "",
            cmcapikeyclass = (ccapisrc == "coinmarketcap") ? "" : "hide",
            options = "<span data-pe='none'>" + apilists.crypto_price_apis.join("</span><span data-pe='none'>") + "</span>",
            content = "\
			<div class='formbox' id='ccapiformbox'>\
				<h2 class='icon-key'>Choose API</h2>\
				<div class='popnotify'></div>\
				<div class='popform' data-currentapi='" + ccapisrc + "'>\
					<div class='selectbox'>\
						<input type='text' value='" + ccapisrc + "' placeholder='Choose API' readonly='readonly'/>\
						<div class='selectarrows icon-menu2' data-pe='none'></div>\
						<div class='options'>" + options + "</div>\
					</div>\
					<input type='text' value='" + cmcapikeyval + "' placeholder='API key' class='" + cmcapikeyclass + "' data-apikey='" + cmcapikeyval + "' data-checkchange='" + cmcapikey + "'/>\
					<input type='submit' class='submit' value='OK'/>\
				</div>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
    })
}

function pickcmcapiselect() {
    $(document).on("click", "#ccapiformbox .selectbox > .options span", function() {
        var thisselect = $(this),
            thisvalue = thisselect.text(),
            thisform = thisselect.closest(".popform"),
            api_input = thisform.find("input:nth-child(2)");
        if (thisvalue == "coinmarketcap") {
            api_input.removeClass("hide");
        } else {
            api_input.addClass("hide");
        }
    })
}

function submitccapi() {
    $(document).on("click", "#ccapiformbox input.submit", function(e) {
        e.preventDefault();
        var thisform = $(this).closest(".popform"),
            currentapi = thisform.attr("data-currentapi"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            api_input = thisform.find("input:nth-child(2)"),
            apival = api_input.val(),
            checkchange = api_input.attr("data-checkchange");
        if (thisvalue == currentapi && checkchange == apival) {
            canceldialog();
            return false;
        } else {
            if (thisvalue != currentapi) {
                set_setting("cmcapisettings", {
                    "selected": thisvalue
                }, thisvalue);
            }
            if (apival !== api_input.attr("data-apikey")) {
                if (checkchange == apival) {
                    popnotify("error", "Enter a valid API key");
                } else {
                    api_input.attr("data-checkchange", apival);
                    checkapikey("coinmarketcap", apival, true)
                }
            } else {
                canceldialog();
                notify("Data saved");
                savesettings();
            }
        }
    })
}

// Fiat price api
function editfiatxrapi() {
    $(document).on("click", "#fiatapisettings", function() {
        var thisdata = $(this).data(),
            fiatxrapisrc = thisdata.selected,
            fiatxrapikey = (thisdata.fxapikey) ? thisdata.fxapikey : "",
            options = "<span data-pe='none'>" + apilists.fiat_price_apis.join("</span><span data-pe='none'>") + "</span>",
            fiatxrapikeyclass = (fiatxrapisrc == "fixer") ? "" : "hide",
            content = "\
			<div class='formbox' id='fiatxrapiformbox'>\
				<h2 class='icon-key'>Choose API</h2>\
				<div class='popnotify'></div>\
				<div class='popform' data-currentapi='" + fiatxrapisrc + "'>\
					<div class='selectbox'>\
						<input type='text' value='" + fiatxrapisrc + "' placeholder='Choose API' readonly='readonly'/>\
						<div class='selectarrows icon-menu2' data-pe='none'></div>\
						<div class='options'>" + options + "</div>\
					</div>\
					<input type='text' value='" + fiatxrapikey + "' placeholder='API key' class='" + fiatxrapikeyclass + "' data-apikey='" + fiatxrapikey + "' data-checkchange='" + fiatxrapikey + "'/>\
					<input type='submit' class='submit' value='OK'/>\
				</div>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
    })
}

function pickfiatxrapiselect() {
    $(document).on("click", "#fiatxrapiformbox .selectbox > .options span", function() {
        var thisselect = $(this),
            thisvalue = thisselect.text(),
            thisform = thisselect.closest(".popform"),
            api_input = thisform.find("input:nth-child(2)");
        if (thisvalue == "fixer") {
            api_input.removeClass("hide");
        } else {
            api_input.addClass("hide");
        }
    })
}

function submitfiatxrapi() {
    $(document).on("click", "#fiatxrapiformbox input.submit", function(e) {
        e.preventDefault();
        var thisform = $(this).closest(".popform"),
            currentapi = thisform.attr("data-currentapi"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            api_input = thisform.find("input:nth-child(2)"),
            apival = api_input.val(),
            checkchange = api_input.attr("data-checkchange");
        if (thisvalue == currentapi && checkchange == apival) {
            canceldialog();
            return false;
        } else {
            if (thisvalue != currentapi) {
                set_setting("fiatapisettings", {
                    "selected": thisvalue
                }, thisvalue);
            }
            if (apival !== api_input.attr("data-apikey")) {
                if (checkchange == apival) {
                    popnotify("error", "Enter a valid API key");
                } else {
                    api_input.attr("data-checkchange", apival);
                    checkapikey("fixer", apival, true)
                }
            } else {
                canceldialog();
                notify("Data saved");
                savesettings();
            }
        }
    })
}

// Api Proxy
function pick_api_proxy() {
    $(document).on("click", "#api_proxy", function() {
        var thisnode = $(this),
            thisdata = thisnode.data(),
            proxies = proxy_list, // (bitrequest_config.js)
            current_proxy = thisdata.selected,
            custom_proxies = thisdata.custom_proxies,
            content = "\
			<div class='formbox' id='proxyformbox'>\
				<h2 class='icon-sphere'>API Proxy</h2>\
				<div class='popnotify'></div>\
				<div class='popform validated'>\
					<div class='selectbox'>\
						<input type='text' value='" + current_proxy + "' placeholder='https://...' id='proxy_select_input' readonly='readonly'/>\
						<div class='selectarrows icon-menu2' data-pe='none'></div>\
						<div class='options'></div>\
					</div>\
					<div id='rpc_input_box'>\
						<h3 class='icon-plus'>Add API Proxy</h3>\
						<div id='proxy_info'>\
							Control your own keys and request limits:<br/><br/>\
							<strong>1.</strong> Host the <a href='https://github.com/bitrequest/bitrequest.github.io/tree/master/api' target='blank' class='exit'>API proxy folder</a> on your server (php required).<br/>\
							<strong>2.</strong> Enter your API keys in 'keys.php'.<br/>\
							<strong>3.</strong> Enter your server address below.<br/><br/>\
						</div>\
						<div id='rpc_input'>\
							<input type='text' value='' placeholder='https://...' id='proxy_url_input'/>\
							<div class='c_stat icon-wifi-off'></div>\
							<div class='c_stat icon-connection'></div>\
						</div>\
					</div>\
					<input type='submit' class='submit' value='OK'/>\
				</div>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
        if (phpsupportglobal === true) {
            var fixed_url = complete_url(thishostname + location.pathname);
            if ($.inArray(fixed_url, proxies) === -1) {
                proxies.push(fixed_url);
            }
        }
        if ($.inArray(hosted_proxy, proxies) === -1) { // always keey default proxy
            proxies.push(hosted_proxy);
        }
        var optionlist = $("#proxyformbox").find(".options"),
            api_info = check_api("nano", false),
            selected = api_info.data,
            nano_node = selected.url;
        $.each(proxies, function(key, value) {
            var selected = (value == current_proxy);
            test_append_proxy(optionlist, key, value, selected, true, nano_node);
        });
        $.each(custom_proxies, function(key, value) {
            var selected = (value == current_proxy);
            test_append_proxy(optionlist, key, value, selected, false, nano_node);
        });
    })
}

function test_append_proxy(optionlist, key, value, selected, dfault, nano_node) { // make test api call
    api_proxy({
        "cachetime": 25,
        "cachefolder": "1h",
        "proxy": true,
        "proxy_url": value,
        "api_url": nano_node,
        "params": {
            "method": "POST",
            "cache": true,
            "data": JSON.stringify({
                "action": "version"
            })
        }
    }).done(function(e) {
        var api_result = br_result(e);
        if (api_result.proxy === true) {
            var result = api_result.result;
            if (result && result.rpc_version) {
                proxy_option_li(optionlist, true, key, value, selected, dfault);
            } else {
                proxy_option_li(optionlist, false, key, value, selected, dfault);
            }
        } else {
            proxy_option_li(optionlist, false, key, value, selected, dfault);
        }
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
        proxy_option_li(optionlist, false, key, value, selected, dfault);
    });
}

function proxy_option_li(optionlist, live, key, value, selected, dfault) {
    var liveclass = (live === true) ? " live" : " offline",
        icon = (live === true) ? "connection" : "wifi-off",
        default_class = (dfault === true) ? " default" : "",
        option = $("<div class='optionwrap" + liveclass + default_class + "' style='display:none' data-pe='none'><span data-value='" + value + "' data-pe='none'>" + value + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    optionlist.append(option);
    option.slideDown(500);
}

function submit_proxy() {
    $(document).on("click", "#proxyformbox input.submit", function(e) {
        e.preventDefault();
        var proxyformbox = $("#proxyformbox"),
            selectval = proxyformbox.find("#proxy_select_input").val(),
            customval = proxyformbox.find("#proxy_url_input").val();
        if (customval.length > 0) {
            test_custom_proxy(customval);
            return false;
        } else {
            var set_proxy = $("#api_proxy").data("selected");
            if (selectval == set_proxy) {
                canceldialog();
            } else {
                set_setting("api_proxy", {
                    "selected": selectval
                }, selectval);
                canceldialog();
                notify("Data saved");
                savesettings();
                // Re init app
                localStorage.removeItem("bitrequest_init");
            }
        }
    })
}

function hide_custom_proxy_field() {
    $(document).on("click", "#proxyformbox .selectarrows", function() {
        var proxyformbox = $("#proxyformbox"),
            options = $("#proxyformbox").find(".options .optionwrap"),
            select_inputval = proxyformbox.find("#proxy_select_input").val();
        custom_input = proxyformbox.find("#proxy_url_input");
        options.each(function() {
            var this_option = $(this),
                to_val = this_option.find("> span").attr("data-value");
            if (to_val == select_inputval) {
                this_option.hide();
            } else {
                this_option.show();
            }
        });
        custom_input.val("");
    });
}

function test_custom_proxy(value) { // make test api call
    var proxy_node = $("#api_proxy"),
        proxy_node_data = proxy_node.data(),
        default_proxies = proxy_node_data.proxies,
        custom_proxies = proxy_node_data.custom_proxies,
        fixed_url = complete_url(value);
    if ($.inArray(fixed_url, custom_proxies) !== -1 || $.inArray(fixed_url, default_proxies) !== -1) {
        popnotify("error", "Proxy already added");
        return false;
    } else {
        if (value.indexOf("http") > -1) {
            api_proxy({
                "cachetime": 25,
                "cachefolder": "1h",
                "proxy": true,
                "proxy_url": fixed_url,
                "api_url": "https://www.bitrequest.app:8020",
                "params": {
                    "method": "POST",
                    "cache": true,
                    "data": JSON.stringify({
                        "action": "version"
                    })
                }
            }).done(function(e) {
                var api_result = br_result(e);
                if (api_result.proxy === true) {
                    var result = api_result.result;
                    if (result && result.rpc_version) {
                        custom_proxies.push(fixed_url);
                        set_setting("api_proxy", {
                            "selected": fixed_url,
                            "custom_proxies": custom_proxies
                        }, fixed_url);
                        canceldialog();
                        notify("Data saved");
                        savesettings();
                        // Re init app
                        localStorage.removeItem("bitrequest_init");
                        setTimeout(function() {
                            $("#apikeys").trigger("click");
                        }, 800);
                    } else {
                        popnotify("error", "Unable to send Post request from " + fixed_url);
                    }
                } else {
                    popnotify("error", "Unable to connect");
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                popnotify("error", "Unable to connect");
            });
        } else {
            popnotify("error", "Invalid url");
        }
    }
    return false;
}

function remove_proxy() {
    $(document).on("click", "#proxyformbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        var proxy_node = "api_proxy",
            custom_proxies = get_setting(proxy_node, "custom_proxies");
        if (custom_proxies.length > 0) {
            var thisoption = $(this).closest(".optionwrap"),
                default_node = (thisoption.hasClass("default")),
                thisval = thisoption.find("> span").attr("data-value");
            if (default_node === true) {
                playsound(funk);
                topnotify("Cannot delete default node");
            } else {
                var result = confirm("Are you sure you want to delete '" + thisval + "'");
                if (result === true) {
                    var new_array = $.grep(custom_proxies, function(value) {
                        return value != thisval;
                    });
                    thisoption.slideUp(500, function() {
                        $(this).remove();
                    });
                    set_setting(proxy_node, {
                        "custom_proxies": new_array
                    });
                    notify("Proxy removed");
                    savesettings();
                }
            }
        }
        return false;
    })
}

function complete_url(url) {
    var cv1 = (url.indexOf("http") > -1) ? url.split("://").pop() : url,
        cv2 = "https://" + cv1;
    return (cv2.substr(-1) != "/") ? cv2 + "/" : cv2;
}

// API keys
function apikeys() {
    $(document).on("click", "#apikeys", function() {
        var ak_data = $(this).data(),
            bitlykey = (ak_data.bitly) ? ak_data.bitly : "",
            firebasekey = (ak_data.firebase) ? ak_data.firebase : "",
            cmckey = (ak_data.coinmarketcap) ? ak_data.coinmarketcap : "",
            fixerkey = (ak_data.fixer) ? ak_data.fixer : "",
            blockcypherkey = (ak_data.blockcypher) ? ak_data.blockcypher : "",
            ethplorerkey = (ak_data.ethplorer) ? ak_data.ethplorer : "",
            blockchairkey = (ak_data.blockchair) ? ak_data.blockchair : "",
            infurakey = (ak_data.infura) ? ak_data.infura : "",
            amberdatakey = (ak_data.amberdata) ? ak_data.amberdata : "",
            currencylayerkey = (ak_data.currencylayer) ? ak_data.currencylayer : "";
        content = "\
			<div class='formbox' id='apikeyformbox'>\
				<h2 class='icon-key'>API keys</h2>\
				<div class='popnotify'></div>\
				<div class='popform'>\
					<h3>Coinmarketcap</h3>\
					<input type='text' value='" + cmckey + "' placeholder='Coinmarketcap API key' data-ref='coinmarketcap' data-checkchange='" + cmckey + "' class='ak_input'/>\
					<h3>Fixer</h3>\
					<input type='text' value='" + fixerkey + "' placeholder='Fixer API key' data-ref='fixer' data-checkchange='" + fixerkey + "' class='ak_input'/>\
					<h3>Currencylayer</h3>\
					<input type='text' value='" + currencylayerkey + "' placeholder='Currencylayer API key' data-ref='currencylayer' data-checkchange='" + currencylayerkey + "' class='ak_input'/>\
					<h3>Blockcypher</h3>\
					<input type='text' value='" + blockcypherkey + "' placeholder='Blockcypher API key' data-ref='blockcypher' data-checkchange='" + blockcypherkey + "' class='ak_input'/>\
					<h3>Ethplorer</h3>\
					<input type='text' value='" + ethplorerkey + "' placeholder='Ethplorer API key' data-ref='ethplorer' data-checkchange='" + ethplorerkey + "' class='ak_input'/>\
					<h3>Blockchair</h3>\
					<input type='text' value='" + blockchairkey + "' placeholder='Blockchair API key' data-ref='blockchair' data-checkchange='" + blockchairkey + "' class='ak_input'/>\
					<h3>Infura</h3>\
					<input type='text' value='" + infurakey + "' placeholder='Infura Project ID' data-ref='infura' data-checkchange='" + infurakey + "' class='ak_input'/>\
					<h3>Amberdata</h3>\
					<input type='text' value='" + amberdatakey + "' placeholder='Amberdata API key' data-ref='amberdata' data-checkchange='" + amberdatakey + "' class='ak_input'/>\
					<h3>Bitly</h3>\
					<input type='text' value='" + bitlykey + "' placeholder='Bitly access token' data-ref='bitly' data-checkchange='" + bitlykey + "' class='ak_input'/>\
					<h3>Firebase</h3>\
					<input type='text' value='" + firebasekey + "' placeholder='Firebase API key' data-ref='firebase' data-checkchange='" + firebasekey + "' class='ak_input'/>\
					<input type='submit' class='submit' value='OK' id='apisubmit'/>\
				</div>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
    })
}

function api_input_change() {
    $(document).on("input", "#apikeyformbox input.ak_input", function() {
        $(this).addClass("changed");
    });
}

function submitapi() {
    $(document).on("click", "#apisubmit", function(e) {
        e.preventDefault();
        $("#apikeyformbox").addClass("pass");
        var allinputs = $("#apikeyformbox input.ak_input"),
            ak_input = allinputs.filter(function() {
                var this_input = $(this);
                return this_input.hasClass("changed") && this_input.val() != this_input.attr("data-checkchange");
            }),
            inputcount = ak_input.length;
        if (inputcount === 0) {
            if (allinputs.hasClass("input_error")) {
                popnotify("error", "Invalid API key");
                notify("Invalid API key");
                $(".input_error").select();
                return false;
            } else {
                canceldialog();
            }
        } else {
            ak_input.each(function(index) {
                var thisindex = index + 1,
                    thisinput = $(this),
                    thisvalue = thisinput.val(),
                    thisref = thisinput.attr("data-ref"),
                    lastinput = (inputcount === thisindex);
                checkapikey(thisref, thisvalue, lastinput);
            });
        }
    })
}

function checkapikey(thisref, apikeyval, lastinput) {
    var token_data = (thisref == "firebase") ? {
            keylength: 20,
            payload: "shortLinks?key="
        } :
        (thisref == "coinmarketcap") ? {
            keylength: 20,
            payload: "cryptocurrency/quotes/latest?id=1&CMC_PRO_API_KEY="
        } :
        (thisref == "fixer") ? {
            keylength: 20,
            payload: "symbols?access_key="
        } :
        (thisref == "blockcypher") ? {
            keylength: 6,
            payload: "btc/main/addrs/1rundZJCMJhUiWQNFS5uT3BvisBuLxkAp/meta?token="
        } :
        (thisref == "ethplorer") ? {
            keylength: 6,
            payload: "getTop?apiKey="
        } :
        (thisref == "blockchair") ? {
            keylength: 6,
            payload: "stats?key="
        } :
        (thisref == "currencylayer") ? {
            keylength: 6,
            payload: "live?access_key="
        } :
        (thisref == "amberdata") ? {
            keylength: 6,
            payload: "blockchains/metrics/latest"
        } : null,
        keylength = (token_data) ? token_data.keylength : 6,
        payload = (token_data) ? token_data.payload : null;
    json_check_apikey(keylength, thisref, payload, apikeyval, lastinput);
}

function json_check_apikey(keylength, thisref, payload, apikeyval, lastinput) {
    if (apikeyval.length > keylength) {
        if (thisref == "infura") {
            var infura_testurl = main_eth_node + apikeyval;
            if (web3 === undefined) {
                web3 = new Web3(Web3.givenProvider || infura_testurl);
            }
            if (web3) {
                if (web3.currentProvider.host == infura_testurl) {} else {
                    web3.setProvider(infura_testurl);
                }
                web3.eth.getTransaction("0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", function(err_1, data_1) { // random tx
                    if (err_1) {
                        api_fail(thisref, apikeyval);
                    } else {
                        if (data_1) {
                            update_api_attr(thisref, apikeyval, lastinput);
                        } else {
                            api_fail(thisref, apikeyval);
                        }
                    }
                });
            } else {
                api_fail(thisref, apikeyval);
            }
        } else {
            var api_data = get_api_data(thisref),
                base_url = api_data.base_url,
                method = (thisref == "firebase") ? "POST" : "GET",
                proxy = (thisref == "coinmarketcap") ? true : true,
                params = {
                    "method": method,
                    "cache": true
                },
                search = (thisref == "amberdata") ? payload :
                payload + apikeyval,
                api_url = (thisref == "bitly") ? "https://api-ssl.bitly.com/v3/shorten?access_token=" + apikeyval + "&longUrl=http%3A%2F%2Fgoogle.com%2F" :
                base_url + search;
            if (thisref == "firebase") {
                params.data = {
                    "longDynamicLink": firebase_shortlink + "?link=" + approot + "?p=request"
                }
            } else if (thisref == "amberdata") {
                params.headers = {
                    "x-amberdata-blockchain-id": "ethereum-mainnet",
                    "x-api-key": apikeyval
                }
            }
            var postdata = {
                "api": thisref,
                "search": search,
                "cachetime": 0,
                "cachefolder": "1h",
                "proxy": proxy,
                "api_url": api_url,
                "params": params
            }
            api_proxy(postdata).done(function(e) {
                var data = br_result(e).result;
                if (thisref == "bitly" && data.status_code === 500) {
                    api_fail(thisref, apikeyval);
                    return false;
                } else if (thisref == "coinmarketcap" && data.status.error_code === 1001) {
                    api_fail(thisref, apikeyval);
                    return false;
                } else if (thisref == "fixer" && data.success === false) {
                    if (data.error.code === 101) {
                        api_fail(thisref, apikeyval);
                    } else {
                        notify("API call error");
                        var content = "<h2 class='icon-blocked'>Api call failed</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "alert", "canceldialog");
                    }
                    return false;
                } else if (thisref == "blockcypher") {
                    if (data.data) {
                        update_api_attr(thisref, apikeyval, lastinput);
                    } else {
                        api_fail(thisref, apikeyval);
                    }
                    return false;
                } else if (thisref == "ethplorer") {
                    if (data.tokens) {
                        update_api_attr(thisref, apikeyval, lastinput);
                    } else {
                        if (data.error.code === 1) {
                            api_fail(thisref, apikeyval);
                        } else {
                            notify("API call error");
                            var content = "<h2 class='icon-blocked'>Api call failed</h2><p class='doselect'>" + data.error + "</p>";
                            popdialog(content, "alert", "canceldialog");
                        }
                    }
                    return false;
                } else if (thisref == "blockchair") {
                    var context_code = data.context.code;
                    if (context_code === 200) {
                        update_api_attr(thisref, apikeyval, lastinput);
                    } else if (context_code === 402) {
                        api_fail(thisref, apikeyval);
                    } else {
                        notify("API call error");
                        var content = "<h2 class='icon-blocked'>Api call failed</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "alert", "canceldialog");
                    }
                    return false;
                } else if (thisref == "currencylayer" && data.success === false) {
                    if (data.error.code === 101) {
                        api_fail(thisref, apikeyval);
                    } else {
                        notify("API call error");
                        var content = "<h2 class='icon-blocked'>Api call failed</h2><p class='doselect'>" + data.error + "</p>";
                        popdialog(content, "alert", "canceldialog");
                    }
                    return false;
                } else if (thisref == "amberdata" && data.status === 401) {
                    api_fail(thisref, apikeyval);
                    return false;
                } else {
                    update_api_attr(thisref, apikeyval, lastinput);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                api_fail(thisref, apikeyval);
            });
        }
    } else {
        if (!apikeyval) {
            update_api_attr(thisref, null, lastinput);
        } else {
            api_fail(thisref, apikeyval);
        }
    }
}

function api_fail(thisref, thisvalue) {
    var errormsg = "Invalid " + thisref + " API key",
        apiformbox = $("#apikeyformbox");
    popnotify("error", "Invalid " + thisref + " API key");
    apiformbox.removeClass("pass");
    apiformbox.find("input[data-ref=" + thisref + "]").attr("data-checkchange", thisvalue).removeClass("changed").addClass("input_error").select();
    notify(errormsg);
    return false;
}

function update_api_attr(thisref, thisvalue, lastinput) {
    var apiformbox = $("#apikeyformbox"),
        changeval = (thisvalue) ? thisvalue : "";
    if (apiformbox && apiformbox.hasClass("pass")) {
        complement_apisettings(thisref, thisvalue);
        apiformbox.find("input[data-ref=" + thisref + "]").attr("data-checkchange", changeval).removeClass("changed input_error");
        if (lastinput === true) {
            canceldialog();
            notify("Data saved");
            savesettings();
        }
    } else {
        complement_apisettings(thisref, thisvalue);
        canceldialog();
        notify("Data saved");
        savesettings();
        // update monitor
        sessionStorage.removeItem("bitrequest_" + thisref + "_api_attempt");
        sessionStorage.removeItem("bitrequest_txstatus");
        cancelpaymentdialog();
    }
}

function complement_apisettings(thisref, thisvalue) {
    var kpairs = {};
    kpairs[thisref] = thisvalue;
    set_setting("apikeys", kpairs);
    if (thisref == "bitly") {
        set_setting("url_shorten_settings", {
            "bitly_at": thisvalue
        });
    } else if (thisref == "firebase") {
        set_setting("url_shorten_settings", {
            "fbapikey": thisvalue
        });
    } else if (thisref == "coinmarketcap") {
        set_setting("cmcapisettings", {
            "cmcapikey": thisvalue
        });
    } else if (thisref == "fixer") {
        set_setting("fiatapisettings", {
            "fxapikey": thisvalue
        });
    }
}

// Contact form
function edit_contactform_trigger() {
    $(document).on("click", "#contactform", function() {
        edit_contactform()
    })
}

function edit_contactform(checkout) {
    var contactform = $("#contactform"),
        thisdata = contactform.data(),
        nameinput = thisdata.name,
        addressinput = thisdata.address,
        zipcodeinput = thisdata.zipcode,
        cityinput = thisdata.city,
        countryinput = thisdata.country,
        emailinput = thisdata.email,
        formheader = (checkout === true) ? "Contactform / shipping" : "Contactform",
        form_subheader = (checkout === true) ? "" : "<p>Your details for online purchases.</p>",
        content = "\
	<div class='formbox' id='contactformbox'>\
		<h2 class='icon-sphere'>" + formheader + "</h2>" + form_subheader +
        "<div class='popnotify'></div>\
		<div class='popform'>\
			<div class='cf_inputwrap empty'><input type='text' value='" + nameinput + "' placeholder='Name' class='cf_nameinput'/><span class='required'>*</span></div>\
			<div class='cf_inputwrap empty'><input type='text' value='" + addressinput + "' placeholder='Address' class='cf_addressinput'/><span class='required'>*</span></div>\
			<div class='cf_inputwrap empty'><input type='text' value='" + zipcodeinput + "' placeholder='Zip/postal code' class='cf_zipcodeinput'/><span class='required'>*</span></div>\
			<div class='cf_inputwrap empty'><input type='text' value='" + cityinput + "' placeholder='City' class='cf_cityinput'/><span class='required'>*</span></div>\
			<div class='cf_inputwrap empty'><input type='text' value='" + countryinput + "' placeholder='country' class='cf_countryinput'/><span class='required'>*</span></div>\
			<div class='cf_inputwrap empty'><input type='text' value='" + emailinput + "' placeholder='email' class='cf_emailinput'/><span class='required'>*</span></div>\
			<input type='submit' class='submit' value='OK'/>\
		</div>\
	</div>";
    popdialog(content, "alert", "triggersubmit");
    check_contactform();
    if (checkout === true) {
        $("#popup #execute").text("CONTINUE");
        $("#popup #canceldialog").hide();
        if (inframe === true) {
            parent.postMessage("close_loader", "*");
        }
    }
}

function check_contactform() {
    $("#contactformbox .popform .cf_inputwrap").each(function() {
        var cf_inputwrap = $(this),
            thisinput = cf_inputwrap.children("input"),
            inputval = thisinput.val();
        if (inputval.length > 2) {
            cf_inputwrap.removeClass("empty");
        } else {
            cf_inputwrap.addClass("empty");
        }
    });
}

function type_contactform() {
    $(document).on("input", "#contactformbox .cf_inputwrap input", function() {
        var thisinput = $(this),
            thisvalue = thisinput.val(),
            cf_inputwrap = thisinput.parent(".cf_inputwrap");
        if (thisvalue.length > 2) {
            cf_inputwrap.removeClass("empty");
        } else {
            cf_inputwrap.addClass("empty");
        }
    })
}

function submit_contactform() {
    $(document).on("click", "#contactformbox input.submit", function(e) {
        e.preventDefault();
        var cfb = $("#contactformbox"),
            nameinput = cfb.find(".cf_nameinput"),
            nameinput_val = nameinput.val(),
            addressinput = cfb.find(".cf_addressinput"),
            addressinput_val = addressinput.val(),
            zipcodeinput = cfb.find(".cf_zipcodeinput"),
            zipcodeinput_val = zipcodeinput.val(),
            cityinput = cfb.find(".cf_cityinput"),
            cityinput_val = cityinput.val(),
            countryinput = cfb.find(".cf_countryinput"),
            countryinput_val = countryinput.val(),
            emailinput = cfb.find(".cf_emailinput"),
            emailinput_val = emailinput.val(),
            cf_data = {
                name: nameinput_val,
                address: addressinput_val,
                zipcode: zipcodeinput_val,
                city: cityinput_val,
                country: countryinput_val,
                email: emailinput_val
            },
            email_regex = /^\w(?:\.?[\w%+-]+)*@\w(?:[\w-]*\.)+?[a-z]{2,}$/,
            email_check = email_regex.test(emailinput_val);
        if (nameinput_val.length < 4) {
            popnotify("error", "Name is a required field");
            nameinput.focus().parent(".cf_inputwrap").addClass("empty");
            return false;
        }
        if (addressinput_val.length < 10) {
            popnotify("error", "Address is a required field");
            addressinput.focus().parent(".cf_inputwrap").addClass("empty");
            return false;
        }
        if (zipcodeinput_val.length < 6) {
            popnotify("error", "Zip/postal code is a required field");
            zipcodeinput.focus().parent(".cf_inputwrap").addClass("empty");
            return false;
        }
        if (cityinput_val.length < 3) {
            popnotify("error", "City is a required field");
            cityinput.focus();
            return false;
        }
        if (countryinput_val.length < 3) {
            popnotify("error", "Country is a required field");
            countryinput.focus().parent(".cf_inputwrap").addClass("empty");
            return false;
        }
        if (emailinput_val.length < 1) {
            popnotify("error", "Email is a required field");
            emailinput.focus().parent(".cf_inputwrap").addClass("empty");
            return false;
        }
        if (email_check === false) {
            popnotify("error", "Email contains invalid characters");
            emailinput.focus().parent(".cf_inputwrap").addClass("empty");
            return false;
        }
        set_setting("contactform", cf_data);
        canceldialog(true);
        savesettings();
        if (geturlparameters().contactform !== undefined) { // test for contactform param 
            loadpaymentfunction(true) // continue to paymentdialog
        } else {
            notify("Data saved");
        }
    })
}

// Permissions
function permissions() {
    $(document).on("click", "#permissions", function() {
        all_pinpanel({
            "func": permissions_callback
        }, true)
    })
}

function permissions_callback() {
    var thisnode = $("#permissions"),
        thisdata = thisnode.data(),
        selected = thisdata.selected,
        content = "\
		<div class='formbox' id='permissions_formbox'>\
			<h2 class='icon-user'>Set permissions</h2>\
			<div class='popnotify'></div>\
			<div class='popform' data-current='" + selected + "'>\
				<div class='selectbox'>\
					<input type='text' value='" + selected + "' readonly='readonly'/>\
					<div class='selectarrows icon-menu2' data-pe='none'></div>\
					<div class='options'>\
						<span data-pe='none'>admin</span>\
						<span data-pe='none'>cashier</span>\
					</div>\
				</div>\
				<input type='submit' class='submit' value='OK'/>\
			</div>\
		</div>";
    popdialog(content, "alert", "triggersubmit");
}

function submit_permissions() {
    $(document).on("click", "#permissions_formbox input.submit", function(e) {
        e.preventDefault();
        var thisform = $(this).closest(".popform"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            currentval = thisform.attr("data-current");
        if (thisvalue == currentval) { // check for changes
            canceldialog();
            return false;
        } else {
            set_setting("permissions", {
                "selected": thisvalue
            }, thisvalue);
            html.attr("data-role", thisvalue);
            canceldialog();
            notify("Data saved");
            savesettings();
        }
    })
}

// Team invite

function team_invite_trigger() {
    $(document).on("click", "#teaminvite", function() {
        if (hasbip && !bipv) {
            bipv_pass();
            notify("please verify your secret phrase first");
            return false;
        }
        if (haspin() === true) {
            team_invite();
        } else {
            var content = pinpanel("", {
                "func": team_invite
            });
            showoptions(content, "pin");
        }
    })
}

function team_invite() {
    var jsonencode = complile_teaminvite(),
        filename = "bitrequest_team_invite.json",
        content = "\
		<div class='formbox' id='team_invite'>\
			<h2 class='icon-users'>Team invite</h2>\
			<div class='popnotify'></div>\
			<div class='popform'>\
				<p><strong>Invite team members (staff, employees etc.) to make requests on your behalf.</strong><br/>\
				This will install Bitrequest on your team member's device, pre-installed with your public keys and restricted access (cashier).<br/>\
				Your team members are unable to access funds or make changes.</p>\
				<div id='send_invite' data-url='" + jsonencode + "' class='button'><span class='icon-share2'/>Send invite</div>\
			</div>\
		</div>\
		<div id='backupactions'>\
			<div id='backupcd'>CANCEL</div>\
		</div>";
    popdialog(content, "alert", "triggersubmit");
}

function complile_teaminvite() {
    var jsonfile = {};
    for (var key in localStorage) {
        var value = localStorage.getItem(key);
        if (value === null ||
            key == "bitrequest_symbols" ||
            key == "bitrequest_changes" ||
            key == "bitrequest_erc20tokens" ||
            key == "bitrequest_editurl" ||
            key == "bitrequest_recent_requests" ||
            key == "bitrequest_backupfile_id" ||
            key == "bitrequest_appstore_dialog" ||
            key == "bitrequest_init" ||
            key == "bitrequest_k" ||
            key == "bitrequest_awl" ||
            key == "bitrequest_tp" ||
            key == "bitrequest_requests" ||
            key == "bitrequest_archive" ||
            key == "bitrequest_bpdat") {} else {
            var pval = JSON.parse(value);
            if (key == "bitrequest_settings") {
                var mods = [{
                        "id": "permissions",
                        "change": "selected",
                        "val": "cashier"
                    }],
                    newarray = adjust_objectarray(pval, mods);
                jsonfile[key] = newarray;
            } else {
                jsonfile[key] = pval;
            }
        }
    }
    var seedobj = (hasbip === true) ? ls_phrase_obj() : {
            "pid": false,
            "pob": false
        },
        seedid = seedobj.pid,
        adjusted = adjust_object(jsonfile, seedobj);
    return btoa(JSON.stringify(adjusted));
}

function adjust_object(object, seedobj) {
    var seedid = seedobj.pid;
    object.bitrequest_cashier = {
        "cashier": true,
        "seedid": seedid
    }
    if (seedid) {
        var phrase = seedobj.pob.join(" "),
            seed = toseed(phrase),
            rootkey = get_rootkey(seed),
            key = rootkey.slice(0, 64),
            cc = rootkey.slice(64);
    }
    $.each(bitrequest_coin_data, function(i, coinconfig) {
        var currency = coinconfig.currency,
            default_coinsettings = coinconfig.settings,
            bip32dat = default_coinsettings.Xpub,
            keyval = "bitrequest_cc_" + currency,
            addresses = object[keyval];
        if (seedid) {
            var root_path = bip32dat.root_path,
                xpubdat = xpub_obj(currency, root_path, cc, key),
                xpub = xpubdat.xpub,
                xpubid = xpubdat.xpubid;
        }
        if (addresses) {
            var checked = $.grep(addresses, function(filter) {
                return filter.checked == true;
            });
            if (bip32dat.xpub) {
                var address_object = $.grep(checked, function(filter) {
                    if (filter.seedid) {
                        return false;
                    }
                    if (filter.xpubid && filter.xpubid != xpubid) {
                        return false;
                    }
                    return true;
                });
                var settings_key = "bitrequest_" + currency + "_settings",
                    saved_coinsettings = object[settings_key],
                    coinsettings = (saved_coinsettings) ? saved_coinsettings : default_coinsettings;
                if (coinsettings) {
                    var xpsettings = coinsettings.Xpub,
                        xpubkey = xpsettings.key;
                    if (xpubkey && xpsettings.selected === true) {} else {
                        if (seedid) {
                            var new_xpsettings = xpsettings;
                            new_xpsettings.key = xpub;
                            new_xpsettings.key_id = xpubid;
                            new_xpsettings.selected = true;
                            coinsettings.Xpub = new_xpsettings;
                        }
                    }
                }
                object[keyval] = address_object;
                object[settings_key] = coinsettings;
            } else {
                $.each(checked, function(key, val) {
                    val.used = false;
                    delete val.seedid;
                });
                object[keyval] = checked;
            }
        }
    })
    return object;
}

function share_teaminvite() {
    $(document).on("click", "#send_invite", function() {
        var result = confirm("Send Team invite?");
        if (result === true) {
            loader(true);
            loadertext("generate installation package");
            var accountname = $("#accountsettings").data("selected");
            api_proxy({
                "custom": "system_bu",
                "api_url": true,
                "proxy": true,
                "params": {
                    "url": $(this).attr("data-url"),
                    "account": btoa(accountname)
                }
            }).done(function(e) {
                var br_cache = e.ping.br_cache,
                    sharedtitle = "Bitrequest Team invitation from " + accountname;
                shorten_url(sharedtitle, approot + "?p=settings&ro=" + br_cache.filename, approot + "/img/icons/apple-touch-icon.png", true);
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                closeloader();
            });
        }
    })
}

function check_teaminvite() {
    var url_params = geturlparameters();
    if (url_params.p == "settings") {
        var ro = url_params.ro;
        if (ro) {
            api_proxy({
                "custom": "get_system_bu",
                "api_url": true,
                "proxy": true,
                "params": ro
            }).done(function(e) {
                var ping = e.ping;
                if (ping) {
                    var br_cache = e.ping.br_cache,
                        server_time = br_cache.utc_timestamp,
                        filetime = br_cache.created_utc,
                        filetimesec = (filetime) ? filetime * 1000 : $.now(),
                        filetime_format = new Date(filetimesec).toLocaleString(language),
                        br_result = e.ping.br_result,
                        base64 = br_result.base64,
                        account = atob(br_result.account),
                        br_dat = JSON.parse(atob(base64)),
                        sharedtitle = "Team invite " + account + " (" + filetime_format + ")",
                        bu_date = filetime_format.replace(/\s+/g, '_').replace(/\:/g, '_'),
                        cache_time = br_cache.cache_time,
                        expires_in = (filetime + cache_time) - server_time,
                        filename = "bitrequest_team_invite" + encodeURIComponent(account) + "_" + bu_date + ".json",
                        cd = countdown(expires_in * 1000),
                        cd_format = countdown_format(cd),
                        bpdat_seedid = (br_dat.bitrequest_cashier) ? (br_dat.bitrequest_cashier.seedid) ? br_dat.bitrequest_cashier.seedid : false : false,
                        update = (bpdat_seedid == cashier_seedid) ? true : false,
                        master_account = (bpdat_seedid == bipid) ? true : false,
                        teamid = localStorage.getItem("bitrequest_teamid"),
                        teamid_arr = (teamid) ? JSON.parse(teamid) : [],
                        is_installed = ($.inArray(ro, teamid_arr) > -1) ? true : false,
                        dialog_heading = (update) ? "Team update" : "Team invitation",
                        cf_string = (cd_format) ? "Invitation expires in " + cd_format : "File expired",
                        dialogtext = (is_installed) ? "<p>Installation already completed!</p>" : (update) ? "<p>" + account + " wants you to update bitrequest with his latest public keys!</p>" : "<p>" + account + " wants to team up and make requests together with you!<br/><br/>By clicking on install, bitrequest will be installed on your device with " + account + "'s public keys and restricted access.</p>",
                        button_text = (update) ? "UPDATE" : "INSTALL",
                        install_button = (is_installed) ? "" : "<div id='install_teaminvite' data-base64='" + base64 + "' data-filename='" + filename + "' class='button icon-download' data-update='" + update + "' data-ismaster='" + master_account + "'data-installid='" + ro + "'>" + button_text + "</div>"
                    content = "\
						<div class='formbox' id='system_backupformbox'>\
							<h2 class='icon-users'>" + dialog_heading + "</h2>\
							<div class='popnotify'></div>\
							<div id='dialogcontent'>\
								<div class='error' style='margin-top:1em;padding:0.3em 1em'>" + cf_string + "</div>\
								<div id='changelog'>" + dialogtext +
                        "<div id='custom_actions'>" + install_button + "</div>\
								</div>\
							</div>\
						</div>\
						<div id='backupactions'>\
							<div id='backupcd'>CANCEL</div>\
						</div>";
                    popdialog(content, "alert", "triggersubmit", null, true);
                } else {
                    systembu_expired();
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                systembu_expired();
            });
        }
    }
}

function install_teaminvite_trigger() {
    $(document).on("click", "#install_teaminvite", function() {
        var this_bttn = $(this),
            ismaster = this_bttn.attr("data-ismaster");
        if (ismaster === "true") {
            notify("Can't install invite on own device	");
            return false;
        }
        var update = this_bttn.attr("data-update"),
            installid = this_bttn.attr("data-installid"),
            installed = (stored_currencies) ? true : false,
            result_text = (update == "true") ? "Update? All you current public keys will be updated." : "Install? All you current public keys will be replaced.",
            result = (installed === true) ? confirm(result_text) : true;
        if (result === true) {
            var bu_dat = this_bttn.attr("data-base64"),
                j_filename = this_bttn.attr("data-filename"),
                j_object = JSON.parse(atob(bu_dat));
            install_teaminvite(j_object, j_filename, installid);
        }
    })
}

function install_teaminvite(jsonobject, bu_filename, iid) {
    $.each(jsonobject, function(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    });
    if (iid) {
        var stored_teamids = localStorage.getItem("bitrequest_teamid"),
            teamid_arr = (stored_teamids) ? JSON.parse(stored_teamids) : [];
        teamid_arr.push(iid);
        localStorage.setItem("bitrequest_teamid", JSON.stringify(teamid_arr));
    }
    rendersettings(["restore", "backup"]); // exclude restore and backup settings
    var lastrestore = "last restore: <span class='icon-folder-open'>Team invite " + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_') + "</span>";
    set_setting("restore", {
        "titlerestore": lastrestore,
        "fileused": bu_filename,
        "device": "folder-open"
    }, lastrestore);
    savesettings();
    notify("Installation complete!");
    canceldialog();
    window.location.href = window.location.pathname + "?p=home";
}