// bip39 (All addresses / xpubs in this app are test addresses derived from the following testphrase, taken from https://github.com/bitcoinbook/bitcoinbook/blob/f8b883dcd4e3d1b9adf40fed59b7e898fbd9241f/ch05.asciidoc)
const bip39_const = {
    "test_phrase": "army van defense carry jealous true garbage claim echo media make crunch", // random phrase used for test derive
    "expected_seed": "5b56c417303faa3fcba7e57400e120a0ca83ec5a4fc9ffba757fbe63fbd77a89a1a3be4c67196f57c39a88b76373733891bfaba16ed27a813ceed498804c0570", // expected seed used for test derive
    "expected_address": "1HQ3rb7nyLPrjnuW85MUknPekwkn7poAUm", // expected addres used for test derive
    "expected_bech32": "bc1qg0azlj4w2lrq8jssrrz6eprt2fe7f7edm4vpd5", // expected bech32 addres used for test derive
    "expected_bch_cashaddr": "qp5p0eur784pk8wxy2kzlz3ctnq5whfnuqqpp78u22",
    "expected_eth_address": "0x2161DedC3Be05B7Bb5aa16154BcbD254E9e9eb68",
    "c_derive": {
        "bitcoin": true,
        "litecoin": true,
        "dogecoin": true,
        "dash": true,
        "nano": true,
        "monero": true,
        "ethereum": true,
        "bitcoin-cash": true,
        "nimiq": false,
        "kaspa": false
    },
    "can_xpub": {
        "bitcoin": true,
        "litecoin": true,
        "dogecoin": true,
        "dash": true,
        "nano": false,
        "monero": false,
        "ethereum": true,
        "bitcoin-cash": true,
        "nimiq": false,
        "kaspa": false
    }
}

$(document).ready(function() {
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

// Determines if the current session is a trial based on a timestamp
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

// Checks BIP (Bitcoin Improvement Proposal) validation status
function bipv_pass() {
    if (glob_let.hasbip) {
        if (glob_let.bipv) {
            return true;
        }
        const used_addresses = filter_all_addressli("seedid", glob_let.bipid).filter(".used"),
            is_trial = istrial();
        if (is_trial) {
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

// Tests BIP39 implementation and related functionalities
function test_bip39() {
    if (!crypto) { // test for window.crypto
        bip39_fail();
        return
    }
    if (glob_const.has_bigint === false) { // test for js BigInt
        bip39_fail();
        return
    }
    const k_str = bip39_const.expected_seed.slice(0, 32),
        enc_test = aes_enc(bip39_const.test_phrase, k_str),
        dec_test = aes_dec(enc_test, k_str);
    if (bip39_const.test_phrase !== dec_test) { // test encryption
        bip39_fail();
        return
    }
    if (toseed(bip39_const.test_phrase) !== bip39_const.expected_seed || test_derivation() === false) {
        bip39_fail();
        const coinsToDeriveFailure = ["bitcoin", "litecoin", "dogecoin", "dash", "ethereum", "bitcoin-cash", "monero", "nano"];
        derive_fail(coinsToDeriveFailure);
        coinsToDeriveFailure.forEach(coin => {
            bip39_const.c_derive[coin] = false;
        });
    }
    const derivationChecks = [{
            "check": bech32_check,
            "coin": "bitcoin"
        },
        {
            "check": bech32_check,
            "coin": "litecoin"
        },
        {
            "check": cashaddr_check,
            "coin": "bitcoin-cash"
        },
        {
            "check": nano_check,
            "coin": "nano"
        },
        {
            "check": xmr_check,
            "coin": "monero"
        }
    ];
    derivationChecks.forEach(function({
        check,
        coin
    }) {
        if (check() === false) {
            derive_fail([coin]);
            bip39_const.c_derive[coin] = false;
        }
    });
    // check xpub derivation
    if (xpub_check() === false) { // test for btc xpub derivation
        const xpubFailCoins = ["bitcoin", "litecoin", "dogecoin", "dash", "bitcoin-cash"];
        derive_xpub_fail(xpubFailCoins);
        xpubFailCoins.forEach(coin => {
            bip39_const.can_xpub[coin] = false;
        });
    }
    if (eth_xpub_check() === false) { // test for ethereum xpub derivation
        derive_xpub_fail(["ethereum"]);
        bip39_const.can_xpub.ethereum = false;
    }
}

// Handles BIP39 failure by adding a CSS class
function bip39_fail() {
    glob_const.body.addClass("nobip");
    glob_let.test_derive = false;
}

// Handles derivation failure for specified cryptocurrencies
function derive_fail(arr) {
    setTimeout(function() {
        arr.forEach(function(val) {
            $("#" + val + "_settings").addClass("no_derive");
        });
    }, 500)
}

// Handles xpub derivation failure for specified cryptocurrencies
function derive_xpub_fail(arr) {
    setTimeout(function() {
        arr.forEach(function(val) {
            $("#" + val + "_settings").addClass("no_xpub");
        });
    }, 500)
}

// test derivations

// Tests derivation process for Bitcoin
function test_derivation() {
    try {
        const currency = "bitcoin",
            test_rootkey = get_rootkey(bip39_const.expected_seed),
            bip32dat = getbip32dat(currency),
            dx_dat = {
                "dpath": "m/44'/0'/0'/0/0",
                "key": test_rootkey.slice(0, 64),
                "cc": test_rootkey.slice(64)
            },
            x_keys_dat = derive_x(dx_dat),
            key_object = format_keys(bip39_const.expected_seed, x_keys_dat, bip32dat, 0, currency);
        return key_object.address === bip39_const.expected_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Checks Bech32 address derivation
function bech32_check() {
    try {
        const bip84_pub = "03bb4a626f63436a64d7cf1e441713cc964c0d53289a5b17acb1b9c262be57cb17",
            bip84_bech32 = pub_to_address_bech32("bc", bip84_pub);
        return bip39_const.expected_bech32 === bip84_bech32;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Checks Bitcoin Cash cashaddr derivation
function cashaddr_check() {
    try {
        const bch_legacy = "1AVPurYZinnctgGPiXziwU6PuyZKX5rYZU",
            bch_cashaddr = pub_to_cashaddr(bch_legacy);
        return bip39_const.expected_bch_cashaddr === bch_cashaddr;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Checks Nano address derivation
function nano_check() {
    try {
        const expected_nano_address = "nano_1mbtirc4x3kixfy5wufxaqakd3gbojpn6gpmk6kjiyngnjwgy6yty3txgztq",
            xnano_address = NanocurrencyWeb.wallet.accounts(bip39_const.expected_seed, 0, 0)[0].address;
        return expected_nano_address === xnano_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Checks Monero (XMR) address derivation
function xmr_check() { // https://coinomi.github.io/tools/bip39/
    try {
        const expected_xmr_address = "477h3C6E6C4VLMR36bQL3yLcA8Aq3jts1AHLzm5QXipDdXVCYPnKEvUKykh2GTYqkkeQoTEhWpzvVQ4rMgLM1YpeD6qdHbS",
            ssk = get_ssk(bip39_const.expected_seed, true),
            xko = xmr_getpubs(ssk, 0);
        return xko.address === expected_xmr_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Checks extended public key (xpub) derivation for Bitcoin
function xpub_check() {
    try {
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
        return xpub_address === bip39_const.expected_address || xpub_address === xpub_wildcard_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Checks Ethereum extended public key (xpub) derivation
function eth_xpub_check() {
    try {
        const eth_pub = "03c026c4b041059c84a187252682b6f80cbbe64eb81497111ab6914b050a8936fd",
            eth_address = pub_to_eth_address(eth_pub);
        return bip39_const.expected_eth_address === eth_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false;
    }
}

// Check derivations

// Checks derivation method for a given currency
function check_derivations(currency) {
    if (glob_let.test_derive && bip39_const.c_derive[currency]) {
        const activepub = active_xpub(currency);
        if (cxpub(currency) && activepub) {
            return "xpub";
        }
        if (glob_let.hasbip) {
            return "seed";
        }
    }
    return false;
}

// Checks if there's an active extended public key for a given currency
function active_xpub(currency) {
    const haspub = has_xpub(currency)
    return haspub && haspub.selected === true ? haspub : false;
}

// Checks if a currency has an extended public key
function has_xpub(currency) {
    const ispub = is_xpub(currency);
    return ispub && ispub.key ? ispub : false;
}

// Checks if a currency is using an extended public key
function is_xpub(currency) {
    if (cxpub(currency)) {
        const xpubli_dat = cs_node(currency, "Xpub", true);
        return xpubli_dat || false;
    }
    return false;
}

// Checks if a currency can use extended public keys
function cxpub(currency) {
    return !!bip39_const.can_xpub[currency];
}

// Retrieves BIP32 data for a given currency
function getbip32dat(currency) {
    const xpub_dat = cs_node(currency, "Xpub", true);
    if (xpub_dat && xpub_dat.active === true) {
        return xpub_dat;
    }
    const coindata = getcoinconfig(currency);
    if (coindata) {
        const xpubdat = q_obj(coindata, "settings.Xpub");
        if (xpubdat && xpubdat.active) {
            return xpubdat;
        }
    }
    return false;
}

// Checks if a currency supports BIP32
function hasbip32(currency) {
    const coindata = getcoinconfig(currency);
    if (coindata) {
        const active_xpub = q_obj(coindata, "settings.Xpub.active");
        if (active_xpub) {
            return true;
        }
    }
    return false;
}

// Bip 39 seed generation

// Handles the creation of a new seed
function make_seed() {
    $(document).on("click", "#option_makeseed", function() {
        const currency = $(this).attr("data-currency");
        if (glob_let.hasbip) {
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

// Handles the restoration of a seed
function restore_seed() {
    $(document).on("click", "#rest_seed, .applist.pobox li.seedu .address .srcicon", function() {
        if (is_viewonly() === true) {
            vu_block();
            return false;
        }
        if (glob_let.hasbip) {
            return false;
        }
        const result = confirm(translate("resoresecretphrase") + "?");
        if (result) {
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

// Verifies the restored seed
function restore_seed_verify() {
    $(document).on("click", "#restore_seed", function() {
        if (glob_let.hasbip) {
            return false;
        }
        glob_let.phrasearray = null,
            glob_let.phraseverified = false;
        const phrase = get_phrase(),
            verify = check_phrase(phrase);
        if (verify) {
            const seedid = $(this).attr("data-seedid"),
                words = phrase.split(" "),
                phraseid = get_seedid(words);
            if (seedid === phraseid) {
                glob_let.phrasearray = words,
                    glob_let.phraseverified = true;
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

// Generates a seed ID from the given words
function get_seedid(words) {
    return hmacsha(btoa(JSON.stringify(words)), "sha256").slice(0, 8);
}

// Manages BIP32 operations
function manage_bip32(dat) {
    if (glob_let.hasbip) {
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

// Handles the submission of the disclaimer dialog
function submit_disclaimer() {
    $(document).on("click", "#disclaimer_dialog input.submit", function(e) {
        e.preventDefault();
        const disclaimer_dialog = $("#disclaimer_dialog"),
            data = disclaimer_dialog.data(),
            pk_checkbox = disclaimer_dialog.find("#pk_confirmwrap"),
            pk_checked = pk_checkbox.data("checked");
        if (pk_checked) {
            canceldialog();
            bip39(data);
        } else {
            popnotify("error", translate("consent"));
        }
    })
}

// Initializes the BIP39 seed generation process
function bip39(dat) {
    glob_let.phraseverified = false;
    const data = br_dobj(dat, true),
        phrase_obj = ls_phrase_obj(),
        edit = data && data.edit,
        dtype = data.type || null,
        restore = dtype === "restore" && edit === true,
        type = glob_let.hasbip === true ? (glob_let.bipv === true ? "bipsavedbu" : "bipsaved") : "nobip",
        step = type === "nobip" ? 1 : (type === "bipsavedbu" ? 2 : 3),
        spclass = type === "nobip" ? " showphrase" : " hidephrase",
        savedseed = glob_let.hasbip ? (phrase_obj ? phrase_obj.pob.join(" ") : false) : false,
        seed = restore ? "" : savedseed || newseed(12),
        remindp = dtype === "restore" ? "<p>" + translate("overwritten") + "</p>" : "<p>" + translate("pleaseverify") + "</p>",
        verifyheader = dtype === "restore" ? translate("verifycurrent") : translate("verifybackup"),
        save_str = restore ? translate("entersecretphrase") : translate("writedownsecretphrase"),
        verify_str = restore ? "<div id='restore_seed' class='button' data-seedid='" + data.seedid + "'>" + translate("restorebttn") + "</div>" : "<div id='cfbu2' class='button'>" + translate("ivebackeditup") + "</div>",
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
    glob_const.body.addClass("seed_dialog");
    if (step === 3) {
        verify_phrase(seed.split(" "), 3);
    }
    wake();
}

// Seed panel nav

// Handles the "Got it" button click in the seed generation process
function got_it() {
    $(document).on("click", "#cfbu1", function() {
        seed_nav(2);
    })
}

// Handles the back button click from step 2 to step 1
function seed_back1() {
    $(document).on("click", "#seed_steps #seed_step2 .ss_header .icon-arrow-left2", function() {
        seed_nav(1);
    })
}

// Handles the back button click from step 3 to step 2
function seed_back2() {
    $(document).on("click", "#seed_steps #seed_step3 .ss_header .icon-arrow-left2, #seed_steps #seed_step3 #toseed", function() {
        seed_nav(2);
        $("#seed_step3").removeClass("delete verify");
    })
}

// Navigates to a specific step in the seed generation process
function seed_nav(index) {
    $("#seed_steps").attr("class", "panel" + index);
}

// Retrieves the phrase object from local storage
function ls_phrase_obj() {
    return glob_let.bipobj ? ls_phrase_obj_parsed(glob_let.bipobj) : false;
}

// Parses the phrase object from local storage
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

// Decrypts the seed using a PIN
function seed_decrypt(pin) {
    if (glob_let.bipobj) {
        const pdat_enc = glob_let.bipobj.datenc;
        if (pdat_enc) {
            const pdat_dec = s_decode(pdat_enc, pin),
                pdat_dec_dat = pdat_dec.dat;
            if (pdat_dec_dat) {
                return JSON.parse(atob(pdat_dec_dat));
            }
        }
        const pdat_dat = glob_let.bipobj.dat;
        if (pdat_dat) {
            return JSON.parse(atob(pdat_dat));
        }
    }
    return false;
}

// Handles the continuation of the backup process
function backup_continue() {
    $(document).on("click", "#cfbu2", function() {
        glob_let.phrasearray = null,
            glob_let.phraseverified = false;
        const phrase = get_phrase(),
            verify = check_phrase(phrase);
        if (verify === true) {
            const words = phrase.split(" ");
            verify_phrase(words, 3);
            glob_let.phrasearray = words;
            $("#seed_steps").removeClass("checked");
            $("#seed_step3").addClass("verify");
            seed_nav(3);
            return
        }
        topnotify(verify);
    })
}

// Checks if the provided phrase is valid
function check_phrase(phrase) {
    const words = phrase.split(" "),
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

// Retrieves the cleaned phrase from the DOM
function get_phrase() {
    return cleanstring($("#bip39phrase").text());
}

// Validates a BIP39 mnemonic phrase
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
    return h === nh;
}

// Identifies words not in the BIP39 wordlist
function missing_words(words) {
    let missing;
    $.each(words, function(i, word) {
        if (wordlist.indexOf(word) === -1) {
            missing = word;
            return
        }
    });
    return missing;
}

// Prepares a phrase verification UI
function verify_phrase(words, count) {
    const wordindex = words.map((word, i) => ({
            "word": word,
            "index": i + 1
        })),
        shuffled_words = shuffleArray(wordindex),
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

// Shuffles an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Handles word verification input
function verify_words() {
    $(document).on("input", "#seed_verify_box input", function(e) {
        const thisinput = $(this),
            cw_box = thisinput.closest(".checkword_box"),
            thisword = thisinput.data("word"),
            thisval = thisinput.val();
        if (thisval === thisword) {
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
                if (result) {
                    br_remove_local("bpdat");
                    const initdat = br_get_local("init", true),
                        iodat = br_dobj(initdat, true);
                    iodat.bipv = "no";
                    delete iodat.bipv;
                    br_set_local("init", iodat, true);
                    glob_let.hasbip = false;
                    glob_let.bipv = false;
                    glob_let.bipid = false;
                    move_seed_cb();
                    hide_seed_panel();
                    notify(translate("secretphrasedeleted"));
                }
                return
            }
            if (step3.hasClass("replace")) {
                const result = confirm(translate("restoresecretphrasefrombackup"));
                if (result) {
                    const bu_dat = $("#seed_steps").data().dat;
                    restore_callback(bu_dat, true);
                }
                return
            }
            glob_let.phraseverified = true;
            $("#seed_steps").addClass("checked");
            finish_seed();
            return
        }
        cw_box.addClass("uncheck");
    });
}

// Updates UI after seed changes
function move_seed_cb() {
    $.each(glob_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            bip32 = coinconfig.settings.Xpub;
        if (bip32.active) {
            const addresslist = get_addresslist(currency);
            addresslist.children(".adli").each(function(i) {
                const this_li = $(this);
                if (this_li.hasClass("seed")) {
                    const seedid = this_li.data("seedid");
                    if (seedid === glob_let.bipid) {
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

// Handles the "Continue" button click in seed setup
function continue_seed() {
    $(document).on("click", "#continue_seed", function() {
        finish_seed();
    })
}

// Handles skipping the verification step
function skip_verify() {
    $(document).on("click", "#cfbu3", function() {
        const content = "<h2><span class='icon-warning' style='color:#B33A3A'></span>" + translate("continueatownrisk") + "</h2><p><strong>" + translate("ifyouloseyourdevice") + "</strong></p>";
        popdialog(content, "finish_seed");
    })
}

// Finalizes the seed setup process
function finish_seed() {
    canceldialog();
    if (haspin(true)) {
        seed_callback();
        return
    }
    const cb = {
            "func": seed_callback
        },
        content = pinpanel("", cb);
    showoptions(content, "pin");
}

// Callback function after seed setup is complete
function seed_callback() {
    if (!glob_let.hasbip) {
        const seed_object = {},
            seed_string = btoa(JSON.stringify(glob_let.phrasearray)),
            phraseid = hmacsha(seed_string, "sha256").slice(0, 8),
            savedat = {
                "id": phraseid,
                "dat": null
            };
        seed_object.pid = phraseid;
        seed_object.pob = seed_string;
        br_set_local("bpdat", savedat, true);
        br_set_local("tp", now());
        glob_let.bipobj = savedat,
            glob_let.hasbip = true,
            glob_let.bipid = phraseid;
        notify("🎉 " + translate("congratulations") + " 🎉");
        const seedid = phraseid,
            savedseed = glob_let.phrasearray.join(" ");
        if (glob_const.body.hasClass("showstartpage")) {
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
    if (glob_let.phraseverified === true) {
        // save as verified
        const initdat = br_get_local("init", true),
            iodat = br_dobj(initdat, true);
        iodat.bipv = "yes";
        br_set_local("init", iodat, true);
        glob_let.bipv = true;
        topnotify(translate("passphraseverified"));
    } else {
        notify(translate("backupasap"));
    }
    hide_seed_panel();
}

// Deactivates all extended public keys (xpubs) for all supported cryptocurrencies
function deactivate_xpubs() {
    $.each(glob_config.bitrequest_coin_data, function(i, coinconfig) {
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

// Encrypts seed data using the user's PIN
function enc_s(dat) {
    if (glob_let.hasbip && glob_let.test_derive) {
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
                const s_obj = glob_let.bipobj,
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
                glob_let.bipobj = s_obj;
            }
        }
    }
}

// Checks if encrypted data exists
function has_datenc() {
    return glob_let.hasbip === true && glob_let.bipobj.datenc ? true : false;
}

// Converts a PIN to a key for encryption
function ptokey(p, sid) {
    const pr = p.toString().split(""),
        newarr = pr.map((val, i) => {
            const v_int = parseFloat(val),
                valc = (v_int === 0) ? 1 : v_int;
            return valc * (i + 1);
        }),
        maxval = Math.max.apply(Math, newarr),
        wordarr = newarr.map(val => {
            const perc = Math.floor((val / maxval) * 2048);
            return wordlist[perc - 1];
        });
    return hmacsha(wordarr.join(" ") + sid, "sha256").slice(0, 32);
}

// Test triggers

// Gets the latest index from an address list
function get_latest_index(alist) {
    const index = dom_to_array(alist, "derive_index");
    return Math.max.apply(Math, index);
}

// Derives and adds a new address for a given currency
function derive_addone(currency, extra) {
    const dd = derive_data(currency, extra);
    if (dd) {
        derive_add_address(currency, dd);
        return true;
    }
    return false;
}

// Retrieves key and chaincode from the seed phrase
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
            key,
            cc,
            seed,
            seedid
        };
    }
    return false;
}

// Retrieves key and chaincode from an extended public key (xpub)
function key_cc_xpub(xpub) {
    const ext_dec = b58check_decode(xpub),
        extend_object = objectify_extended(ext_dec);
    return {
        "key": extend_object.key,
        "cc": extend_object.chaincode,
        "version": extend_object.version
    }
}

// Generates a root key from a seed
function get_rootkey(seed) {
    return hmac_bits(seed, tobits("Bitcoin seed"), "hex");
}

// Initializes derivation for all supported currencies
function derive_all_init(phrase, seedid, extra) {
    derive_all(phrase, seedid, extra);
    const acountname = $("#eninput").val();
    $("#accountsettings").data("selected", acountname).find("p").text(acountname);
    savesettings();
    savecurrencies(true);
    glob_const.body.removeClass("showstartpage");
}

// Derives addresses for all supported currencies
function derive_all(phrase, seedid, extra) {
    const seed = toseed(phrase),
        rootkey = get_rootkey(seed),
        master_key = rootkey.slice(0, 64),
        master_chaincode = rootkey.slice(64);
    $.each(glob_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            coindat = coinconfig.data,
            bip32 = coinconfig.settings.Xpub;
        if (bip32.active && bip39_const.c_derive[currency]) {
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

// Adds a derived address to the UI and saves it
function derive_add_address(currency, ad) {
    appendaddress(currency, ad);
    saveaddresses(currency, true);
    const currencyli = get_currencyli(currency),
        homeli = get_homeli(currency);
    currencyli.attr("data-checked", "true").data("checked", true); // each
    homeli.removeClass("hide"); // each
}

// Retrieves derivation data for a given currency
function derive_data(currency, extra) {
    if (glob_let.test_derive === true && bip39_const.c_derive[currency]) {
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

// Derives a new address object based on the provided parameters
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
        check_p = actives.length ? ch_pending(actives.first().data()) : false;
    if (!actives.length || check_p === true || add) {
        const allength = deriveli.length,
            index = allength > 1 ? get_latest_index(deriveli) + 1 : allength,
            root_path = source === "xpub" ? "M/0/" : (source === "seed" ? b32rp : ""),
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
            index_str = index || 0,
            checkname = addressli.filter(".seed"),
            checkname_array = dom_to_array(checkname, id_key),
            get_unique = get_uniques(checkname_array),
            uniques = $.inArray(seedid, checkname_array) === -1 ? get_unique : get_unique - 1,
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

// Counts the number of unique elements in an array
function get_uniques(arr) {
    return new Set(arr).size;
}

// Handles the copying of the mnemonic phrase
function copy_phrase() {
    $(document).on("click", "#copyphrase", function() {
        const phrase = get_phrase(),
            verify = check_phrase(phrase),
            secret = translate("bip39_passphrase");
        if (verify) {
            const result = confirm(translate("copy") + " " + secret + "?");
            if (result) {
                copytoclipboard(phrase, secret);
            }
        } else {
            topnotify(verify);
        }
    });
}

// Toggles the visibility of the mnemonic phrase
function show_phrase() {
    $(document).on("click", "#showphrase, #phrase_cb.hidephrase #phraseblur", function() {
        const phrase_cb = $("#phrase_cb");
        if (phrase_cb.hasClass("showphrase")) {
            phrase_cb.removeClass("showphrase").addClass("hidephrase");
            return
        }
        if (glob_let.hasbip) {
            if (glob_let.bipv) {
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

// Callback function to show the mnemonic phrase
function show_phrase_callback() {
    $("#phrase_cb").addClass("showphrase").removeClass("hidephrase");
}

// Initiates the process of deleting the mnemonic phrase
function delete_phrase_trigger() {
    $(document).on("click", "#deletephrase", function() {
        const content = "<h2 style='color:#B33A3A'><span class='icon-warning'></span>" + translate("deletingyoursecretphrase") + "</h2><p><strong>" + translate("continuewithbackup") + "</strong></p>";
        popdialog(content, "delete_phrase_verify");
    });
}

// Verifies the user's intent to delete the mnemonic phrase
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

// Creates an HMAC encryptor
function hmac_encrypt(key) {
    const hasher = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    this.encrypt = function() {
        return hasher.encrypt.apply(hasher, arguments);
    };
}

// Converts a mnemonic phrase to a seed
function toseed(mnemonic, passphrase) {
    const parsed = parse_seed(mnemonic, passphrase);
    return frombits(sjcl.misc.pbkdf2(parsed.mnemonic, parsed.passphrase, 2048, 512, hmac_encrypt));
}

// Parses a mnemonic phrase and passphrase for seed generation
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

// Generates a new mnemonic phrase
function newseed(numWords) {
    const strength = numWords / 3 * 32,
        buffer = uint_8Array(strength / 8),
        data = crypto.getRandomValues(buffer);
    return to_mnemonic(data);
}

// Converts a byte array to a mnemonic phrase
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

// Pads a string with leading zeros
function zfill(source1, length) {
    let source = source1.toString();
    while (source.length < length) {
        source = "0" + source;
    }
    return source;
}

// bip32 Derivation

// Converts an extended key to an object with its components
function objectify_extended(extended) {
    const version = extended.slice(0, 8),
        depth = extended.slice(8, 10),
        fingerprint = extended.slice(10, 18),
        childnumber = extended.slice(18, 26),
        chaincode = extended.slice(26, 90),
        key = extended.slice(90, 156),
        remain = extended.slice(156);
    return {
        version,
        depth,
        fingerprint,
        childnumber,
        chaincode,
        key,
        remain
    };
}

// Performs hierarchical deterministic key derivation based on the provided data
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
            if (level === "m") {
                xpub = false;
            } else if (level === "M") {
                xpub = true;
                if (from_x_priv === true) {
                    key = getPublicKey(key);
                }
            } else {
                return false;
            }
        }
        if (i > 0) {
            const hardened = xpub === false && level.indexOf("'") >= 0,
                childindex = hardened ? level.split("'")[0] : level,
                childfloat = parseInt(childindex, 10),
                childnumber = hardened ? dectohex(childfloat + 2147483648) : str_pad(dectohex(childfloat), 8),
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

// Performs child key derivation for a single step in the derivation path
function ckd(ckey, cc, index, xpub, hard) {
    const ckd = {},
        parent_pub = xpub ? ckey : getPublicKey(ckey),
        pubh60 = hash160(parent_pub),
        fingerprint = pubh60.slice(0, 8),
        keyfeed = xpub ? parent_pub : (hard ? "00" + ckey : parent_pub),
        rootnode = hmac_bits(keyfeed + index, hextobits(cc), "hex"),
        child_key_pre = rootnode.slice(0, 64),
        child_chaincode = rootnode.slice(64);
    if (xpub) {
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

// Generates an array of key pairs for a range of indices
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

// Generates extended keys (private and public) for a given key object
function ext_keys(eo, currency) {
    const eko = {},
        ext_payload = b58c_x_payload(eo, currency),
        priv_key = eo.key;
    eko.ext_key = b58check_encode(ext_payload);
    if (eo.xpub === false) {
        const pub_key = getPublicKey(priv_key),
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

// Creates an extended public key object for a given currency and path
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

// Generates the payload for Base58Check encoding of extended keys
function b58c_x_payload(eo, currency) {
    const xpubdat = getbip32dat(currency);
    if (!xpubdat) {
        return false;
    }
    const xz_pub = eo.purpose === "84'" ? xpubdat.prefix.pubz : xpubdat.prefix.pubx,
        has_xpub = eo.xpub === true,
        version = has_xpub ? xz_pub : xpubdat.prefix.privx,
        v_hex = str_pad(dectohex(version), 8),
        depth = eo.depth ? str_pad(eo.depth, 2) : "00",
        fingerprint = eo.fingerprint || "00000000",
        childnumber = eo.childnumber ? str_pad(eo.childnumber, 8) : "00000000",
        chaincode = eo.chaincode,
        keyprefix = has_xpub ? "" : "00",
        newkey = eo.key;
    if (version && newkey && chaincode) {
        return v_hex + depth + fingerprint + childnumber + chaincode + keyprefix + newkey;
    } else {
        return false;
    }
}

// Formats keys for different cryptocurrencies based on the derived key object
function format_keys(seed, key_object, bip32, index, coin) {
    const ko = {};
    if (coin === "nano") {
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
    if (coin === "monero") {
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
        pubkey = xpub === true ? prekey : getPublicKey(prekey),
        vb = str_pad(dectohex(bip32.prefix.pub), 2);
    ko.index = index;
    if (coin === "ethereum") {
        ko.address = pub_to_eth_address(pubkey);
    } else if (coin === "bitcoin") {
        if (purpose === "84'") {
            ko.address = pub_to_address_bech32("bc", pubkey);
        } else {
            const versionbytes = key_object.vb;
            if (versionbytes === "04b24746") {
                ko.address = pub_to_address_bech32("bc", pubkey);
            } else {
                ko.address = pub_to_address(vb, pubkey);
            }
        }
    } else if (coin === "litecoin") {
        if (purpose === "84'") {
            ko.address = pub_to_address_bech32("ltc", pubkey);
        } else {
            const versionbytes = key_object.vb;
            if (versionbytes === "04b24746") {
                ko.address = pub_to_address_bech32("ltc", pubkey);
            } else {
                ko.address = pub_to_address(vb, pubkey);
            }
        }
    } else if (coin === "bitcoin-cash") {
        const legacybch = pub_to_address(vb, pubkey);
        ko.address = pub_to_cashaddr(legacybch);
    } else if (coin === "kaspa") {
        // waiting for pub to address script and more details about derivation path's
    } else {
        ko.address = pub_to_address(vb, pubkey);
    }
    ko.pubkey = coin === "ethereum" ? "0x" + pubkey : pubkey;
    if (xpub === false) {
        if (coin === "ethereum") {
            ko.privkey = "0x" + prekey;
        } else {
            const pkv = bip32.pk_vbytes.wif;
            ko.privkey = privkey_wif(str_pad(dectohex(pkv), 2), prekey, true);
        }

    }
    return ko;
}

// Retrieves the extended public key prefix for a given currency
function xpub_prefix(currency) {
    const test_rootkey = get_rootkey(bip39_const.expected_seed),
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

// Sets up event listener for displaying phrase information
function phrase_info() {
    $(document).on("click", "#phrase_info", function() {
        phrase_info_pu(null);
    })
}

// Generates and displays detailed information about the mnemonic phrase
function phrase_info_pu(coin) {
    const phrase_obj = ls_phrase_obj(),
        savedseed = (glob_let.hasbip === true && phrase_obj) ? phrase_obj.pob.join(" ") : false,
        phrase = savedseed || get_phrase();
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
        singleclass = coin ? "single" : "",
        rootclass = coin ? "pd_" + coin : "pd_bitcoin",
        sourceed_str = coin ? "<li><strong>" + translate("source") + ": </strong> Seed</li>" : "<li><strong>BIP39 Seed: </strong><span class='adboxl adbox select' data-type='BIP39 Seed'>" + seed + "</span></li>",
        coindat = coin ? getcoindata(coin) : null,
        cc_icon = coin ? getcc_icon(coindat.cmcid, coindat.ccsymbol + "-" + coin, coindat.erc20) : "",
        header_str = coin ? "<h2>" + cc_icon + " <span>" + coin + " Key Derivation</span></h2>" : "",
        sbu_val = get_setting("backup", "sbu"),
        sbu_str = has_datenc() === true ? "<li class='clearfix'><strong>" + translate("backupsecretphrase") + ":</strong><div id='toggle_sbu_span' class='ait'>" + switchpanel(sbu_val, " global") + "</div></li>" : "",
        del_phr_str = coin ? "" : (glob_let.hasbip === true ? sbu_str + "<li class='clearfix'><div id='deletephrase' class='icon-bin'></div></li>" : ""),
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
    $.each(glob_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            ccsymbol = coinconfig.data.ccsymbol,
            walletdat = coinconfig.wallets,
            bip32dat = getbip32dat(currency);
        if (bip32dat.active === true) {
            const root_path = bip32dat.root_path,
                lb = (currency === "nano") ? "<br/>" : " ",
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
                    store_tag = store_icon ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ",
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
                xmr_phrase = (currency === "monero") ? (is_viewonly() === true) ? false :
                secret_spend_key_to_words(get_ssk(seed, true)) : false,
                xmr_phrase_box = xmr_phrase ? "<div><strong>XMR Seed words: </strong><br/><span class='adboxl adbox select' data-type='XMR Seed words'>" + xmr_phrase + "</span></div>" : "",
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
                if (currency === "bitcoin" || currency === "litecoin") {
                    const hsw = root_path.indexOf("m/84") > -1;
                    segw_node = $("<li class='clearfix" + coinclass + "' data-currency='" + currency + "'><strong>SegWit:</strong><div class='toggle_segwit ait'>" + switchpanel(hsw, " custom") + "</div></li>");
                }
            }
            if (bip39_const.c_derive[currency]) {
                $("#pi_icons").append(icon_node);
                $("#d_paths").append(dp_node);
                $("#xpub_box").append(xp_node);
                $("#segw_box").append(segw_node);
            }
            $("#supported_wallets").append(sw_node);
            pi_show();
        }
    });
}

// Displays a list of compatible wallets for a given coin
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
    $.each(glob_config.bitrequest_coin_data, function(i, coinconfig) {
        const currency = coinconfig.currency,
            ccsymbol = coinconfig.data.ccsymbol,
            walletdat = coinconfig.wallets,
            bip32dat = coinconfig.settings.Xpub;
        if (bip32dat.active === true) {
            let walletlist = "";
            if (walletdat) {
                const platform = getplatform(getdevicetype()),
                    store_icon = platform_icon(platform),
                    store_tag = store_icon ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ",
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

// Generates the URL for a wallet icon based on the wallet name
function w_icon(wname) {
    return glob_const.aws_bucket + "img_icons_wallet-icons_" + wname + ".png";
}

// Sets up event listener for displaying coin-specific information when clicking on coin icons
function phrase_coin_info() {
    $(document).on("click", "#pi_icons img", function() {
        $("#ad_info_wrap").attr("data-class", $(this).attr("data-class"));
        pi_show();
    })
}

// Toggles the visibility of derivation paths
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

// Shows coin-specific information based on the selected coin
function pi_show() {
    const mclass = $("#ad_info_wrap").attr("data-class");
    $(".pd_hide").hide();
    $(".pd_hide." + mclass).show();
    $("#pi_icons img").removeClass("current");
    $("#pi_icons img[data-class='" + mclass + "']").addClass("current");
}

// Sets up event listener for deriving next set of addresses
function test_derive_next() {
    $(document).on("click", ".td_next", function() {
        test_derive_function($(this));
    })
}

// Sets up event listener for deriving previous set of addresses
function test_derive_prev() {
    $(document).on("click", ".td_prev", function() {
        test_derive_function($(this), true);
    })
}

// Performs address derivation for next or previous set of addresses
function test_derive_function(thisnode, prev) {
    const kd = $("#ad_info_wrap").data(),
        dp_node = thisnode.closest(".d_path"),
        dnd = dp_node.data(),
        currency = dnd.currency;
    if (bip39_const.c_derive[currency]) {
        const test_derive_box = dp_node.find(".td_box"),
            td_prev = dp_node.find(".td_prev"),
            count = 5,
            td_li = prev === true ? test_derive_box.find(".der_li").first() : test_derive_box.find(".der_li").last(),
            der_index = td_li.length ? parseInt(td_li.attr("data-index")) : 0,
            startindex = der_index === 0 ? 0 :
            prev === "replace" ? der_index - 4 :
            prev === true ? der_index - count :
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
            lb = currency === "nano" ? "<br/>" : " ",
            root_path = kd.xpub === true ? "M/0/" : bip32dat.root_path,
            derive_array = keypair_array(kd.seed, new Array(count), startindex, root_path, bip32dat, key, chaincode, currency, versionbytes);
        test_derive_box.html("");
        $.each(derive_array, function(i, val) {
            const index = startindex + i,
                tdb_li = "<li class='adbox der_li' data-index='" + index + "'><strong>" + root_path + index + "</strong> " + lb + "<span class='mspace'>" + val.address + "</span></li>";
            test_derive_box.append(tdb_li);
        });
    }
}

// Toggles the visibility of additional information in the phrase info dialog
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

// Toggles the visibility of extended public key (xpub) information
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
            if (!xpub_box.hasClass("rendered")) {
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