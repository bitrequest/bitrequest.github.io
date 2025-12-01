// bip39 (All addresses / xpubs in this app are test addresses derived from the following testphrase, taken from https://github.com/bitcoinbook/bitcoinbook/blob/f8b883dcd4e3d1b9adf40fed59b7e898fbd9241f/ch05.asciidoc)
const bip39_const = {
    "test_phrase": "army van defense carry jealous true garbage claim echo media make crunch", // random phrase used for test derive
    "expected_seed": "5b56c417303faa3fcba7e57400e120a0ca83ec5a4fc9ffba757fbe63fbd77a89a1a3be4c67196f57c39a88b76373733891bfaba16ed27a813ceed498804c0570", // expected seed used for test derive
    "expected_address": "1HQ3rb7nyLPrjnuW85MUknPekwkn7poAUm", // expected addres used for test derive
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
    // ** Core Initialization & Setup: **
    test_bip39();
    //disable_bip39_support 
    //mark_coins_non_derivable
    //mark_coins_xpub_incompatible
    //is_trial
    //validate_trial_status

    // ** BIP39 Test Functions: **
    //test_derivation
    //bech32_check
    //cashaddr_check 
    //nano_check
    //xmr_check
    //xpub_check
    //eth_xpub_check

    // ** Derivation Support Functions: **
    //check_derivations
    //active_xpub
    //has_xpub
    //is_xpub
    //cxpub
    //get_bip32dat
    //has_bip32

    // ** Seed Generation & Management: **
    make_seed();
    restore_seed();
    restore_seed_verify();
    //get_seedid
    //manage_bip32
    submit_disclaimer();
    //bip39

    // ** Seed Panel Navigation: **
    got_it();
    seed_back1();
    seed_back2();
    //seed_nav
    //ls_phrase_obj
    //ls_phrase_obj_parsed
    //seed_decrypt

    // ** Phrase Verification & Backup: **
    backup_continue();
    //check_phrase
    //get_mnemonic_phrase
    //validate_mnemonic
    //find_invalid_word
    //verify_phrase
    //shuffle_array
    verify_words();
    //update_address_lists
    continue_seed();
    skip_verify();
    //complete_seed_setup
    //seed_callback
    //deactivate_xpubs
    //encrypt_seed_data
    //has_encrypted_data
    //pin_to_encryption_key

    // ** Key Derivation Core: **
    //hmac_encrypt
    //mnemonic_to_seed
    //parse_seed
    //generate_mnemonic
    //to_mnemonic

    // ** BIP32 Derivation: **
    //objectify_extended
    //derive_x
    //derive_child_key
    //keypair_array
    //ext_keys
    //xpub_obj
    //b58c_x_payload
    //format_keys
    //xpub_prefix

    // ** Address Generation: **
    //derive_new_address
    //get_latest_index
    //key_cc
    //key_cc_xpub
    //get_rootkey
    //derive_all_init
    //derive_all
    //derive_add_address
    //derive_data
    //derive_obj
    //count_unique_elements

    // ** UI & Information Display: **
    copy_phrase();
    toggle_phrase_visibility();
    //reveal_mnemonic
    delete_phrase_trigger();
    //delete_phrase_verify
    phrase_info();
    //phrase_info_pu
    //list_compatible_wallets
    phrase_coin_info();
    toggle_dpaths();
    //display_coin_info
    test_derive_next();
    test_derive_prev();
    //derive_address_batch
    phrase_moreinfo();
    phrase_showxp();
});

// ** Core Initialization & Setup: **

// Validates BIP39 implementation, crypto support, and address derivation for multiple cryptocurrencies
function test_bip39() {
    if (!crypto) { // test for window.crypto
        disable_bip39_support();
        return
    }
    if (glob_const.has_bigint === false) { // test for js BigInt
        disable_bip39_support();
        return
    }
    const key_string = bip39_const.expected_seed.slice(0, 32),
        encrypted_test = aes_enc(bip39_const.test_phrase, key_string),
        decrypted_test = aes_dec(encrypted_test, key_string);
    if (bip39_const.test_phrase !== decrypted_test) { // test encryption
        disable_bip39_support();
        return
    }
    if (mnemonic_to_seed(bip39_const.test_phrase) !== bip39_const.expected_seed || test_derivation() === false) {
        disable_bip39_support();
        const failed_coins = ["bitcoin", "litecoin", "dogecoin", "dash", "ethereum", "bitcoin-cash", "monero", "nano"];
        mark_coins_non_derivable(failed_coins);
        failed_coins.forEach(coin => {
            bip39_const.c_derive[coin] = false;
        });
    }
    const coin_checks = [{
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
    coin_checks.forEach(function({
        check,
        coin
    }) {
        if (check() === false) {
            mark_coins_non_derivable([coin]);
            bip39_const.c_derive[coin] = false;
        }
    });
    // check xpub derivation
    if (xpub_check() === false) { // test for btc xpub derivation
        const xpub_failed = ["bitcoin", "litecoin", "dogecoin", "dash", "bitcoin-cash"];
        mark_coins_xpub_incompatible(xpub_failed);
        xpub_failed.forEach(coin => {
            bip39_const.can_xpub[coin] = false;
        });
    }
    if (eth_xpub_check() === false) { // test for ethereum xpub derivation
        mark_coins_xpub_incompatible(["ethereum"]);
        bip39_const.can_xpub.ethereum = false;
    }
}

// Marks interface as BIP39 incompatible and disables derivation testing
function disable_bip39_support() {
    glob_const.body.addClass("nobip");
    glob_let.test_derive = false;
}

// Marks specified cryptocurrencies as non-derivable in UI with 500ms DOM ready delay
function mark_coins_non_derivable(arr) {
    setTimeout(function() {
        arr.forEach(function(coin) {
            $("#" + coin + "_settings").addClass("no_derive");
        });
    }, 500)
}

// Marks specified cryptocurrencies as xpub-incompatible in UI with 500ms DOM ready delay
function mark_coins_xpub_incompatible(arr) {
    setTimeout(function() {
        arr.forEach(function(coin) {
            $("#" + coin + "_settings").addClass("no_xpub");
        });
    }, 500)
}

// Validates trial status by checking if timestamp in local storage is within 12-hour window
function is_trial() {
    const trial_timestamp = br_get_local("tp");
    if (trial_timestamp) {
        const trial_duration = 43200000;
        if ((now_utc() - parseFloat(trial_timestamp)) < trial_duration) {
            return true
        }
    }
    return false
}

// Reminder to write down secret phrase
// Enforces address usage limits based on trial status (2 max for trial, 0 for non-trial users)
function validate_trial_status() {
    if (glob_let.hasbip) {
        if (glob_let.bipv) {
            return true
        }
        const active_addresses = filter_all_addressli("seedid", glob_let.bipid).filter(".used"),
            is_trial_active = is_trial();
        if (is_trial_active) {
            if (active_addresses.length > 1) {
                manage_bip32({
                    "type": "popup"
                });
            }
            if (active_addresses.length > 2) {
                return false
            }
        } else {
            manage_bip32({
                "type": "popup"
            });
            if (active_addresses.length > 0) {
                return false
            }
        }
    }
    return true
}

// ** BIP39 Test Functions: **

// Validates Bitcoin address derivation using BIP44 path against expected test vector
function test_derivation() {
    try {
        const coin = "bitcoin",
            root_key = get_rootkey(bip39_const.expected_seed),
            bip32_config = get_bip32dat(coin),
            derive_params = {
                "dpath": "m/44'/0'/0'/0/0",
                "key": root_key.slice(0, 64),
                "cc": root_key.slice(64)
            },
            derived_keys = derive_x(derive_params),
            derived_address = format_keys(bip39_const.expected_seed, derived_keys, bip32_config, 0, coin);
        return derived_address.address === bip39_const.expected_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// Validates Bech32 address format derivation against known test public key
function bech32_check() {
    try {
        const test_pubkey = "03bb4a626f63436a64d7cf1e441713cc964c0d53289a5b17acb1b9c262be57cb17",
            derived_address = pub_to_address_bech32("bc", test_pubkey);
        return glob_const.test_address.bitcoin === derived_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// Validates conversion from legacy to CashAddr format for Bitcoin Cash addresses
function cashaddr_check() {
    try {
        const legacy_address = "1AVPurYZinnctgGPiXziwU6PuyZKX5rYZU",
            cash_address = pub_to_cashaddr(legacy_address);
        return glob_const.test_address["bitcoin-cash"] === cash_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// Validates Nano address derivation from seed using NanocurrencyWeb library
function nano_check() {
    try {
        return glob_const.test_address.nano === NanocurrencyWeb.wallet.accounts(bip39_const.expected_seed, 0, 0)[0].address;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// Validates Monero address derivation from spend key using Coinomi test vector
function xmr_check() { // https://coinomi.github.io/tools/bip39/
    try {
        const spend_key = get_ssk(bip39_const.expected_seed, true),
            derived_keys = xmr_getpubs(spend_key, 0);
        return glob_const.test_address.monero === derived_keys.address;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// Validates Bitcoin xpub derivation against known addresses using both regular and Bech32 formats
function xpub_check() {
    try {
        const coin = "bitcoin",
            xpub_data = key_cc_xpub("xpub6Cy7dUR4ZKF22HEuVq7epRgRsoXfL2MK1RE81CSvp1ZySySoYGXk5PUY9y9Cc5ExpnSwXyimQAsVhyyPDNDrfj4xjDsKZJNYgsHXoEPNCYQ"),
            derive_params = {
                "dpath": "M/0/0",
                "key": xpub_data.key,
                "cc": xpub_data.cc,
                "vb": xpub_data.version
            },
            derived_keys = derive_x(derive_params),
            bip32_config = get_bip32dat(coin),
            derived_address = format_keys(null, derived_keys, bip32_config, 0, coin);
        return derived_address.address === bip39_const.expected_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// Validates Ethereum xpub derivation by checking public key to address conversion
function eth_xpub_check() {
    try {
        const test_pubkey = "03c026c4b041059c84a187252682b6f80cbbe64eb81497111ab6914b050a8936fd",
            derived_address = pub_to_eth_address(test_pubkey);
        return glob_const.test_address["ethereum"] === derived_address;
    } catch (e) {
        console.error(e.name, e.message);
        return false
    }
}

// ** Derivation Support Functions: **

// Returns derivation method ('xpub', 'seed', or false) based on currency's configuration
function check_derivations(coin) {
    if (glob_let.test_derive && bip39_const.c_derive[coin]) {
        const active_pubkey = active_xpub(coin);
        if (cxpub(coin) && active_pubkey) {
            return "xpub";
        }
        if (glob_let.hasbip) {
            return "seed";
        }
    }
    return false
}

// Returns active xpub data if currency has selected xpub, false otherwise
function active_xpub(coin) {
    const pubkey_data = has_xpub(coin)
    return pubkey_data && pubkey_data.selected === true ? pubkey_data : false;
}

// Returns xpub configuration if currency has valid xpub, false otherwise
function has_xpub(coin) {
    const pubkey_config = is_xpub(coin);
    return pubkey_config && pubkey_config.key ? pubkey_config : false;
}

// Returns xpub data from currency settings if xpub is supported, false otherwise
function is_xpub(coin) {
    if (cxpub(coin)) {
        const xpub_settings = cs_node(coin, "Xpub", true);
        return xpub_settings || false;
    }
    return false
}

// Returns boolean indicating if currency supports xpub functionality
function cxpub(coin) {
    return !!bip39_const.can_xpub[coin];
}

// Retrieves BIP32 configuration data from active xpub or coin settings
function get_bip32dat(coin) {
    const xpub_settings = cs_node(coin, "Xpub", true);
    if (xpub_settings && xpub_settings.active === true) {
        return xpub_settings;
    }
    const coin_config = get_coin_definition(coin);
    if (coin_config) {
        const xpub_config = q_obj(coin_config, "settings.Xpub");
        if (xpub_config && xpub_config.active) {
            return xpub_config;
        }
    }
    return false
}

// Checks if currency has BIP32 support in its configuration
function has_bip32(coin) {
    const coin_config = get_coin_definition(coin);
    if (coin_config) {
        const has_xpub = q_obj(coin_config, "settings.Xpub.active");
        if (has_xpub) {
            return true
        }
    }
    return false
}

// ** Seed Generation & Management: **

// Handles UI interaction for generating new seed phrases
function make_seed() {
    $(document).on("click", "#option_makeseed", function() {
        const coin = $(this).attr("data-currency");
        if (glob_let.hasbip) {
            topnotify(tl("alreadyhavesecretphrase"));
            return
        }
        canceldialog();
        manage_bip32({
            "type": coin,
            "edit": true
        });
    })
}

// Handles UI interaction for restoring existing seed phrases
function restore_seed() {
    $(document).on("click", "#rest_seed, .applist.pobox li.seedu .address .srcicon", function() {
        if (is_viewonly() === true) {
            show_view_only_error();
            return false
        }
        if (glob_let.hasbip) {
            return false
        }
        const confirm_restore = confirm(tl("resoresecretphrase") + "?");
        if (confirm_restore) {
            const seed_id = $(this).attr("data-seedid");
            canceloptions();
            canceldialog();
            bip39({
                "type": "restore",
                "edit": true,
                "seedid": seed_id
            });
            $("#seed_step2").addClass("restore");
            seed_nav(2);
            $("#bip39phrase").focus();
        }
    })
}

// Validates and processes seed phrase restoration attempts
function restore_seed_verify() {
    $(document).on("click", "#restore_seed", function() {
        if (glob_let.hasbip) {
            return false
        }
        glob_let.phrasearray = null,
            glob_let.phraseverified = false;
        const input_phrase = get_mnemonic_phrase(),
            is_valid = check_phrase(input_phrase);
        if (is_valid) {
            const target_id = $(this).attr("data-seedid"),
                phrase_words = input_phrase.split(" "),
                current_id = get_seedid(phrase_words);
            if (target_id === current_id) {
                glob_let.phrasearray = phrase_words,
                    glob_let.phraseverified = true;
                $("#seed_steps").addClass("checked");
                complete_seed_setup();
                return
            }
            shake($("#bip39phrase"));
            topnotify(tl("wrongsecretphrase"));
            return
        }
        topnotify(is_valid);
    })
}

// Generates 8-character seed identifier from word array using HMAC-SHA256
function get_seedid(words) {
    return hmacsha(btoa(JSON.stringify(words)), "sha256").slice(0, 8);
}

// Controls BIP32 wallet setup flow and disclaimer acceptance
function manage_bip32(dat) {
    if (glob_let.hasbip) {
        bip39(dat);
        return
    }
    const dialog_data = get_default_object(dat, true),
        dialog_elements = [{
                "div": {
                    "class": "popform",
                    "content": [{
                        "div": {
                            "class": "inputwrap",
                            "content": "<p>" + tl("cannotbespend") + "</p>"
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
                            "content": tl("understandandok")
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
        dialog_content = $(template_dialog({
            "id": "disclaimer_dialog",
            "icon": "icon-warning",
            "title": tl("disclaimer"),
            "elements": dialog_elements
        })).data(dialog_data);
    if ($("#option_makeseed").length) {
        canceldialog();
        setTimeout(function() {
            popdialog(dialog_content, "triggersubmit");
        }, 1000);
    } else {
        popdialog(dialog_content, "triggersubmit");
    }
}

// Processes disclaimer dialog submission and triggers BIP39 setup if confirmed
function submit_disclaimer() {
    $(document).on("click", "#disclaimer_dialog input.submit", function(e) {
        e.preventDefault();
        const dialog = $("#disclaimer_dialog"),
            dialog_data = dialog.data(),
            checkbox = dialog.find("#pk_confirmwrap"),
            is_confirmed = checkbox.data("checked");
        if (is_confirmed) {
            canceldialog();
            bip39(dialog_data);
        } else {
            popnotify("error", tl("consent"));
        }
    })
}

// Sets up BIP39 seed generation UI with steps for backup, verification, and restoration
function bip39(dat) {
    glob_let.phraseverified = false;
    const dialog_data = get_default_object(dat, true),
        saved_phrase = ls_phrase_obj(),
        can_edit = dialog_data && dialog_data.edit,
        dialog_type = dialog_data.type || null,
        is_restore = dialog_type === "restore" && can_edit === true,
        ui_state = glob_let.hasbip === true ? (glob_let.bipv === true ? "bipsavedbu" : "bipsaved") : "nobip",
        current_step = ui_state === "nobip" ? 1 : (ui_state === "bipsavedbu" ? 2 : 3),
        phrase_class = ui_state === "nobip" ? " showphrase" : " hidephrase",
        existing_seed = glob_let.hasbip ? (saved_phrase ? saved_phrase.pob.join(" ") : false) : false,
        seed_phrase = is_restore ? "" : existing_seed || generate_mnemonic(12),
        reminder_text = dialog_type === "restore" ? "<p>" + tl("overwritten") + "</p>" : "<p>" + tl("pleaseverify") + "</p>",
        verify_header = dialog_type === "restore" ? tl("verifycurrent") : tl("verifybackup"),
        save_prompt = is_restore ? tl("entersecretphrase") : tl("writedownsecretphrase"),
        verify_button = is_restore ? "<div id='restore_seed' class='button' data-seedid='" + dialog_data.seedid + "'>" + tl("restorebttn") + "</div>" : "<div id='cfbu2' class='button'>" + tl("ivebackeditup") + "</div>",
        markup = $("<div id='seed_steps' class='panel" + current_step + "' data-goal='" + dialog_type + "'>\
        <div id='seed_step1' class='seed_step'>\
            <div class='ss_header'>\
                <div class='icon-cross ssnav'></div>\
            </div>\
            <div class='ss_content flex'>\
                <div class='ss_content_box'>\
                    <h2 style='color:#eeac57'>" + tl("important") + "</h2>\
                    <p><strong>" + tl("abouttobecome") + "</strong><br/>" + tl("inthenextscreen") + " <strong style='color:#eeac57'>" + tl("makesure") + "</strong></p>\
                    <p><strong>" + tl("ifyouloseyourdevice") + "</strong></p>\
                    <p class='p_warning' style='text-transform:uppercase'><strong>" + tl("ifyouloseyourphrase") + "</strong></p>\
                </div>\
            </div>\
            <div class='ss_footer'>\
                <div id='cfbu1' class='button'>" + tl("understand") + "</div>\
            </div>\
        </div>\
        <div id='seed_step2' class='seed_step'>\
            <div class='ss_header'>\
                <div class='icon-arrow-left2 ssnav'></div>\
                <div class='icon-cross ssnav'></div>\
            </div>\
            <div class='ss_content flex'>\
                <div id='phrase_cb' class='ss_content_box" + phrase_class + "'>\
                    <h2 id='showphrase'><span class='icon-eye-blocked eye linkcolor'></span><span class='icon-eye eye linkcolor'></span>" + tl("bip39_passphrase") + ":</h2>\
                    <p>" + save_prompt + "</p>\
                    <div id='phrasewrap'>\
                        <div id='bip39phrase' contenteditable='" + can_edit + "' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' lang='en' class='noselect'>" + seed_phrase + "</div>\
                        <div id='phrase_actions'>\
                            <div id='copyphrase' class='button linkcolor'>" + tl("copy") + "</div>\
                            <div id='phrase_info' class='linkcolor' title='seed info'><span class='icon-info'></span></div>\
                        </div>\
                        <div id='phraseblur'></div>\
                    </div>\
                </div>\
            </div>\
            <div class='ss_footer'>" + verify_button + "</div>\
        </div>\
        <div id='seed_step3' class='seed_step'>\
            <div class='ss_header'>\
                <div class='icon-arrow-left2 ssnav'></div>\
            </div>\
            <div class='ss_content flex'>\
                <div class='ss_content_box'><h2>" + verify_header + "</h2><p id='reminder_seed_backup'>" + tl("congratulations") + "<br/></p>\
                <p id='gpp'>" + tl("withgreatpower") + "<br/><strong>" + tl("remember") + "</strong></p>" + reminder_text + "<div id='seed_verify_box'>\
                    </div>\
                    <div id='cfbu3_w'>\
                        <div id='cfbu3' class='button'>" + tl("idothislater") + "</div>\
                    </div>\
                </div>\
            </div>\
            <div class='ss_footer'>\
                <div id='continue_seed' class='button'>Continue</div>\
            </div>\
        </div>\
    </div>").data(dialog_data);
    if (inj(ui_state)) return // xss filter
    $("#sd_panel").html(markup).addClass(ui_state);
    glob_const.body.addClass("seed_dialog");
    if (current_step === 3) {
        verify_phrase(seed_phrase.split(" "), 3);
    }
    prevent_screen_sleep();
}

// ** Seed Panel Navigation: **

// Advances seed generation process from step 1 to step 2
function got_it() {
    $(document).on("click", "#cfbu1", function() {
        seed_nav(2);
    })
}

// Navigates back from step 2 to step 1 in seed generation
function seed_back1() {
    $(document).on("click", "#seed_steps #seed_step2 .ss_header .icon-arrow-left2", function() {
        seed_nav(1);
    })
}

// Navigates back from step 3 to step 2 in seed generation
function seed_back2() {
    $(document).on("click", "#seed_steps #seed_step3 .ss_header .icon-arrow-left2, #seed_steps #seed_step3 #toseed", function() {
        seed_nav(2);
        $("#seed_step3").removeClass("delete verify");
    })
}

// Changes active panel in seed generation UI to specified step number
function seed_nav(step_num) {
    $("#seed_steps").attr("class", "panel" + step_num);
}

// Retrieves phrase object from global state or returns false
function ls_phrase_obj() {
    return glob_let.bipobj ? ls_phrase_obj_parsed(glob_let.bipobj) : false;
}

// Decodes and parses encrypted or plain phrase object from storage
function ls_phrase_obj_parsed(phrase_obj) {
    const encrypted_data = phrase_obj.datenc;
    let phrase_data = phrase_obj.dat;
    if (encrypted_data) {
        const decrypted = s_decode(encrypted_data),
            decoded_data = decrypted.dat;
        if (decoded_data) {
            phrase_data = decoded_data;
        }
    }
    if (phrase_data) {
        const parsed_data = JSON.parse(atob(phrase_data));
        return {
            "pid": parsed_data.pid,
            "pob": JSON.parse(atob(parsed_data.pob))
        }
    }
    return false
}

// Decrypts seed data using provided PIN and returns parsed object
function seed_decrypt(pin) {
    if (glob_let.bipobj) {
        const encrypted_data = glob_let.bipobj.datenc;
        if (encrypted_data) {
            const decrypted = s_decode(encrypted_data, pin),
                decoded_data = decrypted.dat;
            if (decoded_data) {
                return JSON.parse(atob(decoded_data));
            }
        }
        const plain_data = glob_let.bipobj.dat;
        if (plain_data) {
            return JSON.parse(atob(plain_data));
        }
    }
    return false
}

// ** Phrase Verification & Backup: **

// Validates phrase and triggers verification step in backup process
function backup_continue() {
    $(document).on("click", "#cfbu2", function() {
        glob_let.phrasearray = null,
            glob_let.phraseverified = false;
        const input_phrase = get_mnemonic_phrase(),
            is_valid = check_phrase(input_phrase);
        if (is_valid === true) {
            const phrase_words = input_phrase.split(" ");
            verify_phrase(phrase_words, 3);
            glob_let.phrasearray = phrase_words;
            $("#seed_steps").removeClass("checked");
            $("#seed_step3").addClass("verify");
            seed_nav(3);
            return
        }
        topnotify(is_valid);
    })
}

// Validates seed phrase format, length, and BIP39 compatibility
function check_phrase(input_phrase) {
    const phrase_words = input_phrase.split(" "),
        word_count = phrase_words.length;
    if (word_count < 2) {
        return tl("emptyphrase");
    }
    if (word_count === 12) {
        if (validate_mnemonic(input_phrase) === false) {
            const invalid_word = find_invalid_word(phrase_words);
            if (invalid_word) {
                return tl("notinwordlist", {
                    "missing_word": invalid_word
                });
            }
            return tl("notbip39compatible");
        }
        return true
    }
    return tl("mustbe12characters");
}

// Returns cleaned seed phrase text from DOM element
function get_mnemonic_phrase() {
    return clean_string($("#bip39phrase").text());
}

// Validates BIP39 mnemonic using SHA256 hash comparison
function validate_mnemonic(mnemonic) {
    const binary_str = mnemonic_to_binary_string(mnemonic);
    if (binary_str === null) {
        return false
    }
    const str_len = binary_str.length,
        data_bits = binary_str.substring(0, str_len / 33 * 32),
        hash_bits = binary_str.substring(str_len - str_len / 33, str_len),
        data_array = binary_string_to_word_array(data_bits),
        hash_result = sjcl.hash.sha256.hash(data_array),
        hash_hex = from_bits(hash_result),
        hash_binary = pad_binary(hex_string_to_binary_string(hash_hex), 256),
        calc_hash = hash_binary.substring(0, str_len / 33);
    return hash_bits === calc_hash;
}

// Returns first word from input array not found in BIP39 wordlist
function find_invalid_word(word_list) {
    let invalid_word;
    $.each(word_list, function(i, word) {
        if (wordlist.indexOf(word) === -1) {
            invalid_word = word;
            return
        }
    });
    return invalid_word;
}

// Creates UI elements for verifying selected words from seed phrase
function verify_phrase(word_list, word_count) {
    const word_indices = word_list.map((word, i) => ({
            "word": word,
            "index": i + 1
        })),
        randomized_words = shuffle_array(word_indices),
        selected_words = randomized_words.slice(0, word_count),
        verify_box = $("#seed_verify_box");
    verify_box.html("");
    $.each(selected_words, function(i, word_data) {
        const word = word_data.word,
            word_num = word_data.index,
            focus_attr = (i === 0) ? " autofocus" : "",
            input_element = "<div class='checkword_box uncheck'><input type='text' placeholder='" + tl("word") + " #" + word_num + "' data-word='" + word + "'" + focus_attr + " autocorrect='off' autocapitalize='none'/><span class='icon-checkmark'></span></div>";
        verify_box.append(input_element);
    });
}

// Implements Fisher-Yates shuffle algorithm for array randomization
function shuffle_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const rand_index = Math.floor(Math.random() * (i + 1));
        [array[i], array[rand_index]] = [array[rand_index], array[i]];
    }
    return array;
}

// Handles word verification input and triggers appropriate callbacks
function verify_words() {
    $(document).on("input", "#seed_verify_box input", function(e) {
        const input_field = $(this),
            word_box = input_field.closest(".checkword_box"),
            target_word = input_field.data("word"),
            input_value = input_field.val();
        if (input_value === target_word) {
            input_field.blur();
            word_box.removeClass("uncheck");
            const remaining_words = $("#seed_verify_box").find(".uncheck"),
                words_left = remaining_words.length;
            if (words_left > 0) {
                const next_input = remaining_words.first().find("input");
                setTimeout(function() {
                    next_input.focus().val("");
                }, 500);
                return
            }
            const verification_step = $("#seed_step3");
            if (verification_step.hasClass("delete")) {
                const confirm_delete = confirm(tl("areyousuredfp"));
                if (confirm_delete) {
                    br_remove_local("bpdat");
                    const init_data = br_get_local("init", true),
                        updated_init = get_default_object(init_data, true);
                    updated_init.bipv = "no";
                    delete updated_init.bipv;
                    br_set_local("init", updated_init, true);
                    glob_let.hasbip = false;
                    glob_let.bipv = false;
                    glob_let.bipid = false;
                    update_address_lists();
                    hide_seed_panel();
                    notify(tl("secretphrasedeleted"));
                }
                return
            }
            if (verification_step.hasClass("replace")) {
                const confirm_restore = confirm(tl("restoresecretphrasefrombackup"));
                if (confirm_restore) {
                    const backup_data = $("#seed_steps").data().dat;
                    restore_callback(backup_data, true);
                }
                return
            }
            glob_let.phraseverified = true;
            $("#seed_steps").addClass("checked");
            complete_seed_setup();
            return
        }
        word_box.addClass("uncheck");
    });
}

// Updates UI and address lists after seed phrase changes
function update_address_lists() {
    $.each(glob_config.bitrequest_coin_data, function(i, coin_config) {
        const coin = coin_config.currency,
            bip32_settings = coin_config.settings.Xpub;
        if (bip32_settings.active) {
            const address_list = get_addresslist(coin);
            address_list.children(".adli").each(function(i) {
                const address_item = $(this);
                if (address_item.hasClass("seed")) {
                    const seed_id = address_item.data("seedid");
                    if (seed_id === glob_let.bipid) {
                        address_item.removeClass("seedu").addClass("seedv").attr("data-checked", "true").data("checked", true);
                    } else {
                        address_item.removeClass("seedv").addClass("seedu").attr("data-checked", "false").data("checked", false);
                    }
                }
            });
            save_addresses(coin, false);
            check_currency(coin);
        }
    });
}

// Handles continue button click in seed setup flow
function continue_seed() {
    $(document).on("click", "#continue_seed", function() {
        complete_seed_setup();
    })
}

// Shows warning dialog when skipping seed verification
function skip_verify() {
    $(document).on("click", "#cfbu3", function() {
        const warning_content = "<h2><span class='icon-warning' style='color:#B33A3A'></span>" + tl("continueatownrisk") + "</h2><p><strong>" + tl("ifyouloseyourdevice") + "</strong></p>";
        popdialog(warning_content, "complete_seed_setup");
    })
}

// Completes seed setup with PIN validation
function complete_seed_setup() {
    canceldialog();
    if (check_pin_enabled(true)) {
        seed_callback();
        return
    }
    const pin_callback = {
            "func": seed_callback
        },
        pin_content = pinpanel("", pin_callback);
    showoptions(pin_content, "pin");
}

// Processes final seed setup steps and initializes derivation
function seed_callback() {
    if (!glob_let.hasbip) {
        const phrase_obj = {},
            seed_string = btoa(JSON.stringify(glob_let.phrasearray)),
            phrase_id = hmacsha(seed_string, "sha256").slice(0, 8),
            storage_data = {
                "id": phrase_id,
                "dat": null
            };
        phrase_obj.pid = phrase_id;
        phrase_obj.pob = seed_string;
        br_set_local("bpdat", storage_data, true);
        br_set_local("tp", now_utc());
        glob_let.bipobj = storage_data,
            glob_let.hasbip = true,
            glob_let.bipid = phrase_id;
        notify("🎉 " + tl("congratulations") + " 🎉");
        const seed_id = phrase_id,
            seed_phrase = glob_let.phrasearray.join(" ");
        if (set_up()) {
            const existing_derivations = filter_all_addressli("seedid", seed_id);
            if (existing_derivations.length > 0) {
                update_address_lists();
            }
            deactivate_xpubs();
            derive_all(seed_phrase, seed_id);
            save_currencies(true);
        } else {
            derive_all_init(seed_phrase, seed_id);
            openpage("?p=home", "home", "loadpage");
            const selected_coin = $("#seed_steps").attr("data-goal"),
                home_item = get_homeli(selected_coin);
            home_item.find(".rq_icon").trigger("click");
        }
        encrypt_seed_data(phrase_obj);
    }
    if (glob_let.phraseverified === true) {
        // save as verified
        const init_data = br_get_local("init", true),
            updated_init = get_default_object(init_data, true);
        updated_init.bipv = "yes";
        br_set_local("init", updated_init, true);
        glob_let.bipv = true;
        topnotify(tl("passphraseverified"));
    } else {
        notify(tl("backupasap"));
    }
    hide_seed_panel();
}

// Disables xpub settings across all supported cryptocurrencies
function deactivate_xpubs() {
    $.each(glob_config.bitrequest_coin_data, function(i, coin_config) {
        const bip32_settings = coin_config.settings.Xpub;
        if (bip32_settings.xpub === true) {
            const coin = coin_config.currency,
                xpub_list = cs_node(coin, "Xpub");
            if (xpub_list) {
                const xpub_switch = xpub_list.find(".switchpanel.custom");
                xpub_list.data("selected", false).find("p").text("false");
                xpub_switch.removeClass("true").addClass("false");
                save_cc_settings(coin);
            }
        }
    });
}

// Encrypts seed data using PIN-derived key
function encrypt_seed_data(data) {
    if (glob_let.hasbip && glob_let.test_derive) {
        const pin_hash = get_setting("pinsettings", "pinhash");
        if (pin_hash) {
            let seed_data;
            if (data) {
                seed_data = data;
            } else {
                const decrypted_phrase = seed_decrypt();
                if (decrypted_phrase) {
                    seed_data = decrypted_phrase;
                }
            }
            if (seed_data) {
                const seed_obj = glob_let.bipobj,
                    encoded_seed = btoa(JSON.stringify(seed_data)),
                    seed_id = seed_obj.id,
                    enc_key = pin_to_encryption_key(pin_hash, seed_id),
                    encrypted_data = aes_enc(JSON.stringify(encoded_seed), enc_key);
                seed_obj.datenc = {
                    "id": seed_id,
                    "dat": encrypted_data
                };
                seed_obj.dat = null;
                br_set_local("bpdat", seed_obj, true);
                glob_let.bipobj = seed_obj;
            }
        }
    }
}

// Checks for existence of encrypted seed data
function has_encrypted_data() {
    return glob_let.hasbip === true && glob_let.bipobj.datenc ? true : false;
}

// Generates encryption key from PIN using wordlist mapping
function pin_to_encryption_key(pin, seed_id) {
    const pin_digits = pin.toString().split(""),
        weighted_values = pin_digits.map((digit, i) => {
            const digit_value = parseFloat(digit),
                safe_value = (digit_value === 0) ? 1 : digit_value;
            return safe_value * (i + 1);
        }),
        max_value = Math.max.apply(Math, weighted_values),
        word_mapping = weighted_values.map(value => {
            const word_index = Math.floor((value / max_value) * 2048);
            return wordlist[word_index - 1];
        });
    return hmacsha(word_mapping.join(" ") + seed_id, "sha256").slice(0, 32);
}

// ** Key Derivation Core: **

// Constructor for HMAC SHA-512 encryptor
function hmac_encrypt(key) {
    const hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    this.encrypt = function() {
        return hmac.encrypt.apply(hmac, arguments);
    };
}

// Converts mnemonic to seed using PBKDF2
function mnemonic_to_seed(mnemonic, passphrase) {
    const seed_params = parse_seed(mnemonic, passphrase);
    return from_bits(sjcl.misc.pbkdf2(seed_params.mnemonic, seed_params.passphrase, 2048, 512, hmac_encrypt));
}

// Normalizes mnemonic and passphrase for seed generation
function parse_seed(mnemonic, input_passphrase) {
    const empty_passphrase = input_passphrase || "",
        clean_mnemonic = clean_string(mnemonic),
        norm_passphrase = normalize_string(empty_passphrase),
        salt_prefix = "mnemonic" + norm_passphrase;
    return {
        "mnemonic": to_bits(clean_mnemonic),
        "passphrase": to_bits(salt_prefix)
    }
}

// Generates random mnemonic phrase of specified length
function generate_mnemonic(word_count) {
    const entropy_bits = word_count / 3 * 32,
        random_bytes = uint_8array(entropy_bits / 8),
        entropy_data = crypto.getRandomValues(random_bytes);
    return to_mnemonic(entropy_data);
}

// Converts random bytes to mnemonic using wordlist
function to_mnemonic(byte_array) {
    if (byte_array.length % 4 > 0) {
        throw "Data length in bits should be divisible by 32, but it is not (" + byte_array.length + " bytes = " + byte_array.length * 8 + " bits)."
    }
    const word_array = byte_array_to_word_array(byte_array),
        checksum = hmacsha(word_array, "sha256"),
        entropy_bits = byte_array_to_binary_string(byte_array),
        checksum_bits = pad_binary(hex_string_to_binary_string(checksum), 256),
        checksum_length = byte_array.length * 8 / 32,
        full_bits = entropy_bits + checksum_bits.substring(0, checksum_length),
        word_list = [],
        word_count = full_bits.length / 11;
    for (let i = 0; i < word_count; i++) {
        const word_index = parseInt(full_bits.substring(i * 11, (i + 1) * 11), 2);
        word_list.push(wordlist[word_index]);
    }
    return join_words(word_list);
}

// ** BIP32 Derivation: **

// Parses extended key format into component parts
function objectify_extended(extended_key) {
    const version_bytes = extended_key.slice(0, 8),
        depth_byte = extended_key.slice(8, 10),
        parent_fingerprint = extended_key.slice(10, 18),
        child_number = extended_key.slice(18, 26),
        chain_code = extended_key.slice(26, 90),
        pubkey = extended_key.slice(90, 156),
        remaining = extended_key.slice(156);
    return {
        "version": version_bytes,
        "depth": depth_byte,
        "fingerprint": parent_fingerprint,
        "childnumber": child_number,
        "chaincode": chain_code,
        "key": pubkey,
        "remain": remaining
    };
}

// Performs BIP32 hierarchical key derivation
function derive_x(derive_params, from_private) {
    const path = derive_params.dpath,
        path_segments = path.split("/"),
        depth = path_segments.length - 1;
    let derived_data = {},
        current_key = derive_params.key,
        current_chain = derive_params.cc,
        is_public = false,
        path_purpose = null;
    $.each(path_segments, function(i, segment) {
        if (i === 0) {
            if (segment === "m") {
                is_public = false;
            } else if (segment === "M") {
                is_public = true;
                if (from_private === true) {
                    current_key = get_publickey(current_key);
                }
            } else {
                return false
            }
        }
        if (i > 0) {
            const is_hardened = is_public === false && segment.indexOf("'") >= 0,
                index_str = is_hardened ? segment.split("'")[0] : segment,
                index_num = parseInt(index_str, 10),
                child_index = is_hardened ? dec_to_hex(index_num + 2147483648) : str_pad(dec_to_hex(index_num), 8),
                child_keys = derive_child_key(current_key, current_chain, child_index, is_public, is_hardened);
            if (i === 1) {
                path_purpose = segment;
            }
            if (i === depth) {
                child_keys.purpose = path_purpose;
                child_keys.depth = i;
                child_keys.childnumber = child_index;
                child_keys.xpub = is_public;
                derived_data = child_keys;
            } else {
                current_key = child_keys.key;
                current_chain = child_keys.chaincode;
            }
        }
    });
    if (is_public === true) {
        derived_data.vb = derive_params.vb;
    }
    return derived_data;
}

// Derives child keys using BIP32 algorithm
function derive_child_key(parent_key, chain_code, child_index, is_public, is_hardened) {
    const derived_keys = {},
        parent_pubkey = is_public ? parent_key : get_publickey(parent_key),
        pub_hash = hash160(parent_pubkey),
        parent_fp = pub_hash.slice(0, 8),
        input_key = is_public ? parent_pubkey : (is_hardened ? "00" + parent_key : parent_pubkey),
        hmac_result = hmac_bits(input_key + child_index, hex_to_bits(chain_code), "hex"),
        child_key = hmac_result.slice(0, 64),
        child_chain = hmac_result.slice(64);
    if (is_public) {
        const key_point = secp.Point.fromPrivateKey(child_key);
        derived_keys.key = secp.Point.fromHex(parent_key).add(key_point).toHex(true);
    } else {
        const child_decimal = (hex_to_dec(parent_key) + hex_to_dec(child_key)) % oc;
        derived_keys.key = str_pad(child_decimal.toString(16), 64);
    }
    derived_keys.chaincode = child_chain;
    derived_keys.fingerprint = parent_fp;
    return derived_keys;
}

// Generates array of derived key pairs for given range
function keypair_array(seed, indices, start_index, derive_path, bip32_config, key, chain_code, coin, version) {
    const derived_pairs = [];
    $.each(indices, function(i) {
        const current_index = i + start_index,
            full_path = derive_path + current_index,
            derive_params = {
                "dpath": full_path,
                "key": key,
                "cc": chain_code,
                "vb": version
            },
            ext_keys = derive_x(derive_params),
            formatted_keys = format_keys(seed, ext_keys, bip32_config, current_index, coin);
        derived_pairs.push(formatted_keys);
    });
    return derived_pairs;
}

// Creates extended private and public keys from key object
function ext_keys(key_data, coin) {
    const ext_keys = {},
        ext_payload = b58c_x_payload(key_data, coin),
        private_key = key_data.key;
    ext_keys.ext_key = b58check_encode(ext_payload);
    if (key_data.xpub === false) {
        const public_key = get_publickey(private_key),
            pub_data = {
                "chaincode": key_data.chaincode,
                "purpose": key_data.purpose,
                "childnumber": key_data.childnumber,
                "depth": key_data.depth,
                "fingerprint": key_data.fingerprint,
                "xpub": true,
                "key": public_key
            },
            pub_payload = b58c_x_payload(pub_data, coin),
            ext_pubkey = b58check_encode(pub_payload);
        ext_keys.ext_pub = ext_pubkey;
    }
    return ext_keys;
}

// Builds xpub object containing key, id and prefix
function xpub_obj(coin, root_path, chain_code, key) {
    const derive_params = {
            "dpath": root_path.slice(0, -3),
            "key": key,
            "cc": chain_code
        },
        derived_keys = derive_x(derive_params),
        extended_keys = ext_keys(derived_keys, coin),
        xpub_key = extended_keys.ext_pub,
        xpub_id = hmacsha(xpub_key, "sha256").slice(0, 8);
    return {
        "xpub": xpub_key,
        "xpubid": xpub_id,
        "prefix": xpub_key.slice(0, 4)
    }
}

// Creates Base58Check payload for extended key encoding
function b58c_x_payload(key_data, coin) {
    const xpub_config = get_bip32dat(coin);
    if (!xpub_config) {
        return false
    }
    const z_public = key_data.purpose === "84'" ? xpub_config.prefix.pubz : xpub_config.prefix.pubx,
        is_public = key_data.xpub === true,
        version = is_public ? z_public : xpub_config.prefix.privx,
        version_hex = str_pad(dec_to_hex(version), 8),
        depth = key_data.depth ? str_pad(key_data.depth, 2) : "00",
        fingerprint = key_data.fingerprint || "00000000",
        child_num = key_data.childnumber ? str_pad(key_data.childnumber, 8) : "00000000",
        chain_code = key_data.chaincode,
        key_prefix = is_public ? "" : "00",
        key_hex = key_data.key;
    if (version && key_hex && chain_code) {
        return version_hex + depth + fingerprint + child_num + chain_code + key_prefix + key_hex;
    } else {
        return false
    }
}

// Formats keys into currency-specific address formats
function format_keys(seed, key_data, bip32_config, index, coin) {
    const formatted_keys = {};
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
        return formatted_keys;
    }
    if (coin === "monero") {
        if (seed) {
            const spend_key = get_ssk(seed, true),
                xmr_keys = xmr_getpubs(spend_key, index);
            return {
                "index": index,
                "address": xmr_keys.address,
                "vk": xmr_keys.account + xmr_keys.svk
            }
        }
        return formatted_keys;
    }
    const purpose = key_data.purpose,
        is_public = key_data.xpub,
        raw_key = key_data.key,
        pubkey = is_public ? raw_key : get_publickey(raw_key),
        version_bytes = str_pad(dec_to_hex(bip32_config.prefix.pub), 2);
    formatted_keys.index = index;
    if (coin === "ethereum") {
        formatted_keys.address = pub_to_eth_address(pubkey);
    } else if (coin === "bitcoin") {
        if (purpose === "84'") {
            formatted_keys.address = pub_to_address_bech32("bc", pubkey);
        } else {
            const version = key_data.vb;
            if (version === "04b24746") {
                formatted_keys.address = pub_to_address_bech32("bc", pubkey);
            } else {
                formatted_keys.address = pub_to_address(version_bytes, pubkey);
            }
        }
    } else if (coin === "litecoin") {
        if (purpose === "84'") {
            formatted_keys.address = pub_to_address_bech32("ltc", pubkey);
        } else {
            const version = key_data.vb;
            if (version === "04b24746") {
                formatted_keys.address = pub_to_address_bech32("ltc", pubkey);
            } else {
                formatted_keys.address = pub_to_address(version_bytes, pubkey);
            }
        }
    } else if (coin === "bitcoin-cash") {
        const legacy_address = pub_to_address(version_bytes, pubkey);
        formatted_keys.address = pub_to_cashaddr(legacy_address);
    } else if (coin === "kaspa") {
        // waiting for pub to address script and more details about derivation path's
    } else {
        formatted_keys.address = pub_to_address(version_bytes, pubkey);
    }
    formatted_keys.pubkey = coin === "ethereum" ? "0x" + pubkey : pubkey;
    if (is_public === false) {
        if (coin === "ethereum") {
            formatted_keys.privkey = "0x" + raw_key;
        } else {
            const pk_version = bip32_config.pk_vbytes.wif;
            formatted_keys.privkey = privkey_wif(str_pad(dec_to_hex(pk_version), 2), raw_key, true);
        }
    }
    return formatted_keys;
}

// Gets xpub prefix for given currency
function xpub_prefix(coin) {
    const root_key = get_rootkey(bip39_const.expected_seed),
        derive_params = {
            "dpath": "m/0",
            "key": root_key.slice(0, 64),
            "cc": root_key.slice(64)
        },
        derived_keys = derive_x(derive_params),
        extended_keys = ext_keys(derived_keys, coin);
    return extended_keys.ext_pub.slice(0, 4);
}

// ** Address Generation: **

// Derives and adds new address for specified currency
function derive_new_address(coin, extra) {
    const derived_data = derive_data(coin, extra);
    if (derived_data) {
        derive_add_address(coin, derived_data);
        return true
    }
    return false
}

// Returns highest derivation index from address list
function get_latest_index(address_list) {
    const indices = dom_to_array(address_list, "derive_index");
    return Math.max.apply(Math, indices);
}

// Extracts key and chaincode from seed phrase
function key_cc() {
    const seed_obj = ls_phrase_obj();
    if (seed_obj) {
        const seed_id = seed_obj.pid,
            phrase = seed_obj.pob.join(" "),
            seed_hex = mnemonic_to_seed(phrase),
            root_key = get_rootkey(seed_hex),
            master_key = root_key.slice(0, 64),
            chain_code = root_key.slice(64);
        return {
            "key": master_key,
            "cc": chain_code,
            "seed": seed_hex,
            "seedid": seed_id
        };
    }
    return false
}

// Extracts key and chaincode components from xpub string
function key_cc_xpub(xpub) {
    const decoded_key = b58check_decode(xpub),
        key_parts = objectify_extended(decoded_key);
    return {
        "key": key_parts.key,
        "cc": key_parts.chaincode,
        "version": key_parts.version
    }
}

// Generates master root key from seed using HMAC-SHA512
function get_rootkey(seed) {
    return hmac_bits(seed, to_bits("Bitcoin seed"), "hex");
}

// Sets initial account settings and derives addresses for all currencies
function derive_all_init(phrase, seed_id, extra) {
    derive_all(phrase, seed_id, extra);
    save_settings();
    // On app initiation
    save_currencies(true, true);
}

// Derives addresses for all supported coins from master seed
function derive_all(phrase, seed_id, extra) {
    const seed_hex = mnemonic_to_seed(phrase),
        root_key = get_rootkey(seed_hex),
        master_key = root_key.slice(0, 64),
        chain_code = root_key.slice(64);
    $.each(glob_config.bitrequest_coin_data, function(i, coin_config) {
        const coin = coin_config.currency,
            coin_data = coin_config.data,
            bip32_settings = coin_config.settings.Xpub;
        if (bip32_settings.active && bip39_const.c_derive[coin]) {
            const key_data = {
                "seed": seed_hex,
                "key": master_key,
                "cc": chain_code,
                "seedid": seed_id
            }
            const derived_address = derive_obj("seed", key_data, coin_data, bip32_settings, extra);
            if (derived_address) {
                derive_add_address(coin, derived_address);
            }
        }
    });
}

// Adds derived address to UI and saves to storage
function derive_add_address(coin, address_data) {
    append_address(coin, address_data);
    save_addresses(coin, true);
    const currency_item = get_currencyli(coin),
        home_item = get_homeli(coin);
    currency_item.attr("data-checked", "true").data("checked", true);
    home_item.removeClass("hide");
}

// Gets derivation data for currency based on xpub or seed
function derive_data(coin, extra) {
    if (glob_let.test_derive === true && bip39_const.c_derive[coin]) {
        const coin_data = get_coin_config(coin),
            bip32_settings = get_bip32dat(coin),
            active_pubkey = active_xpub(coin);
        if (bip32_settings) {
            if (active_pubkey) {
                const xpub_key = active_pubkey.key,
                    xpub_id = active_pubkey.key_id,
                    key_data = key_cc_xpub(xpub_key);
                key_data.seedid = xpub_id;
                const derived_address = derive_obj("xpub", key_data, coin_data, bip32_settings, extra);
                if (derived_address) {
                    return derived_address;
                }
            } else {
                const key_data = key_cc();
                if (key_data) {
                    const derived_address = derive_obj("seed", key_data, coin_data, bip32_settings, extra);
                    if (derived_address) {
                        return derived_address;
                    }
                }
            }
        }
    }
    return false
}

// Creates address object with derivation path and key data
function derive_obj(key_source, key_data, coin_data, bip32_settings, add) {
    const seed_hex = key_data.seed,
        seed_id = key_data.seedid,
        master_key = key_data.key,
        chain_code = key_data.cc,
        version_bytes = key_data.version,
        coin = coin_data.currency,
        id_key = key_source + "id",
        root_path = bip32_settings.root_path,
        purpose = root_path.split("/")[1],
        address_list = get_addresslist(coin).children("li"),
        seed_items = filter_list(address_list, id_key, seed_id),
        derive_items = filter_list(seed_items, "purpose", purpose),
        unused_items = derive_items.not(".used"),
        has_pending = unused_items.length ? ch_pending(unused_items.first().data()) : false;
    if (!unused_items.length || has_pending === true || add) {
        const total_items = derive_items.length,
            next_index = total_items > 1 ? get_latest_index(derive_items) + 1 : total_items,
            base_path = key_source === "xpub" ? "M/0/" : (key_source === "seed" ? root_path : ""),
            full_path = base_path + next_index,
            derive_params = {
                "dpath": full_path,
                "key": master_key,
                "cc": chain_code,
                "vb": version_bytes
            },
            derived_keys = derive_x(derive_params),
            key_result = format_keys(seed_hex, derived_keys, bip32_settings, next_index, coin),
            address = key_result.address,
            coin_symbol = coin_data.ccsymbol,
            index_num = next_index || 0,
            seed_addresses = address_list.filter(".seed"),
            seed_ids = dom_to_array(seed_addresses, id_key),
            unique_count = count_unique_elements(seed_ids),
            label_index = $.inArray(seed_id, seed_ids) === -1 ? unique_count : unique_count - 1,
            alpha_prefixes = "abcdefghijklmnopqrstuvwxyz",
            label_prefix = alpha_prefixes.charAt(label_index),
            address_label = key_source + "_" + label_prefix + index_num,
            address_data = {
                "derive_index": next_index,
                "currency": coin,
                "address": address,
                "ccsymbol": coin_symbol,
                "cmcid": coin_data.cmcid,
                "erc20": false,
                "checked": true,
                "label": "",
                "a_id": address_label,
                "purpose": purpose
            },
            view_key = key_result.vk;
        if (view_key) {
            address_data.vk = view_key;
        }
        address_data[key_source + "id"] = seed_id;
        return address_data;
    }
    return false
}

// Returns count of unique elements in array using Set
function count_unique_elements(arr) {
    return new Set(arr).size;
}

// ** UI & Information Display: **

// Handles mnemonic phrase copy functionality with confirmation
function copy_phrase() {
    $(document).on("click", "#copyphrase", function() {
        const phrase = get_mnemonic_phrase(),
            is_valid = check_phrase(phrase),
            phrase_label = tl("bip39_passphrase");
        if (is_valid) {
            const confirm_copy = confirm(tl("copy") + " " + phrase_label + "?");
            if (confirm_copy) {
                copy_to_clipboard(phrase, phrase_label);
            }
        } else {
            topnotify(is_valid);
        }
    });
}

// Controls visibility toggling of mnemonic phrase
function toggle_phrase_visibility() {
    $(document).on("click", "#showphrase, #phrase_cb.hidephrase #phraseblur", function() {
        const phrase_container = $("#phrase_cb");
        if (phrase_container.hasClass("showphrase")) {
            phrase_container.removeClass("showphrase").addClass("hidephrase");
            return
        }
        if (glob_let.hasbip) {
            if (glob_let.bipv) {
                reveal_mnemonic();
                return
            }
            all_pinpanel({
                "func": reveal_mnemonic
            }, null, true)
            return
        }
        reveal_mnemonic();
    })
}

// Updates UI to reveal mnemonic phrase
function reveal_mnemonic() {
    $("#phrase_cb").addClass("showphrase").removeClass("hidephrase");
}

// Initiates mnemonic phrase deletion process
function delete_phrase_trigger() {
    $(document).on("click", "#deletephrase", function() {
        const warning_exists = $("#dialogbody").find("#dseedwarning");
        if (warning_exists.length) {
            play_audio("funk");
            return
        }
        const warning_content = "<h2 style='color:#B33A3A' id='dseedwarning'><span class='icon-warning'></span>" + tl("deletingyoursecretphrase") + "</h2><p><strong>" + tl("continuewithbackup") + "</strong></p>";
        popdialog(warning_content, "delete_phrase_verify");
    });
}

// Validates deletion intent with phrase verification
function delete_phrase_verify() {
    const confirm_delete = confirm(tl("verifycurrent") + "?");
    if (confirm_delete) {
        canceldialog();
        const input_phrase = get_mnemonic_phrase(),
            phrase_words = input_phrase.split(" ");
        verify_phrase(phrase_words, 4);
        $("#seed_steps").removeClass("checked");
        $("#seed_step3").addClass("delete");
        seed_nav(3);
    }
}

// Sets up phrase info dialog event listener
function phrase_info() {
    $(document).on("click", "#phrase_info", function() {
        phrase_info_pu(null);
    })
}

// Generates detailed mnemonic phrase analysis UI
function phrase_info_pu(selected_coin) {
    const phrase_obj = ls_phrase_obj(),
        saved_seed = (glob_let.hasbip === true && phrase_obj) ? phrase_obj.pob.join(" ") : false,
        input_phrase = saved_seed || get_mnemonic_phrase();
    if (input_phrase.length < 50) {
        return false
    }
    const seed_hex = mnemonic_to_seed(input_phrase),
        root_key = get_rootkey(seed_hex),
        master_key = root_key.slice(0, 64),
        chain_code = root_key.slice(64),
        root_data = {
            "key": master_key,
            "cc": chain_code,
            "seed": seed_hex,
            "xpub": false
        },
        view_class = selected_coin ? "single" : "",
        coin_class = selected_coin ? "pd_" + selected_coin : "pd_bitcoin",
        seed_info = selected_coin ? "<li><strong>" + tl("source") + ": </strong> Seed</li>" :
        "<li><strong>BIP39 Seed: </strong><span class='adboxl adbox select' data-type='BIP39 Seed'>" + seed_hex + "</span></li>",
        coin_data = selected_coin ? get_coin_config(selected_coin) : null,
        coin_icon = selected_coin ? getcc_icon(coin_data.cmcid, coin_data.ccsymbol + "-" + selected_coin, coin_data.erc20) : "",
        header = selected_coin ? "<h2>" + coin_icon + " <span>" + selected_coin + " Key Derivation</span></h2>" : "",
        backup_setting = get_setting("backup", "sbu"),
        backup_toggle = has_encrypted_data() === true ?
        "<li class='clearfix'><strong>" + tl("backupsecretphrase") + ":</strong><div id='toggle_sbu_span' class='ait'>" +
        switch_panel(backup_setting, " global") + "</div></li>" : "",
        delete_option = selected_coin ? "" : (glob_let.hasbip === true ? backup_toggle +
            "<li class='clearfix'><div id='deletephrase' class='icon-bin'></div></li>" : ""),
        dialog_content = $("<div id='ad_info_wrap' class='" + view_class + "' data-class='" + coin_class + "'>" + header + "<ul>" +
            seed_info +
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
            <div id='bip_mi'><strong>" + tl("compatiblewallets") + ": </strong><span class='xpref ref'>" + tl("hide") + "</span></div>\
            <div id='bip_mibox' class='clearfix drawer'>\
                <div id='supported_wallets'>\
                </div>\
            </div>\
        </li>" + delete_option +
            "</ul>\
    </div>").data(root_data);

    popdialog(dialog_content, "canceldialog");

    $.each(glob_config.bitrequest_coin_data, function(i, coin_config) {
        const coin = coin_config.currency,
            coin_symbol = coin_config.data.ccsymbol,
            wallet_data = coin_config.wallets,
            bip32_config = get_bip32dat(coin);
        if (bip32_config.active === true) {
            const derive_path = bip32_config.root_path,
                line_break = (coin === "nano") ? "<br/>" : " ",
                display_class = " pd_hide pd_" + coin;
            let xpub_key,
                derive_list = "",
                wallet_list = "",
                start_index = 0,
                derived_addresses = keypair_array(seed_hex, new Array(5), start_index, derive_path, bip32_config, master_key, chain_code, coin);
            if (bip32_config.xpub) {
                const xpub_data = xpub_obj(coin, derive_path, chain_code, master_key);
                xpub_key = xpub_data.xpub;
            }
            $.each(derived_addresses, function(i, address_data) {
                const current_index = start_index + i;
                derive_list += "<li class='adbox der_li' data-index='" + current_index + "'><strong>" + derive_path + current_index +
                    "</strong> <span class='mspace'>" + line_break + address_data.address + "</span></li>";
            });
            if (wallet_data) {
                const device_platform = get_platform(detect_device_type()),
                    store_icon = platform_icon(device_platform),
                    store_badge = store_icon ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ",
                    wallet_configs = wallet_data.wallets;
                $.each(wallet_configs, function(key, wallet_config) {
                    const platform_url = wallet_config[device_platform];
                    if (platform_url && wallet_config.seed === true) {
                        const wallet_name = wallet_config.name,
                            wallet_site = wallet_config.website,
                            wallet_logo = get_aws_icon_url(wallet_name);
                        wallet_list += "<li><a href='" + wallet_site + "' target='_blank' class='exit app_dll'>" + wallet_logo + wallet_name +
                            "</a><a href='" + platform_url + "' target='_blank' class='exit store_tag'>" + store_badge + "</a></li>";
                    }
                });
            }
            const coin_id = coin_symbol + "-" + coin,
                coin_icon_src = c_icons(coin_id),
                icon_element = $("<img src='" + coin_icon_src + "' data-class='pd_" + coin + "'/>"),
                path_data = {
                    "bip32": bip32_config,
                    "currency": coin
                },
                monero_phrase = (coin === "monero") ? (is_viewonly() === true) ? false :
                secret_spend_key_to_words(get_ssk(seed_hex, true)) : false,
                monero_box = monero_phrase ? "<div><strong>XMR Seed words: </strong><br/><span class='adboxl adbox select' data-type='XMR Seed words'>" +
                monero_phrase + "</span></div>" : "",
                path_element = $("<div class='d_path" + display_class + "'>\
                <div class='d_path_header'><strong>" + tl("derivationpath") + ": </strong><span class='ref'>" + derive_path + "</span></div>" +
                    monero_box +
                    "<div class='d_path_body drawer clearfix'>\
                        <div class='td_bar'>\
                            <div class='td_next button'>" + tl("next") + "</div><div class='td_prev button'>" + tl("prev") + "</div>\
                        </div>\
                        <ul class='td_box'>" + derive_list + "</ul>\
                    </div>\
                </div>").data(path_data),
                wallet_element = $("<ul id='formbox_ul' class='clearfix" + display_class + "'>" + wallet_list + "</ul>");
            let xpub_element = "",
                segwit_element = "";
            if (xpub_key) {
                xpub_element = $("<div class='xpub_ib clearfix" + display_class + "' data-xpub='" + xpub_key + "'>\
                    <div class='show_xpub'><strong>Xpub: </strong><span class='xpref ref'>" + tl("show") + "</span></div>\
                        <div class='xp_span drawer'>\
                            <div class='qrwrap flex'>\
                                <div class='qrcode'></div><img src='" + coin_icon_src + "' class='cmc_icon'>\
                            </div>\
                            <p class='adbox adboxl select' data-type='Xpub'>" + xpub_key + "</p>\
                        </div>\
                    </div>");
                if (coin === "bitcoin" || coin === "litecoin") {
                    const has_segwit = derive_path.indexOf("m/84") > -1;
                    segwit_element = $("<li class='clearfix" + display_class + "' data-currency='" + coin +
                        "'><strong>SegWit:</strong><div class='toggle_segwit ait'>" + switch_panel(has_segwit, " custom") + "</div></li>");
                }
            }
            if (bip39_const.c_derive[coin]) {
                $("#pi_icons").append(icon_element);
                $("#d_paths").append(path_element);
                $("#xpub_box").append(xpub_element);
                $("#segw_box").append(segwit_element);
            }
            $("#supported_wallets").append(wallet_element);
            display_coin_info();
        }
    });
}

// Displays a list of compatible wallets for a given coin
function list_compatible_wallets(coin) {
    const dialog_content = $("<div id='ad_info_wrap' class='' data-class='pd_" + coin + "'><h2><span class='icon-warning' style='color:#B33A3A'/>" +
        tl("cannotsendfunds") + "</span></h2><ul>\
            <li class='noline'><strong style='color:#6a6a6a'>" + tl("importtosend") + "</strong></li>\
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
    popdialog(dialog_content, "canceldialog");
    $.each(glob_config.bitrequest_coin_data, function(i, coin_config) {
        const coin = coin_config.currency,
            coin_symbol = coin_config.data.ccsymbol,
            wallet_data = coin_config.wallets,
            bip32_config = coin_config.settings.Xpub;
        if (bip32_config.active === true) {
            let wallet_list = "";
            if (wallet_data) {
                const device_platform = get_platform(detect_device_type()),
                    store_icon = platform_icon(device_platform),
                    store_badge = store_icon ? "<img src='" + store_icon + "'/>" : "<span class='icon-download'></span> ",
                    wallet_configs = wallet_data.wallets;
                $.each(wallet_configs, function(key, wallet_config) {
                    const platform_url = wallet_config[device_platform];
                    if (platform_url && wallet_config.seed === true) {
                        const wallet_name = wallet_config.name,
                            wallet_site = wallet_config.website,
                            wallet_logo = get_aws_icon_url(wallet_name);
                        wallet_list += "<li><a href='" + wallet_site + "' target='_blank' class='exit app_dll'>" + wallet_logo + wallet_name +
                            "</a><a href='" + platform_url + "' target='_blank' class='exit store_tag'>" + store_badge + "</a></li>";
                    }
                });
            }
            const coin_id = coin_symbol + "-" + coin,
                coin_icon_src = c_icons(coin_id),
                icon_element = $("<img src='" + coin_icon_src + "' data-class='pd_" + coin + "'/>"),
                wallet_element = $("<ul id='formbox_ul' class='clearfix pd_hide pd_" + coin + "'>" + wallet_list + "</ul>");
            $("#pi_icons").append(icon_element);
            $("#supported_wallets").append(wallet_element);
            display_coin_info();
        }
    });
}

// Handles coin icon click to show coin-specific info
function phrase_coin_info() {
    $(document).on("click", "#pi_icons img", function() {
        $("#ad_info_wrap").attr("data-class", $(this).attr("data-class"));
        display_coin_info();
    })
}

// Controls derivation path drawer visibility
function toggle_dpaths() {
    $(document).on("click", "#ad_info_wrap .d_path_header", function() {
        const path_drawer = $(".d_path_body");
        if (path_drawer.is(":visible")) {
            path_drawer.slideUp(200);
        } else {
            path_drawer.slideDown(200);
            $(".drawer").not(path_drawer).slideUp(200);
        }
        $(".xpref").text(tl("show"));
    })
}

// Updates UI to display selected coin's information
function display_coin_info() {
    const active_class = $("#ad_info_wrap").attr("data-class");
    $(".pd_hide").hide();
    $(".pd_hide." + active_class).show();
    $("#pi_icons img").removeClass("current");
    $("#pi_icons img[data-class='" + active_class + "']").addClass("current");
}

// Sets up next address derivation handler
function test_derive_next() {
    $(document).on("click", ".td_next", function() {
        derive_address_batch($(this));
    })
}

// Sets up previous address derivation handler
function test_derive_prev() {
    $(document).on("click", ".td_prev", function() {
        derive_address_batch($(this), true);
    })
}

// Derives next/previous set of addresses based on parameters
function derive_address_batch(trigger_element, is_prev) {
    const key_data = $("#ad_info_wrap").data(),
        path_container = trigger_element.closest(".d_path"),
        path_data = path_container.data(),
        coin = path_data.currency;
    if (bip39_const.c_derive[coin]) {
        const address_list = path_container.find(".td_box"),
            prev_button = path_container.find(".td_prev"),
            batch_size = 5,
            target_item = is_prev === true ? address_list.find(".der_li").first() : address_list.find(".der_li").last(),
            current_index = target_item.length ? parseInt(target_item.attr("data-index")) : 0,
            start_index = current_index === 0 ? 0 :
            is_prev === "replace" ? current_index - 4 :
            is_prev === true ? current_index - batch_size :
            current_index + 1;

        if (start_index > 1) {
            prev_button.show();
        } else {
            prev_button.hide();
        }

        const bip32_config = path_data.bip32,
            master_key = key_data.key,
            chain_code = key_data.cc,
            version = key_data.versionbytes,
            line_break = coin === "nano" ? "<br/>" : " ",
            derive_path = key_data.xpub === true ? "M/0/" : bip32_config.root_path,
            derived_addresses = keypair_array(key_data.seed, new Array(batch_size), start_index, derive_path, bip32_config, master_key, chain_code, coin, version);

        address_list.html("");
        $.each(derived_addresses, function(i, address_data) {
            const current_index = start_index + i,
                address_item = "<li class='adbox der_li' data-index='" + current_index + "'><strong>" + derive_path + current_index +
                "</strong> " + line_break + "<span class='mspace'>" + address_data.address + "</span></li>";
            address_list.append(address_item);
        });
    }
}

// Controls visibility of additional wallet info section
function phrase_moreinfo() {
    $(document).on("click", "#bip_mi", function() {
        const info_button = $(this),
            toggle_text = info_button.find(".xpref"),
            info_drawer = $("#bip_mibox");
        if (info_drawer.is(":visible")) {
            toggle_text.text(tl("show"));
            info_drawer.slideUp(200);
        } else {
            toggle_text.text(tl("hide"));
            info_drawer.slideDown(200);
            $(".drawer").not(info_drawer).slideUp(200);
        }
        $(".xpref").not(toggle_text).text(tl("show"));
    })
}

// Controls xpub information visibility and QR code generation
function phrase_showxp() {
    $(document).on("click", ".show_xpub", function() {
        const xpub_button = $(this),
            xpub_container = $("#xpub_box"),
            xpub_items = xpub_container.find(".xpub_ib"),
            toggle_text = xpub_container.find(".xpref"),
            xpub_drawer = $(".xp_span");
        if (xpub_drawer.is(":visible")) {
            toggle_text.text(tl("show"));
            xpub_drawer.slideUp(200);
        } else {
            if (!xpub_container.hasClass("rendered")) {
                xpub_items.each(function() {
                    const item = $(this),
                        xpub_data = item.attr("data-xpub"),
                        qr_container = item.find(".qrcode");
                    qr_container.qrcode(xpub_data);
                });
                xpub_container.addClass("rendered");
            }
            toggle_text.text(tl("hide"));
            xpub_drawer.slideDown(200);
            $(".drawer").not(xpub_drawer).slideUp(200);
        }
        $(".xpref").not(toggle_text).text(tl("show"));
    })
}