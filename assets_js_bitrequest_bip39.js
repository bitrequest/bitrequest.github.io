const glob_test_phrase = "army van defense carry jealous true garbage claim echo media make crunch", // random phrase used for test derive
    glob_expected_seed = "5b56c417303faa3fcba7e57400e120a0ca83ec5a4fc9ffba757fbe63fbd77a89a1a3be4c67196f57c39a88b76373733891bfaba16ed27a813ceed498804c0570", // expected seed used for test derive
    glob_expected_address = "1HQ3rb7nyLPrjnuW85MUknPekwkn7poAUm", // expected addres used for test derive
    glob_expected_bech32 = "bc1qg0azlj4w2lrq8jssrrz6eprt2fe7f7edm4vpd5", // expected bech32 addres used for test derive

    glob_expected_ltc_address = "LZakyXotaE29Pehw21SoPuU832UhvJp4LG",
    glob_expected_bch_cashaddr = "qp5p0eur784pk8wxy2kzlz3ctnq5whfnuqqpp78u22",
    glob_expected_doge_address = "DKvWg8UhQSycj1J8QVxeBDkRpbjDkw3DiW",
    glob_expected_eth_address = "0x2161DedC3Be05B7Bb5aa16154BcbD254E9e9eb68",
    glob_c_derive = {
        "bitcoin": true,
        "litecoin": true,
        "dogecoin": true,
        "nano": true,
        "monero": true,
        "ethereum": true,
        "bitcoin-cash": true,
        "nimiq": false,
        "kaspa": false
    },
    glob_can_xpub = {
        "bitcoin": true,
        "litecoin": true,
        "dogecoin": true,
        "nano": false,
        "monero": false,
        "ethereum": true,
        "bitcoin-cash": true,
        "nimiq": false,
        "kaspa": false
    };
let glob_test_derive = true,
    glob_phrasearray,
    glob_has_bigint = false,
    glob_phraseverified;

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
    //cxpub
    //getbip32dat
    //hasbip32

    // Bip 39 seed generation
    make_seed();
    restore_seed();
    restore_seed_verify();
    //get_seedid
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
    //seed_decrypt
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
    //derive_addone_trigger();
    //derive_addone
    //get_latest_index
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
    //xpub_obj
    //b58c_x_payload
    //format_keys
    //xpub_prefix

    // Phrase info
    phrase_info();
    //phrase_info_pu
    //compatible_wallets
    //w_icon
    phrase_coin_info();
    toggle_dpaths();
    //pi_show
    test_derive_next();
    test_derive_prev();
    //test_derive_function
    phrase_moreinfo();
    phrase_showxp();
});

function hasbigint() {
    try {
        if (typeof BigInt("1") == "bigint") {
            glob_has_bigint = true;
        }
    } catch (err) {
        console.log(err.message);
    }
}

function istrial() {
    const trialp = br_get_local("tp");
    if (trialp) {
        const twelvehours = 43200000;
        if ((now() - parseFloat(trialp)) < twelvehours) {
            return true;
        }
    }
    return false;
}

// Reminder to write down secret phrase

function bipv_pass() {
    if (glob_hasbip === true) {
        if (glob_bipv === true) {
            return true;
        }
        const used_addresses = filter_all_addressli("seedid", glob_bipid).filter(".used");
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
    return true;
}

// dependencies check

function test_bip39() {
    if (crypto === undefined) { // test for window.crypto
        bip39_fail();
        glob_test_derive = false;
    }
    if (glob_has_bigint === false) { // test for js BigInt
        bip39_fail();
        glob_test_derive = false;
    }
    const k_str = glob_expected_seed.slice(0, 32),
        enc_test = aes_enc(glob_test_phrase, k_str),
        dec_test = aes_dec(enc_test, k_str);
    if (glob_test_phrase != dec_test) { // test encryption
        bip39_fail();
        glob_test_derive = false;
    }
    if (toseed(glob_test_phrase) != glob_expected_seed || test_derivation() === false) {
        derive_fail(["bitcoin", "litecoin", "dogecoin", "ethereum", "bitcoin-cash"]);
        glob_c_derive.bitcoin = false,
            glob_c_derive.litecoin = false,
            glob_c_derive.dogecoin = false,
            glob_c_derive.ethereum = false,
            glob_c_derive["bitcoin-cash"] = false;
    }
    if (bech32_check() === false) { // test for bech32 Derivation
        derive_fail(["bitcoin"]);
        glob_c_derive.bitcoin = false;
    }
    if (cashaddr_check() === false) { // test for BCH cashaddr Derivation
        derive_fail(["bitcoin-cash"]);
        glob_c_derive["bitcoin-cash"] = false;
    }
    if (nano_check() === false) { // test for nano Derivation
        derive_fail(["nano"]);
        glob_c_derive.nano = false;
    }
    if (xmr_check() === false) { // test for xmr Derivation
        derive_fail(["monero"]);
        glob_c_derive.monero = false;
    }
    // check xpub derivation
    if (xpub_check() === false) { // test for btc xpub derivation
        derive_xpub_fail(["bitcoin", "litecoin", "dogecoin", "bitcoin-cash"]);
        glob_can_xpub.bitcoin = false,
            glob_can_xpub.litecoin = false,
            glob_can_xpub.dogecoin = false,
            glob_can_xpub["bitcoin-cash"] = false;
    }
    if (eth_xpub_check() === false) { // test for ethereum xpub derivation
        derive_xpub_fail(["ethereum"]);
        glob_can_xpub.ethereum = false;
    }
}

function bip39_fail() {
    glob_body.addClass("nobip");
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
    const currency = "bitcoin",
        test_rootkey = get_rootkey(glob_expected_seed),
        bip32dat = getbip32dat(currency),
        dx_dat = {
            "dpath": "m/44'/0'/0'/0/0",
            "key": test_rootkey.slice(0, 64),
            "cc": test_rootkey.slice(64)
        },
        x_keys_dat = derive_x(dx_dat),
        key_object = format_keys(glob_expected_seed, x_keys_dat, bip32dat, 0, currency);
    if (key_object.address == glob_expected_address) {
        return true;
    }
    return false;
}

function bech32_check() {
    const bip84_pub = "03bb4a626f63436a64d7cf1e441713cc964c0d53289a5b17acb1b9c262be57cb17",
        bip84_bech32 = pub_to_address_bech32("bc", bip84_pub);
    if (glob_expected_bech32 == bip84_bech32) {
        return true;
    }
    return false;
}

function cashaddr_check() {
    const bch_legacy = "1AVPurYZinnctgGPiXziwU6PuyZKX5rYZU",
        bch_cashaddr = pub_to_cashaddr(bch_legacy);
    if (glob_expected_bch_cashaddr == bch_cashaddr) {
        return true;
    }
    return false;
}

function nano_check() {
    const expected_nano_address = "nano_1mbtirc4x3kixfy5wufxaqakd3gbojpn6gpmk6kjiyngnjwgy6yty3txgztq",
        xnano_address = NanocurrencyWeb.wallet.accounts(glob_expected_seed, 0, 0)[0].address;
    if (expected_nano_address == xnano_address) {
        return true;
    }
    return false;
}

function xmr_check() { // https://coinomi.github.io/tools/bip39/
    const expected_xmr_address = "477h3C6E6C4VLMR36bQL3yLcA8Aq3jts1AHLzm5QXipDdXVCYPnKEvUKykh2GTYqkkeQoTEhWpzvVQ4rMgLM1YpeD6qdHbS",
        ssk = get_ssk(glob_expected_seed, true),
        xko = xmr_getpubs(ssk, 0);
    if (xko.address == expected_xmr_address) {
        return true;
    }
    return false;
}

function xpub_check() {
    const currency = "bitcoin",
        xpub_keycc = key_cc_xpub("xpub6Cy7dUR4ZKF22HEuVq7epRgRsoXfL2MK1RE81CSvp1ZySySoYGXk5PUY9y9Cc5ExpnSwXyimQAsVhyyPDNDrfj4xjDsKZJNYgsHXoEPNCYQ"),
        dx_dat = {
            "dpath": "M/0/0",
            "key": xpub_keycc.key,
            "cc": xpub_keycc.cc,
            "vb": xpub_keycc.version
        },
        x_keys_dat = derive_x(dx_dat),
        bip32dat = getbip32dat(currency),
        key_object = format_keys(null, x_keys_dat, bip32dat, 0, currency),
        xpub_address = key_object.address,
        xpub_wildcard_address = "bc1qk0wlvl4xh3eqe5szqyrlcj4ws8633vz0vhhywl"; // wildcard for bech32 Xpubs (Zpub)
    if (xpub_address == glob_expected_address || xpub_address == xpub_wildcard_address) {
        return true;
    }
    return false;
}

function eth_xpub_check() {
    const eth_pub = "03c026c4b041059c84a187252682b6f80cbbe64eb81497111ab6914b050a8936fd",
        eth_address = pub_to_eth_address(eth_pub);
    if (glob_expected_eth_address == eth_address) {
        return true;
    }
    return false;
}

// Check derivationsn

function check_derivations(currency) {
    if (glob_test_derive === true && glob_c_derive[currency]) {
        const activepub = active_xpub(currency);
        if (cxpub(currency) && activepub) {
            return "xpub";
        }
        if (glob_hasbip === true) {
            return "seed";
        }
    }
    return false;
}

function active_xpub(currency) {
    const haspub = has_xpub(currency)
    if (haspub) {
        if (haspub.selected === true) {
            return haspub;
        }
    }
    return false;
}

function has_xpub(currency) {
    const ispub = is_xpub(currency);
    if (ispub) {
        if (ispub.key) {
            return ispub;
        }
    }
    return false;
}

function is_xpub(currency) {
    if (cxpub(currency)) {
        const xpubli_dat = cs_node(currency, "Xpub", true);
        if (xpubli_dat) {
            return xpubli_dat;
        }
    }
    return false;
}

function cxpub(currency) {
    if (glob_can_xpub[currency]) {
        return true;
    }
    return false;
}

function getbip32dat(currency) {
    const xpub_dat = cs_node(currency, "Xpub", true);
    if (xpub_dat && xpub_dat.active === true) {
        return xpub_dat;
    }
    const coindata = getcoinconfig(currency);
    if (coindata) {
        const xpubdat = coindata.settings.Xpub;
        if (xpubdat && xpubdat.active) {
            return xpubdat;
        }
    }
    return false;
}

function hasbip32(currency) {
    const coindata = getcoinconfig(currency);
    if (coindata) {
        const settings = coindata.settings;
        if (settings) {
            const xpub = settings.Xpub;
            if (xpub) {
                if (xpub.active) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Bip 39 seed generation

function make_seed() {
    $(document).on("click", "#option_makeseed", function() {
        const currency = $(this).attr("data-currency");
        if (glob_hasbip === true) {
            topnotify(translate("alreadyhavesecretphrase"));
            return
        }
        canceldialog();
        manage_bip32({
            "type": currency,
            "edit": true
        });
    })
}

function restore_seed() {
    $(document).on("click", "#rest_seed, .applist.pobox li.seedu .address .srcicon", function() {
        if (is_viewonly() === true) {
            vu_block();
            return false;
        }
        if (glob_hasbip === true) {
            return false;
        }
        const result = confirm(translate("resoresecretphrase") + "?");
        if (result === true) {
            const seedid = $(this).attr("data-seedid");
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
    })
}

function restore_seed_verify() {
    $(document).on("click", "#restore_seed", function() {
        if (glob_hasbip === true) {
            return false;
        }
        glob_phrasearray = null,
            glob_phraseverified = false;
        const phrase = get_phrase(),
            verify = check_phrase(phrase);
        if (verify === true) {
            const seedid = $(this).attr("data-seedid"),
                words = phrase.split(" "),
                phraseid = get_seedid(words);
            if (seedid == phraseid) {
                glob_phrasearray = words,
                    glob_phraseverified = true;
                $("#seed_steps").addClass("checked");
                finish_seed();
                return
            }
            shake($("#bip39phrase"));
            topnotify(translate("wrongsecretphrase"));
            return
        }
        topnotify(verify);
    })
}

function get_seedid(words) {
    return hmacsha(btoa(JSON.stringify(words)), "sha256").slice(0, 8);
}

function manage_bip32(dat) {
    if (glob_hasbip === true) {
        bip39(dat);
        return
    }
    const data = br_dobj(dat, true),
        ddat = [{
                "div": {
                    "class": "popform",
                    "content": [{
                        "div": {
                            "class": "inputwrap",
                            "content": "<p>" + translate("cannotbespend") + "</p>"
                        },
                    }]
                }
            },
            {
                "div": {
                    "id": "pk_confirm",
                    "class": "noselect",
                    "content": [{
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
                            "content": translate("understandandok")
                        }

                    }]
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
        content = $(template_dialog({
            "id": "disclaimer_dialog",
            "icon": "icon-warning",
            "title": translate("disclaimer"),
            "elements": ddat
        })).data(data);
    if ($("#option_makeseed").length) {
        canceldialog();
        setTimeout(function() {
            popdialog(content, "triggersubmit");
        }, 1000);
    } else {
        popdialog(content, "triggersubmit");
    }
}

function submit_disclaimer() {
    $(document).on("click", "#disclaimer_dialog input.submit", function(e) {
        e.preventDefault();
        const disclaimer_dialog = $("#disclaimer_dialog"),
            data = disclaimer_dialog.data(),
            pk_checkbox = disclaimer_dialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked");
        if (pk_checked == true) {
            canceldialog();
            bip39(data);
        } else {
            popnotify("error", translate("consent"));
        }
    })
}

function bip39(dat) {
    glob_phraseverified = false;
    const data = br_dobj(dat, true),
        phrase_obj = ls_phrase_obj(),
        edit = (data && data.edit) ? true : false,
        dtype = (data && data.type) ? data.type : null,
        restore = (dtype == "restore" && edit === true),
        type = (glob_hasbip === true) ? (glob_bipv === true) ? "bipsavedbu" : "bipsaved" : "nobip",
        step = (type == "nobip") ? 1 : (type == "bipsavedbu") ? 2 : 3,
        spclass = (type == "nobip") ? " showphrase" : " hidephrase",
        savedseed = (glob_hasbip === true) ? (phrase_obj) ? phrase_obj.pob.join(" ") : false : false,
        seed = (restore) ? "" : (savedseed) ? savedseed : newseed(12),
        remindp = (dtype == "restore") ? "<p>" + translate("overwritten") + "</p>" : "<p>" + translate("pleaseverify") + "</p>",
        verifyheader = (dtype == "restore") ? translate("verifycurrent") : translate("verifybackup"),
        save_str = (restore) ? translate("entersecretphrase") : translate("writedownsecretphrase"),
        verify_str = (restore) ? "<div id='restore_seed' class='button' data-seedid='" + data.seedid + "'>" + translate("restorebttn") + "</div>" : "<div id='cfbu2' class='button'>" + translate("ivebackeditup") + "</div>",
        markup = $("<div id='seed_steps' class='panel" + step + "' data-goal='" + dtype + "'>\
        <div id='seed_step1' class='seed_step'>\
            <div class='ss_header'>\
                <div class='icon-cross ssnav'></div>\
            </div>\
            <div class='ss_content flex'>\
                <div class='ss_content_box'>\
                    <h2 style='color:#eeac57'>" + translate("important") + "</h2>\
                    <p><strong>" + translate("abouttobecome") + "</strong><br/>" + translate("inthenextscreen") + " <strong style='color:#eeac57'>" + translate("makesure") + "</strong></p>\
                    <p><strong>" + translate("ifyouloseyourdevice") + "</strong></p>\
                    <p class='p_warning' style='text-transform:uppercase'><strong>" + translate("ifyouloseyourphrase") + "</strong></p>\
                </div>\
            </div>\
            <div class='ss_footer'>\
                <div id='cfbu1' class='button'>" + translate("understand") + "</div>\
            </div>\
        </div>\
        <div id='seed_step2' class='seed_step'>\
            <div class='ss_header'>\
                <div class='icon-arrow-left2 ssnav'></div>\
                <div class='icon-cross ssnav'></div>\
            </div>\
            <div class='ss_content flex'>\
                <div id='phrase_cb' class='ss_content_box" + spclass + "'>\
                    <h2 id='showphrase'><span class='icon-eye-blocked eye'></span><span class='icon-eye eye'></span>" + translate("bip39_passphrase") + ":</h2>\
                    <p>" + save_str + "</p>\
                    <div id='phrasewrap'>\
                        <div id='bip39phrase' contenteditable='" + edit + "' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' lang='en' class='noselect'>" + seed + "</div>\
                        <div id='phrase_actions'>\
                            <div id='copyphrase' class='button'>" + translate("copy") + "</div>\
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
                <div class='ss_content_box'><h2>" + verifyheader + "</h2><p id='reminder_seed_backup'>" + translate("congratulations") + "<br/></p>\
                <p id='gpp'>" + translate("withgreatpower") + "<br/><strong>" + translate("remember") + "</strong></p>" + remindp + "<div id='seed_verify_box'>\
                    </div>\
                    <div id='cfbu3_w'>\
                        <div id='cfbu3' class='button'>" + translate("idothislater") + "</div>\
                    </div>\
                </div>\
            </div>\
            <div class='ss_footer'>\
                <div id='continue_seed' class='button'>Continue</div>\
            </div>\
        </div>\
    </div>").data(data);
    $("#seed_panel").html(markup).addClass(type);
    glob_body.addClass("seed_dialog");
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
    if (glob_bipobj) {
        return ls_phrase_obj_parsed(glob_bipobj);
    }
    return false;

}

function ls_phrase_obj_parsed(obj) {
    const pdat_enc = obj.datenc;
    let phrasedat = obj.dat;
    if (pdat_enc) {
        const pdat_dec = s_decode(pdat_enc),
            pdat_dec_dat = pdat_dec.dat;
        if (pdat_dec_dat) {
            phrasedat = pdat_dec_dat;
        }
    }
    if (phrasedat) {
        const datparse = JSON.parse(atob(phrasedat));
        return {
            "pid": datparse.pid,
            "pob": JSON.parse(atob(datparse.pob))
        }
    }
    return false;
}

function seed_decrypt(pin) {
    if (glob_bipobj) {
        const pdat_enc = glob_bipobj.datenc;
        if (pdat_enc) {
            const pdat_dec = s_decode(pdat_enc, pin),
                pdat_dec_dat = pdat_dec.dat;
            if (pdat_dec_dat) {
                return JSON.parse(atob(pdat_dec_dat));
            }
        }
        const pdat_dat = glob_bipobj.dat;
        if (pdat_dat) {
            return JSON.parse(atob(pdat_dat));
        }
    }
    return false;
}

function backup_continue() {
    $(document).on("click", "#cfbu2", function() {
        glob_phrasearray = null,
            glob_phraseverified = false;
        const phrase = get_phrase(),
            verify = check_phrase(phrase);
        if (verify === true) {
            const words = phrase.split(" ");
            verify_phrase(words, 3);
            glob_phrasearray = words;
            $("#seed_steps").removeClass("checked");
            $("#seed_step3").addClass("verify");
            seed_nav(3);
        }
        topnotify(verify);
    })
}

function check_phrase(phrase) {
    const cleanphrase = get_phrase(),
        words = phrase.split(" "),
        phraselength = words.length;
    if (phraselength < 2) {
        return translate("emptyphrase");
    }
    if (phraselength === 12) {
        if (checkmnemonic(phrase) === false) {
            const missing_word = missing_words(words);
            if (missing_word) {
                return translate("notinwordlist", {
                    "missing_word": missing_word
                });
            }
            return translate("notbip39compatible");
        }
        return true;
    }
    return translate("mustbe12characters");
}

function get_phrase() {
    return cleanstring($("#bip39phrase").text());
}

function checkmnemonic(mnemonic) {
    const b = mnemonicToBinaryString(mnemonic);
    if (b === null) {
        return false;
    }
    const l = b.length,
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
    let missing;
    $.each(words, function(i, word) {
        if (wordlist.indexOf(word) == -1) {
            missing = word;
            return
        }
    });
    return missing;
}

function verify_phrase(words, count) {
    const wordindex = [];
    $.each(words, function(i, word) {
        wordobject = {
            "word": word,
            "index": i + 1
        }
        wordindex.push(wordobject);
    });
    const shuffled_words = shuffleArray(wordindex),
        trimmed_sw = shuffled_words.slice(0, count),
        verify_box = $("#seed_verify_box");
    verify_box.html("");
    $.each(trimmed_sw, function(i, word_obj) {
        const word = word_obj.word,
            index = word_obj.index,
            af_attr = (i === 0) ? " autofocus" : "",
            input = "<div class='checkword_box uncheck'><input type='text' placeholder='" + translate("word") + " #" + index + "' data-word='" + word + "'" + af_attr + " autocorrect='off' autocapitalize='none'/><span class='icon-checkmark'></span></div>";
        verify_box.append(input);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)),
            temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function verify_words() {
    $(document).on("input", "#seed_verify_box input", function(e) {
        const thisinput = $(this),
            cw_box = thisinput.closest(".checkword_box"),
            thisword = thisinput.data("word"),
            thisval = thisinput.val();
        if (thisval == thisword) {
            thisinput.blur();
            cw_box.removeClass("uncheck");
            const unchecked = $("#seed_verify_box").find(".uncheck"),
                uclength = unchecked.length;
            if (uclength > 0) {
                const first_uncheck = unchecked.first().find("input");
                setTimeout(function() {
                    first_uncheck.focus().val("");
                }, 500);
                return
            }
            const step3 = $("#seed_step3");
            if (step3.hasClass("delete")) {
                const result = confirm(translate("areyousuredfp"));
                if (result === true) {
                    br_remove_local("bpdat");
                    const initdat = br_get_local("init", true),
                        iodat = br_dobj(initdat, true);
                    iodat.bipv = "no";
                    delete iodat.bipv;
                    br_set_local("init", iodat, true);
                    glob_hasbip = false;
                    glob_bipv = false;
                    glob_bipid = false;
                    move_seed_cb();
                    hide_seed_panel();
                    notify(translate("secretphrasedeleted"));
                }
                return
            }
            if (step3.hasClass("replace")) {
                const result = confirm(translate("restoresecretphrasefrombackup"));
                if (result === true) {
                    const bu_dat = $("#seed_steps").data().dat;
                    restore_callback(bu_dat, true);
                }
                return
            }
            glob_phraseverified = true,
                $("#seed_steps").addClass("checked");
            finish_seed();
            return
        }
        cw_box.addClass("uncheck");
    });
}

function move_seed_cb() {
    $.each(glob_br_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            bip32 = coinconfig.settings.Xpub;
        if (bip32.active) {
            const addresslist = get_addresslist(currency);
            addresslist.children(".adli").each(function(i) {
                const this_li = $(this);
                if (this_li.hasClass("seed")) {
                    const seedid = this_li.data("seedid");
                    if (seedid == glob_bipid) {
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
        const content = "<h2><span class='icon-warning' style='color:#B33A3A'></span>" + translate("continueatownrisk") + "</h2><p><strong>" + translate("ifyouloseyourdevice") + "</strong></p>";
        popdialog(content, "finish_seed");
    })
}

function finish_seed() {
    canceldialog();
    if (haspin(true) === true) {
        seed_callback();
        return
    }
    const cb = {
            "func": seed_callback
        },
        content = pinpanel("", cb);
    showoptions(content, "pin");
}

function seed_callback() {
    if (glob_hasbip === true) {} else {
        const seed_object = {},
            seed_string = btoa(JSON.stringify(glob_phrasearray)),
            phraseid = hmacsha(seed_string, "sha256").slice(0, 8),
            savedat = {
                "id": phraseid,
                "dat": null
            };
        seed_object.pid = phraseid;
        seed_object.pob = seed_string;
        br_set_local("bpdat", savedat, true);
        br_set_local("tp", now());
        glob_bipobj = savedat,
            glob_hasbip = true,
            glob_bipid = phraseid;
        notify("🎉 " + translate("congratulations") + " 🎉");
        const seedid = phraseid,
            savedseed = glob_phrasearray.join(" ");
        if (glob_body.hasClass("showstartpage")) {
            derive_all_init(savedseed, seedid);
            openpage("?p=home", "home", "loadpage");
            const currency = $("#seed_steps").attr("data-goal"),
                homeli = get_homeli(currency);
            homeli.find(".rq_icon").trigger("click");
        } else {
            const derivations = filter_all_addressli("seedid", seedid);
            if (derivations.length > 0) {
                move_seed_cb();
            }
            deactivate_xpubs();
            derive_all(savedseed, seedid);
            savecurrencies(true);
        }
        enc_s(seed_object);
    }
    if (glob_phraseverified === true) {
        // save as verified
        const initdat = br_get_local("init", true),
            iodat = br_dobj(initdat, true);
        iodat.bipv = "yes";
        br_set_local("init", iodat, true);
        glob_bipv = true;
        topnotify(translate("passphraseverified"));
    } else {
        notify(translate("backupasap"));
    }
    hide_seed_panel();
}

function deactivate_xpubs() {
    $.each(glob_br_config.bitrequest_coin_data, function(i, coinconfig) {
        const bip32 = coinconfig.settings.Xpub;
        if (bip32.xpub === true) {
            const currency = coinconfig.currency,
                thislist = cs_node(currency, "Xpub");
            if (thislist) {
                const this_switch = thislist.find(".switchpanel.custom");
                thislist.data("selected", false).find("p").text("false");
                this_switch.removeClass("true").addClass("false");
                save_cc_settings(currency);
            }
        }
    });
}

function enc_s(dat) {
    if (glob_hasbip && glob_test_derive) {
        const pn = get_setting("pinsettings", "pinhash");
        if (pn) {
            let sdat;
            if (dat) {
                sdat = dat;
            } else {
                const phrase_obj = seed_decrypt();
                if (phrase_obj) {
                    sdat = phrase_obj;
                }
            }
            if (sdat) {
                const s_obj = glob_bipobj,
                    seedenc = btoa(JSON.stringify(sdat)),
                    s_id = s_obj.id,
                    keystring = ptokey(pn, s_id),
                    encb = aes_enc(JSON.stringify(seedenc), keystring);
                s_obj.datenc = {
                    "id": s_id,
                    "dat": encb
                };
                s_obj.dat = null;
                br_set_local("bpdat", s_obj, true);
                glob_bipobj = s_obj;
            }
        }
    }
}

function has_datenc() {
    if (glob_hasbip === true) {
        if (glob_bipobj.datenc) {
            return true;
        }
    }
    return false;
}

function ptokey(p, sid) {
    const pr = p.toString().split(""),
        newarr = [];
    $.each(pr, function(i, val) {
        const v_int = parseFloat(val),
            valc = (v_int === 0) ? v_int + 1 : v_int,
            multval = valc * (i + 1);
        newarr.push(multval);
    });
    const maxval = Math.max.apply(Math, newarr),
        wordarr = [];
    $.each(newarr, function(i, val) {
        const perc = Math.floor((val / maxval) * 2048);
        wordarr.push(wordlist[perc - 1]);
    });
    return key = hmacsha(wordarr.join(" ") + sid, "sha256").slice(0, 32);
}

// Test triggers

function get_latest_index(alist) {
    const index = dom_to_array(alist, "derive_index");
    return Math.max.apply(Math, index);
}

function derive_addone_trigger() {
    $(document).on("click", ".addonexx", function() {
        derive_addone($(this).attr("data-currency"), true);
    })
}

function derive_addone(currency, extra) {
    const dd = derive_data(currency, extra);
    if (dd) {
        derive_add_address(currency, dd);
        return true;
    }
    return false;
}

function key_cc() {
    const seedobject = ls_phrase_obj();
    if (seedobject) {
        const seedid = seedobject.pid,
            phrase = seedobject.pob.join(" "),
            seed = toseed(phrase),
            rootkey = get_rootkey(seed),
            key = rootkey.slice(0, 64),
            cc = rootkey.slice(64);
        return {
            "key": key,
            "cc": cc,
            "seed": seed,
            "seedid": seedid
        }
    }
    return false;
}

function key_cc_xpub(xpub) {
    const ext_dec = b58check_decode(xpub),
        extend_object = objectify_extended(ext_dec);
    return {
        "key": extend_object.key,
        "cc": extend_object.chaincode,
        "version": extend_object.version
    }
}

function get_rootkey(seed) {
    return hmac_bits(seed, tobits("Bitcoin seed"), "hex");
}

function derive_all_init(phrase, seedid, extra) {
    derive_all(phrase, seedid, extra);
    const acountname = $("#eninput").val();
    $("#accountsettings").data("selected", acountname).find("p").text(acountname);
    savesettings();
    savecurrencies(true);
    glob_body.removeClass("showstartpage");
}

function derive_all(phrase, seedid, extra) {
    const seed = toseed(phrase),
        rootkey = get_rootkey(seed),
        master_key = rootkey.slice(0, 64),
        master_chaincode = rootkey.slice(64);
    $.each(glob_br_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            coindat = coinconfig.data,
            bip32 = coinconfig.settings.Xpub;
        if (bip32.active && glob_c_derive[currency]) {
            const keycc = {
                "seed": seed,
                "key": master_key,
                "cc": master_chaincode,
                "seedid": seedid
            }
            const ad = derive_obj("seed", keycc, coindat, bip32, extra);
            if (ad) {
                derive_add_address(currency, ad);
            }
        }
    });
}

function derive_add_address(currency, ad) {
    appendaddress(currency, ad);
    saveaddresses(currency, true);
    const currencyli = get_currencyli(currency),
        homeli = get_homeli(currency);
    currencyli.attr("data-checked", "true").data("checked", true); // each
    homeli.removeClass("hide"); // each
}

function derive_data(currency, extra) {
    if (glob_test_derive === true && glob_c_derive[currency]) {
        const coindat = getcoindata(currency),
            bip32 = getbip32dat(currency),
            activepub = active_xpub(currency);
        if (bip32) {
            if (activepub) {
                const xpubkey = activepub.key,
                    xpub_id = activepub.key_id,
                    keycc = key_cc_xpub(xpubkey);
                keycc.seedid = xpub_id;
                const ad = derive_obj("xpub", keycc, coindat, bip32, extra);
                if (ad) {
                    return ad;
                }
            } else {
                const keycc = key_cc();
                if (keycc) {
                    const ad = derive_obj("seed", keycc, coindat, bip32, extra);
                    if (ad) {
                        return ad;
                    }
                }
            }
        }
    }
    return false;
}

function derive_obj(source, keycc, coindat, bip32, add) {
    const seed = keycc.seed,
        seedid = keycc.seedid,
        key = keycc.key,
        cc = keycc.cc,
        versionbytes = keycc.version,
        currency = coindat.currency,
        id_key = source + "id",
        b32rp = bip32.root_path,
        purpose = b32rp.split("/")[1],
        addressli = get_addresslist(currency).children("li"),
        filterli = filter_list(addressli, id_key, seedid),
        deriveli = filter_list(filterli, "purpose", purpose),
        actives = deriveli.not(".used"),
        check_p = (actives.length) ? ch_pending(actives.first().data()) : false;
    if (!actives.length || check_p === true || add) {
        const allength = deriveli.length,
            index = (allength > 1) ? get_latest_index(deriveli) + 1 : allength,
            root_path = (source == "xpub") ? "M/0/" : (source == "seed") ? b32rp : "",
            path = root_path + index,
            dx_dat = {
                "dpath": path,
                "key": key,
                "cc": cc,
                "vb": versionbytes
            },
            x_keys_dat = derive_x(dx_dat),
            key_object = format_keys(seed, x_keys_dat, bip32, index, currency),
            address = key_object.address,
            ccsymbol = coindat.ccsymbol,
            index_str = (index > 0) ? index : 0,
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
                "label": "",
                "a_id": label,
                "purpose": purpose
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
    return ($("#requestlist li[data-address='" + dat.address + "'][data-pending='scanning'][data-cmcid='" + dat.cmcid + "']").length > 0) ? true : false;
}

function get_uniques(arr) {
    const counts = {};
    for (let i = 0; i < arr.length; i++) {
        counts[arr[i]] = 1 + (counts[arr[i]] || 0);
    }
    return Object.keys(counts).length;
}

function copy_phrase() {
    $(document).on("click", "#copyphrase", function() {
        const phrase = get_phrase(),
            verify = check_phrase(phrase),
            secret = translate("bip39_passphrase");
        if (verify === true) {
            const result = confirm(translate("copy") + " " + secret + "?");
            if (result === true) {
                copytoclipboard(phrase, secret);
            }
        } else {
            topnotify(verify);
        }
    });
}

function show_phrase() {
    $(document).on("click", "#showphrase, #phrase_cb.hidephrase #phraseblur", function() {
        const phrase_cb = $("#phrase_cb");
        if (phrase_cb.hasClass("showphrase")) {
            phrase_cb.removeClass("showphrase").addClass("hidephrase");
            return
        }
        if (glob_hasbip === true) {
            if (glob_bipv === true) {
                show_phrase_callback();
                return
            }
            all_pinpanel({
                "func": show_phrase_callback
            }, null, true)
            return
        }
        show_phrase_callback();
    })
}

function show_phrase_callback() {
    $("#phrase_cb").addClass("showphrase").removeClass("hidephrase");
}

function delete_phrase_trigger() {
    $(document).on("click", "#deletephrase", function() {
        const content = "<h2 style='color:#B33A3A'><span class='icon-warning'></span>" + translate("deletingyoursecretphrase") + "</h2><p><strong>" + translate("continuewithbackup") + "</strong></p>";
        popdialog(content, "delete_phrase_verify");
    });
}

function delete_phrase_verify() {
    canceldialog();
    const phrase = get_phrase(),
        words = phrase.split(" ");
    verify_phrase(words, 4);
    $("#seed_steps").removeClass("checked");
    $("#seed_step3").addClass("delete");
    seed_nav(3);
}

// Bip 32 Key derivation

function hmac_encrypt(key) {
    const hasher = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    this.encrypt = function() {
        return hasher.encrypt.apply(hasher, arguments);
    };
}

function toseed(mnemonic, passphrase) {
    const parsed = parse_seed(mnemonic, passphrase);
    return frombits(sjcl.misc.pbkdf2(parsed.mnemonic, parsed.passphrase, 2048, 512, hmac_encrypt));
}

function parse_seed(mnemonic, passphrase1) {
    const passphrase2 = passphrase1 || "",
        mnemonicNormalized = cleanstring(mnemonic),
        passphrase3 = normalizestring(passphrase2),
        passphrase4 = "mnemonic" + passphrase3;
    return {
        "mnemonic": tobits(mnemonicNormalized),
        "passphrase": tobits(passphrase4)
    }
}

function newseed(numWords) {
    const strength = numWords / 3 * 32,
        buffer = uint_8Array(strength / 8),
        data = crypto.getRandomValues(buffer);
    return to_mnemonic(data);
}

function to_mnemonic(byteArray) {
    if (byteArray.length % 4 > 0) {
        throw "Data length in bits should be divisible by 32, but it is not (" + byteArray.length + " bytes = " + byteArray.length * 8 + " bits)."
    }
    const data = byteArrayToWordArray(byteArray),
        h = hmacsha(data, "sha256"),
        a = byteArrayToBinaryString(byteArray),
        c = zfill(hexStringToBinaryString(h), 256),
        d = c.substring(0, byteArray.length * 8 / 32),
        b = a + d,
        result = [],
        blen = b.length / 11;
    for (let i = 0; i < blen; i++) {
        const idx = parseInt(b.substring(i * 11, (i + 1) * 11), 2);
        result.push(wordlist[idx]);
    }
    return joinwords(result);
}

function zfill(source1, length) {
    let source = source1.toString();
    while (source.length < length) {
        source = "0" + source;
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

function derive_x(dx_dat, from_x_priv) {
    const dpath = dx_dat.dpath,
        derive_array = dpath.split("/"),
        levels = derive_array.length - 1;
    let keydat = {},
        key = dx_dat.key,
        chaincode = dx_dat.cc,
        xpub = false,
        purpose = null;
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
            const hardened = (xpub === true) ? false : (level.indexOf("'") >= 0) ? true : false,
                childindex = (hardened === true) ? level.split("'")[0] : level,
                childfloat = parseInt(childindex),
                childnumber = (hardened === true) ? dectohex(childfloat + 2147483648) : str_pad(dectohex(childfloat), 8),
                kd = ckd(key, chaincode, childnumber, xpub, hardened);
            if (i === 1) {
                purpose = level;
            }
            if (i === levels) {
                kd.purpose = purpose,
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
    if (xpub === true) {
        keydat.vb = dx_dat.vb;
    }
    return keydat;
}

function ckd(ckey, cc, index, xpub, hard) {
    const ckd = {},
        parent_pub = (xpub === true) ? ckey : secp.Point.fromPrivateKey(ckey).toHex(true),
        pubh60 = hash160(parent_pub),
        fingerprint = pubh60.slice(0, 8),
        keyfeed = (xpub === true) ? parent_pub : (hard === true) ? "00" + ckey : parent_pub,
        rootnode = hmac_bits(keyfeed + index, hextobits(cc), "hex"),
        child_key_pre = rootnode.slice(0, 64),
        child_chaincode = rootnode.slice(64);
    if (xpub === true) {
        const key_point = secp.Point.fromPrivateKey(child_key_pre);
        ckd.key = secp.Point.fromHex(ckey).add(key_point).toHex(true);
    } else {
        const child_key_dec = (hextodec(ckey) + hextodec(child_key_pre)) % oc;
        ckd.key = str_pad(child_key_dec.toString(16), 64);
    }
    ckd.chaincode = child_chaincode;
    ckd.fingerprint = fingerprint;
    return ckd;
}

function keypair_array(seed, arr, startindex, d_path, bip32dat, key, chaincode, currency, versionbytes) {
    const derive_array = [];
    $.each(arr, function(i) {
        const index = i + startindex,
            root_path = d_path + index,
            dx_dat = {
                "dpath": root_path,
                "key": key,
                "cc": chaincode,
                "vb": versionbytes
            },
            ext_key_obj = derive_x(dx_dat),
            key_object = format_keys(seed, ext_key_obj, bip32dat, index, currency);
        derive_array.push(key_object);
    });
    return derive_array;
}

function ext_keys(eo, currency) {
    const eko = {},
        ext_payload = b58c_x_payload(eo, currency),
        priv_key = eo.key;
    eko.ext_key = b58check_encode(ext_payload);
    if (eo.xpub === false) {
        const pub_key = secp.Point.fromPrivateKey(priv_key).toHex(true),
            pub_obj = {
                "chaincode": eo.chaincode,
                "purpose": eo.purpose,
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

function xpub_obj(currency, rootpath, cc, key) {
    const dx_dat = {
            "dpath": rootpath.slice(0, -3),
            "key": key,
            "cc": cc
        },
        x_keys_dat = derive_x(dx_dat),
        x_keys = ext_keys(x_keys_dat, currency),
        x_pubval = x_keys.ext_pub,
        xpub_id = hmacsha(x_pubval, "sha256").slice(0, 8);
    return {
        "xpub": x_pubval,
        "xpubid": xpub_id,
        "prefix": x_pubval.slice(0, 4)
    }
}

function b58c_x_payload(eo, currency) {
    const xpubdat = getbip32dat(currency);
    if (!xpubdat) {
        return false;
    }
    const xz_pub = (eo.purpose == "84'") ? xpubdat.prefix.pubz : xpubdat.prefix.pubx,
        version = (eo.xpub === true) ? xz_pub : xpubdat.prefix.privx,
        v_hex = str_pad(dectohex(version), 8),
        depth = (eo.depth) ? str_pad(eo.depth, 2) : "00",
        fingerprint = (eo.fingerprint) ? eo.fingerprint : "00000000",
        childnumber = (eo.childnumber) ? str_pad(eo.childnumber, 8) : "00000000",
        chaincode = eo.chaincode,
        keyprefix = (eo.xpub === true) ? "" : "00",
        newkey = eo.key;
    if (version && newkey && chaincode) {
        return v_hex + depth + fingerprint + childnumber + chaincode + keyprefix + newkey;
    } else {
        return false;
    }
}

function format_keys(seed, key_object, bip32, index, coin) {
    const ko = {};
    if (coin == "nano") {
        if (seed) {
            const nano_account = NanocurrencyWeb.wallet.accounts(seed, index, index)[0];
            return {
                "index": nano_account.accountIndex,
                "address": nano_account.address,
                "pubkey": nano_account.publicKey,
                "privkey": nano_account.privateKey
            }
        }
        return ko;
    }
    if (coin == "monero") {
        if (seed) {
            const ssk = get_ssk(seed, true),
                xko = xmr_getpubs(ssk, index);
            return {
                "index": index,
                "address": xko.address,
                "vk": xko.account + xko.svk
            }
        }
        return ko;
    }
    const purpose = key_object.purpose,
        xpub = key_object.xpub,
        prekey = key_object.key,
        pubkey = (xpub === true) ? prekey : secp.Point.fromPrivateKey(prekey).toHex(true),
        vb = str_pad(dectohex(bip32.prefix.pub), 2);
    ko.index = index;
    if (coin == "ethereum") {
        ko.address = pub_to_eth_address(pubkey);
    } else if (coin == "bitcoin") {
        if (purpose == "84'") {
            ko.address = pub_to_address_bech32("bc", pubkey);
        } else {
            const versionbytes = key_object.vb;
            if (versionbytes == "04b24746") {
                ko.address = pub_to_address_bech32("bc", pubkey);
            } else {
                ko.address = pub_to_address(vb, pubkey);
            }
        }
    } else if (coin == "litecoin") {
        if (purpose == "84'") {
            ko.address = pub_to_address_bech32("ltc", pubkey);
        } else {
            const versionbytes = key_object.vb;
            if (versionbytes == "04b24746") {
                ko.address = pub_to_address_bech32("ltc", pubkey);
            } else {
                ko.address = pub_to_address(vb, pubkey);
            }
        }
    } else if (coin == "bitcoin-cash") {
        const legacybch = pub_to_address(vb, pubkey);
        ko.address = pub_to_cashaddr(legacybch);
    } else if (coin == "kaspa") {
        // waiting for pub to address script and more details about derivation path's
    } else {
        ko.address = pub_to_address(vb, pubkey);
    }
    ko.pubkey = (coin == "ethereum") ? "0x" + pubkey : pubkey;
    if (xpub === false) {
        if (coin == "ethereum") {
            ko.privkey = "0x" + prekey;
        } else {
            const pkv = bip32.pk_vbytes.wif;
            ko.privkey = privkey_wif(str_pad(dectohex(pkv), 2), prekey, true);
        }

    }
    return ko;
}

function xpub_prefix(currency) {
    const test_rootkey = get_rootkey(glob_expected_seed),
        dx_dat = {
            "dpath": "m/0",
            "key": test_rootkey.slice(0, 64),
            "cc": test_rootkey.slice(64)
        },
        x_keys_dat = derive_x(dx_dat),
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
    const phrase_obj = ls_phrase_obj(),
        savedseed = (glob_hasbip === true && phrase_obj) ? phrase_obj.pob.join(" ") : false,
        phrase = (savedseed) ? savedseed : get_phrase();
    if (phrase.length < 50) {
        return false
    }
    const seed = toseed(phrase),
        rootkey = get_rootkey(seed),
        key = rootkey.slice(0, 64),
        cc = rootkey.slice(64),
        root_dat = {
            "key": key,
            "cc": cc,
            "seed": seed,
            "xpub": false
        },
        singleclass = (coin) ? "single" : "",
        rootclass = (coin) ? "pd_" + coin : "pd_bitcoin",
        sourceed_str = (coin) ? "<li><strong>" + translate("source") + ": </strong> Seed</li>" : "<li><strong>BIP39 Seed: </strong><span class='adboxl adbox select' data-type='BIP39 Seed'>" + seed + "</span></li>",
        coindat = (coin) ? getcoindata(coin) : null,
        cc_icon = (coin) ? getcc_icon(coindat.cmcid, coindat.ccsymbol + "-" + coin, coindat.erc20) : "",
        header_str = (coin) ? "<h2>" + cc_icon + " <span>" + coin + " Key Derivation</span></h2>" : "",
        sbu_val = get_setting("backup", "sbu"),
        sbu_str = (has_datenc() === true) ? "<li class='clearfix'><strong>" + translate("backupsecretphrase") + ":</strong><div id='toggle_sbu_span' class='ait'>" + switchpanel(sbu_val, " global") + "</div></li>" : "",
        del_phr_str = (coin) ? "" : (glob_hasbip === true) ? sbu_str + "<li class='clearfix'><div id='deletephrase' class='icon-bin'></div></li>" : "",
        content = $("<div id='ad_info_wrap' class='" + singleclass + "' data-class='" + rootclass + "'>" + header_str + "<ul>" +
            sourceed_str +
            "<li id='pi_li' class='noline'>\
            <div id='pi_icons'>\
            </div>\
        </li>\
        <li class='clearfix noline' style='margin:0;padding:0'>\
            <ul id='segw_box'>\
            </ul>\
        <li>\
            <div id='d_paths'>\
            </div>\
        </li>\
        <li id='xpub_box' class='clearfix noline'>\
        </li>\
        <li>\
            <div id='bip_mi'><strong>" + translate("compatiblewallets") + ": </strong><span class='xpref ref'>" + translate("hide") + "</span></div>\
            <div id='bip_mibox' class='clearfix drawer'>\
                <div id='supported_wallets'>\
                </div>\
            </div>\
        </li>" + del_phr_str +
            "</ul>\
    </div>").data(root_dat);
    popdialog(content, "canceldialog");
    $.each(glob_br_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            ccsymbol = coinconfig.data.ccsymbol,
            walletdat = coinconfig.wallets,
            bip32dat = getbip32dat(currency);
        if (bip32dat.active === true) {
            const root_path = bip32dat.root_path,
                lb = (currency == "nano") ? "<br/>" : " ",
                coinclass = " pd_hide pd_" + currency;
            let x_pub,
                derivelist = "",
                walletlist = "",
                startindex = 0,
                derive_array = keypair_array(seed, new Array(5), startindex, root_path, bip32dat, key, cc, currency);
            if (bip32dat.xpub) {
                const xpubdat = xpub_obj(currency, root_path, cc, key);
                x_pub = xpubdat.xpub;
            }
            $.each(derive_array, function(i, val) {
                const index = startindex + i;
                derivelist += "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> <span class='mspace'>" + lb + val.address + "</span></li>";
            });
            if (walletdat) {
                const platform = getplatform(getdevicetype()),
                    store_icon = platform_icon(platform),
                    store_tag = (store_icon) ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ",
                    wallets = walletdat.wallets;
                $.each(wallets, function(key, value) {
                    const device_url = value[platform];
                    if (device_url && value.seed === true) {
                        const walletname = value.name,
                            website = value.website,
                            wallet_icon = "<img src='" + w_icon(walletname) + "' class='wallet_icon'/>";
                        walletlist += "<li><a href='" + website + "' target='_blank' class='exit app_dll'>" + wallet_icon + walletname + "</a><a href='" + device_url + "' target='_blank' class='exit store_tag'>" + store_tag + "</a></li>";
                    }
                });
            }
            const c_id = ccsymbol + "-" + currency,
                icon_src = c_icons(c_id),
                icon_node = $("<img src='" + icon_src + "' data-class='pd_" + currency + "'/>"),
                dp_node_dat = {
                    "bip32": bip32dat,
                    "currency": currency
                },
                xmr_phrase = (currency == "monero") ? (is_viewonly() === true) ? false :
                secret_spend_key_to_words(get_ssk(seed, true)) : false,
                xmr_phrase_box = (xmr_phrase) ? "<div><strong>XMR Seed words: </strong><br/><span class='adboxl adbox select' data-type='XMR Seed words'>" + xmr_phrase + "</span></div>" : "",
                dp_node = $("<div class='d_path" + coinclass + "'>\
                <div class='d_path_header'><strong>" + translate("derivationpath") + ": </strong><span class='ref'>" + root_path + "</span></div>" +
                    xmr_phrase_box +
                    "<div class='d_path_body drawer clearfix'>\
                        <div class='td_bar'>\
                            <div class='td_next button'>" + translate("next") + "</div><div class='td_prev button'>" + translate("prev") + "</div>\
                        </div>\
                        <ul class='td_box'>" + derivelist + "</ul>\
                    </div>\
                </div>").data(dp_node_dat),
                sw_node = $("<ul id='formbox_ul' class='clearfix" + coinclass + "'>" + walletlist + "</ul>");
            let xp_node = "",
                segw_node = "";
            if (x_pub) {
                xp_node = $("<div class='xpub_ib clearfix" + coinclass + "' data-xpub='" + x_pub + "'>\
                    <div class='show_xpub'><strong>Xpub: </strong><span class='xpref ref'>" + translate("show") + "</span></div>\
                        <div class='xp_span drawer'>\
                            <div class='qrwrap flex'>\
                                <div class='qrcode'></div><img src='" + icon_src + "' class='cmc_icon'>\
                            </div>\
                            <p class='adbox adboxl select' data-type='Xpub'>" + x_pub + "</p>\
                        </div>\
                    </div>");
                if (currency == "bitcoin" || currency == "litecoin") {
                    const hsw = (root_path.indexOf("m/84") > -1);
                    segw_node = $("<li class='clearfix" + coinclass + "' data-currency='" + currency + "'><strong>SegWit:</strong><div class='toggle_segwit ait'>" + switchpanel(hsw, " custom") + "</div></li>");
                }
            }
            if (glob_c_derive[currency]) {
                $("#pi_icons").append(icon_node);
                $("#d_paths").append(dp_node);
            }
            $("#xpub_box").append(xp_node);
            $("#segw_box").append(segw_node);
            $("#supported_wallets").append(sw_node);
            pi_show();
        }
    });
}

function compatible_wallets(coin) {
    const content = $("<div id='ad_info_wrap' class='' data-class='pd_" + coin + "'><h2><span class='icon-warning' style='color:#B33A3A'/>" + translate("cannotsendfunds") + "</span></h2><ul>\
            <li class='noline'><strong style='color:#6a6a6a'>" + translate("importtosend") + "</strong></li>\
            <li id='pi_li' class='noline'>\
                <div id='pi_icons'>\
                </div>\
            </li>\
            <li>\
                <div id='bip_mibox' class='clearfix drawer'>\
                    <div id='supported_wallets'>\
                    </div>\
                </div>\
            </li>\
        </ul>\
    </div>");
    popdialog(content, "canceldialog");
    $.each(glob_br_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            ccsymbol = coinconfig.data.ccsymbol,
            walletdat = coinconfig.wallets,
            bip32dat = coinconfig.settings.Xpub;
        if (bip32dat.active === true) {
            const walletlist = "";
            if (walletdat) {
                const platform = getplatform(getdevicetype()),
                    store_icon = platform_icon(platform),
                    store_tag = (store_icon) ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ",
                    wallets = walletdat.wallets;
                $.each(wallets, function(key, value) {
                    const device_url = value[platform];
                    if (device_url && value.seed === true) {
                        const walletname = value.name,
                            website = value.website,
                            wallet_icon = "<img src='" + w_icon(walletname) + "' class='wallet_icon'/>";
                        walletlist += "<li><a href='" + website + "' target='_blank' class='exit app_dll'>" + wallet_icon + walletname + "</a><a href='" + device_url + "' target='_blank' class='exit store_tag'>" + store_tag + "</a></li>";
                    }
                });
            }
            const c_id = ccsymbol + "-" + currency,
                icon_src = c_icons(c_id),
                icon_node = $("<img src='" + icon_src + "' data-class='pd_" + currency + "'/>"),
                sw_node = $("<ul id='formbox_ul' class='clearfix pd_hide pd_" + currency + "'>" + walletlist + "</ul>");
            $("#pi_icons").append(icon_node);
            $("#supported_wallets").append(sw_node);
            pi_show();
        }
    });
}

function w_icon(wname) {
    return glob_aws_bucket + "img_icons_wallet-icons_" + wname + ".png";
}

function phrase_coin_info() {
    $(document).on("click", "#pi_icons img", function() {
        $("#ad_info_wrap").attr("data-class", $(this).attr("data-class"));
        pi_show();
    })
}

function toggle_dpaths() {
    $(document).on("click", "#ad_info_wrap .d_path_header", function() {
        const d_body = $(".d_path_body");
        if (d_body.is(":visible")) {
            d_body.slideUp(200);
        } else {
            d_body.slideDown(200);
            $(".drawer").not(d_body).slideUp(200);
        }
        $(".xpref").text(translate("show"));
    })
}

function pi_show() {
    const mclass = $("#ad_info_wrap").attr("data-class");
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
    const kd = $("#ad_info_wrap").data(),
        dp_node = thisnode.closest(".d_path"),
        dnd = dp_node.data(),
        currency = dnd.currency;
    if (glob_c_derive[currency]) {
        const test_derive_box = dp_node.find(".td_box"),
            td_prev = dp_node.find(".td_prev"),
            count = 5,
            td_li = (prev === true) ? test_derive_box.find(".der_li").first() : test_derive_box.find(".der_li").last(),
            der_index = (td_li.length) ? parseInt(td_li.attr("data-index")) : 0,
            startindex = (der_index === 0) ? 0 :
            (prev === "replace") ? der_index - 4 :
            (prev === true) ? der_index - count :
            der_index + 1;
        if (startindex > 1) {
            td_prev.show();
        } else {
            td_prev.hide();
        }
        const bip32dat = dnd.bip32,
            key = kd.key,
            chaincode = kd.cc,
            versionbytes = kd.versionbytes,
            lb = (currency == "nano") ? "<br/>" : " ",
            root_path = (kd.xpub === true) ? "M/0/" : bip32dat.root_path,
            derive_array = keypair_array(kd.seed, new Array(count), startindex, root_path, bip32dat, key, chaincode, currency, versionbytes);
        test_derive_box.html("");
        $.each(derive_array, function(i, val) {
            const index = startindex + i,
                tdb_li = "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> " + lb + "<span class='mspace'>" + val.address + "</span></li>";
            test_derive_box.append(tdb_li);
        });
    }
}

function phrase_moreinfo() {
    $(document).on("click", "#bip_mi", function() {
        const thisbttn = $(this),
            show_cp = thisbttn.find(".xpref"),
            bmb = $("#bip_mibox");
        if (bmb.is(":visible")) {
            show_cp.text(translate("show"));
            bmb.slideUp(200);
        } else {
            show_cp.text(translate("hide"));
            bmb.slideDown(200);
            $(".drawer").not(bmb).slideUp(200);
        }
        $(".xpref").not(show_cp).text(translate("show"));
    })
}

function phrase_showxp() {
    $(document).on("click", ".show_xpub", function() {
        const thisbttn = $(this),
            xpub_box = $("#xpub_box"),
            xpub_ib = xpub_box.find(".xpub_ib"),
            show_cp = xpub_box.find(".xpref"),
            bmb = $(".xp_span");
        if (bmb.is(":visible")) {
            show_cp.text(translate("show"));
            bmb.slideUp(200);
        } else {
            if (xpub_box.hasClass("rendered")) {} else {
                xpub_ib.each(function() {
                    const thisnode = $(this),
                        xpub = thisnode.attr("data-xpub"),
                        qr_code = thisnode.find(".qrcode");
                    qr_code.qrcode(xpub);
                });
                xpub_box.addClass("rendered");
            }
            show_cp.text(translate("hide"));
            bmb.slideDown(200);
            $(".drawer").not(bmb).slideUp(200);
        }
        $(".xpref").not(show_cp).text(translate("show"));
    })
}