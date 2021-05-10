var test_phrase = "army van defense carry jealous true garbage claim echo media make crunch", // random phrase used for test derive
    expected_seed = "5b56c417303faa3fcba7e57400e120a0ca83ec5a4fc9ffba757fbe63fbd77a89a1a3be4c67196f57c39a88b76373733891bfaba16ed27a813ceed498804c0570", // expected seed used for test derive
    expected_address = "1HQ3rb7nyLPrjnuW85MUknPekwkn7poAUm", // expected addres used for test derive
    has_bigint = false,
    test_derive = true,
    c_derive = {
	    "bitcoin": true,
	    "litecoin": true,
	    "dogecoin": true,
	    "nano": true,
	    "monero": true,
	    "ethereum": true
    },
    can_xpub = {
	    "bitcoin": true,
	    "litecoin": true,
	    "dogecoin": true,
	    "nano": false,
	    "monero": false,
	    "ethereum": true
    };

$(document).ready(function() {
	hasbigint();
    //istrial
    //bipv_pass
    test_bip39();
    //bip39_fail
    //derive_fail
    //derive_xpub_fail
    //test_derivation

    // Check derivationsn
    //check_derivations
    //active_xpub
    //has_xpub
    //is_xpub

    // Bip 39 seed generation
    make_seed();
    restore_seed();
    restore_seed_verify();
    //manage_bip32
    submit_disclaimer();
    //bip39

    // Seed panel nav
    got_it();
    seed_back1();
    seed_back2();
    //seed_nav
    //ls_phrase_obj
    //ls_phrase_obj_parsed
    backup_continue();
    //check_phrase
    //get_phrase
    //checkmnemonic
    //missing_words
    //verify_phrase
    //shuffleArray
    verify_words();
    //move_seed_cb
    continue_seed();
    skip_verify();
    //finish_seed
    //seed_callback
    //deactivate_xpubs

    // Test triggers
    //derive_test_trigger();
    //derive_addone_trigger();
    //derive_addone
    //key_cc
    //key_cc_xpub
    //get_rootkey
    //derive_all_init
    //derive_all
    //derive_add_address
    //derive_data
    //derive_obj
    //ch_pending
    //get_uniques
    copy_phrase();
    show_phrase();
    //show_phrase_callback
    delete_phrase_trigger();
    //delete_phrase_verify

    // Bip 32 Key derivation
    //hmac_encrypt
    //toseed
    //parse_seed
    //newseed
    //to_mnemonic
    //zfill

    // bip32 Derivation
    //objectify_extended
    //derive_x
    //ckd
    //keypair_array
    //ext_keys
    //b58c_x_payload
    //format_keys
    //xpub_prefix

    // Phrase info
    phrase_info();
    //phrase_info_pu
    phrase_coin_info();
    toggle_dpaths();
    //pi_show
    test_derive_next();
    test_derive_prev();
    //test_derive_function
    phrase_moreinfo();
});

function hasbigint() {
	try {
        if (typeof BigInt("1") == "bigint") { 
	        has_bigint = true;
    	}
    } catch (err) {
        console.log(err.message);
    }
}

function istrial() {
    var trialp = localStorage.getItem("bitrequest_tp");
    if (trialp) {
        var twelvehours = 43200000;
        if (($.now() - parseFloat(trialp)) < twelvehours) {
            return true;
        }
    }
    return false;
}

// Reminder to write down secret phrase

function bipv_pass() {
    if (hasbip === true) {
        if (bipv === true) {} else {
            var used_addresses = filter_all_addressli("seedid", bipid).filter(".used");
            if (istrial() === true) {
                if (used_addresses.length > 1) {
                    manage_bip32({
                        "type": "popup"
                    });
                }
                if (used_addresses.length > 2) {
                    return false;
                }
            } else {
                manage_bip32({
                    "type": "popup"
                });
                if (used_addresses.length > 0) {
                    return false;
                }
            }
        }
    }
    return true;
}

// dependencies check

function test_bip39() {
	if (crypto === undefined) { // test for window.crypto
        bip39_fail();
        test_derive = false;
    }
    if (has_bigint === false) { // test for js BigInt
        bip39_fail();
        test_derive = false;
    }
    if (toseed(test_phrase) != expected_seed || test_derivation() === false) {
	    derive_fail(["bitcoin","litecoin","dogecoin","ethereum"]);
	    c_derive.bitcoin = false,
        c_derive.litecoin = false,
        c_derive.dogecoin = false,
        c_derive.ethereum = false;
    }
    if (bech32_check() === false) { // test for bech32 Derivation
	    derive_fail(["bitcoin"]);
        c_derive.bitcoin = false;
    }
    if (nano_check() === false) { // test for nano Derivation
	    derive_fail(["nano"]);
        c_derive.nano = false;
    }
    if (xmr_check() === false) { // test for xmr Derivation
	    derive_fail(["monero"]);
        c_derive.monero = false;
    }
    // check xpub derivation
    if (xpub_check() === false) { // test for btc xpub derivation
	    derive_xpub_fail(["bitcoin","litecoin","dogecoin"]);
	    can_xpub.bitcoin = false,
        can_xpub.litecoin = false,
        can_xpub.dogecoin = false;
    }
    if (eth_xpub_check() === false) { // test for ethereum xpub derivation
	    derive_xpub_fail(["ethereum"]);
	    can_xpub.ethereum = false;
    }
}

function bip39_fail() {
	body.addClass("nobip");
}

function derive_fail(arr) {
	setTimeout(function() {
		$.each(arr, function(i, val) { 
			$("#" + val + "_settings").addClass("no_derive");
		});
    }, 500)
}

function derive_xpub_fail(arr) {
	setTimeout(function() {
		$.each(arr, function(i, val) { 
			$("#" + val + "_settings").addClass("no_xpub");
		});
    }, 500)
}

// test derivations

function test_derivation() {
    var currency = "bitcoin",
        test_rootkey = get_rootkey(expected_seed),
        test_master_priv = test_rootkey.slice(0, 64),
        test_master_chaincode = test_rootkey.slice(64),
        dpath = "m/44'/0'/0'/0/0",
        bip32dat = getbip32dat(currency),
        x_keys_dat = derive_x(dpath, test_master_priv, test_master_chaincode),
        key_object = format_keys(expected_seed, x_keys_dat, bip32dat, 0, currency);
    if (key_object.address == expected_address) {
        return true;
    }
    return false;
}

function bech32_check() {
    var bip84_pub = "03bb4a626f63436a64d7cf1e441713cc964c0d53289a5b17acb1b9c262be57cb17",
        expected_bip84_bech32 = "bc1qg0azlj4w2lrq8jssrrz6eprt2fe7f7edm4vpd5",
        bip84_bech32 = pub_to_address_bech32("bc", bip84_pub);
    if (expected_bip84_bech32 == bip84_bech32) {
        return true;
    }
    return false;
}

function nano_check() {
    var expected_nano_address = "nano_1mbtirc4x3kixfy5wufxaqakd3gbojpn6gpmk6kjiyngnjwgy6yty3txgztq",
        xnano_address = NanocurrencyWeb.wallet.accounts(expected_seed, 0, 0)[0].address;
    if (expected_nano_address == xnano_address) {
        return true;
    }
    return false;
}

function xmr_check() { // https://coinomi.github.io/tools/bip39/
    var expected_xmr_address = "477h3C6E6C4VLMR36bQL3yLcA8Aq3jts1AHLzm5QXipDdXVCYPnKEvUKykh2GTYqkkeQoTEhWpzvVQ4rMgLM1YpeD6qdHbS",
    	ssk = get_ssk(expected_seed, true),
	    xko = xmr_getpubs(ssk, 0);
    if (xko.address == expected_xmr_address) {
        return true;
    }
    return false;
}

function xpub_check() {
	var currency = "bitcoin",
    	xpub_keycc = key_cc_xpub("xpub6EdHrjLe1JdwRR6W5romAvmVzk7bfXQWV2N9SuTWP1ebszkLVQMev6KWTNtb2D9mQpocUfAsPQGkE6wtVe8Kug3dYyA9yCJTnHRPJAbgEAF"),
    	x_keys_dat = derive_x("M/0", xpub_keycc.key, xpub_keycc.cc),
    	bip32dat = getbip32dat(currency),
    	key_object = format_keys(null, x_keys_dat, bip32dat, 0, currency),
    	xpub_address = key_object.address;
    if (expected_address == key_object.address) {
	    return true;
    }
    else {
	    return false;
    }
}

function eth_xpub_check() {
	var expected_eth_address = "0x2161DedC3Be05B7Bb5aa16154BcbD254E9e9eb68",
		eth_pub = "03c026c4b041059c84a187252682b6f80cbbe64eb81497111ab6914b050a8936fd",
		eth_address = pub_to_eth_address(eth_pub);
    if (expected_eth_address == eth_address) {
	    return true;
    }
    else {
	    return false;
    }
}

// Check derivationsn

function check_derivations(currency) {
    if (test_derive === true && c_derive[currency]) {
        var activepub = active_xpub(currency);
        if (can_xpub[currency] && activepub) {
            return "xpub";
        } else {
            if (hasbip === true) {
                return "seed";
            }
        }
    }
    return false;
}

function active_xpub(currency) {
    var haspub = has_xpub(currency)
    if (haspub) {
        if (haspub.selected === true) {
            return haspub;
        }
    }
    return false;
}

function has_xpub(currency) {
    var ispub = is_xpub(currency);
    if (ispub) {
        if (ispub.key) {
            return ispub;
        }
    }
    return false;
}

function is_xpub(currency) {
	if (can_xpub[currency]) {
		var xpubli = $("#" + currency + "_settings .cc_settinglist li[data-id='Xpub']");
	    if (xpubli) {
	        var xpubli_dat = xpubli.data();
	        if (xpubli_dat) {
	            return xpubli_dat;
	        }
	    }
	}
	return false;
}

// Bip 39 seed generation

function make_seed() {
    $(document).on("click", "#option_makeseed", function() {
        var currency = $(this).attr("data-currency");
        if (hasbip === true) {
            topnotify("You already have a seed");
        } else {
            canceldialog();
            manage_bip32({
                "type": currency,
                "edit": true
            });
        }
    })
}

function restore_seed() {
    $(document).on("click", "#rest_seed, .applist.pobox li.seedu .address .srcicon", function() {
	    if (hasbip === true) {
            return false;
        } else {
            var result = confirm("Restore seed?");
            if (result === true) {
                var thistrigger = $(this),
                    seedid = thistrigger.attr("data-seedid");
                canceloptions();
                canceldialog();
                bip39({
                    "type": "restore",
                    "edit": true,
                    "seedid": seedid
                });
                $("#seed_step2").addClass("restore");
                seed_nav(2);
                $("#bip39phrase").focus();
            }
        }
    })
}

function restore_seed_verify() {
    $(document).on("click", "#restore_seed", function() {
        if (hasbip === true) {
            return false;
        } else {
            phrasearray = null,
                phraseverified = false;
            var phrase = get_phrase(),
                verify = check_phrase(phrase);
            if (verify === true) {
                var thistrigger = $(this),
                    seedid = thistrigger.attr("data-seedid"),
                    words = phrase.split(" "),
					seed_string = btoa(JSON.stringify(words)),
                    phraseid = hmacsha(seed_string, "sha256").slice(0, 8);
                if (seedid == phraseid) {
                    phrasearray = words;
                    phraseverified = true,
                        $("#seed_steps").addClass("checked");
                    finish_seed();
                } else {
                    shake($("#bip39phrase"));
                    topnotify("wrong seed");
                }
            } else {
                topnotify(verify);
            }
        }
    })
}

function manage_bip32(dat) {
    if (hasbip === true) {
        bip39(dat);
    } else {
	    var data = (dat) ? dat : {},
        	content = $("<div class='formbox' id='disclaimer_dialog'>\
        	<h2><span class='icon-warning' style='color:#B33A3A'></span>Disclaimer!</h2>\
        	<div class='popnotify'></div>\
        	<form class='popform'>\
        		<div class='inputwrap'><p>Funds recieved from addresses generated fom your Bip39 secret passphrase can not be spend by Bitrequest.<br/>To spend your funds you wil have to import your seed phrase in a <a href='https://www.bitrequest.io/compatible-wallets' target='_blank' class='ref'>Bip39 compatible wallet.</a></p></div>\
        		<div id='pk_confirm' class='noselect'><div id='pk_confirmwrap' class='cb_wrap' data-checked='false'><span class='checkbox'></span></div><span>I understand and am ok with this.</span></div>\
        		<input type='submit' class='submit' value='OK'></form></div>").data(data);
        if($("#option_makeseed").length) {
		    canceldialog();
		    setTimeout(function() {
	            popdialog(content, "alert", "triggersubmit");
	        }, 1000)
	    }
	    else {
		    popdialog(content, "alert", "triggersubmit");
	    }
    }
}

function submit_disclaimer() {
    $(document).on("click", "#disclaimer_dialog input.submit", function(e) {
        e.preventDefault();
        var disclaimer_dialog = $("#disclaimer_dialog"),
        	data = disclaimer_dialog.data(),
        	pk_checkbox = disclaimer_dialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked");
        if (pk_checked == true) {
	      	canceldialog();
	        bip39(data);
	    }
	    else {
		    popnotify("error", "Please consent to continue.");
	    }
    })
}

function bip39(dat) {
    phraseverified = false;
    var data = (dat) ? dat : {},
        edit = (data && data.edit) ? true : false,
        dtype = (data && data.type) ? data.type : null,
        restore = (dtype == "restore" && edit === true),
        type = (hasbip === true) ? (bipv === true) ? "bipsavedbu" : "bipsaved" : "nobip",
        step = (type == "nobip") ? 1 : (type == "bipsavedbu") ? 2 : 3,
        spclass = (type == "nobip") ? " showphrase" : " hidephrase",
        savedseed = (hasbip === true) ? ls_phrase_obj().pob.join(" ") : false,
        seed = (restore) ? "" : (savedseed) ? savedseed : newseed(12),
        remindp = (dtype == "restore") ? "<p>Make sure to backup your current <span id='toseed'>Secret phrase</span>. It will be overwritten.</p>" : "<p>Please verify your secret phrase.</p>",
        verifyheader = (dtype == "restore") ? "Verify Current seed phrase:" : "Verify Backup:",
        save_str = (restore) ? "Enter your secret phrase:" : "Write down your secret phrase and put it somewhere safe.",
        verify_str = (restore) ? "<div id='restore_seed' class='button' data-seedid='" + data.seedid + "'>Restore</div>" : "<div id='cfbu2' class='button'>I've backed it up</div>",
        markup = $("<div id='seed_steps' class='panel" + step + "' data-goal='" + dtype + "'>\
		<div id='seed_step1' class='seed_step'>\
			<div class='ss_header'>\
				<div class='icon-cross ssnav'></div>\
			</div>\
			<div class='ss_content flex'>\
				<div class='ss_content_box'>\
					<h2 style='color:#eeac57'>Important!</h2>\
					<p><strong>You are about to become your own bank.</strong><br/>In the next screen, you will see your secret phrase. <strong style='color:#eeac57'>Make sure to write it down and put it somewhere safe!</strong></p>\
					<p><strong>If you lose your device, uninstall your application or clear your browserdata, you will need your secret phrase to recover your funds!</strong></p>\
					<p class='p_warning' style='text-transform:uppercase'><strong>If you lose your phrase,<br/>you will lose your money!</strong></p>\
				</div>\
			</div>\
			<div class='ss_footer'>\
				<div id='cfbu1' class='button'>I understand!</div>\
			</div>\
		</div>\
		<div id='seed_step2' class='seed_step'>\
			<div class='ss_header'>\
				<div class='icon-arrow-left2 ssnav'></div>\
				<div class='icon-cross ssnav'></div>\
			</div>\
			<div class='ss_content flex'>\
				<div id='phrase_cb' class='ss_content_box" + spclass + "'>\
					<h2 id='showphrase'><span class='icon-eye-blocked eye'></span><span class='icon-eye eye'></span>Secret Phrase:</h2>\
					<p>" + save_str + "</p>\
					<div id='phrasewrap'>\
						<div id='bip39phrase' contenteditable='" + edit + "' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' lang='en' class='noselect'>" + seed + "</div>\
						<div id='phrase_actions'>\
							<div id='copyphrase' class='button'>Copy</div>\
							<div id='phrase_info' title='seed info'><span class='icon-info'></span></div>\
						</div>\
						<div id='phraseblur'></div>\
					</div>\
				</div>\
			</div>\
			<div class='ss_footer'>" + verify_str + "</div>\
		</div>\
		<div id='seed_step3' class='seed_step'>\
			<div class='ss_header'>\
				<div class='icon-arrow-left2 ssnav'></div>\
			</div>\
			<div class='ss_content flex'>\
				<div class='ss_content_box'><h2>" + verifyheader + "</h2><p id='reminder_seed_backup'>Congratulations. You are now your own bank!<br/></p>\
				<p id='gpp'>With great power comes great responsibility.<br/><strong>Remember to backup your <span id='toseed'>Secret phrase</span>.</strong></p>" + remindp + "<div id='seed_verify_box'>\
					</div>\
					<div id='cfbu3_w'>\
						<div id='cfbu3' class='button'>I do this later</div>\
					</div>\
				</div>\
			</div>\
			<div class='ss_footer'>\
				<div id='continue_seed' class='button'>Continue</div>\
			</div>\
		</div>\
	</div>").data(data);
    $("#seed_panel").html(markup).addClass(type);
    body.addClass("seed_dialog");
    if (step === 3) {
        verify_phrase(seed.split(" "), 3);
    }
    wake();
}

// Seed panel nav

function got_it() {
    $(document).on("click", "#cfbu1", function() {
        seed_nav(2);
    })
}

function seed_back1() {
    $(document).on("click", "#seed_steps #seed_step2 .ss_header .icon-arrow-left2", function() {
        seed_nav(1);
    })
}

function seed_back2() {
    $(document).on("click", "#seed_steps #seed_step3 .ss_header .icon-arrow-left2, #seed_steps #seed_step3 #toseed", function() {
        seed_nav(2);
        $("#seed_step3").removeClass("delete verify");
    })
}

function seed_nav(index) {
    $("#seed_steps").attr("class", "panel" + index);
}

function ls_phrase_obj() {
    if (bipobj) {
        var savedat = JSON.parse(bipobj);
        return ls_phrase_obj_parsed(savedat);
    } else {
        return false;
    }

}

function ls_phrase_obj_parsed(obj) {
    var phrasedat = obj.dat,
        datparse = JSON.parse(atob(phrasedat));
    return {
        "pid": datparse.pid,
        "pob": JSON.parse(atob(datparse.pob))
    }
}

function backup_continue() {
    $(document).on("click", "#cfbu2", function() {
        phrasearray = null,
            phraseverified = false;
        var phrase = get_phrase(),
            verify = check_phrase(phrase);
        if (verify === true) {
            var words = phrase.split(" ");
            verify_phrase(words, 3);
            phrasearray = words;
            $("#seed_steps").removeClass("checked");
            $("#seed_step3").addClass("verify");
            seed_nav(3);
        } else {
            topnotify(verify);
        }
    })
}

function check_phrase(phrase) {
    var cleanphrase = get_phrase(),
        words = phrase.split(" "),
        phraselength = words.length;
    if (phraselength < 2) {
        return "Blank mnemonic";
    }
    if (phraselength === 12) {
        if (checkmnemonic(phrase) === false) {
            var missing_word = missing_words(words);
            if (missing_word) {
                return missing_word + " not in wordlist";
            }
            return "Secret phrase not Bip39 compatible";
        }
        return true;
    } else {
        return "Secret phrase must be 12 characters";
    }
}

function get_phrase() {
    return cleanstring($("#bip39phrase").text());
}

function checkmnemonic(mnemonic) {
    var b = mnemonicToBinaryString(mnemonic);
    if (b === null) {
        return false;
    }
    var l = b.length,
        d = b.substring(0, l / 33 * 32),
        h = b.substring(l - l / 33, l),
        nd = binaryStringToWordArray(d),
        ndHash = sjcl.hash.sha256.hash(nd),
        ndHex = sjcl.codec.hex.fromBits(ndHash),
        ndBstr = zfill(hexStringToBinaryString(ndHex), 256),
        nh = ndBstr.substring(0, l / 33);
    return h == nh;
}

function missing_words(words) {
    var missing;
    $.each(words, function(i, word) {
        if (wordlist.indexOf(word) == -1) {
            missing = word;
            return false;
        }
    });
    return missing;
}

function verify_phrase(words, count) {
    var wordindex = [];
    $.each(words, function(i, word) {
        wordobject = {
            "word": word,
            "index": i + 1
        }
        wordindex.push(wordobject);
    });
    var shuffled_words = shuffleArray(wordindex);
    trimmed_sw = shuffled_words.slice(0, count),
        verify_box = $("#seed_verify_box");
    verify_box.html("");
    $.each(trimmed_sw, function(i, word_obj) {
        var word = word_obj.word,
            index = word_obj.index,
            af_attr = (i === 0) ? " autofocus" : "";
        input = "<div class='checkword_box uncheck'><input type='text' placeholder='word #" + index + "' data-word='" + word + "'" + af_attr + " autocorrect='off' autocapitalize='none'/><span class='icon-checkmark'></span></div>";
        verify_box.append(input);
    });
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function verify_words() {
    $(document).on("input", "#seed_verify_box input", function(e) {
        var thisinput = $(this),
            cw_box = thisinput.closest(".checkword_box"),
            thisword = thisinput.data("word"),
            thisval = thisinput.val();
        if (thisval == thisword) {
            thisinput.blur();
            cw_box.removeClass("uncheck");
            var unchecked = $("#seed_verify_box").find(".uncheck"),
                uclength = unchecked.length;
            if (uclength > 0) {
                var first_uncheck = unchecked.first().find("input");
                setTimeout(function() {
                    first_uncheck.focus().val("");
                }, 500)
            } else {
                var step3 = $("#seed_step3");
                if (step3.hasClass("delete")) {
                    var result = confirm("Are you sure you want to delete your secret phrase?");
                    if (result === true) {
                        localStorage.removeItem("bitrequest_bpdat");
                        var initdat = localStorage.getItem("bitrequest_init"),
                            iodat = (initdat) ? JSON.parse(initdat) : {};
                        iodat.bipv = "no";
                        delete iodat.bipv;
                        localStorage.setItem("bitrequest_init", JSON.stringify(iodat));
                        hasbip = false;
                        bipv = false;
                        bipid = false;
                        move_seed_cb();
                        hide_seed_panel();
                        notify("Secret phrase deleted");
                    }
                } else if (step3.hasClass("replace")) {
                    var result = confirm("Are you sure you want to restore your seed from backup? Your current seed will be erased.");
                    if (result === true) {
                        var bu_dat = $("#seed_steps").data().dat;
                        restore_callback(bu_dat, true);
                    }
                } else {
                    phraseverified = true,
                        $("#seed_steps").addClass("checked");
                    finish_seed();
                }
            }
        } else {
            cw_box.addClass("uncheck");
        }
    });
}

function move_seed_cb() {
    $.each(bitrequest_coin_data, function(i, coinconfig) {
        var currency = coinconfig.currency,
            bip32 = coinconfig.settings.Xpub;
        if (bip32.active === true) {
            var addresslist = get_addresslist(currency);
            addresslist.children(".adli").each(function(i) {
                var this_li = $(this);
                if (this_li.hasClass("seed")) {
                    var seedid = this_li.data("seedid");
                    if (seedid == bipid) {
                        this_li.removeClass("seedu").addClass("seedv").attr("data-checked", "true").data("checked", true);
                    } else {
                        this_li.removeClass("seedv").addClass("seedu").attr("data-checked", "false").data("checked", false);
                    }
                }
            });
            saveaddresses(currency, false);
            check_currency(currency);
        }
    });
}

function continue_seed() {
    $(document).on("click", "#continue_seed", function() {
        finish_seed();
    })
}

function skip_verify() {
    $(document).on("click", "#cfbu3", function() {
        var content = "<h2><span class='icon-warning' style='color:#B33A3A'></span>Warning! Continue at your own risk.</h2><p><strong>If you lose your device, uninstall your application or clear your browserdata, you'll need your secret phrase to recover your funds!</strong></p>";
        popdialog(content, "alert", "finish_seed");
    })
}

function finish_seed() {
    canceldialog();
    if (haspin() === true) {
        seed_callback();
    } else {
        var cb = {
                "func": seed_callback
            },
            content = pinpanel("", cb);
        showoptions(content, "pin");
    }
}

function seed_callback() {
    if (hasbip === true) {} else {
        var seed_object = {},
            seed_string = btoa(JSON.stringify(phrasearray)),
            phraseid = hmacsha(seed_string, "sha256").slice(0, 8);
        seed_object.pid = phraseid;
        seed_object.pob = seed_string;
        seedenc = btoa(JSON.stringify(seed_object)),
            savedat = JSON.stringify({
                "id": phraseid,
                "dat": seedenc,
            });
        localStorage.setItem("bitrequest_bpdat", savedat);
        localStorage.setItem("bitrequest_tp", $.now());
        bipobj = localStorage.getItem("bitrequest_bpdat"),
            hasbip = true;
        bipid = phraseid;
        notify("🎉 Congratulations. You are now your own bank! 🎉");
        var seedobject = ls_phrase_obj(),
            seedid = seedobject.pid,
            savedseed = seedobject.pob.join(" ");
        if (body.hasClass("showstartpage")) {
            derive_all_init(savedseed, seedid);
            openpage("?p=home", "home", "loadpage");
            var currency = $("#seed_steps").attr("data-goal");
            $("#currencylist > li[data-currency='" + currency + "'] .rq_icon").trigger("click");
        } else {
            var derivations = filter_all_addressli("seedid", seedid);
            if (derivations.length > 0) {
                move_seed_cb();
            }
            deactivate_xpubs();
            derive_all(savedseed, seedid);
            savecurrencies(true);
        }
        enc_s();
    }
    if (phraseverified === true) {
        // save as verified
        var initdat = localStorage.getItem("bitrequest_init"),
            iodat = (initdat) ? JSON.parse(initdat) : {};
        iodat.bipv = "yes";
        localStorage.setItem("bitrequest_init", JSON.stringify(iodat));
        bipv = true;
        topnotify("Passphrase verified");
    } else {
        notify("Please backup your secret phrase asap");
    }
    hide_seed_panel();
}

function deactivate_xpubs() {
    $.each(bitrequest_coin_data, function(i, coinconfig) {
        var bip32 = coinconfig.settings.Xpub;
        if (bip32.xpub === true) {
            var currency = coinconfig.currency,
                thislist = $("#" + currency + "_settings .cc_settinglist li[data-id='Xpub']"),
                this_switch = thislist.find(".switchpanel.custom");
            thislist.data("selected", false).find("p").html("false");
            this_switch.removeClass("true").addClass("false");
            save_cc_settings(currency);
        }
    });
}

// Test triggers

function derive_test_trigger() {
    $(document).on("click", "#testtriggerxx", function() {
	    var seedobject = ls_phrase_obj(),
			seedid = seedobject.pid,
			savedseed = seedobject.pob.join(" ");
		derive_all(savedseed, seedid, true);
    })
}

function enc_s() {
    if (test_derive === true) {
        if (hasbip === true) {
            var p = get_setting("pinsettings", "pinhash");
            if (p !== null) {
                var s_obj = JSON.parse(bipobj),
                    s_id = s_obj.id,
                    keystring = ptokey(p, s_id);
                encb = aes_enc(JSON.stringify(s_obj.dat), keystring);
                s_obj.datenc = {
                    "id": s_id,
                    "dat": encb
                };
                localStorage.setItem("bitrequest_bpdat", JSON.stringify(s_obj));
                bipobj = localStorage.getItem("bitrequest_bpdat");
            }
        }
    }
}

function has_datenc() {
    if (hasbip === true) {
        var s_obj = JSON.parse(bipobj);
        if (s_obj.datenc) {
            return true;
        }
    }
    return false;
}

function ptokey(p, sid) {
    var pr = p.toString().split(""),
        newarr = [];
    $.each(pr, function(i, val) {
        var v_int = parseFloat(val),
            valc = (v_int === 0) ? v_int + 1 : v_int,
            multval = valc * (i + 1);
        newarr.push(multval);
    });
    var maxval = Math.max.apply(Math, newarr),
        wordarr = [];
    $.each(newarr, function(i, val) {
        var perc = Math.floor((val / maxval) * 2048);
        wordarr.push(wordlist[perc - 1]);
    });
    return key = hmacsha(wordarr.join(" ") + sid, "sha256").slice(0, 32);
}

function derive_addone_trigger() {
    $(document).on("click", ".addonexx", function() {
        derive_addone($(this).attr("data-currency"), true);
    })
}

function derive_addone(currency, extra) {
	var dd = derive_data(currency, extra);
	if (dd) {
		derive_add_address(currency, dd);
    }
}

function key_cc() {
    var seedobject = ls_phrase_obj();
    if (seedobject) {
        var seedid = seedobject.pid,
            phrase = seedobject.pob.join(" "),
			seed = toseed(phrase),
            rootkey = get_rootkey(seed),
            key = rootkey.slice(0, 64),
            cc = rootkey.slice(64)
        return {
            "key": key,
            "cc": cc,
            "seed": seed,
            "seedid": seedid
        }
    } else {
        return false;
    }
}

function key_cc_xpub(xpub) {
    var ext_dec = b58check_decode(xpub),
        extend_object = objectify_extended(ext_dec);
    return {
        "key": extend_object.key,
        "cc": extend_object.chaincode
    }
}

function get_rootkey(seed) {
    return hmac_bits(seed, tobits("Bitcoin seed"), "hex");
}

function derive_all_init(phrase, seedid, extra) {
    derive_all(phrase, seedid, extra);
    var acountname = $("#eninput").val();
    $("#accountsettings").data("selected", acountname).find("p").html(acountname);
    savesettings();
    savecurrencies(true);
    body.removeClass("showstartpage");
}

function derive_all(phrase, seedid, extra) {
    var seed = toseed(phrase),
        rootkey = get_rootkey(seed),
        master_key = rootkey.slice(0, 64),
        master_chaincode = rootkey.slice(64);
    $.each(bitrequest_coin_data, function(i, coinconfig) {
        var currency = coinconfig.currency,
            coindat = coinconfig.data,
            bip32 = coinconfig.settings.Xpub;
        if (bip32.active === true && c_derive[currency]) {
	        var ad = derive_obj("seed", seed, master_key, master_chaincode, coindat, bip32, seedid, extra);
	        if (ad) {
		        derive_add_address(currency, ad);
	        }
        }
    });
}

function derive_add_address(currency, ad) {
	appendaddress(currency, ad);
    saveaddresses(currency, true);
    $("#usedcurrencies > li[data-currency='" + currency + "']").attr("data-checked", "true").data("checked", true); // each
    $("#currencylist > li[data-currency='" + currency + "']").removeClass("hide"); // each
}

function derive_data(currency, extra) {
    if (test_derive === true && c_derive[currency]) {
        var coindat = getcoindata(currency),
            bip32 = getbip32dat(currency),
            activepub = active_xpub(currency);
        if (bip32) {
	        if (activepub) {
	            var xpubkey = activepub.key,
	                xpub_id = activepub.key_id,
	                keycc = key_cc_xpub(xpubkey),
					ad = derive_obj("xpub", false, keycc.key, keycc.cc, coindat, bip32, xpub_id, extra);
		        if (ad) {
			       return ad;
		        }
	        } else {
	            var keycc = key_cc();
	            if (keycc) {
		            var ad = derive_obj("seed", keycc.seed, keycc.key, keycc.cc, coindat, bip32, keycc.seedid, extra);
			        if (ad) {
				        return ad;
			        }
	            }
	        }
	    }
    }
    return false;
}

function derive_obj(source, seed, key, cc, coindat, bip32, seedid, add) {
    var currency = coindat.currency,
        id_key = source + "id",
        addressli = get_addresslist(currency).children("li"),
        deriveli = filter_list(addressli, id_key, seedid),
        actives = deriveli.not(".used"),
        check_p = (actives.length) ? ch_pending(actives.first().data()) : false;
    if (!actives.length || check_p === true || add) {
	    var allength = deriveli.length,
	        index = (allength > 1) ? get_latest_index(deriveli) + 1 : allength,
	        root_path = (source == "xpub") ? "M/" : (source == "seed") ? bip32.root_path : "",
	        path = root_path + index,
	        x_keys_dat = derive_x(path, key, cc),
	        key_object = format_keys(seed, x_keys_dat, bip32, index, currency),
	        address = key_object.address,
	        ccsymbol = coindat.ccsymbol,
	        index_str = (index > 0) ? index : "new",
	        checkname = addressli.filter(".seed"),
			checkname_array = dom_to_array(checkname, id_key),
	        get_unique = get_uniques(checkname_array),
	        uniques = ($.inArray(seedid, checkname_array) === -1) ? get_unique : get_unique - 1,
	        alpha_prefixes = "abcdefghijklmnopqrstuvwxyz",
	        prefix = alpha_prefixes.charAt(uniques),
	        label = source + "_" + prefix + index_str,
	        this_data = {
	            "derive_index": index,
	            "currency": currency,
	            "address": address,
	            "ccsymbol": ccsymbol,
	            "cmcid": coindat.cmcid,
	            "erc20": false,
	            "checked": true,
	            "label": label
	        },
	        vk = key_object.vk;
	    if (vk) {
		   this_data.vk = vk; 
	    }
	    this_data[source + "id"] = seedid;
	    return this_data;
    }
    return false;
}

function ch_pending(dat) {
    return $("#requestlist li[data-address='" + dat.address + "'][data-pending='scanning'][data-cmcid='" + dat.cmcid + "']").length > 0;
}

function get_uniques(arr) {
    var counts = {};
    for (var i = 0; i < arr.length; i++) {
        counts[arr[i]] = 1 + (counts[arr[i]] || 0);
    }
    return Object.keys(counts).length;
}

function copy_phrase() {
    $(document).on("click", "#copyphrase", function() {
        var phrase = get_phrase(),
            verify = check_phrase(phrase);
        if (verify === true) {
            var result = confirm("Copy secret phrase?");
            if (result === true) {
                copytoclipboard(phrase, "secret phrase");
            }
        } else {
            topnotify(verify);
        }
    });
}

function show_phrase() {
    $(document).on("click", "#showphrase, #phrase_cb.hidephrase #phraseblur", function() {
        var phrase_cb = $("#phrase_cb");
        if (phrase_cb.hasClass("showphrase")) {
            phrase_cb.removeClass("showphrase").addClass("hidephrase");
        } else {
            if (hasbip === true) {
                if (bipv === true) {
                    show_phrase_callback();
                } else {
                    all_pinpanel({
                        "func": show_phrase_callback
                    })
                }
            } else {
                show_phrase_callback();
            }
        }
    })
}

function show_phrase_callback() {
    $("#phrase_cb").addClass("showphrase").removeClass("hidephrase");
}

function delete_phrase_trigger() {
    $(document).on("click", "#deletephrase", function() {
        var content = "<h2 style='color:#B33A3A'><span class='icon-warning'></span>Warning! Deleting your seed may result in lost of funds.</h2><p><strong>Continue only if you have a backup of your secret phrase.</strong></p>";
        popdialog(content, "alert", "delete_phrase_verify");
    });
}

function delete_phrase_verify() {
    canceldialog();
    var phrase = get_phrase(),
        words = phrase.split(" ");
    verify_phrase(words, 4);
    $("#seed_steps").removeClass("checked");
    $("#seed_step3").addClass("delete");
    seed_nav(3);
}

// Bip 32 Key derivation

function hmac_encrypt(key) {
    var hasher = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    this.encrypt = function() {
        return hasher.encrypt.apply(hasher, arguments);
    };
}

function toseed(mnemonic, passphrase) {
    var parsed = parse_seed(mnemonic, passphrase);
    return frombits(sjcl.misc.pbkdf2(parsed.mnemonic, parsed.passphrase, 2048, 512, hmac_encrypt));
}

function parse_seed(mnemonic, passphrase) {
    var passphrase = passphrase || "",
        mnemonicNormalized = cleanstring(mnemonic),
        passphrase = normalizestring(passphrase),
        passphrase = "mnemonic" + passphrase;
    return {
        "mnemonic": tobits(mnemonicNormalized),
        "passphrase": tobits(passphrase)
    }
}

function newseed(numWords) {
    var strength = numWords / 3 * 32,
        buffer = new Uint8Array(strength / 8),
        data = crypto.getRandomValues(buffer);
    return to_mnemonic(data);
}

function to_mnemonic(byteArray) {
    if (byteArray.length % 4 > 0) {
        throw 'Data length in bits should be divisible by 32, but it is not (' + byteArray.length + ' bytes = ' + byteArray.length * 8 + ' bits).'
    }
    var data = byteArrayToWordArray(byteArray);
    h = hmacsha(data, "sha256"),
        a = byteArrayToBinaryString(byteArray),
        c = zfill(hexStringToBinaryString(h), 256),
        d = c.substring(0, byteArray.length * 8 / 32),
        b = a + d;
    result = [],
        blen = b.length / 11;
    for (var i = 0; i < blen; i++) {
        var idx = parseInt(b.substring(i * 11, (i + 1) * 11), 2);
        result.push(wordlist[idx]);
    }
    return joinwords(result);
}

function zfill(source, length) {
    var source = source.toString();
    while (source.length < length) {
        source = '0' + source;
    }
    return source;
}

// bip32 Derivation

function objectify_extended(extended) {
    var version = extended.slice(0, 8),
        remain = extended.slice(8),
        depth = remain.slice(0, 2),
        remain = remain.slice(2),
        fingerprint = remain.slice(0, 8),
        remain = remain.slice(8),
        child_number = remain.slice(0, 8),
        remain = remain.slice(8),
        chain_code = remain.slice(0, 64),
        remain = remain.slice(64),
        parent_key = remain.slice(0, 66),
        remain = remain.slice(66);
    return {
        "version": version,
        "depth": depth,
        "fingerprint": fingerprint,
        "childnumber": child_number,
        "chaincode": chain_code,
        "key": parent_key,
        "remain": remain
    }
}

function derive_x(dpath, parent_key, parent_cc, from_x_priv) {
    var keydat = {},
        key = parent_key,
        chaincode = parent_cc,
		derive_array = dpath.split("/"),
        levels = derive_array.length - 1,
        xpub = false,
        purpose = null,
        hardened = null,
        childnumber = 0;
    $.each(derive_array, function(i, level) {
        if (i === 0) {
            if (level == "m") {
                xpub = false;
            } else if (level == "M") {
                xpub = true;
                if (from_x_priv === true) {
                    key = secp.Point.fromPrivateKey(parent_key).toHex(true);
                }
            } else {
                return false;
            }
        }
        if (i > 0) {
            var hardened = (xpub === true) ? false : (level.indexOf("'") >= 0) ? true : false,
                childindex = (hardened === true) ? level.split("'")[0] : level,
                childfloat = parseInt(childindex),
                childnumber = (hardened === true) ? dectohex(childfloat + 2147483648) : str_pad(dectohex(childfloat), 8),
                kd = ckd(key, chaincode, childnumber, xpub, hardened);
            if (i === 1) {
                purpose = level;
            }
            if (i === levels) {
                kd.purpose = purpose;
                kd.depth = i,
                    kd.childnumber = childnumber,
                    kd.xpub = xpub;
                keydat = kd;
            } else {
                key = kd.key,
                    chaincode = kd.chaincode;
            }
        }
    });
    return keydat;
}

function ckd(ckey, cc, index, xpub, hard) {
    var ckd = {},
        parent_pub = (xpub === true) ? ckey : secp.Point.fromPrivateKey(ckey).toHex(true),
        pubh60 = hash160(parent_pub),
        fingerprint = pubh60.slice(0, 8),
        keyfeed = (xpub === true) ? parent_pub : (hard === true) ? "00" + ckey : parent_pub,
        rootnode = hmac_bits(keyfeed + index, hextobits(cc), "hex"),
        child_key_pre = rootnode.slice(0, 64),
        child_chaincode = rootnode.slice(64);
    if (xpub === true) {
        var key_point = secp.Point.fromPrivateKey(child_key_pre);
        ckd.key = secp.Point.fromHex(ckey).add(key_point).toHex(true);
    } else {
        var child_key_dec = (hextodec(ckey) + hextodec(child_key_pre)) % oc;
        ckd.key = str_pad(child_key_dec.toString(16), 64);
    }
    ckd.chaincode = child_chaincode;
    ckd.fingerprint = fingerprint;
    return ckd;
}

function keypair_array(seed, arr, startindex, d_path, bip32dat, key, chaincode, currency) {
    var derive_array = [];
    $.each(arr, function(i) {
        var index = i + startindex,
            root_path = d_path + index,
            ext_key_obj = derive_x(root_path, key, chaincode),
            key_object = format_keys(seed, ext_key_obj, bip32dat, index, currency);
        derive_array.push(key_object);
    });
    return derive_array;
}

function ext_keys(eo, currency) {
    var eko = {},
        ext_payload = b58c_x_payload(eo, currency),
        priv_key = eo.key;
    eko.ext_key = b58check_encode(ext_payload);
    if (eo.xpub === false) {
        var pub_key = secp.Point.fromPrivateKey(priv_key).toHex(true),
            pub_obj = {
                "chaincode": eo.chaincode,
                "childnumber": eo.childnumber,
                "depth": eo.depth,
                "fingerprint": eo.fingerprint,
                "xpub": true,
                "key": pub_key
            },
            pub_payload = b58c_x_payload(pub_obj, currency),
            ext_pub = b58check_encode(pub_payload);
        eko.ext_pub = ext_pub;
    }
    return eko;
}

function b58c_x_payload(eo, currency) {
    var xpubdat = getbip32dat(currency),
        xpub = eo.xpub,
        version = (xpub) ? xpubdat.prefix.pubx : xpubdat.prefix.privx,
        v_hex = str_pad(dectohex(version), 8),
        depth = (eo.depth) ? str_pad(eo.depth, 2) : "00",
        fingerprint = (eo.fingerprint) ? eo.fingerprint : "00000000",
        childnumber = (eo.childnumber) ? str_pad(eo.childnumber, 8) : "00000000",
        chaincode = eo.chaincode,
        keyprefix = (xpub === true) ? "" : "00",
        newkey = eo.key;
    if (version && newkey && chaincode) {
        return v_hex + depth + fingerprint + childnumber + chaincode + keyprefix + newkey;
    } else {
        return false;
    }
}

function format_keys(seed, key_object, bip32, index, coin) {
    var ko = {};
    if (coin == "nano") {
        if (seed) {
	        var nano_account = NanocurrencyWeb.wallet.accounts(seed, index, index)[0];
            ko = {
                "index": nano_account.accountIndex,
                "address": nano_account.address,
                "pubkey": nano_account.publicKey,
                "privkey": nano_account.privateKey
            }
        }
    }
    else if (coin == "monero") {
        if (seed) {
	        var ssk = get_ssk(seed, true),
	    		xko = xmr_getpubs(ssk, index);
	    	ko = {
                "index": index,
                "address": xko.address,
                "vk": xko.account + xko.svk
            }
        }
    }
    else {
        var purpose = key_object.purpose,
            xpub = key_object.xpub,
            prekey = key_object.key,
            pubkey = (xpub === true) ? prekey : secp.Point.fromPrivateKey(prekey).toHex(true),
            vb = str_pad(dectohex(bip32.prefix.pub), 2);
        ko.index = index;
        if (coin == "ethereum") {
            if (xpub === true) {
                ko.address = pub_to_eth_address(pubkey);
            } else {
                ko.address = web3.eth.accounts.privateKeyToAccount("0x" + prekey).address;
            }
        }
        else if (coin == "bitcoin") {
            if (purpose.indexOf("84") > -1) {
                ko.address = pub_to_address_bech32("bc", pubkey);
            } else {
                ko.address = pub_to_address(vb, pubkey);
            }
        } 
        else {
            ko.address = pub_to_address(vb, pubkey);
        }
        ko.pubkey = (coin == "ethereum") ? "0x" + pubkey : pubkey;
        if (xpub === false) {
            if (coin == "ethereum") {
                ko.privkey = "0x" + prekey;
            } else {
                var pkv = bip32.pk_vbytes.wif;
                ko.privkey = privkey_wif(str_pad(dectohex(pkv), 2), prekey, true);
            }

        }
    }
    return ko;
}

function xpub_prefix(currency) {
    var test_rootkey = get_rootkey(expected_seed),
        test_master_priv = test_rootkey.slice(0, 64),
        test_master_chaincode = test_rootkey.slice(64),
        dpath = "m/0",
        x_keys_dat = derive_x(dpath, test_master_priv, test_master_chaincode),
        x_keys = ext_keys(x_keys_dat, currency);
    return x_keys.ext_pub.slice(0, 4);
}

// Phrase info

function phrase_info() {
    $(document).on("click", "#phrase_info", function() {
        phrase_info_pu(null);
    })
}

function phrase_info_pu(coin) {
    var savedseed = (hasbip === true) ? ls_phrase_obj().pob.join(" ") : false,
        phrase = (savedseed) ? savedseed : get_phrase();
    if (phrase.length < 50) {
        return false
    }
    var seed = toseed(phrase),
        rootkey = get_rootkey(seed),
        key = rootkey.slice(0, 64),
        cc = rootkey.slice(64),
        root_dat = {
            "key": key,
            "cc": cc,
            "seed": seed,
            "xpub": false,
        },
        singleclass = (coin) ? "single" : "",
        rootclass = (coin) ? "pd_" + coin : "pd_bitcoin",
        sourceed_str = (coin) ? "<li><strong>Source: </strong> Seed</li>" : "<li><strong>BIP39 Seed: </strong><span class='adboxl adbox select'>" + seed + "</span></li>",
        pk_string = (coin) ? "<li class='clearfix'><span id='export_keys' class='ref' data-currency='" + coin + "'>Private keys</span><div id='pks_box'></div></li>" : "",
        coindat = (coin) ? getcoindata(coin) : null,
        header_str = (coin) ? "<h2>" + getcc_icon(coindat.cmcid, coindat.ccsymbol + "-" + thiscurrency, coindat.erc20) + " <span>" + thiscurrency + " Key Derivation</span></h2>" : "",
        sbu_val = get_setting("backup", "sbu"),
        sbu_str = (has_datenc() === true) ? "<div class='si_li'><strong>Backup seed:</strong><div id='toggle_sbu_span' class='ait'>" + switchpanel(sbu_val, " global") + "</div></div>" : "",
        del_phr_str = (coin) ? "" : (hasbip === true) ? sbu_str + "<div class='si_li noline'><div id='deletephrase' class='icon-bin'></div></div>" : "",
        content = $("<div id='ad_info_wrap' class='" + singleclass + "' data-class='" + rootclass + "'>" + header_str + "<ul>" +
            sourceed_str +
            "<li id='pi_li' class='noline'><strong>Key derivations: </strong>\
    		<div id='pi_icons'>\
    		</div>\
    	</li>\
    	<li>\
    		<div id='d_paths'>\
    		</div>\
    	</li>\
    	<li class='noline'>\
    		<div id='bip_mi' class='ref'>Compatible wallets:</div>\
    		<div id='bip_mibox'>\
    			<div id='supported_wallets'>\
				</div>" + del_phr_str +
            "</div>\
    	</li>\
    	</ul>\
	</div>").data(root_dat);
    popdialog(content, "alert", "canceldialog");
    $.each(bitrequest_coin_data, function(i, coinconfig) {
        var currency = coinconfig.currency,
            ccsymbol = coinconfig.data.ccsymbol,
            walletdat = coinconfig.wallets,
            bip32dat = coinconfig.settings.Xpub;
        if (bip32dat.active === true) {
            var root_path = bip32dat.root_path,
                startindex = 0,
                derivelist = "",
                walletlist = "",
                lb = (currency == "nano") ? "<br/>" : " ",
                derive_array = keypair_array(seed, new Array(5), startindex, root_path, bip32dat, key, cc, currency),
                coinclass = " pd_hide pd_" + currency;
            $.each(derive_array, function(i, val) {
                var index = startindex + i;
                derivelist += "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> " + lb + val.address + "</li>";
            });
            if (walletdat) {
                var platform = getplatform(getdevicetype()),
                    store_icon = (platform == "playstore") ? "button-playstore-v2.svg" :
                    (platform == "appstore") ? "button-appstore.svg" : "button-desktop_app.svg",
                    store_tag = (store_icon) ? "<img src='img/" + store_icon + "'/>" : "<span class='icon-download'></span> ",
                    wallets = walletdat.wallets;
                $.each(wallets, function(key, value) {
                    var device_url = value[platform];
                    if (device_url && value.seed === true) {
                        var walletname = value.name,
                            website = value.website,
                            wallet_icon = "<img src='img/icons/wallet-icons/" + walletname + ".png' class='wallet_icon'/>";
                        walletlist += "<li><a href='" + website + "' target='_blank' class='exit app_dll'>" + wallet_icon + walletname + "</a><a href='" + device_url + "' target='_blank' class='exit store_tag'>" + store_tag + "</a></li>";
                    }
                });
            }
            var icon_node = $("<img src='img/logos/" + ccsymbol + "-" + currency + ".png' data-class='pd_" + currency + "'/>"),
                dp_node_dat = {
                    "bip32": bip32dat,
                    "currency": currency
                },
                xmr_phrase = (currency == "monero") ? secret_spend_key_to_words(get_ssk(seed, true)) : false,
                xmr_phrase_box = (xmr_phrase) ? "<div><strong>XMR Seed words: </strong><br/><span class='adboxl adbox select'>" + xmr_phrase + "</span></div>" : "",
                dp_node = $("<div class='d_path" + coinclass + "'>\
				<div class='d_path_header'><strong>Derivation path: </strong><span class='ref'>" + root_path + "</span></div>" +
					xmr_phrase_box +
    				"<div class='d_path_body clearfix'>\
    					<div class='td_bar'>\
							<div class='td_next button'>Next</div><div class='td_prev button'>Prev</div>\
						</div>\
						<ul class='td_box'>" + derivelist + "</ul>\
    				</div>\
    			</div>").data(dp_node_dat),
                sw_node = $("<ul id='formbox_ul' class='clearfix" + coinclass + "'>" + walletlist + "</ul>");
            if (c_derive[currency]) {
	            $("#pi_icons").append(icon_node);
				$("#d_paths").append(dp_node);
            }
            $("#supported_wallets").append(sw_node);
            pi_show();
        }
    });
}

function phrase_coin_info() {
    $(document).on("click", "#pi_icons img", function() {
        $("#ad_info_wrap").attr("data-class", $(this).attr("data-class"));
        pi_show();
    })
}

function toggle_dpaths() {
    $(document).on("click", "#ad_info_wrap .d_path_header", function() {
        var d_body = $(".d_path_body");
        if (d_body.is(":visible")) {
            d_body.slideUp(200);
        } else {
            d_body.slideDown(200);
        }
    })
}

function pi_show() {
    var mclass = $("#ad_info_wrap").attr("data-class");
    $(".pd_hide").hide();
    $(".pd_hide." + mclass).show();
    $("#pi_icons img").removeClass("current");
    $("#pi_icons img[data-class='" + mclass + "']").addClass("current");
}

function test_derive_next() {
    $(document).on("click", ".td_next", function() {
        test_derive_function($(this));
    })
}

function test_derive_prev() {
    $(document).on("click", ".td_prev", function() {
        test_derive_function($(this), true);
    })
}

function test_derive_function(thisnode, prev) {
    var kd = $("#ad_info_wrap").data(),
        dp_node = thisnode.closest(".d_path"),
        dnd = dp_node.data(),
        currency = dnd.currency;
    if (c_derive[currency]) {
	    var test_derive_box = dp_node.find(".td_box"),
	        td_prev = dp_node.find(".td_prev"),
	        count = 5,
	        td_li = (prev === true) ? test_derive_box.find(".der_li").first() : test_derive_box.find(".der_li").last(),
	        der_index = (td_li.length) ? parseInt(td_li.attr("data-index")) : 0,
	        startindex = (der_index === 0) ? 0 : (prev === true) ? der_index - count : der_index + 1;
	    if (startindex > 1) {
	        td_prev.show();
	    } else {
	        td_prev.hide();
	    }
	    var bip32dat = dnd.bip32,
	        key = kd.key,
	        chaincode = kd.cc,
	        lb = (currency == "nano") ? "<br/>" : " ",
	        root_path = (kd.xpub === true) ? "M/" : bip32dat.root_path,
	        derive_array = keypair_array(kd.seed, new Array(count), startindex, root_path, bip32dat, key, chaincode, currency);
	    test_derive_box.html("");
	    $.each(derive_array, function(i, val) {
	        var index = startindex + i,
	            tdb_li = "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> " + lb + val.address + "</li>";
	        test_derive_box.append(tdb_li);
	    });
    }
}

function phrase_moreinfo() {
    $(document).on("click", "#bip_mi", function() {
        var thisbttn = $(this),
        bmb = $("#bip_mibox");
        if (bmb.is(":visible")) {
            bmb.slideUp(200);
            //thisbttn.text("Compatible wallets:");
        } else {
            bmb.slideDown(200);
            //thisbttn.text("Hide");
        }
    })
}