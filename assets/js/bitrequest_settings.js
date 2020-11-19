//globals
var deviceid = hashcode(getdevicetype() + navigator.appName + navigator.appCodeName),
	caches;

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

    // Pincode
    editpin();
    locktime();
    submit_locktime();

    // Back up
    backupdatabasetrigger();
    //backupdatabase
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
    submit_GD_restore();
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
    select_bitly();

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

    // ** Currency Settings **

    // Confirmations
    edit_confirmations();
    submit_confirmations();
    cc_switch();

    // Blockexplorer
    edit_blockexplorer();
    submit_blockexplorer();

    // RPC settings
    edit_rpcnode();
    //get_rpc_placeholder
    //test_append_rpc
    //rpc_option_li
    test_rpcnode();
    submit_rpcnode();
    //test_rpc
    //pass_rpc_submit
    remove_rpcnode();
    //get_rpc_url

    // Add apikey
    trigger_apikey();
    //add_apikey;
    submit_apikey();
});

// ** Settings **

// Account name
function editaccount() {
    $(document).on("click touch", "#accountsettings", function() {
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
    $(document).on("click touch", "#accountformbox input.submit", function(e) {
        e.preventDefault();
        var thisinput = $(this).prev("input"),
            thisvalue = thisinput.val();
        if (thisvalue.length < 1) {
            popnotify("error", "Name is required");
            thisinput.focus();
            return false;
        }
        $("#accountsettings").data("selected", thisvalue).find("p").html(thisvalue);
        canceldialog();
        notify("Data saved");
        savesettings();
    })
}

// Contact form

function edit_contactform_trigger() {
    $(document).on("click touch", "#contactform", function() {
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
    $(document).on("click touch", "#contactformbox input.submit", function(e) {
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
        $("#contactform").data(cf_data);
        canceldialog(true);
        savesettings();
        if (geturlparameters().contactform !== undefined) { // test for contactform param 
            loadpaymentfunction(true) // continue to paymentdialog
        } else {
            notify("Data saved");
        }
    })
}

// Standard fiat currency
function editcurrency() {
    $(document).on("click touch", "#currencysettings", function() {
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
    $(document).on("click touch", "#toggle_defaultcurrency .switchpanel", function(e) {
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
    $(document).on("click touch", "#currencyformbox input.submit", function(e) {
        e.preventDefault();
        var thisssettingli = $("#currencysettings"),
            localcurrency = thisssettingli.data("currencysymbol"),
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
                thisssettingli.data({
                    "currencysymbol": currencysymbollc,
                    "selected": thisinputvalue,
                    "default": dc_output
                }).find("p").html(thisinputvalue);
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

// Pincode
function editpin() {
    $(document).on("click touch", "#pinsettings", function() {
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
    $(document).on("click touch", "#locktime", function() {
        var locktime = $("#pinsettings").data("locktime"),
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
    $(document).on("click touch", "#locktime_formbox input.submit", function(e) {
        e.preventDefault();
        var thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisvalue = thistrigger.prev("input").val(),
            titlepin = (thisvalue == "never") ? "pincode disabled" : "pincode activated";
        $("#pinsettings").data({
            "locktime": thisvalue,
            "selected": titlepin
        }).find("p").html(titlepin);
        canceldialog();
        savesettings();
    })
}

// Back up
function backupdatabasetrigger() {
    $(document).on("click touch", "#backup, #alert", function() {
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
        backupheader = (GoogleAuth) ? "" : "<h2 class='icon-download'>Backup</h2>",
        content = "\
		<div class='formbox' id='backupformbox'>\
			" + backupheader + "\
			<div class='popnotify'></div>\
			<div id='dialogcontent'>\
				" + gdtrigger + "\
				<div id='changelog' style='" + showhidechangelog + "'>\
					" + changenotification + "\
					<ul>" + changespush.join("") + "</ul>\
					<div id='custom_actions'>\
						<br/>\
						<a href='data:text/json;charset=utf-16le;base64," + jsonencode + "' download='" + filename + "' title='" + filename + "' id='triggerdownload' class='button icon-download' data-date='" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_').replace(/\:/g, '_') + "' data-lastbackup='" + filename + "' download>DOWNLOAD BACKUP</a>\
					</div>\
				</div>\
			</div>\
		</div>\
		<div id='backupactions'>\
			<div id='share_bu' data-url='" + jsonencode + "' class='icon-share2'></div>\
			<div id='backupcd'>CANCEL</div>\
		</div>";
	popdialog(content, "alert", "triggersubmit", null, true);
}

function sharebu() {
    $(document).on("click touch", "#share_bu", function() {
	    var result = confirm("Share system backup ?");
		if (result === true) {
			loader(true);
			loadertext("generate system backup");
			var accountname = $("#accountsettings").data("selected");
		    api_proxy({
			    "custom": "system_bu",
	            "api_url": true,
	            "proxy": true,
	            "proxy_url": approot,
	            "params": {
		            "url": $(this).attr("data-url"),
		            "account": btoa(accountname)
		        }
			}).done(function(e) {
				var br_cache = e.ping.br_cache,
					filetime = br_cache.unix_timestamp_of_cached_file,
					filetimesec = (filetime) ? filetime * 1000 : $.now(),
					filetime_format = new Date(filetimesec).toLocaleString(language),
					sharedtitle = "System Backup " + accountname + " (" + filetime_format + ")";
				shorten_url(sharedtitle, approot + "?p=settings&sbu=" + br_cache.filename, approot + "/img/system_backup.png");
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
	            "proxy_url": approot,
	            "params": sbu
			}).done(function(e) {
				var ping = e.ping;
				if (ping) {
					var br_cache = e.ping.br_cache,
						server_time = br_cache.unix_timestamp,
						filetime = br_cache.unix_timestamp_of_cached_file,
						filetimesec = (filetime) ? filetime * 1000 : $.now(),
						filetime_format = new Date(filetimesec).toLocaleString(language),
						br_result = e.ping.br_result,
						base64 = br_result.base64,
						account = atob(br_result.account),
						sharedtitle = "System Backup " + account + " (" + filetime_format + ")",
						bu_date = filetime_format.replace(/\s+/g, '_').replace(/\:/g, '_'),
						cache_time = br_cache.cache_time,
						expires_in = (filetime + cache_time) - server_time,
						ei_divide = expires_in / 1,
						filename = "bitrequest_system_backup_" + encodeURIComponent(account) + "_" + bu_date + ".json",
						cd = countdown(ei_divide * 1000),
						cd_format = countdown_format(cd),
						cf_string = (cd_format) ? "Expires in " + cd_format : "File expired",
						content = "\
						<div class='formbox' id='system_backupformbox'>\
							<h2 class='icon-download'>System Backup</h2>\
							<div class='popnotify'></div>\
							<div id='dialogcontent'>\
								<h1>" + sharedtitle +"</h1>\
								<p><span class='warning' style='padding:0.3em 1em'>" + cf_string + "</span></p>\
								<div id='changelog'>\
									<div id='custom_actions'>\
										<br/>\
										<a href='data:text/json;charset=utf-16le;base64," + base64 + "' download='" + filename + "' title='" + filename + "' id='triggerdownload' class='button icon-download' data-date='" + bu_date + "' data-lastbackup='" + filename + "' download>DOWNLOAD BACKUP</a>\
									<div id='restore_bu' data-base64='" + base64 + "' data-filename='" + filename + "' class='button icon-share2'>INSTALL SYSTEM BACKUP</div>\
									</div>\
								</div>\
							</div>\
						</div>\
						<div id='backupactions'>\
							<div id='backupcd'>CANCEL</div>\
						</div>";
						popdialog(content, "alert", "triggersubmit", null, true);
				}
				else {
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
    $(document).on("click touch", "#system_backupformbox #restore_bu", function() {
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
    $(document).on("click touch", "#backupcd", function() {
        canceldialog();
    })
}

function complilebackup() {
    var jsonfile = [];
    for (var key in localStorage) {
        var value = localStorage.getItem(key);
        if (value !== null && key != "bitrequest_symbols" && key != "bitrequest_changes" && key != "bitrequest_erc20tokens" && key != "bitrequest_editurl" && key != "bitrequest_backupfile_id" && key != "bitrequest_init" && key != "bitrequest_k") {
            jsonfile.push('"' + key + '":' + value);
        }
    }
    return btoa("{" + jsonfile + "}");
}

function complilefilename() {
    return "bitrequest_backup_" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_').replace(/\:/g, '_') + ".json";
}

function submitbackup() {
    $(document).on("click touch", "#triggerdownload", function(e) {
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
        $("#backup").data({
            "titlebackup": lastsaved,
            "lastbackup": lastbackup,
            "device": "folder-open"
        }).find("p").html(lastsaved);
        canceldialog();
        savesettings();
        resetchanges();
        notify("Downloaded: " + lastbackup);
    })
}

// Restore backup
function restorefrombackup() {
    $(document).on("click touch", "#restore, #rshome", function() {
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
			<h2 class='icon-upload'>Restore from backup</h2>\
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
    $(document).on("click touch", "#restoreformbox input.submit", function(e) {
        e.preventDefault();
        var switchpanel = $("#popup #listappdata .switchpanel");
        if (switchpanel.hasClass("true")) {
	         topnotify("Select a Backup file");
        }
        else {
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
	var result = confirm("Restore " + bu_filename + "?");
    if (result === true) {
        restorestorage(jsonobject);
        rendersettings(["restore", "backup"]); // exclude restore and backup settings
        var lastrestore = "last restore: <span class='icon-folder-open'>" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_') + "</span>";
        $("#restore").data({
            "titlerestore": lastrestore,
            "fileused": bu_filename,
            "device": "folder-open"
        }).find("p").html(lastrestore);
        savesettings();
        notify("file restored");
        canceldialog();
        window.location.href = window.location.pathname + "?p=settings";
    }
}

function submit_GD_restore() {
    $(document).on("click touch", "#gd_backuplist .restorefile", function() {
        var thisfield = $(this).parent("li"),
            thisfileid = thisfield.attr("data-gdbu_id"),
            thisdevice = thisfield.attr("data-device"),
            thisdeviceid = thisfield.attr("data-device-id"),
            thisfilename = thisfield.text(),
            result = confirm("Restore " + thisfield.text() + " from " + thisdevice + " device?");
        if (result === true) {
            return gapi.client.drive.files.get({
                    "fileId": thisfileid,
                    "alt": "media"
                })
                .then(function(response) {
                        var jsonobject = JSON.parse(atob(response.body)),
                            lastrestore = "last restore: <span class='icon-googledrive'>" + new Date($.now()).toLocaleString(language).replace(/\s+/g, '_') + "</span>";
                        restorestorage(jsonobject);
                        rendersettings(["restore", "backup"]); // exclude restore and backup settings
                        $("#restore").data({
                            "titlerestore": lastrestore,
                            "fileused": thisfilename,
                            "device": thisdevice
                        }).find("p").html(lastrestore);
                        setTimeout(function() {
                            savesettings();
                            createfile(); // create new file from backup
                            if (thisdeviceid == deviceid) {
                                deletefile(thisfileid) // delete old backup file
                            }
                            canceldialog();
                            setTimeout(function() {
                                location.href = approot + "?p=requests";
                            }, 300);
                        }, 300);
                    },
                    function(err) {
                        console.log(err)
                    });
        }
    })
}

function restorestorage(jsonobject) {
    $.each(jsonobject, function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    });
}

// Cache control
function cachecontrol() {
    $(document).on("click touch", "#cachecontrol", function() {
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
						<div class='cancel_dialog customtrigger'>OK</div>\
						<div class='cancel_dialog customtrigger'>CANCEL</div>\
					</div>\
				</div>";
        popdialog(content);
    })
}

function clearcache() {
    $(document).on("click touch", "#clearcache", function() {
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
    $(document).on("click touch", ".reset_cc_settings", function() {
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
    $(document).on("click touch", "#reset_settings", function() {
        var content = pinpanel(" pinwall reset_app");
        canceldialog();
        showoptions(content, "pin");
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
    $(document).on("click touch", "#backup2", function() {
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
    $(document).on("click touch", "#themesettings", function() {
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
    $(document).on("click touch", "#themeformbox .selectbox > .options span", function() {
        $("link#theme").attr("href", "assets/styles/themes/" + $(this).text());
    })
}

function canceltheme() {
    $(document).on("click touch", "#canceltheme", function() {
        $("link#theme").attr("href", "assets/styles/themes/" + $("#themesettings").data("selected"));
        canceldialog();
    })
}

function submittheme() {
    $(document).on("click touch", "#submittheme", function() {
        var thisvalue = $("#themeformbox").find("input:first").val();
        $("#themesettings").data("selected", thisvalue).find("p").html(thisvalue);
        canceldialog();
        notify("Data saved");
        savesettings();
    })
}

// Url shortener
function urlshortener() {
    $(document).on("click touch", "#url_shorten_settings", function() {
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
    $(document).on("click touch", "#toggle_urlshortener .switchpanel", function(e) {
        var thispanel = $(this),
            thisform = $("#usformbox .popform");
        if (thispanel.hasClass("true")) {
            thisform.slideDown(300);
        } else {
            var result = confirm("Are you sure you want to disable url shortening? This can affect the workflow of this app");
            if (result === true) {
                thisform.slideUp(300);
            } else {
                thispanel.addClass("true").removeClass("false");
                e.preventDefault();
                return false;
            }
        }
        thispanel.addClass("us_changed");
    })
}

function pick_urlshortener_select() {
    $(document).on("click touch", "#usformbox .selectbox > .options span", function() {
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
    $(document).on("click touch", "#usformbox input.submit", function(e) {
        e.preventDefault();
        var us_settings = $("#url_shorten_settings"),
            thisform = $(this).closest(".popform"),
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
                us_settings.data({
                    "selected": us_title,
                    "us_active": us_state
                }).find("p").html(us_title);
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

function select_bitly() {
    $(document).on("click touch", "#select_bitly", function() {
        var us_settings = $("#url_shorten_settings"),
            us_data = us_settings.data(),
            us_active = (us_data.us_active === "active");
        us_settings.data("selected", "bitly").find("p").html("bitly");
        canceldialog();
        notify("Data saved");
        savesettings();
        $("#sharebutton").trigger("click");
    })
}

// Cryptocurrency price api
function editccapi() {
    $(document).on("click touch", "#cmcapisettings", function() {
        var cc_apisettings = $("#cmcapisettings").data(),
            ccapisrc = cc_apisettings.selected,
            cmcapikey = cc_apisettings.cmcapikey,
            cmcapikey = (cc_apisettings.cmcapikey) ? cc_apisettings.cmcapikey : "",
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
					<input type='text' value='" + cmcapikey + "' placeholder='API key' class='" + cmcapikeyclass + "' data-apikey='" + cmcapikey + "' data-checkchange='" + cmcapikey + "'/>\
					<input type='submit' class='submit' value='OK'/>\
				</div>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
    })
}

function pickcmcapiselect() {
    $(document).on("click touch", "#ccapiformbox .selectbox > .options span", function() {
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
    $(document).on("click touch", "#ccapiformbox input.submit", function(e) {
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
                $("#cmcapisettings").data("selected", thisvalue).find("p").html(thisvalue);
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
    $(document).on("click touch", "#fiatapisettings", function() {
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
    $(document).on("click touch", "#fiatxrapiformbox .selectbox > .options span", function() {
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
    $(document).on("click touch", "#fiatxrapiformbox input.submit", function(e) {
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
                $("#fiatapisettings").data("selected", thisvalue).find("p").html(thisvalue);
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

// API keys
function apikeys() {
    $(document).on("click touch", "#apikeys", function() {
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
    $(document).on("click touch", "#apisubmit", function(e) {
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
                    "longDynamicLink": firebase_shortlink + "?link=https://app.bitrequest.io/?p=request"
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
    $("#apikeys").data(thisref, thisvalue);
    if (thisref == "bitly") {
        $("#url_shorten_settings").data("bitly_at", thisvalue);
    } else if (thisref == "firebase") {
        $("#url_shorten_settings").data("fbapikey", thisvalue);
    } else if (thisref == "coinmarketcap") {
        $("#cmcapisettings").data("cmcapikey", thisvalue);
    } else if (thisref == "fixer") {
        $("#fiatapisettings").data("fxapikey", thisvalue);
    }
}

// Api Proxy
function pick_api_proxy() {
    $(document).on("click touch", "#api_proxy", function() {
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
        if ($.inArray("https://app.bitrequest.io/", proxies) === -1) { // always keey default proxy
        	proxies.push("https://app.bitrequest.io/");
        }
        var optionlist = $("#proxyformbox").find(".options"),
	        api_info = check_api("nano"),
	        selected = api_info.data,
	        nano_node = selected.url;
			console.log(nano_node);
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
			}
			else {
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
    $(document).on("click touch", "#proxyformbox input.submit", function(e) {
	    e.preventDefault();
        var proxyformbox = $("#proxyformbox"),
        	selectval = proxyformbox.find("#proxy_select_input").val(),
        	customval = proxyformbox.find("#proxy_url_input").val();
        if (customval.length > 0) {
	        test_custom_proxy(customval);
	        return false;
	    }
	    else {
		    var set_proxy = $("#api_proxy").data("selected");
		    if (selectval == set_proxy) {
			    canceldialog();
		    }
		    else {
			   	$("#api_proxy").data("selected", selectval).find("p").html(selectval);
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
    $(document).on("click touch", "#proxyformbox .selectarrows", function() {
        var proxyformbox = $("#proxyformbox"),
        	options = $("#proxyformbox").find(".options .optionwrap"),
        	select_inputval = proxyformbox.find("#proxy_select_input").val();
        	custom_input = proxyformbox.find("#proxy_url_input");
        options.each(function() {
	        var this_option = $(this),
	        	to_val = this_option.find("> span").attr("data-value");
	        if (to_val == select_inputval) {
		        this_option.hide();
	        }
	        else {
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
	}
	else {
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
			            $("#api_proxy").data({
				            "selected": fixed_url,
				            "custom_proxies": custom_proxies
						}).find("p").html(fixed_url);
						canceldialog();
				        notify("Data saved");
				        savesettings();
				        // Re init app
						localStorage.removeItem("bitrequest_init");
				        setTimeout(function() {
					        $("#apikeys").trigger("click");
					    }, 800);
					}
					else {
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
		}
		else {
			 popnotify("error", "Invalid url");
		}
	}
	return false;
}

function remove_proxy() {
    $(document).on("click touch", "#proxyformbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        var proxy_node = $("#api_proxy"),
			custom_proxies = proxy_node.data("custom_proxies");
        if (custom_proxies.length > 0) {
            var thisoption =  $(this).closest(".optionwrap"),
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
                    proxy_node.data("custom_proxies", new_array);
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

// ** Currency Settings **

// Confirmations
function edit_confirmations() {
    $(document).on("click touch", ".cc_settinglist li[data-id='confirmations'] .edit_trigger", function() {
        var thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisli = thistrigger.closest("li"),
            confsrc = thisli.data("selected"),
            content = "<div class='formbox' id='conf_formbox'>\
			<h2 class='icon-clock'>Confirmations</h2>\
			<div class='popnotify'></div>\
			<ul class='conf_options noselect'>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>0</span>\
						<div class='conf_emoji'>☕</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>1</span>\
						<div class='conf_emoji'>🍷 🍽</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>2</span>\
						<div class='conf_emoji'>📱</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>3</span>\
						<div class='conf_emoji'>🖥</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>4</span>\
						<div class='conf_emoji'>🚗</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>5</span>\
						<div class='conf_emoji'>🏠</div>\
					</div>\
				</li>\
				<li>\
					<div class='pick_conf'>\
						<div class='radio icon-radio-unchecked'></div>\
						<span>6</span>\
						<div class='conf_emoji'>🛥 💎</div>\
					</div>\
				</li>\
			</ul>\
			<div class='popform'>\
				<input type='hidden' value='" + confsrc + "'/>\
				<input type='submit' class='submit' value='OK' data-currency='" + thiscurrency + "'/>\
			</div>";
        popdialog(content, "alert", "triggersubmit");
        var currentli = $("#conf_formbox ul.conf_options li").filter(function() {
            return $(this).find("span").text() == confsrc;
        });
        currentli.find(".radio").removeClass("icon-radio-unchecked").addClass("icon-radio-checked2");
    })
}

function submit_confirmations() {
    $(document).on("click touch", "#conf_formbox input.submit", function(e) {
        e.preventDefault();
        var thistrigger = $(this),
            thiscurrency = thistrigger.attr("data-currency"),
            thisvalue = thistrigger.prev("input").val();
        $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='confirmations']").data("selected", thisvalue).find("p").html(thisvalue);
        canceldialog();
        notify("Data saved");
        save_cc_settings(thiscurrency);
    })
}

function cc_switch() {
    $(document).on("click touch", ".cc_settinglist li .switchpanel", function() {
        var thistrigger = $(this),
            thislist = thistrigger.closest("li"),
            thisliwrap = thistrigger.closest(".liwrap"),
            thiscurrency = thisliwrap.attr("data-currency"),
            thisvalue = (thistrigger.hasClass("true")) ? true : false;
        thislist.data("selected", thisvalue).find("p").html(thisvalue.toString());
        save_cc_settings(thiscurrency);
    })
}

// Choose blockexplorer
function edit_blockexplorer() {
    $(document).on("click touch", ".cc_settinglist li[data-id='blockexplorers']", function() {
        var current_li = $(this),
            this_data = current_li.data(),
            options = this_data.options;
        if (options === undefined) {
            return false;
        } else {
            var thiscurrency = current_li.children(".liwrap").attr("data-currency"),
                selected = this_data.selected,
                content = "\
				<div class='formbox' id='be_formbox'>\
					<h2 class='icon-key'>Choose Blockexplorer</h2>\
					<div class='popnotify'></div>\
					<div class='popform'>\
						<div class='selectbox'>\
							<input type='text' value='" + selected + "' placeholder='Choose Blockexplorer' readonly='readonly'/>\
							<div class='selectarrows icon-menu2' data-pe='none'></div>\
							<div class='options'>\
							</div>\
						</div>\
						<input type='submit' class='submit' value='OK' data-currency='" + thiscurrency + "'/>\
					</div>\
				</div>";
            popdialog(content, "alert", "triggersubmit");
            var optionlist = $("#be_formbox").find(".options");
            $.each(options, function(key, value) {
                optionlist.append("<span data-pe='none'>" + value + "</span>");
            });
        }
    })
}

function submit_blockexplorer() {
    $(document).on("click touch", "#be_formbox input.submit", function(e) {
        e.preventDefault();
        var thiscurrency = $(this).attr("data-currency"),
            thisvalue = $("#be_formbox").find("input:first").val();
        $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='blockexplorers']").data("selected", thisvalue).find("p").html(thisvalue);
        canceldialog();
        notify("Data saved");
        save_cc_settings(thiscurrency);
    })
}

// RPC node / Websockets
function edit_rpcnode() {
    $(document).on("click touch", ".cc_settinglist li[data-id='apis'], .cc_settinglist li[data-id='websockets']", function() {
        var current_li = $(this),
            this_data = current_li.data(),
            options = this_data.options,
            api_list = this_data.apis,
            sockets = this_data.websockets;
        s_id = current_li.attr("data-id");
        if (options === undefined && api_list === undefined) {
            return false;
        } else {
            test_rpc_call = this_data.rpc_test_command;
            var thiscurrency = current_li.children(".liwrap").attr("data-currency");
            is_erc20t = ($("#" + thiscurrency + "_settings").attr("data-erc20") == "true");
            var header_text = (s_id === "websockets") ? "Add websocket" : "Add RPC node",
                currencycode = (thiscurrency == "bitcoin" || thiscurrency == "litecoin" || thiscurrency == "dogecoin") ? "btc" :
                (thiscurrency == "ethereum" || is_erc20t === true) ? "eth" :
                thiscurrency,
                placeholder_id = s_id + currencycode + getrandomnumber(1, 3),
                getplaceholder = get_rpc_placeholder(thiscurrency)[placeholder_id],
                placeholder = (getplaceholder) ? getplaceholder : "eg: some.local-or-remote.node:port",
                api_form = (options) ? "<div id='rpc_input_box' data-currency='" + thiscurrency + "' data-erc20='" + is_erc20t + "'>\
						<h3 class='icon-plus'>" + header_text + "</h3>\
						<div id='rpc_input'>\
							<input type='text' value='' placeholder='" + placeholder + "' id='rpc_url_input'/>\
							<div class='c_stat icon-wifi-off'></div>\
							<div class='c_stat icon-connection'></div>\
						</div>\
						<input type='text' value='' placeholder='Username (optional)' id='rpc_username_input'/>\
						<input type='password' value='' placeholder='Password (optional)' id='rpc_password_input'/>\
					</div>" : "",
                selected = this_data.selected,
                selected_title = (selected.name) ? selected.name : selected.url,
                content = "\
				<div class='formbox' id='settingsbox' data-id='" + s_id + "'>\
					<h2 class='icon-sphere'>Choose " + thiscurrency + " " + s_id + "</h2>\
					<div class='popnotify'></div>\
					<div class='popform'>\
						<div class='selectbox'>\
							<input type='text' value='" + selected_title + "' placeholder='Choose RPC node' readonly='readonly' id='rpc_main_input'/>\
							<div class='selectarrows icon-menu2' data-pe='none'></div>\
							<div class='options'>\
							</div>\
						</div>" +
                api_form +
                "<input type='submit' class='submit' value='OK' data-currency='" + thiscurrency + "'/>\
					</div>\
				</div>";
            popdialog(content, "alert", "triggersubmit");
            var optionlist = $("#settingsbox").find(".options");
            $.each(api_list, function(key, value) {
                if (value.display === true) {
                    var selected = (value.url == selected_title || value.name == selected_title);
                    rpc_option_li(optionlist, true, key, value, selected, false);
                }
            });
            $.each(options, function(key, value) {
                var selected = (value.url == selected_title || value.name == selected_title);
                test_append_rpc(thiscurrency, optionlist, key, value, selected);
            });
            $("#rpc_main_input").data(selected);
        }
    })
}

function get_rpc_placeholder(currency) {
    var btc_port = (currency == "bitcoin") ? "8332" :
        (currency == "litecoin") ? "9332" :
        (currency == "dogecoin") ? "22555" : "port";
    return {
        apisnano1: "eg: http://127.0.0.1:7076",
        apisnano2: "eg: http://some.local-or-remote.node:7076",
        apisnano3: "eg: http://localhost:7076",
        websocketsnano1: "eg: ws://127.0.0.1:7078",
        websocketsnano2: "eg: ws://some.local-or-remote.node:7078",
        websocketsnano3: "eg: ws://localhost:7078",
        apisbtc1: "eg: http://127.0.0.1:" + btc_port,
        apisbtc2: "eg: http://some.local-or-remote.node:" + btc_port,
        apisbtc3: "eg: http://localhost:" + btc_port,
        apiseth1: "eg: http://localhost:8545",
        apiseth2: "eg: http://some.local-or-remote.node:8546",
        apiseth3: "eg: https://mainnet.infura.io/v3/YOUR-PROJECT-ID",
        websocketseth1: "eg: ws://localhost:8545",
        websocketseth2: "eg: ws://some.local-or-remote.node:8546",
        websocketseth3: "eg: wss://mainnet.infura.io/ws/v3/YOUR-PROJECT-ID",
    }
}

function test_append_rpc(thiscurrency, optionlist, key, value, selected) {
    if (s_id == "apis") {
        if (thiscurrency == "ethereum") {
            if (web3) {
                web3.setProvider(value.url);
                web3.eth.getTransaction("0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", function(err_1, data_1) { // random tx
                    if (err_1) {
                        console.log(err_1);
                        rpc_option_li(optionlist, false, key, value, selected, true);
                    } else {
                        if (data_1) {
                            rpc_option_li(optionlist, true, key, value, selected, true);
                        }
                    }
                });
            } else {
                rpc_option_li(optionlist, false, key, value, selected, true);
            }
        } else {
            var rpc = (thiscurrency == "bitcoin" || thiscurrency == "litecoin" || thiscurrency == "dogecoin") ? "bitcoin" : thiscurrency,
                rpcurl = get_rpc_url({
                    "url": value.url,
                    "username": value.username,
                    "password": value.password
                });
            api_proxy({
                "api": rpc,
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                "api_url": rpcurl,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(test_rpc_call),
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }).done(function(e) {
                var data = br_result(e).result,
                    rpc_result = data.result;
                if (rpc_result) {
                    rpc_option_li(optionlist, true, key, value, selected, true);
                } else {
                    rpc_option_li(optionlist, false, key, value, selected, true);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                console.log(jqXHR);
                console.log(textStatus);
                console.log(errorThrown);
                rpc_option_li(optionlist, false, key, value, selected, true);
            });
        }
    } else if (s_id == "websockets") {
        var provider = value.url,
            ping_event;
        if (thiscurrency == "bitcoin") {
            var ping_event = JSON.stringify({
                op: "ping"
            });
        } else if (thiscurrency == "nano") {
            var ping_event = JSON.stringify({
                action: "subscribe",
                topic: "confirmation",
                ack: true,
                id: 1
            });
        } else if (is_erc20t === true) {
            var ping_event = JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_subscribe",
                params: ["logs", {
                    address: "0x56ba2Ee7890461f463F7be02aAC3099f6d5811A8",
                    topics: []
                }]
            });
        }
        var web_socket = new WebSocket(provider);
        web_socket.onopen = function(e) {
            web_socket.send(ping_event);
            console.log(ping_event);
            console.log("Connected: " + provider);
        };
        web_socket.onmessage = function(e) {
            console.log(e);
            rpc_option_li(optionlist, true, key, value, selected, true);
            console.log("socket test success");
            web_socket.close();
            web_socket = undefined;
        };
        web_socket.onclose = function(e) {
            console.log("End socket test");
        };
        web_socket.onerror = function(e) {
            console.log(e);
            rpc_option_li(optionlist, false, key, value, selected, true);
            console.log("socket test failed");
            web_socket.close();
            web_socket = undefined;
        };
    }
}

function rpc_option_li(optionlist, live, key, value, selected, checked) {
    var liveclass = (live === true) ? " live" : " offline",
        selected_class = (selected === true) ? " rpc_selected" : "",
        icon = (live === true) ? "connection" : "wifi-off",
        datakey = (checked === true) ? " data-key='" + key + "'" : "",
        default_class = (value.default !== false) ? " default" : "",
        node_name = (value.name) ? value.name : value.url,
        option = $("<div class='optionwrap" + liveclass + selected_class + default_class + "' style='display:none' data-pe='none'><span" + datakey + " data-value='" + value.url + "' data-pe='none'>" + node_name + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    option.data(value).appendTo(optionlist);
    option.slideDown(500);
}

function test_rpcnode() {
    $(document).on("click touch", "#settingsbox .selectbox .options > div", function() {
        var thisoption = $(this),
            thisdata = thisoption.data();
        if (thisoption.hasClass("offline")) {
            playsound(funk);
            topnotify("Unable to connect");
        } else {
            var settingsbox = $("#settingsbox"),
                rpc_main_input = settingsbox.find("#rpc_main_input");
            settingsbox.find("#rpc_main_input").removeData().data(thisdata);
            settingsbox.find(".options .optionwrap").removeClass("rpc_selected");
            thisoption.addClass("rpc_selected");
        }
        return false;
    })
}

function submit_rpcnode() {
    $(document).on("click touch", "#settingsbox input.submit", function(e) {
        e.preventDefault();
        var settingsbox = $("#settingsbox"),
            thiscurrency = $(this).attr("data-currency"),
            rpc_main_input = settingsbox.find("#rpc_main_input"),
            setvalue = rpc_main_input.data(),
            rpc_input_box = settingsbox.find("#rpc_input_box");
        if (rpc_input_box.length > 0) {
            var rpc_url_input_val = rpc_input_box.find("#rpc_url_input").val();
            if (rpc_url_input_val.length > 5) {
                var optionsbox = settingsbox.find(".options"),
                    duplicates = optionsbox.find("span[data-value='" + rpc_url_input_val + "']"),
                    indexed = (duplicates.length > 0);
                if (indexed === true) {
                    popnotify("error", "Node already added");
                    return false;
                } else {
                    var rpc_username_input_val = rpc_input_box.find("#rpc_username_input").val(),
                        rpc_password_input_val = rpc_input_box.find("#rpc_password_input").val(),
                        rpc_data = {
                            "url": rpc_url_input_val,
                            "username": rpc_username_input_val,
                            "password": rpc_password_input_val,
                            "default": false
                        };
                    test_rpc(rpc_input_box, rpc_data, thiscurrency);
                }
            } else {
                pass_rpc_submit(thiscurrency, setvalue, false)
            }
        } else {
            pass_rpc_submit(thiscurrency, setvalue, false)
        }
    })
}

function test_rpc(rpc_input_box, rpc_data, currency) {
    if (s_id == "apis") {
	    console.log(currency);
        if (currency == "ethereum") {
            if (web3) {
                if (web3.currentProvider.host == rpc_data.url) {} else {
                    web3.setProvider(rpc_data.url);
                }
                web3.eth.getTransaction("0x919408272d05b3fd7ccfa1f47c10bea425891c8aa47ba7309dc3beb0b89197f1", function(err_1, data_1) { // random tx
                    if (err_1) {
                        rpc_input_box.addClass("offline").removeClass("live");
                        popnotify("error", err_1);
                    } else {
                        if (data_1) {
                            rpc_input_box.addClass("live").removeClass("offline");
                            pass_rpc_submit(currency, rpc_data, true);
                        } else {
                            rpc_input_box.addClass("offline").removeClass("live");
                            popnotify("error", "unable to connect");
                        }
                    }
                });
            } else {
                rpc_input_box.addClass("offline").removeClass("live");
                popnotify("error", "Unable to connect");
            }
        } else {
            var rpc = (currency == "bitcoin" || currency == "litecoin" || currency == "dogecoin") ? "bitcoin" : currency,
                rpcurl = get_rpc_url(rpc_data);
            api_proxy({
                "api": rpc,
                "search": "test",
                "cachetime": 25,
                "cachefolder": "1h",
                //"custom": "btc_rpc_test",
                "api_url": rpcurl,
                "params": {
                    "method": "POST",
                    "data": JSON.stringify(test_rpc_call),
                    "headers": {
                        "Content-Type": "text/plain"
                    }
                }
            }).done(function(e) {
                var data = br_result(e).result,
                    rpc_result = data.result;
                if (rpc_result) {
                    rpc_input_box.addClass("live").removeClass("offline");
                    pass_rpc_submit(currency, rpc_data, true);
                } else {
                    var error = data.error;
                    if (error) {
                        rpc_input_box.addClass("offline").removeClass("live");
                        topnotify("Unable to connect");
                        var error_message = error.error_message;
                        if (error_message) {
                            popnotify("error", error_message);
                        }
                    }
                }
            }).fail(function(data) {
                console.log(data);
                rpc_input_box.addClass("offline").removeClass("live");
                topnotify("Unable to connect");
                if (data.status === 0) {
                    popnotify("error", "Try disabeling Cross Origin Limitations in your browser");
                }
            });
        }
    } else if (s_id == "websockets") {
        var provider = rpc_data.url,
            ping_event;
        if (currency == "bitcoin") {
            var ping_event = JSON.stringify({
                op: "ping"
            });
        } else if (currency == "nano") {
            var ping_event = JSON.stringify({
                action: "subscribe",
                topic: "confirmation",
                ack: true,
                id: 1
            });
        } else if (currency == "ethereum" || is_erc20t === true) {
            var ping_event = JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "eth_subscribe",
                params: ["logs", {
                    address: "",
                    topics: []
                }]
            });
        }
        var web_socket = new WebSocket(provider);
        web_socket.onopen = function(e) {
            web_socket.send(ping_event);
            console.log("Connected: " + provider);
        };
        web_socket.onmessage = function(e) {
            rpc_input_box.addClass("live").removeClass("offline");
            pass_rpc_submit(currency, rpc_data, true);
            console.log("socket test success");
            web_socket.close();
            web_socket = undefined;
        };
        web_socket.onclose = function(e) {
            console.log("End socket test");
        };
        web_socket.onerror = function(e) {
            console.log(e);
            rpc_input_box.addClass("offline").removeClass("live");
            popnotify("error", "Unable to connect");
            console.log("socket test failed");
            web_socket.close();
            web_socket = undefined;
        };
    }
}

function pass_rpc_submit(thiscurrency, thisvalue, newnode) {
    var rpc_setting_li = $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='" + s_id + "']"),
        options = rpc_setting_li.data("options"),
        node_name = (thisvalue.name) ? thisvalue.name : thisvalue.url;
    rpc_setting_li.data("selected", thisvalue).find("p").html(node_name);
    if (options === undefined) {
        if (newnode === true) {
            rpc_setting_li.data("options", thisvalue);
        }
    } else {
        if (newnode === true) {
            options.push(thisvalue);
        }
    }
    canceldialog();
    notify("Data saved");
    save_cc_settings(thiscurrency);
}

function remove_rpcnode() {
    $(document).on("click touch", "#settingsbox .options .opt_icon_box .icon-bin", function(e) {
        e.preventDefault();
        var thistrigger = $(this),
            settingsbox = $("#settingsbox"),
            thiscurrency = settingsbox.find("#rpc_input_box").attr("data-currency"),
            rpc_setting_li = $("#" + thiscurrency + "_settings .cc_settinglist li[data-id='" + s_id + "']"),
            options = rpc_setting_li.data("options");
        if (options.length > 0) {
            var thisoption = thistrigger.closest(".optionwrap"),
                thisdata = thisoption.data(),
                thisurl = thisdata.url,
                default_node = (thisdata.default !== false),
                optionsbox = settingsbox.find(".options"),
                duplicates = optionsbox.find("span[data-value='" + thisurl + "']"),
                is_duplicate = (duplicates.length > 1);
            if (default_node === true && is_duplicate === false) {
                playsound(funk);
                topnotify("Cannot delete default node");
            } else {
                var thisname = (thisdata.name) ? thisdata.name : thisurl,
                    result = confirm("Are you sure you want to delete '" + thisname + "'");
                if (result === true) {
                    var new_array = $.grep(options, function(option) {
                        return option.url != thisurl;
                    });
                    thisoption.slideUp(500, function() {
                        $(this).remove();
                    });
                    rpc_setting_li.data("options", new_array);
                    notify("RPC node removed");
                    save_cc_settings(thiscurrency);
                }
            }
        }
        return false;
    })
}

function get_rpc_url(rpc_data) {
    if (rpc_data === false) {
        return false;
    } else {
        var url = rpc_data.url,
            username = rpc_data.username,
            password = rpc_data.password,
            login_param = (username && password) ? username + ":" + password + "@" : "",
            hasprefix = (url.indexOf("http") > -1),
            urlsplit = (hasprefix === true) ? url.split("://") : url;
        return (hasprefix === true) ? urlsplit[0] + "://" + login_param + urlsplit[1] : url;
    }
}

// Add api key

function trigger_apikey() {
    $(document).on("click touch", "#add_api", function() {
        add_apikey($(this).attr("data-api"));
    })
}

function add_apikey(api) {
    var get_key = $("#apikeys").data(api),
        api_key = (get_key) ? get_key : "",
        apidata = get_api_data(api),
        sign_up = apidata.sign_up,
        get_apikey_url = (!sign_up) ? "" : "<div id='api_signin'>Get your " + api + " API key <a href='" + sign_up + "' target='blank' class='exit'>here</a></div>",
        content = "\
		<div class='formbox' id='add_apikey'>\
			<h2 class='icon-key'>Set " + api + " API key</h2>\
			<div class='popnotify'></div>\
			<div class='popform' data-api='" + api + "'>\
				<input type='text' value='" + api_key + "' placeholder='API key' data-apikey='" + api_key + "' data-checkchange='" + api_key + "'>\
				<input type='submit' class='submit' value='OK'/>\
			</div>" + get_apikey_url +
        "</div>";
    canceldialog();
    setTimeout(function() {
        popdialog(content, "alert", "triggersubmit");
    }, 800);
}

function submit_apikey() {
    $(document).on("click touch", "#add_apikey input.submit", function(e) {
        e.preventDefault();
        var thisform = $(this).closest(".popform"),
            thisinput = thisform.find("input:first"),
            thisvalue = thisinput.val(),
            currentkey = thisinput.attr("data-apikey");
        if (thisvalue) {
            if (thisvalue === currentkey) {
                canceldialog();
            } else {
                if (thisinput.attr("data-checkchange") == thisvalue) {
                    popnotify("error", "Enter a valid API key");
                } else {
                    thisinput.attr("data-checkchange", thisvalue);
                    checkapikey(thisform.attr("data-api"), thisvalue, true);
                }
            }
        } else {
            popnotify("error", "Enter a valid API key");
        }
    })
}