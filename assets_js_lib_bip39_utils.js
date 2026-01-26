/**
 * Bip39Utils - Standalone BIP39/BIP32 Cryptocurrency Utilities Library
 * 
 * STANDALONE USAGE (outside Bitrequest):
 * ----------------------------------------
 * <script src="assets_js_lib_sjcl.js"></script>
 * <script src="assets_js_lib_crypto_utils.js"></script>
 * <script src="assets_js_lib_bip39_utils.js"></script>
 * <script>
 *   const mnemonic = Bip39Utils.generate_mnemonic(12);
 *   const seed = Bip39Utils.mnemonic_to_seed(mnemonic);
 *   const keys = Bip39Utils.derive_x(params);
 * </script>
 * 
 * FEATURES:
 * - BIP39 mnemonic generation and validation
 * - BIP32 hierarchical deterministic key derivation
 * - Extended public/private key encoding
 * - Multi-currency address generation
 * - Support for Bitcoin, Litecoin, Ethereum, Dogecoin, Dash, Bitcoin Cash
 * 
 * DEPENDENCIES:
 * - sjcl.js
 * - crypto_utils.js
 * 
 * @version 1.1.0
 * @license AGPL-3.0
 * @see https://github.com/bitrequest/bitrequest.github.io
 */

// ============================================
// CONSTANTS
// ============================================

const bip39_utils_const = {
    "version": "1.1.0",
    "test_phrase": "army van defense carry jealous true garbage claim echo media make crunch",
    "expected_seed": "5b56c417303faa3fcba7e57400e120a0ca83ec5a4fc9ffba757fbe63fbd77a89a1a3be4c67196f57c39a88b76373733891bfaba16ed27a813ceed498804c0570",
    "expected_address": "1HQ3rb7nyLPrjnuW85MUknPekwkn7poAUm"
};

// ============================================
// MNEMONIC GENERATION & VALIDATION
// ============================================

// Constructor for HMAC SHA-512 encryptor used in PBKDF2
function hmac_encrypt(key) {
    const hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    this.encrypt = function() {
        return hmac.encrypt.apply(hmac, arguments);
    };
}

// Converts mnemonic phrase to 512-bit seed using PBKDF2 with 2048 iterations
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

// Generates random BIP39 mnemonic phrase
function generate_mnemonic(word_count) {
    const entropy_bits = word_count / 3 * 32,
        random_bytes = uint_8array(entropy_bits / 8),
        entropy_data = crypto.getRandomValues(random_bytes);
    return to_mnemonic(entropy_data);
}

// Converts entropy bytes to mnemonic phrase using BIP39 wordlist
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

// Validates BIP39 mnemonic checksum using SHA256
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
    for (let i = 0; i < word_list.length; i++) {
        if (wordlist.indexOf(word_list[i]) === -1) {
            return word_list[i];
        }
    }
    return undefined;
}

// ============================================
// BIP32 KEY DERIVATION
// ============================================

// Generates master root key from seed using HMAC-SHA512 with "Bitcoin seed"
function get_rootkey(seed) {
    return hmac_bits(seed, to_bits("Bitcoin seed"), "hex");
}

// Parses Base58Check encoded extended key into component parts
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

// Performs BIP32 hierarchical deterministic key derivation
function derive_x(derive_params, from_private) {
    const path = derive_params.dpath,
        path_segments = path.split("/"),
        depth = path_segments.length - 1;
    let derived_data = {},
        current_key = derive_params.key,
        current_chain = derive_params.cc,
        is_public = false,
        path_purpose = null;
    for (let i = 0; i < path_segments.length; i++) {
        const segment = path_segments[i];
        if (i === 0) {
            if (segment === "m") {
                is_public = false;
            } else if (segment === "M") {
                is_public = true;
                if (from_private === true) {
                    current_key = get_publickey(current_key);
                }
            } else {
                return false;
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
    }
    if (is_public === true) {
        derived_data.vb = derive_params.vb;
    }
    return derived_data;
}

// Derives child key using BIP32 algorithm
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
        const child_decimal = (hex_to_dec(parent_key) + hex_to_dec(child_key)) % CURVE.n;
        derived_keys.key = str_pad(child_decimal.toString(16), 64);
    }
    derived_keys.chaincode = child_chain;
    derived_keys.fingerprint = parent_fp;
    return derived_keys;
}

// Extracts key and chaincode from Base58Check encoded xpub/xprv
function key_cc_xpub(xpub) {
    const decoded_key = b58check_decode(xpub),
        key_parts = objectify_extended(decoded_key);
    return {
        "key": key_parts.key,
        "cc": key_parts.chaincode,
        "version": key_parts.version
    }
}

// Generates array of derived key pairs for given index range
function keypair_array(seed, indices, start_index, derive_path, bip32_config, key, chain_code, coin, version) {
    const derived_pairs = [];
    for (let i = 0; i < indices.length; i++) {
        const current_index = i + start_index,
            full_path = derive_path + current_index,
            derive_params = {
                "dpath": full_path,
                "key": key,
                "cc": chain_code,
                "vb": version
            },
            ext_keys_result = derive_x(derive_params),
            formatted_keys = format_keys(seed, ext_keys_result, bip32_config, current_index, coin);
        derived_pairs.push(formatted_keys);
    }
    return derived_pairs;
}

// ============================================
// EXTENDED KEY ENCODING
// ============================================

// Creates extended private and public keys from key object
function ext_keys(key_data, coin_or_config) {
    const extended_keys = {},
        ext_payload = b58c_x_payload(key_data, coin_or_config),
        private_key = key_data.key;
    extended_keys.xprv = b58check_encode(ext_payload.private);
    extended_keys.xpub = b58check_encode(ext_payload.public);
    return extended_keys;
}

// Creates xpub object from derivation data
function xpub_obj(coin_or_config, root_path, chain_code, key) {
    const bip32_config = (typeof coin_or_config === "object") ? coin_or_config : get_bip32dat(coin_or_config),
        pub_version = bip32_config.prefix.pubz || bip32_config.prefix.pubx,
        versionh = str_pad(dec_to_hex(pub_version), 8),
        depth = "03",
        fingerprint = "00000000",
        childnumber = "80000000",
        xpub_hex = versionh + depth + fingerprint + childnumber + chain_code + key;
    return {
        "xpub": b58check_encode(xpub_hex),
        "version": versionh
    }
}

// Constructs Base58Check payload for extended keys
function b58c_x_payload(key_data, coin_or_config) {
    const bip32_config = (typeof coin_or_config === "object") ? coin_or_config : get_bip32dat(coin_or_config),
        chain_code = key_data.chaincode,
        private_key = key_data.key,
        public_key = get_publickey(private_key),
        depth = str_pad(dec_to_hex(key_data.depth), 2),
        fingerprint = key_data.fingerprint,
        childnumber = key_data.childnumber,
        priv_version = bip32_config.prefix.privx,
        pub_version = (key_data.purpose === "84'") ? bip32_config.prefix.pubz : bip32_config.prefix.pubx,
        priv_versionh = str_pad(dec_to_hex(priv_version), 8),
        pub_versionh = str_pad(dec_to_hex(pub_version), 8),
        priv_payload = priv_versionh + depth + fingerprint + childnumber + chain_code + "00" + private_key,
        pub_payload = pub_versionh + depth + fingerprint + childnumber + chain_code + public_key;
    return {
        "private": priv_payload,
        "public": pub_payload
    }
}

// ============================================
// ADDRESS FORMATTING
// ============================================

// Formats derived keys into address and key pairs for specific coin
function format_keys(seed, key_data, bip32_config, index, coin) {
    const formatted_keys = {},
        purpose = key_data.purpose,
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

// ============================================
// BIP32 CONFIGURATION
// ============================================

// Default BIP32 configurations for supported cryptocurrencies
const bip32_configs = {
    "bitcoin": {
        "root_path": "m/84'/0'/0'/0/",
        "prefix": {
            "pub": 0,
            "pubx": 76067358,
            "pubz": 78792518,
            "privx": 76066276
        },
        "pk_vbytes": {
            "wif": 128
        }
    },
    "litecoin": {
        "root_path": "m/84'/2'/0'/0/",
        "prefix": {
            "pub": 48,
            "pubx": 27108450,
            "pubz": 78792518,
            "privx": 27106558
        },
        "pk_vbytes": {
            "wif": 176
        }
    },
    "dogecoin": {
        "root_path": "m/44'/3'/0'/0/",
        "prefix": {
            "pub": 30,
            "pubx": 49990397,
            "privx": 49988504
        },
        "pk_vbytes": {
            "wif": 158
        }
    },
    "dash": {
        "root_path": "m/44'/5'/0'/0/",
        "prefix": {
            "pub": 76,
            "pubx": 50221772,
            "privx": 50221816
        },
        "pk_vbytes": {
            "wif": 204
        }
    },
    "ethereum": {
        "root_path": "m/44'/60'/0'/0/",
        "prefix": {
            "pub": 0,
            "pubx": 76067358,
            "privx": 76066276
        },
        "pk_vbytes": {
            "wif": 128
        }
    },
    "bitcoin-cash": {
        "root_path": "m/44'/145'/0'/0/",
        "prefix": {
            "pub": 0,
            "pubx": 76067358,
            "privx": 76066276
        },
        "pk_vbytes": {
            "wif": 128
        }
    }
};

// Gets BIP32 configuration for specified currency
function get_bip32dat(coin) {
    return bip32_configs[coin] || false;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Implements Fisher-Yates shuffle algorithm for array randomization
function shuffle_array(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const rand_index = Math.floor(Math.random() * (i + 1));
        [array[i], array[rand_index]] = [array[rand_index], array[i]];
    }
    return array;
}

// ============================================
// TEST FUNCTIONS
// ============================================

// Validates complete BIP39/BIP32 implementation using test vectors
function test_bip39_derivation() {
    const results = {
            "success": true,
            "tests": []
        },
        seed = mnemonic_to_seed(bip39_utils_const.test_phrase),
        seed_test = {
            "name": "Mnemonic to Seed",
            "expected": bip39_utils_const.expected_seed,
            "actual": seed,
            "pass": seed === bip39_utils_const.expected_seed
        };
    results.tests.push(seed_test);
    if (!seed_test.pass) results.success = false;

    const is_valid = validate_mnemonic(bip39_utils_const.test_phrase),
        validate_test = {
            "name": "Validate Mnemonic",
            "expected": true,
            "actual": is_valid,
            "pass": is_valid === true
        };
    results.tests.push(validate_test);
    if (!validate_test.pass) results.success = false;

    try {
        const root_key = get_rootkey(seed),
            bip32_config = get_bip32dat("bitcoin"),
            derive_params = {
                "dpath": "m/44'/0'/0'/0/0",
                "key": root_key.slice(0, 64),
                "cc": root_key.slice(64)
            },
            derived_keys = derive_x(derive_params),
            derived_address = format_keys(seed, derived_keys, bip32_config, 0, "bitcoin");

        const address_test = {
            "name": "BIP44 Address Derivation",
            "expected": bip39_utils_const.expected_address,
            "actual": derived_address.address,
            "pass": derived_address.address === bip39_utils_const.expected_address
        };
        results.tests.push(address_test);
        if (!address_test.pass) results.success = false;
    } catch (e) {
        results.tests.push({
            "name": "BIP44 Address Derivation",
            "expected": bip39_utils_const.expected_address,
            "actual": "Error: " + e.message,
            "pass": false
        });
        results.success = false;
    }

    return results;
}

// ============================================
// MODULE EXPORT
// ============================================

const Bip39Utils = {
    // Version
    version: bip39_utils_const.version,

    // Test constants
    test_phrase: bip39_utils_const.test_phrase,
    expected_seed: bip39_utils_const.expected_seed,
    expected_address: bip39_utils_const.expected_address,

    // Mnemonic functions
    mnemonic_to_seed,
    parse_seed,
    generate_mnemonic,
    to_mnemonic,
    validate_mnemonic,
    find_invalid_word,

    // BIP32 derivation
    get_rootkey,
    objectify_extended,
    derive_x,
    derive_child_key,
    key_cc_xpub,
    keypair_array,
    ext_keys,
    xpub_obj,
    b58c_x_payload,

    // Address formatting
    format_keys,

    // Configuration
    bip32_configs,
    get_bip32dat,

    // Utilities
    shuffle_array,

    // Testing
    test_bip39_derivation
};

// Make Bip39Utils globally available
window.Bip39Utils = Bip39Utils;