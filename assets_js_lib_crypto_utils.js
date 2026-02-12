/**
 * CryptoUtils - Standalone cryptocurrency utilities library
 * 
 * STANDALONE USAGE (outside Bitrequest):
 * ----------------------------------------
 * <script src="assets_js_lib_sjcl.js"></script>
 * <script src="assets_js_lib_crypto_utils.js"></script>
 * <script>
 *   const bytes = CryptoUtils.hex_to_bytes("crypto");
 *   const addr = CryptoUtils.pub_to_address_bech32("bc", pubkey);
 * </script>
 * 
 * FEATURES:
 * - Base58 / Base58Check encoding
 * - Bech32 / Bech32m encoding
 * - Secp256k1 elliptic curve operations
 * - SHA256, RIPEMD160, Hash160, Keccak-256
 * - Bitcoin/Litecoin/Ethereum address generation
 * - Bitcoin Cash CashAddr support
 * - BIP39 mnemonic utilities
 * - AES encryption/decryption
 * - LNURL decoding
 * 
 * @version 1.1.0
 * @license AGPL-3.0
 * @see https://github.com/bitrequest/bitrequest.github.io
 * secp256k1 implementation based onhttps://github.com/paulmillr/noble-secp256k1
 */

// ============================================
// CONSTANTS
// ============================================

const crypto = window.crypto,
    b58ab = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz",
    b32ab = "qpzry9x8gf2tvdw0s3jn54khce6mua7l",
    generator = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3],
    bytestring = "0000000000000000000000000000000000000000000000000000000000000000",
    utf8_encoder = new TextEncoder(),
    utf8_decoder = new TextDecoder("utf-8", {
        "fatal": true
    }),
    BECH32_CONST = 1,
    BECH32M_CONST = 0x2bc830a3,
    NIMIQ_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVXY",
    NANO_ALPHABET = "13456789abcdefghijkmnopqrstuwxyz";

// Secp256k1 curve parameters
const secp = {},
    CURVE = {
        "a": 0n,
        "b": 7n,
        "P": (2n ** 256n) - (2n ** 32n) - 977n,
        "n": (2n ** 256n) - 432420386565659656852420866394968145599n,
        "Gx": 55066263022277343669578718895168534326250603453777594175500187360389116729240n,
        "Gy": 32670510020758816978083085130507043184471273380659243275938904335757337482424n
    };
secp.CURVE = CURVE;

// ============================================
// TEST CONSTANTS
// bip39 (All addresses / xpubs in this app are test addresses derived from the following testphrase, taken from https://github.com/bitcoinbook/bitcoinbook/blob/f8b883dcd4e3d1b9adf40fed59b7e898fbd9241f/ch05.asciidoc)
// "army van defense carry jealous true garbage claim echo media make crunch"
// ============================================

const crypto_utils_const = {
    "version": "1.1.0",
    "test_privkey": "922c2cc579600419c8cde59ca8fcb03518ddbb5c38ed1bfbd150cb100e1f5430",
    "test_pubkey": "036740c4f55d64fb6c9bc412084638b80062cee07f6c84b205671584e82a7c96b7",
    "test_pubkey_bech32": "03bb4a626f63436a64d7cf1e441713cc964c0d53289a5b17acb1b9c262be57cb17",
    "test_address": "1HQ3rb7nyLPrjnuW85MUknPekwkn7poAUm",
    "test_address_bech32": "bc1qg0azlj4w2lrq8jssrrz6eprt2fe7f7edm4vpd5",
    "test_pubkey_eth": "03c026c4b041059c84a187252682b6f80cbbe64eb81497111ab6914b050a8936fd",
    "test_address_eth": "0x2161DedC3Be05B7Bb5aa16154BcbD254E9e9eb68",
    "test_bch_legacy_address": "1AVPurYZinnctgGPiXziwU6PuyZKX5rYZU",
    "test_bch_cashaddr": "qp5p0eur784pk8wxy2kzlz3ctnq5whfnuqqpp78u22",
    "test_pubkey_kaspa": "035bed9ca853f2539607e6688059d6616c5acd86cd34ac987927be3c4b62065135",
    "test_address_kaspa": "kaspa:qpd7m89g20e989s8ue5gqkwkv9k94nvxe562exrey7lrcjmzqegn2wspgcke4",
    "test_address_nimiq": "NQ288KG7ER5QUANFN5X1J1CJFRN6FE8GC1KM",
    "test_address_nano": "nano_1mbtirc4x3kixfy5wufxaqakd3gbojpn6gpmk6kjiyngnjwgy6yty3txgztq"
};

// ============================================
// CORE HELPERS
// ============================================

// Creates a typed array with 8-bit unsigned integers from a byte array
function uint_8array(bytes) {
    return new Uint8Array(bytes);
}

// Encodes string to UTF-8 using TextEncoder
function buffer(enc) {
    return utf8_encoder.encode(enc);
}

// Decodes UTF-8 encoded data using TextDecoder
function unbuffer(enc, encoding) {
    return utf8_decoder.decode(enc);
}

// Converts ArrayBuffer to zero-padded hexadecimal string
function buf2hex(buffer) {
    return Array.prototype.map.call(uint_8array(buffer), x => ("00" + x.toString(16)).slice(-2)).join("");
}

// Validates string contains only hexadecimal characters [0-9a-fA-F]
function is_hex(str) {
    return new RegExp("^[a-fA-F0-9]+$").test(str);
}

// Left-pads string with zeros to specified byte length with truncation
function str_pad(val, bytes) {
    return (bytestring.slice(0, bytes) + val).substr(-bytes);
}

// Converts integer to base-16 string representation
function dec_to_hex(val) {
    return val.toString(16);
}

// Parses hexadecimal string to BigInt with 0x prefix
function hex_to_dec(val) {
    return BigInt("0x" + val);
}

// Converts a hexadecimal string to a decimal string
function hex_to_number_string(val) {
    return hex_to_int(val).toString();
}

// Converts a hexadecimal string to a number
function hex_to_int(val) {
    return parseInt(val, 16);
}

// Pads binary strings with leading zeros
function pad_binary(binary_str, target_length) {
    let padded_str = binary_str.toString();
    while (padded_str.length < target_length) {
        padded_str = "0" + padded_str;
    }
    return padded_str;
}

// Concatenates multiple Uint8Arrays into one
function concat_bytes(...arrays) {
    const sizes = arrays.reduce((acc, a) => acc + a.length, 0),
        result = uint_8array(sizes);
    let offset = 0;
    for (const array of arrays) {
        result.set(array, offset);
        offset += array.length;
    }
    return result;
}

// Encodes integer as Bitcoin-style variable-length integer (LEB128)
function encode_varint(n) {
    const bytes = [];
    while (n >= 0x80) {
        bytes.push((n & 0x7f) | 0x80);
        n >>= 7;
    }
    bytes.push(n);
    return new Uint8Array(bytes);
}

// ============================================
// SJCL BIT OPERATIONS
// ============================================

// Converts UTF-8 string to SJCL bit array
function to_bits(val) {
    return sjcl.codec.utf8String.toBits(val);
}

// Converts hex string to SJCL bit array
function hex_to_bits(val) {
    return sjcl.codec.hex.toBits(val);
}

// Converts SJCL bit array to hex string
function from_bits(val) {
    return sjcl.codec.hex.fromBits(val);
}

// Returns the bit length of SJCL bit array
function bit_length(val) {
    return sjcl.bitArray.bitLength(val);
}

// Concatenates two SJCL bit arrays
function concat_array(arr1, arr2) {
    return sjcl.bitArray.concat(arr1, arr2);
}

// ============================================
// BASE CONVERSION
// ============================================

// Converts binary string to SJCL word array
function binary_string_to_word_array(binary) {
    const bit_len = binary.length;
    let words = [];
    for (let i = 0; i < bit_len; i += 32) {
        const str_chunk = binary.substring(i, i + 32),
            int_word = parseInt(str_chunk, 2);
        words.push(int_word | 0);
    }
    return sjcl.bitArray.clamp(words, bit_len);
}

// Converts byte array to SJCL word array
function byte_array_to_word_array(data) {
    let words = [],
        i,
        word = 0;
    for (i = 0; i < data.length; i++) {
        word = (word << 8) | data[i];
        if ((i + 1) % 4 === 0) {
            words.push(word);
            word = 0;
        }
    }
    if (i % 4 !== 0) {
        word <<= (4 - (i % 4)) * 8;
        words.push(word);
    }
    return sjcl.bitArray.clamp(words, data.length * 8);
}

// Converts byte array to binary string
function byte_array_to_binary_string(data) {
    let bin_str = "";
    for (let i = 0; i < data.length; i++) {
        bin_str += pad_binary(data[i].toString(2), 8);
    }
    return bin_str;
}

// Converts hex string to binary string
function hex_string_to_binary_string(hexString) {
    let bin_str = "";
    for (let i = 0; i < hexString.length; i++) {
        const hexChar = hexString[i],
            hexInt = parseInt(hexChar, 16),
            bin_frag = hexInt.toString(2);
        bin_str += pad_binary(bin_frag, 4);
    }
    return bin_str;
}

// ============================================
// BASE58 ENCODING
// ============================================

// Encodes data to Base58 string from hex or UTF-8 input
function b58enc(enc, encode = "hex") {
    const bytestring = (encode === "hex") ? hex_to_bytes(enc) : buffer(enc);
    return b58enc_uint_array(bytestring);
}

// Converts Uint8Array to Base58 string using custom alphabet
function b58enc_uint_array(u) {
    let d = [],
        s = "",
        i, j, c, n;
    for (i in u) {
        j = 0, c = u[i];
        s += c || s.length ^ i ? "" : 1;
        while (j in d || c) {
            n = d[j];
            n = n ? n * 256 + c : c;
            c = n / 58 | 0;
            d[j] = n % 58;
            j++
        }
    }
    while (j--) s += b58ab[d[j]];
    return s;
}

// Decodes Base58 string to UTF-8 or hexadecimal output
function b58dec(dec, decode) {
    const buffer = b58dec_uint_array(dec);
    return (decode === "hex") ? buf2hex(buffer) : unbuffer(buffer, "utf-8");
}

// Converts Base58 string to Uint8Array using custom alphabet
function b58dec_uint_array(dec) {
    let d = [],
        b = [],
        i, j, c, n;
    for (i in dec) {
        j = 0, c = b58ab.indexOf(dec[i]);
        if (c < 0) return undefined;
        c || b.length ^ i ? i : b.push(0);
        while (j in d || c) {
            n = d[j];
            n = n ? n * 58 + c : c;
            c = n >> 8;
            d[j] = n % 256;
            j++
        }
    }
    while (j--) b.push(d[j]);
    return uint_8array(b);
}

// Implements Base58Check encoding with double SHA256 checksum
function b58check_encode(payload) {
    const full_bytes = payload + hmacsha(hmacsha(payload, "sha256", "hex"), "sha256", "hex").slice(0, 8);
    return b58enc(full_bytes, "hex");
}

// Decodes Base58Check string and removes 4-byte checksum
function b58check_decode(val) {
    const full_bytes = b58dec(val, "hex"),
        bytes = full_bytes.substring(0, full_bytes.length - 8);
    return bytes;
}

// ============================================
// BECH32 ENCODING
// ============================================

// Converts input byte array to 5-bit word representation for bech32 encoding
function to_words(bytes) {
    const res = convert_bits(bytes, 8, 5, true);
    if (Array.isArray(res)) {
        return res
    }
    throw new Error(res)
}

// Converts 5-bit word array back to byte representation for bech32 decoding
function from_words(bytes) {
    const res = convert_bits(bytes, 5, 8, true);
    if (Array.isArray(res)) {
        return res
    }
    throw new Error(res)
}

// Transforms data between different bit-length representations with optional padding
function convert_bits(data, inBits, outBits, pad) {
    let value = 0,
        bits = 0,
        maxV = (1 << outBits) - 1,
        result = [];
    for (let i = 0; i < data.length; ++i) {
        value = (value << inBits) | data[i];
        bits += inBits;
        while (bits >= outBits) {
            bits -= outBits;
            result.push((value >> bits) & maxV);
        }
    }
    if (pad) {
        if (bits > 0) {
            result.push((value << (outBits - bits)) & maxV);
        }
    } else {
        if (bits >= inBits) {
            return "Excess padding"
        }
        if ((value << (outBits - bits)) & maxV) {
            return "Non-zero padding"
        }
    }
    return result
}

// Computes the Bech32 checksum
function polymod(values) {
    let chk = 1;
    for (let p = 0; p < values.length; ++p) {
        let top = chk >> 25;
        chk = (chk & 0x1ffffff) << 5 ^ values[p];
        for (let i = 0; i < 5; ++i) {
            if ((top >> i) & 1) {
                chk ^= generator[i];
            }
        }
    }
    return chk;
}

// Expands the human-readable part for Bech32 encoding
function hrp_expand(hrp) {
    const ret = [];
    let p;
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) >> 5);
    }
    ret.push(0);
    for (p = 0; p < hrp.length; ++p) {
        ret.push(hrp.charCodeAt(p) & 31);
    }
    return ret;
}

// Verifies the checksum in a Bech32 address
function verify_checksum(hrp, data) {
    return polymod(hrp_expand(hrp).concat(data)) === 1;
}

// Creates a checksum for Bech32 encoding
function create_checksum(hrp, data) {
    const values = hrp_expand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]),
        mod = polymod(values) ^ 1,
        ret = [];
    for (let p = 0; p < 6; ++p) {
        ret.push((mod >> 5 * (5 - p)) & 31);
    }
    return ret;
}

// Encodes data into a Bech32 address
function bech32_encode(hrp, data) {
    let combined = data.concat(create_checksum(hrp, data)),
        ret = hrp + "1";
    for (let p = 0; p < combined.length; ++p) {
        ret += b32ab.charAt(combined[p]);
    }
    return ret;
}

// Decodes a Bech32 encoded string
function bech32_decode(bechString) {
    let p, has_lower = false,
        has_upper = false;

    for (p = 0; p < bechString.length; ++p) {
        if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
            return null;
        }
        if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
            has_lower = true;
        }
        if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
            has_upper = true;
        }
    }
    if (has_lower && has_upper) {
        return null;
    }

    bechString = bechString.toLowerCase();
    const pos = bechString.lastIndexOf("1");
    if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
        return null;
    }

    const hrp = bechString.substring(0, pos),
        data = [];

    for (p = pos + 1; p < bechString.length; ++p) {
        const d = b32ab.indexOf(bechString.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }

    const encoding = verify_checksum_with_type(hrp, data);
    if (!encoding) {
        return null;
    }

    if (data[0] === 1 && encoding !== "bech32m") {
        return null;
    }
    if (data[0] === 0 && encoding !== "bech32") {
        return null;
    }
    return {
        hrp,
        "data": data.slice(0, data.length - 6),
        encoding
    };
}

// Modified polymod function to support both bech32 and bech32m
function verify_checksum_with_type(hrp, data) {
    const modulo = polymod(hrp_expand(hrp).concat(data));
    if (modulo === BECH32_CONST) return "bech32";
    if (modulo === BECH32M_CONST) return "bech32m";
    return null;
}

// Converts a binary array to decimal array for Bech32 encoding
function bech32_dec_array(bitarr) {
    const hexstr = [0];
    bitarr.forEach(bits => {
        hexstr.push(parseInt(bits, 2));
    });
    return hexstr;
}

// Converts a public key to a Bech32 address
function pub_to_address_bech32(hrp, pubkey) {
    const step1 = hash160(pubkey),
        step2 = hex_string_to_binary_string(step1),
        step3 = step2.match(/.{1,5}/g),
        step4 = bech32_dec_array(step3);
    return bech32_encode(hrp, step4);
}

// ============================================
// KASPA BECH32 (8-character checksum variant)
// ============================================

// Kaspa uses a modified bech32 with 8-character checksum (40-bit)
// Generator polynomial split into high 8 bits and low 32 bits for JavaScript compatibility
const KASPA_GENERATOR1 = [0x98, 0x79, 0xf3, 0xae, 0x1e],
    KASPA_GENERATOR2 = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];

// Kaspa polymod - handles 40-bit values using two 32-bit integers
function kaspa_polymod(data) {
    // Treat c as 8 bits (c0) + 32 bits (c1)
    let c0 = 0,
        c1 = 1,
        C = 0;
    for (var j = 0; j < data.length; j++) {
        C = c0 >>> 3;
        c0 &= 0x07;
        c0 <<= 5;
        c0 |= c1 >>> 27;
        c1 &= 0x07ffffff;
        c1 <<= 5;
        c1 ^= data[j];
        for (var i = 0; i < KASPA_GENERATOR1.length; ++i) {
            if (C & (1 << i)) {
                c0 ^= KASPA_GENERATOR1[i];
                c1 ^= KASPA_GENERATOR2[i];
            }
        }
    }
    c1 ^= 1;
    if (c1 < 0) {
        c1 ^= 1 << 31;
        c1 += (1 << 30) * 2;
    }
    return c0 * (1 << 30) * 4 + c1;
}

// Kaspa prefix expansion: only low 5 bits of each char, then 0
// Different from standard bech32 which uses high bits + 0 + low bits
function kaspa_prefix_expand(prefix) {
    const result = [];
    for (let i = 0; i < prefix.length; i++) {
        result.push(prefix.charCodeAt(i) & 31);
    }
    result.push(0);
    return result;
}

// Convert checksum number to 8-element array
function kaspa_checksum_to_array(checksum) {
    const result = [];
    for (let i = 0; i < 8; ++i) {
        result.push(checksum & 31);
        checksum /= 32;
    }
    return result.reverse();
}

// Create 8-character checksum for Kaspa addresses
function kaspa_create_checksum(prefix, data) {
    const prefixData = kaspa_prefix_expand(prefix),
        checksumData = prefixData.concat(data).concat([0, 0, 0, 0, 0, 0, 0, 0]);
    return kaspa_checksum_to_array(kaspa_polymod(checksumData));
}

// Converts a compressed public key to a Kaspa address
function pub_to_kaspa_address(pubkey) {
    // Extract x-only pubkey (32 bytes) from compressed pubkey (33 bytes)
    const x_only = pubkey.slice(2),
        pubkey_bytes = [];
    for (let i = 0; i < x_only.length; i += 2) {
        pubkey_bytes.push(parseInt(x_only.substr(i, 2), 16));
    }
    // Version 0x00 = schnorr pubkey
    const version = 0x00,
        data_bytes = [version].concat(pubkey_bytes),
        words = to_words(data_bytes),
        checksum = kaspa_create_checksum("kaspa", words),
        combined = words.concat(checksum);
    let address = "kaspa:";
    for (let i = 0; i < combined.length; i++) {
        address += b32ab.charAt(combined[i]);
    }
    return address;
}

// ============================================
// SECP256K1 ELLIPTIC CURVE
// ============================================

// Computes modular reduction with positive result
function mod(a, m = CURVE.P) {
    const r = a % m;
    return r >= 0n ? r : m + r;
}

// Evaluates the secp256k1 curve equation y² = x³ + 7 for a given x coordinate
function weierstrass(x) {
    return mod(x ** 3n + CURVE.b);
}

// Implements Extended Euclidean Algorithm to find GCD and Bézout's identity coefficients
function egcd(a, b) {
    if (typeof a === "number") a = BigInt(a);
    if (typeof b === "number") b = BigInt(b);
    let [x, y, u, v] = [0n, 1n, 1n, 0n];
    while (a !== 0n) {
        const q = b / a,
            r = b % a;
        let m = x - u * q,
            n = y - v * q;
        [b, a] = [a, r];
        [x, y] = [u, v];
        [u, v] = [m, n];
    }
    return [b, x, y];
}

// Calculates the modular multiplicative inverse using extended Euclidean algorithm
function invert(number, modulo = CURVE.P) {
    if (number === 0n || modulo <= 0n) {
        throw new Error("invert: invalid number");
    }
    const [g, x] = egcd(mod(number, modulo), modulo);
    if (g !== 1n) throw new Error("invert: does not exist");
    return mod(x, modulo);
}

// Converts hexadecimal string to Uint8Array with zero-padding for odd length
function hex_to_bytes(hex) {
    if (typeof hex !== "string") throw new TypeError("hexToBytes: expected string");
    if (hex.length % 2) hex = "0" + hex;
    const len = hex.length / 2,
        array = uint_8array(len);
    for (let i = 0; i < len; i++) {
        const j = i * 2;
        array[i] = parseInt(hex.slice(j, j + 2), 16);
    }
    return array;
}

// Converts Uint8Array to hexadecimal string
function bytes_to_hex(uint8a) {
    let hex = "";
    for (let i = 0; i < uint8a.length; i++) {
        hex += uint8a[i].toString(16).padStart(2, "0");
    }
    return hex;
}

// Parses hexadecimal string to BigInt
function hex_to_number(hex) {
    if (typeof hex !== "string") throw new TypeError("hexToNumber: expected string");
    return hex.length ? BigInt("0x" + hex) : 0n;
}

// Converts Uint8Array to BigInt (big-endian)
function bytes_to_number(bytes) {
    return hex_to_number(bytes_to_hex(bytes));
}

// Zero-pads BigInt to 64-character hex string
function pad64(num) {
    return num.toString(16).padStart(64, "0");
}

// Implements point addition and doubling in Jacobian projective coordinates
class JacobianPoint {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    static fromAffine(p) {
        return new JacobianPoint(p.x, p.y, 1n);
    }

    double() {
        const {
            "x": X1,
            "y": Y1,
            "z": Z1
        } = this;
        if (!Y1) return new JacobianPoint(0n, 0n, 0n);
        const A = mod(X1 ** 2n),
            B = mod(Y1 ** 2n),
            C = mod(B ** 2n),
            D = mod(2n * (mod((X1 + B) ** 2n) - A - C)),
            E = mod(3n * A),
            F = mod(E ** 2n),
            X3 = mod(F - 2n * D),
            Y3 = mod(E * (D - X3) - 8n * C),
            Z3 = mod(2n * Y1 * Z1);
        return new JacobianPoint(X3, Y3, Z3);
    }

    add(other) {
        if (!other.x && !other.y) return this;
        if (!this.x && !this.y) return other;
        const {
            "x": X1,
            "y": Y1,
            "z": Z1
        } = this, {
            "x": X2,
            "y": Y2,
            "z": Z2
        } = other, Z1Z1 = mod(Z1 ** 2n), Z2Z2 = mod(Z2 ** 2n), U1 = mod(X1 * Z2Z2), U2 = mod(X2 * Z1Z1), S1 = mod(Y1 * Z2 * Z2Z2), S2 = mod(Y2 * Z1 * Z1Z1), H = mod(U2 - U1), r = mod(S2 - S1);
        if (H === 0n) {
            if (r === 0n) {
                return this.double();
            } else {
                return new JacobianPoint(0n, 0n, 0n);
            }
        }
        const HH = mod(H ** 2n),
            HHH = mod(H * HH),
            V = mod(U1 * HH),
            X3 = mod(r ** 2n - HHH - 2n * V),
            Y3 = mod(r * (V - X3) - S1 * HHH),
            Z3 = mod(Z1 * Z2 * H);
        return new JacobianPoint(X3, Y3, Z3);
    }

    multiplyUnsafe(scalar) {
        let n = scalar;
        if (typeof n !== "bigint") n = BigInt(n);
        n = n % CURVE.n;
        if (n === 0n) return new JacobianPoint(0n, 0n, 0n);
        let p = new JacobianPoint(0n, 0n, 0n),
            d = this;
        while (n > 0n) {
            if (n & 1n) p = p.add(d);
            d = d.double();
            n >>= 1n;
        }
        return p;
    }

    toAffine() {
        if (this.z === 0n) {
            return new Point(0n, 0n);
        }
        const iz = invert(this.z, CURVE.P),
            iz2 = mod(iz ** 2n),
            x = mod(this.x * iz2),
            y = mod(this.y * iz2 * iz);
        return new Point(x, y);
    }
}

// Represents a point on secp256k1 curve in affine coordinates (x,y)
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static fromPrivateKey(privateKey) {
        const key = normalize_privatekey(privateKey);
        return Point.BASE.multiply(key);
    }

    static fromHex(hex) {
        const bytes = hex instanceof Uint8Array ? hex : hex_to_bytes(hex);
        if (bytes.length === 32) {
            return this.fromX(bytes);
        }
        const header = bytes[0];
        if (header === 0x02 || header === 0x03) {
            return this.fromCompressedHex(bytes);
        }
        if (header === 0x04) {
            return this.fromUncompressedHex(bytes);
        }
        throw new Error("Point.fromHex: invalid format");
    }

    static fromX(bytes) {
        const x = bytes_to_number(bytes),
            y2 = weierstrass(x);
        let y = sqrt_mod(y2);
        if ((y & 1n) === 1n) {
            y = mod(-y);
        }
        const p = new Point(x, y);
        p.assertValidity();
        return p;
    }

    static fromCompressedHex(bytes) {
        if (bytes.length !== 33) {
            throw new Error("Compressed pubkey must be 33 bytes");
        }
        const x = bytes_to_number(bytes.slice(1)),
            y2 = weierstrass(x);
        let y = sqrt_mod(y2);
        const odd = (y & 1n) === 1n,
            isFirstByteOdd = (bytes[0] & 1) === 1;
        if (odd !== isFirstByteOdd) {
            y = mod(-y);
        }
        const p = new Point(x, y);
        p.assertValidity();
        return p;
    }

    static fromUncompressedHex(bytes) {
        if (bytes.length !== 65) {
            throw new Error("Uncompressed pubkey must be 65 bytes");
        }
        const x = bytes_to_number(bytes.slice(1, 33)),
            y = bytes_to_number(bytes.slice(33)),
            p = new Point(x, y);
        p.assertValidity();
        return p;
    }

    assertValidity() {
        const {
            x,
            y
        } = this;
        if (x < 0n || x >= CURVE.P || y < 0n || y >= CURVE.P) {
            throw new Error("Point is not on curve (coordinates out of range)");
        }
        const left = mod(y * y),
            right = weierstrass(x);
        if (left !== right) {
            throw new Error("Point is not on curve (y^2 != x^3 + 7)");
        }
    }

    multiply(scalar) {
        return JacobianPoint.fromAffine(this).multiplyUnsafe(scalar).toAffine();
    }

    add(other) {
        const pA = JacobianPoint.fromAffine(this),
            pB = JacobianPoint.fromAffine(other);
        return pA.add(pB).toAffine();
    }

    negate() {
        return new Point(this.x, mod(-this.y));
    }

    toHex(compressed = false) {
        const xHex = pad64(this.x);
        if (compressed) {
            const prefix = (this.y & 1n) === 1n ? "03" : "02";
            return prefix + xHex;
        } else {
            const yHex = pad64(this.y);
            return "04" + xHex + yHex;
        }
    }

    static get BASE() {
        return new Point(CURVE.Gx, CURVE.Gy);
    }

    static get ZERO() {
        return new Point(0n, 0n);
    }
}

// Precomputed constant for sqrt_mod
const P_1_4 = (CURVE.P + 1n) >> 2n;

// Calculates modular square root using simplified Tonelli-Shanks for p ≡ 3 (mod 4)
function sqrt_mod(x) {
    return pow_mod(x, P_1_4, CURVE.P);
}

// Computes modular exponentiation using square-and-multiply algorithm
function pow_mod(base, exponent, modulus) {
    let result = 1n,
        b = mod(base, modulus),
        e = exponent;
    while (e > 0n) {
        if (e & 1n) result = mod(result * b, modulus);
        b = mod(b * b, modulus);
        e >>= 1n;
    }
    return result;
}

// Validates and normalizes private key to BigInt within curve order range
function normalize_privatekey(privateKey) {
    let key = null;
    if (typeof privateKey === "bigint") {
        key = privateKey;
    } else if (typeof privateKey === "string") {
        key = hex_to_number(privateKey);
    } else if (privateKey instanceof Uint8Array) {
        key = bytes_to_number(privateKey);
    } else {
        throw new Error("Invalid private key type");
    }
    key = key % CURVE.n;
    if (key <= 0n || key >= CURVE.n) {
        throw new Error("Invalid private key range");
    }
    return key;
}

// Derives compressed or uncompressed public key from private key scalar
function get_publickey(privateKey, isCompressed = true) {
    const P = Point.fromPrivateKey(privateKey);
    return P.toHex(isCompressed);
}

// Export the main Point class
secp.Point = Point;

// ============================================
// HASH FUNCTIONS
// ============================================

// Generates HMAC using SJCL with optional hex encoding
function hmac_bits(message, key, encode) {
    const enc_msg = (encode == "hex") ? hex_to_bits(message) : message,
        hmac = new sjcl.misc.hmac(key, sjcl.hash.sha512);
    return from_bits(hmac.encrypt(enc_msg));
}

// Computes HMAC-SHA hash with optional key encoding
function hmacsha(key, hash, encode) {
    const enc_key = (encode == "hex") ? hex_to_bits(key) : key;
    return from_bits(hmacsha_bits(enc_key, hash));
}

// Performs HMAC-SHA hash computation on input key
function hmacsha_bits(key, hash) {
    return sjcl.hash[hash].hash(key);
}

// Computes double hash: RIPEMD160(SHA256(input))
function hash160(pub) {
    return hmacsha(hmacsha(pub, "sha256", "hex"), "ripemd160", "hex");
}

// Computes a substring of SHA256 hash
function sha_sub(val, lim) {
    return hmacsha(val, "sha256").slice(0, lim);
}

// Keccak-256 hash function (used for Ethereum addresses)
function keccak_256(input) {
    const rc = [
        1, 0, 32898, 0, 32906, 2147483648, 2147516416, 2147483648,
        32907, 0, 2147483649, 0, 2147516545, 2147483648, 32777, 2147483648,
        138, 0, 136, 0, 2147516425, 0, 2147483658, 0,
        2147516555, 0, 139, 2147483648, 32905, 2147483648, 32771, 2147483648,
        32770, 2147483648, 128, 2147483648, 32778, 0, 2147483658, 2147483648,
        2147516545, 2147483648, 32896, 2147483648, 2147483649, 0, 2147516424, 2147483648
    ];

    function keccak_f(s) {
        let c = [],
            b = [],
            h, l;
        for (let n = 0; n < 48; n += 2) {
            for (let x = 0; x < 10; x++) {
                c[x] = s[x] ^ s[x + 10] ^ s[x + 20] ^ s[x + 30] ^ s[x + 40];
            }
            for (let x = 0; x < 10; x += 2) {
                h = c[(x + 8) % 10] ^ (c[(x + 2) % 10] << 1 | c[(x + 3) % 10] >>> 31);
                l = c[(x + 9) % 10] ^ (c[(x + 3) % 10] << 1 | c[(x + 2) % 10] >>> 31);
                for (let y = 0; y < 50; y += 10) {
                    s[x + y] ^= h;
                    s[x + y + 1] ^= l;
                }
            }
            b[0] = s[0];
            b[1] = s[1];
            b[32] = s[11] << 4 | s[10] >>> 28;
            b[33] = s[10] << 4 | s[11] >>> 28;
            b[14] = s[20] << 3 | s[21] >>> 29;
            b[15] = s[21] << 3 | s[20] >>> 29;
            b[46] = s[31] << 9 | s[30] >>> 23;
            b[47] = s[30] << 9 | s[31] >>> 23;
            b[28] = s[40] << 18 | s[41] >>> 14;
            b[29] = s[41] << 18 | s[40] >>> 14;
            b[20] = s[2] << 1 | s[3] >>> 31;
            b[21] = s[3] << 1 | s[2] >>> 31;
            b[2] = s[13] << 12 | s[12] >>> 20;
            b[3] = s[12] << 12 | s[13] >>> 20;
            b[34] = s[22] << 10 | s[23] >>> 22;
            b[35] = s[23] << 10 | s[22] >>> 22;
            b[16] = s[33] << 13 | s[32] >>> 19;
            b[17] = s[32] << 13 | s[33] >>> 19;
            b[48] = s[42] << 2 | s[43] >>> 30;
            b[49] = s[43] << 2 | s[42] >>> 30;
            b[40] = s[5] << 30 | s[4] >>> 2;
            b[41] = s[4] << 30 | s[5] >>> 2;
            b[22] = s[14] << 6 | s[15] >>> 26;
            b[23] = s[15] << 6 | s[14] >>> 26;
            b[4] = s[25] << 11 | s[24] >>> 21;
            b[5] = s[24] << 11 | s[25] >>> 21;
            b[36] = s[34] << 15 | s[35] >>> 17;
            b[37] = s[35] << 15 | s[34] >>> 17;
            b[18] = s[45] << 29 | s[44] >>> 3;
            b[19] = s[44] << 29 | s[45] >>> 3;
            b[10] = s[6] << 28 | s[7] >>> 4;
            b[11] = s[7] << 28 | s[6] >>> 4;
            b[42] = s[17] << 23 | s[16] >>> 9;
            b[43] = s[16] << 23 | s[17] >>> 9;
            b[24] = s[26] << 25 | s[27] >>> 7;
            b[25] = s[27] << 25 | s[26] >>> 7;
            b[6] = s[36] << 21 | s[37] >>> 11;
            b[7] = s[37] << 21 | s[36] >>> 11;
            b[38] = s[47] << 24 | s[46] >>> 8;
            b[39] = s[46] << 24 | s[47] >>> 8;
            b[30] = s[8] << 27 | s[9] >>> 5;
            b[31] = s[9] << 27 | s[8] >>> 5;
            b[12] = s[18] << 20 | s[19] >>> 12;
            b[13] = s[19] << 20 | s[18] >>> 12;
            b[44] = s[29] << 7 | s[28] >>> 25;
            b[45] = s[28] << 7 | s[29] >>> 25;
            b[26] = s[38] << 8 | s[39] >>> 24;
            b[27] = s[39] << 8 | s[38] >>> 24;
            b[8] = s[48] << 14 | s[49] >>> 18;
            b[9] = s[49] << 14 | s[48] >>> 18;
            for (let y = 0; y < 50; y += 10) {
                for (let x = 0; x < 10; x += 2) {
                    s[y + x] = b[y + x] ^ (~b[y + (x + 2) % 10] & b[y + (x + 4) % 10]);
                    s[y + x + 1] = b[y + x + 1] ^ (~b[y + (x + 3) % 10] & b[y + (x + 5) % 10]);
                }
            }
            s[0] ^= rc[n];
            s[1] ^= rc[n + 1];
        }
    }

    let bytes;
    if (typeof input === "string") {
        bytes = new Uint8Array(input.length);
        for (let i = 0; i < input.length; i++) bytes[i] = input.charCodeAt(i);
    } else if (input instanceof Uint8Array) {
        bytes = input;
    } else if (Array.isArray(input)) {
        bytes = new Uint8Array(input);
    } else {
        throw new Error("Invalid input type for keccak256");
    }

    const rate = 136,
        block_count = 34,
        s = new Array(50).fill(0),
        blocks = new Array(35).fill(0);
    let i = 0;

    for (let pos = 0; pos < bytes.length; pos++) {
        blocks[i >> 2] |= bytes[pos] << ((i & 3) << 3);
        if (++i >= rate) {
            for (let j = 0; j < block_count; j++) {
                s[j] ^= blocks[j];
                blocks[j] = 0;
            }
            keccak_f(s);
            i = 0;
        }
    }

    blocks[i >> 2] |= 1 << ((i & 3) << 3);
    blocks[block_count - 1] |= 0x80000000;
    for (let j = 0; j < block_count; j++) s[j] ^= blocks[j];
    keccak_f(s);

    let hex = "";
    for (let i = 0; i < 32; i++) {
        const byte = (s[i >> 2] >> ((i & 3) << 3)) & 0xff;
        hex += (byte >> 4).toString(16) + (byte & 0xf).toString(16);
    }
    return hex;
}

// ============================================
// KEY & ADDRESS GENERATION
// ============================================

// Encodes private key to Wallet Import Format (WIF) with optional compression
function privkey_wif(versionbytes, hexkey, comp) {
    const compressed = (comp) ? "01" : "";
    return b58check_encode(versionbytes + hexkey + compressed);
}

// Generates corresponding public key from a private key
function priv_to_pub(priv) {
    return get_publickey(priv, true);
}

// Converts compressed public key to full uncompressed format
function expand_pub(pub) {
    return secp.Point.fromHex(pub).toHex(false);
}

// Generates standard cryptocurrency address from public key
function pub_to_address(versionbytes, pub) {
    return hash160_to_address(versionbytes, hash160(pub));
}

// Derives Ethereum-specific address from public key
function pub_to_eth_address(pub) {
    const xp_pub = expand_pub(pub),
        keccak = "0x" + keccak_256(hex_to_bytes(xp_pub.slice(2))),
        addr = "0x" + keccak.slice(26);
    return to_checksum_address(addr);
}

// Converts RIPEMD160 hash to a cryptocurrency address
function hash160_to_address(versionbytes, h160) {
    return b58check_encode(versionbytes + h160);
}

// Converts an Ethereum address to checksum format
function to_checksum_address(e) {
    if (void 0 === e) {
        return "";
    }
    if (!/^(0x)?[0-9a-f]{40}$/i.test(e)) {
        throw new Error("Given address " + e + " is not a valid Ethereum address.");
        return
    }
    e = e.toLowerCase().replace(/^0x/i, "");
    for (var t = keccak_256(e).replace(/^0x/i, ""), r = "0x", n = 0; n < e.length; n++)
        7 < parseInt(t[n], 16) ? r += e[n].toUpperCase() : r += e[n];
    return r;
}

// ============================================
// BITCOIN CASH (CASHADDR)
// ============================================

const cashaddr = (function() {
    const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l",
        CHARSET_MAP = {};
    for (let i = 0; i < CHARSET.length; i++) {
        CHARSET_MAP[CHARSET[i]] = i;
    }

    function polymod(values) {
        const GENERATORS = [
            0x98f2bc8e61n, 0x79b76d99e2n, 0xf33e5fb3c4n,
            0xae2eabe2a8n, 0x1e4f43e470n
        ];
        let chk = 1n;
        for (let i = 0; i < values.length; i++) {
            const top = chk >> 35n;
            chk = ((chk & 0x07ffffffffn) << 5n) ^ BigInt(values[i]);
            for (let j = 0; j < 5; j++) {
                if ((top >> BigInt(j)) & 1n) {
                    chk ^= GENERATORS[j];
                }
            }
        }
        return chk ^ 1n;
    }

    function prefixToArray(prefix) {
        const result = new Uint8Array(prefix.length + 1);
        for (let i = 0; i < prefix.length; i++) {
            result[i] = prefix.charCodeAt(i) & 31;
        }
        result[prefix.length] = 0;
        return result;
    }

    function convertBits(data, fromBits, toBits, pad) {
        let acc = 0,
            bits = 0;
        const result = [],
            maxv = (1 << toBits) - 1;
        for (let i = 0; i < data.length; i++) {
            const value = data[i];
            acc = (acc << fromBits) | value;
            bits += fromBits;
            while (bits >= toBits) {
                bits -= toBits;
                result.push((acc >> bits) & maxv);
            }
        }
        if (pad) {
            if (bits > 0) result.push((acc << (toBits - bits)) & maxv);
        } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
            throw new Error("Invalid padding");
        }
        return new Uint8Array(result);
    }

    function createChecksum(prefix, payload) {
        const prefixArray = prefixToArray(prefix),
            combined = new Uint8Array(prefixArray.length + payload.length + 8);
        combined.set(prefixArray);
        combined.set(payload, prefixArray.length);
        const mod = polymod(combined),
            checksum = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            checksum[7 - i] = Number((mod >> BigInt(i * 5)) & 31n);
        }
        return checksum;
    }

    function verifyChecksum(prefix, payload) {
        const prefixArray = prefixToArray(prefix),
            combined = new Uint8Array(prefixArray.length + payload.length);
        combined.set(prefixArray);
        combined.set(payload, prefixArray.length);
        return polymod(combined) === 0n;
    }

    function getHashSize(versionByte) {
        return [160, 192, 224, 256, 320, 384, 448, 512][versionByte & 7];
    }

    function getType(versionByte) {
        const typeValue = versionByte & 120;
        if (typeValue === 0) return "P2PKH";
        if (typeValue === 8) return "P2SH";
        throw new Error("Invalid address type");
    }

    return {
        "encode": function(prefix, type, hash) {
            let versionByte = (type === "P2PKH") ? 0 : (type === "P2SH") ? 8 : null;
            if (versionByte === null) throw new Error("Invalid type: " + type);

            const hashBits = hash.length * 8,
                sizeMap = {
                    "160": 0,
                    "192": 1,
                    "224": 2,
                    "256": 3,
                    "320": 4,
                    "384": 5,
                    "448": 6,
                    "512": 7
                };
            if (!(hashBits in sizeMap)) throw new Error("Invalid hash size");
            versionByte |= sizeMap[hashBits];

            const versionAndHash = new Uint8Array(hash.length + 1);
            versionAndHash[0] = versionByte;
            versionAndHash.set(hash, 1);

            const payload = convertBits(versionAndHash, 8, 5, true),
                checksum = createChecksum(prefix, payload),
                combined = new Uint8Array(payload.length + checksum.length);
            combined.set(payload);
            combined.set(checksum, payload.length);

            let result = prefix + ":";
            for (let i = 0; i < combined.length; i++) {
                result += CHARSET[combined[i]];
            }
            return result;
        },

        "decode": function(address) {
            const lower = address.toLowerCase();
            if (address !== lower && address !== address.toUpperCase()) {
                throw new Error("Mixed case address");
            }
            const parts = lower.split(":");
            if (parts.length !== 2) throw new Error("Missing prefix");

            const prefix = parts[0],
                payloadStr = parts[1],
                payload = new Uint8Array(payloadStr.length);
            for (let i = 0; i < payloadStr.length; i++) {
                const char = payloadStr[i];
                if (!(char in CHARSET_MAP)) throw new Error("Invalid character: " + char);
                payload[i] = CHARSET_MAP[char];
            }

            if (!verifyChecksum(prefix, payload)) throw new Error("Invalid checksum");

            const data = payload.slice(0, -8),
                converted = convertBits(data, 5, 8, false),
                versionByte = converted[0],
                hash = converted.slice(1);

            if (hash.length * 8 !== getHashSize(versionByte)) {
                throw new Error("Invalid hash size");
            }

            return {
                prefix,
                type: getType(versionByte),
                hash
            };
        }
    };
})();

// Converts a legacy Bitcoin Cash address to CashAddr format
function pub_to_cashaddr(legacy) {
    const c_addr = bch_cashaddr("bitcoincash", "P2PKH", legacy);
    return c_addr.split(":")[1];
}

// Converts a CashAddr format address to legacy Bitcoin Cash address
function bch_legacy(cadr) {
    try {
        const address = (cadr.indexOf(":") === -1) ? "bitcoincash:" + cadr : cadr,
            version = 0,
            dec = cashaddr.decode(address),
            bytes = dec.hash,
            bytesarr = Array.from(bytes),
            conc = concat_array([0], bytesarr),
            unbuf = buf2hex(conc);
        return b58check_encode(unbuf);
    } catch (e) {
        return cadr
    }
}

// Converts a legacy Bitcoin Cash address to CashAddr format
function bch_cashaddr(prefix, type, legacy) {
    try {
        const lbytes = b58dec_uint_array(legacy),
            lbslice = lbytes.slice(1, 21);
        return cashaddr.encode(prefix, type, lbslice);
    } catch (e) {
        console.error(e.name, e.message);
        return legacy
    }
}

// ============================================
// LNURL & LIGHTNING
// ============================================

// Decodes a Bech32 encoded LNURL
function lnurl_decodeb32(lnurl) {
    let p,
        has_lower = false,
        has_upper = false;
    for (p = 0; p < lnurl.length; ++p) {
        if (lnurl.charCodeAt(p) < 33 || lnurl.charCodeAt(p) > 126) {
            return null;
        }
        if (lnurl.charCodeAt(p) >= 97 && lnurl.charCodeAt(p) <= 122) {
            has_lower = true;
        }
        if (lnurl.charCodeAt(p) >= 65 && lnurl.charCodeAt(p) <= 90) {
            has_upper = true;
        }
    }
    if (has_lower && has_upper) {
        return null;
    }
    const lnurlow = lnurl.toLowerCase(),
        pos = lnurlow.lastIndexOf("1"),
        hrp = lnurlow.substring(0, pos),
        data = [];
    for (p = pos + 1; p < lnurlow.length; ++p) {
        const d = b32ab.indexOf(lnurlow.charAt(p));
        if (d === -1) {
            return null;
        }
        data.push(d);
    }
    if (!verify_checksum(hrp, data)) {
        return null;
    }
    return {
        "hrp": hrp,
        "data": data.slice(0, data.length - 6)
    };
}

// ============================================
// MNEMONIC FUNCTIONS
// ============================================

// Cleans and normalizes mnemonic string
function clean_string(words) {
    return normalize_string(join_words(split_words(words)));
}

// Concatenates word array with single space delimiter
function join_words(words) {
    return words.join(" ");
}

// Splits string on whitespace and removes empty elements
function split_words(mnemonic) {
    return mnemonic.split(/\s/g).filter(function(x) {
        return x.length;
    });
}

// Applies Unicode NFKD normalization to string
function normalize_string(str) {
    return str.normalize("NFKD");
}

// Converts BIP39 mnemonic to binary string with 11-bit word indices
function mnemonic_to_binary_string(mnemonic) {
    const mm = split_words(mnemonic);
    if (mm.length == 0 || mm.length % 3 > 0) {
        return null;
    }
    const idx = [];
    for (let i = 0; i < mm.length; i++) {
        const word = mm[i],
            wordIndex = wordlist.indexOf(word);
        if (wordIndex == -1) {
            return null;
        }
        const binaryIndex = pad_binary(wordIndex.toString(2), 11);
        idx.push(binaryIndex);
    }
    return idx.join("");
}

// ============================================
// ENCRYPTION
// ============================================

// Encrypts data using AES-GCM
function aes_enc(params, keyString) {
    const buffer = uint_8array(16),
        iv = byte_array_to_word_array(crypto.getRandomValues(buffer)),
        key = sjcl.codec.base64.toBits(keyString),
        cipher = new sjcl.cipher.aes(key),
        data = to_bits(params),
        enc = sjcl.mode.gcm.encrypt(cipher, data, iv, {}, 128),
        concatbitArray = concat_array(iv, enc),
        conString = sjcl.codec.base64.fromBits(concatbitArray);
    return conString;
}

// Decrypts AES-GCM encrypted data
function aes_dec(content, keyst) {
    const bitArray = sjcl.codec.base64.toBits(content),
        bitArrayCopy = bitArray.slice(0),
        ivdec = bitArrayCopy.slice(0, 4),
        encryptedBitArray = bitArray.slice(4),
        key = sjcl.codec.base64.toBits(keyst),
        cipher = new sjcl.cipher.aes(key);
    try {
        const data = sjcl.mode.gcm.decrypt(cipher, encryptedBitArray, ivdec, {}, 128);
        return sjcl.codec.utf8String.fromBits(data);
    } catch (err) {
        console.error(err.name, err.message);
        return false
    }
}

// ============================================
// SCRIPTHASH
// ============================================

// Convert address to scripthash, with support for Bitcoin Cash addresses
function address_to_scripthash(addr, currency) {
    const address = (currency === "bitcoin-cash") ? bch_legacy(addr) : addr;
    let script_pub_key;

    if (address.startsWith("bc1") || address.startsWith("tb1") || address.startsWith("ltc1")) {
        try {
            const decoded = bech32_decode(address);
            if (!decoded) throw new Error("Invalid bech32 address");
            const program = convert5to8(decoded.data.slice(1));
            if (!program) throw new Error("Invalid witness program");
            if (decoded.data[0] === 1) {
                if (program.length !== 32) {
                    throw new Error("Invalid Taproot program length: " + program.length);
                }
                script_pub_key = "5120" + program.map(function(b) {
                    return b.toString(16).padStart(2, "0");
                }).join("");
            } else if (decoded.data[0] === 0) {
                if (program.length === 20) {
                    script_pub_key = "0014" + program.map(function(b) {
                        return b.toString(16).padStart(2, "0");
                    }).join("");
                } else if (program.length === 32) {
                    script_pub_key = "0020" + program.map(function(b) {
                        return b.toString(16).padStart(2, "0");
                    }).join("");
                } else {
                    throw new Error("Invalid witness program length: " + program.length);
                }
            } else {
                throw new Error("Unsupported witness version");
            }
        } catch (error) {
            throw new Error("Invalid bech32 address: " + error.message);
        }
    } else {
        try {
            const decoded = b58check_decode(address),
                version = decoded.slice(0, 2),
                hash = decoded.slice(2);

            if (version === "00" || version === "30") {
                script_pub_key = "76a914" + hash + "88ac";
            } else if (version === "05" || version === "32") {
                script_pub_key = "a914" + hash + "87";
            } else {
                throw new Error("Unsupported address version: " + version);
            }
        } catch (error) {
            throw new Error("Invalid base58 address: " + error.message);
        }
    }

    const script_hash = hmacsha(script_pub_key, "sha256", "hex");
    return {
        "script_pub_key": script_pub_key,
        "hash": script_hash.match(/.{2}/g).reverse().join("")
    }
}

// Helper function for converting groups of 5 bits to 8 bits
function convert5to8(data) {
    const acc = new Array(Math.floor(data.length * 5 / 8));
    let index = 0,
        bits = 0,
        value = 0;
    for (let i = 0; i < data.length; ++i) {
        value = (value << 5) | data[i];
        bits += 5;
        while (bits >= 8) {
            bits -= 8;
            acc[index] = (value >> bits) & 0xff;
            index += 1;
        }
    }
    if (bits >= 5 || ((value << (8 - bits)) & 0xff)) {
        return null;
    }
    return acc;
}

// ============================================
// COMPATIBILITY TESTING
// ============================================

// Tests crypto.getRandomValues availability
function test_crypto_api() {
    try {
        return !!(crypto && crypto.getRandomValues);
    } catch (e) {
        console.error("CryptoUtils test_crypto_api:", e.message);
        return false;
    }
}

// Tests BigInt functionality
function test_bigint() {
    try {
        return typeof BigInt === "function" &&
            BigInt("9007199254740991") + BigInt(1) === BigInt("9007199254740992");
    } catch (e) {
        console.error("CryptoUtils test_bigint:", e.message);
        return false;
    }
}

// Tests secp256k1 private key to public key derivation
function test_secp256k1() {
    try {
        return get_publickey(crypto_utils_const.test_privkey) === crypto_utils_const.test_pubkey;
    } catch (e) {
        console.error("CryptoUtils test_secp256k1:", e.message);
        return false;
    }
}

// Tests bech32 address encoding
function test_bech32() {
    try {
        return pub_to_address_bech32("bc", crypto_utils_const.test_pubkey_bech32) === crypto_utils_const.test_address_bech32;
    } catch (e) {
        console.error("CryptoUtils test_bech32:", e.message);
        return false;
    }
}

// Tests Bitcoin Cash cashaddr encoding
function test_cashaddr() {
    try {
        return pub_to_cashaddr(crypto_utils_const.test_bch_legacy_address) === crypto_utils_const.test_bch_cashaddr;
    } catch (e) {
        console.error("CryptoUtils test_cashaddr:", e.message);
        return false;
    }
}

// Tests keccak256 / Ethereum address derivation
function test_keccak256() {
    try {
        return pub_to_eth_address(crypto_utils_const.test_pubkey_eth) === crypto_utils_const.test_address_eth;
    } catch (e) {
        console.error("CryptoUtils test_keccak256:", e.message);
        return false;
    }
}

// Tests Kaspa address encoding
function test_kaspa() {
    const generated = pub_to_kaspa_address(crypto_utils_const.test_pubkey_kaspa);
    if (generated === crypto_utils_const.test_address_kaspa) {
        return true;
    }
    return false;
}

// Tests AES encryption round-trip
function test_aes() {
    try {
        const test_data = "crypto_utils_test",
            test_key = "0123456789abcdef0123456789abcdef",
            encrypted = aes_enc(test_data, test_key);
        return aes_dec(encrypted, test_key) === test_data;
    } catch (e) {
        console.error("CryptoUtils test_aes:", e.message);
        return false;
    }
}

// ============================================
// BLAKE2B-256
// Pure vanilla JS, BigInt for 64-bit word ops
// ============================================

const BLAKE2B_IV = [
    0x6a09e667f3bcc908n, 0xbb67ae8584caa73bn,
    0x3c6ef372fe94f82bn, 0xa54ff53a5f1d36f1n,
    0x510e527fade682d1n, 0x9b05688c2b3e6c1fn,
    0x1f83d9abfb41bd6bn, 0x5be0cd19137e2179n
];

const BLAKE2B_SIGMA = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    [14, 10, 4, 8, 9, 15, 13, 6, 1, 12, 0, 2, 11, 7, 5, 3],
    [11, 8, 12, 0, 5, 2, 15, 13, 10, 14, 3, 6, 7, 1, 9, 4],
    [7, 9, 3, 1, 13, 12, 11, 14, 2, 6, 5, 10, 4, 0, 15, 8],
    [9, 0, 5, 7, 2, 4, 10, 15, 14, 1, 11, 12, 6, 8, 3, 13],
    [2, 12, 6, 10, 0, 11, 8, 3, 4, 13, 7, 5, 15, 14, 1, 9],
    [12, 5, 1, 15, 14, 13, 4, 10, 0, 7, 6, 3, 9, 2, 8, 11],
    [13, 11, 7, 14, 12, 1, 3, 9, 5, 0, 15, 4, 8, 6, 2, 10],
    [6, 15, 14, 9, 11, 3, 0, 8, 12, 2, 13, 7, 1, 4, 10, 5],
    [10, 2, 8, 4, 7, 6, 1, 5, 15, 11, 9, 14, 3, 12, 13, 0]
];

const MASK_64 = 0xffffffffffffffffn;

function b2b_rotr64(x, n) {
    return ((x >> BigInt(n)) | (x << BigInt(64 - n))) & MASK_64;
}

function b2b_G(v, a, b, c, d, x, y) {
    v[a] = (v[a] + v[b] + x) & MASK_64;
    v[d] = b2b_rotr64(v[d] ^ v[a], 32);
    v[c] = (v[c] + v[d]) & MASK_64;
    v[b] = b2b_rotr64(v[b] ^ v[c], 24);
    v[a] = (v[a] + v[b] + y) & MASK_64;
    v[d] = b2b_rotr64(v[d] ^ v[a], 16);
    v[c] = (v[c] + v[d]) & MASK_64;
    v[b] = b2b_rotr64(v[b] ^ v[c], 63);
}

function b2b_compress(h, block, t, last) {
    const v = new Array(16);
    for (let i = 0; i < 8; i++) {
        v[i] = h[i];
        v[i + 8] = BLAKE2B_IV[i];
    }
    v[12] ^= t & MASK_64;
    v[13] ^= (t >> 64n) & MASK_64;
    if (last) {
        v[14] ^= MASK_64;
    }
    const m = new Array(16);
    for (let i = 0; i < 16; i++) {
        const off = i * 8;
        m[i] = BigInt(block[off]) | (BigInt(block[off + 1]) << 8n) |
            (BigInt(block[off + 2]) << 16n) | (BigInt(block[off + 3]) << 24n) |
            (BigInt(block[off + 4]) << 32n) | (BigInt(block[off + 5]) << 40n) |
            (BigInt(block[off + 6]) << 48n) | (BigInt(block[off + 7]) << 56n);
    }
    for (let i = 0; i < 12; i++) {
        const s = BLAKE2B_SIGMA[i % 10];
        b2b_G(v, 0, 4, 8, 12, m[s[0]], m[s[1]]);
        b2b_G(v, 1, 5, 9, 13, m[s[2]], m[s[3]]);
        b2b_G(v, 2, 6, 10, 14, m[s[4]], m[s[5]]);
        b2b_G(v, 3, 7, 11, 15, m[s[6]], m[s[7]]);
        b2b_G(v, 0, 5, 10, 15, m[s[8]], m[s[9]]);
        b2b_G(v, 1, 6, 11, 12, m[s[10]], m[s[11]]);
        b2b_G(v, 2, 7, 8, 13, m[s[12]], m[s[13]]);
        b2b_G(v, 3, 4, 9, 14, m[s[14]], m[s[15]]);
    }
    for (let i = 0; i < 8; i++) {
        h[i] ^= v[i] ^ v[i + 8];
    }
}

// Blake2b: Uint8Array in → Uint8Array out (default 32 bytes)
function blake2b(input, outlen) {
    if (outlen === undefined) outlen = 32;
    const h = [...BLAKE2B_IV];
    h[0] ^= 0x01010000n | BigInt(outlen); // fanout=1, depth=1, digest_length=outlen
    const len = input.length;
    if (len > 128) {
        const full = Math.floor((len - 1) / 128);
        for (let i = 0; i < full; i++) {
            b2b_compress(h, input.slice(i * 128, (i + 1) * 128), BigInt((i + 1) * 128), false);
        }
        const last = new Uint8Array(128);
        last.set(input.slice(full * 128));
        b2b_compress(h, last, BigInt(len), true);
    } else {
        const block = new Uint8Array(128);
        block.set(input);
        b2b_compress(h, block, BigInt(len), true);
    }
    const out = new Uint8Array(outlen);
    for (let i = 0; i < outlen; i++) {
        out[i] = Number((h[Math.floor(i / 8)] >> BigInt((i % 8) * 8)) & 0xffn);
    }
    return out;
}

// ============================================
// ED25519 ELLIPTIC CURVE ARITHMETIC
// Self-contained implementation for Ed25519 pubkey derivation
// Curve: -x² + y² = 1 + d·x²·y² over GF(2²⁵⁵ - 19)
// ============================================

const ED25519 = {
        "a": -1n,
        "d": 37095705934669439343138083508754565189542113879843219016388785533085940283555n,
        "P": 2n ** 255n - 19n,
        "n": 2n ** 252n + 27742317777372353535851937790883648493n,
        "Gx": 15112221349535400772501151409588531511454012693041857206046113283949847762202n,
        "Gy": 46316835694926478169428394003475163141307993866256225615783033603165251855960n
    },
    ED25519_ENCODING_LENGTH = 32,
    ed_DIV_8_MINUS_3 = (ED25519.P + 3n) / 8n,
    ed_pointPrecomputes = new WeakMap();

let ed_I_cached = null;

// Little-endian bytes to BigInt
function ed_bytes_to_number_le(uint8a) {
    let num = 0n;
    for (let i = uint8a.length - 1; i >= 0; i--) {
        num = (num << 8n) | BigInt(uint8a[i]);
    }
    return num;
}

// Batch modular inverse (Montgomery's trick)
function ed_invert_batch(nums, n = ED25519.P) {
    const len = nums.length,
        scratch = new Array(len);
    let acc = 1n;
    for (let i = 0; i < len; i++) {
        if (nums[i] === 0n) continue;
        scratch[i] = acc;
        acc = mod(acc * nums[i], n);
    }
    acc = invert(acc, n);
    for (let i = len - 1; i >= 0; i--) {
        if (nums[i] === 0n) continue;
        const tmp = mod(acc * nums[i], n);
        nums[i] = mod(acc * scratch[i], n);
        acc = tmp;
    }
    return nums;
}

// Ed25519 Extended Point (x, y, z, t) for efficient group operations
class EdExtPoint {
    constructor(x, y, z, t) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.t = t;
    }

    static fromAffine(p) {
        if (!(p instanceof EdPoint))
            throw new TypeError("EdExtPoint#fromAffine: expected EdPoint");
        if (p.equals(EdPoint.ZERO)) return EdExtPoint.ZERO;
        return new EdExtPoint(p.x, p.y, 1n, mod(p.x * p.y, ED25519.P));
    }

    static toAffineBatch(points) {
        const toInv = ed_invert_batch(points.map(p => p.z));
        return points.map((p, i) => p.toAffine(toInv[i]));
    }

    static normalizeZ(points) {
        return this.toAffineBatch(points).map(this.fromAffine);
    }

    negate() {
        return new EdExtPoint(mod(-this.x, ED25519.P), this.y, this.z, mod(-this.t, ED25519.P));
    }

    double() {
        const P = ED25519.P,
            X1 = this.x,
            Y1 = this.y,
            Z1 = this.z,
            A = mod(X1 ** 2n, P),
            B = mod(Y1 ** 2n, P),
            C = mod(2n * Z1 ** 2n, P),
            D = mod(ED25519.a * A, P),
            E = mod((X1 + Y1) ** 2n - A - B, P),
            G = mod(D + B, P),
            F = mod(G - C, P),
            H = mod(D - B, P);
        return new EdExtPoint(mod(E * F, P), mod(G * H, P), mod(F * G, P), mod(E * H, P));
    }

    add(other) {
        const P = ED25519.P,
            X1 = this.x,
            Y1 = this.y,
            Z1 = this.z,
            T1 = this.t,
            X2 = other.x,
            Y2 = other.y,
            Z2 = other.z,
            T2 = other.t,
            A = mod((Y1 - X1) * (Y2 + X2), P),
            B = mod((Y1 + X1) * (Y2 - X2), P),
            F = mod(B - A, P);
        if (F === 0n) return this.double();
        const C = mod(Z1 * 2n * T2, P),
            D = mod(T1 * 2n * Z2, P),
            E = mod(D + C, P),
            G = mod(B + A, P),
            H = mod(D - C, P);
        return new EdExtPoint(mod(E * F, P), mod(G * H, P), mod(F * G, P), mod(E * H, P));
    }

    precomputeWindow(W) {
        const windows = 256 / W + 1;
        let points = [],
            p = this,
            base = p;
        for (let window = 0; window < windows; window++) {
            base = p;
            points.push(base);
            for (let i = 1; i < 2 ** (W - 1); i++) {
                base = base.add(p);
                points.push(base);
            }
            p = base.double();
        }
        return points;
    }

    wNAF(n, affinePoint) {
        if (!affinePoint && this.equals(EdExtPoint.BASE))
            affinePoint = EdPoint.BASE;
        const W = (affinePoint && affinePoint._WINDOW_SIZE) || 1;
        if (256 % W) throw new Error("EdPoint#wNAF: Invalid precomputation window");
        let precomputes = affinePoint && ed_pointPrecomputes.get(affinePoint);
        if (!precomputes) {
            precomputes = this.precomputeWindow(W);
            if (affinePoint && W !== 1) {
                precomputes = EdExtPoint.normalizeZ(precomputes);
                ed_pointPrecomputes.set(affinePoint, precomputes);
            }
        }
        let p = EdExtPoint.ZERO,
            f = EdExtPoint.ZERO;
        const windows = 256 / W + 1,
            windowSize = 2 ** (W - 1),
            mask = BigInt(2 ** W - 1),
            maxNumber = 2 ** W,
            shiftBy = BigInt(W);
        for (let window = 0; window < windows; window++) {
            const offset = window * windowSize;
            let wbits = Number(n & mask);
            n >>= shiftBy;
            if (wbits > windowSize) {
                wbits -= maxNumber;
                n += 1n;
            }
            if (wbits === 0) {
                f = f.add(window % 2 ? precomputes[offset].negate() : precomputes[offset]);
            } else {
                const cached = precomputes[offset + Math.abs(wbits) - 1];
                p = p.add(wbits < 0 ? cached.negate() : cached);
            }
        }
        return [p, f];
    }

    multiply(scalar, affinePoint) {
        if (typeof scalar !== "number" && typeof scalar !== "bigint")
            throw new TypeError("EdPoint#multiply: expected number or bigint");
        const n = mod(BigInt(scalar), ED25519.n);
        if (n <= 0) throw new Error("EdPoint#multiply: invalid scalar");
        return EdExtPoint.normalizeZ(this.wNAF(n, affinePoint))[0];
    }

    toAffine(invZ = invert(this.z, ED25519.P)) {
        return new EdPoint(mod(this.x * invZ, ED25519.P), mod(this.y * invZ, ED25519.P));
    }

    equals(other) {
        return this.x === other.x && this.y === other.y && this.z === other.z && this.t === other.t;
    }
}
EdExtPoint.ZERO = new EdExtPoint(0n, 1n, 1n, 0n);

// Ed25519 Affine Point (x, y) — user-facing representation
class EdPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    _setWindowSize(windowSize) {
        this._WINDOW_SIZE = windowSize;
        ed_pointPrecomputes.delete(this);
    }

    static fromHex(hash) {
        const bytes = hash instanceof Uint8Array ? hash : hex_to_bytes(hash),
            len = bytes.length - 1,
            normedLast = bytes[len] & ~0x80,
            isLastByteOdd = (bytes[len] & 0x80) !== 0,
            normed = Uint8Array.from(Array.from(bytes.slice(0, len)).concat(normedLast)),
            y = ed_bytes_to_number_le(normed);
        if (y >= ED25519.P) throw new Error("EdPoint#fromHex expects hex <= Fp");
        const sqrY = y * y,
            sqrX = mod((sqrY - 1n) * invert(ED25519.d * sqrY + 1n, ED25519.P), ED25519.P);
        if (ed_I_cached === null)
            ed_I_cached = pow_mod(2n, (ED25519.P + 1n) / 4n, ED25519.P);
        let x = pow_mod(sqrX, ed_DIV_8_MINUS_3, ED25519.P);
        if (mod(x * x - sqrX, ED25519.P) !== 0n)
            x = mod(x * ed_I_cached, ED25519.P);
        if ((x & 1n) === 1n !== isLastByteOdd)
            x = mod(-x, ED25519.P);
        return new EdPoint(x, y);
    }

    toRawBytes() {
        const hex = this.y.toString(16).padStart(1 + (this.y.toString(16).length | 1), "0"),
            u8 = uint_8array(ED25519_ENCODING_LENGTH);
        for (let i = hex.length - 2, j = 0; j < ED25519_ENCODING_LENGTH && i >= 0; i -= 2, j++)
            u8[j] = parseInt(hex[i] + hex[i + 1], 16);
        if (this.x & 1n) u8[ED25519_ENCODING_LENGTH - 1] |= 0x80;
        return u8;
    }

    toHex() {
        return bytes_to_hex(this.toRawBytes());
    }
    equals(other) {
        return this.x === other.x && this.y === other.y;
    }
    add(other) {
        return EdExtPoint.fromAffine(this).add(EdExtPoint.fromAffine(other)).toAffine();
    }
    multiply(scalar) {
        return EdExtPoint.fromAffine(this).multiply(scalar, this).toAffine();
    }
}
EdPoint.BASE = new EdPoint(ED25519.Gx, ED25519.Gy);
EdPoint.ZERO = new EdPoint(0n, 1n);
EdPoint.BASE._setWindowSize(8);

// Scalar × G base point multiplication
function ed25519_point_multiply(hex) {
    return EdPoint.BASE.multiply(EdPoint.fromHex(hex).y);
}

// ============================================
// ED25519 PUBLIC KEY DERIVATION
// Standard (SHA-512) and Nano variant (Blake2b-512)
// ============================================

// Standard Ed25519 seed → public key (SHA-512 hash, clamp, scalar × G)
function ed25519_pubkey(privkey) {
    const hash = from_bits(sjcl.hash.sha512.hash(hex_to_bits(privkey))),
        scalar_bytes = hex_to_bytes(hash.slice(0, 64));
    scalar_bytes[0] &= 248;
    scalar_bytes[31] &= 127;
    scalar_bytes[31] |= 64;
    return ed25519_point_multiply(bytes_to_hex(scalar_bytes)).toHex();
}

// Nano Ed25519: uses Blake2b-512 instead of SHA-512
function nano_ed25519_pubkey(privkey) {
    const hash = blake2b(hex_to_bytes(privkey), 64),
        scalar_bytes = hash.slice(0, 32);
    scalar_bytes[0] &= 248;
    scalar_bytes[31] &= 127;
    scalar_bytes[31] |= 64;
    return ed25519_point_multiply(bytes_to_hex(scalar_bytes)).toHex();
}

// ============================================
// NIMIQ + NANO ADDRESS ENCODING
// Nimiq: Custom base32 + IBAN MOD-97-10 checksum
// Nano: Custom base32 + Blake2b-5 checksum
// ============================================

// Hex → Nimiq custom base32 string
function hex_to_nimiq_base32(hex) {
    let num = BigInt("0x" + hex),
        result = "";
    while (num > 0n) {
        result = NIMIQ_ALPHABET[Number(num % 32n)] + result;
        num = num / 32n;
    }
    return result;
}

// IBAN MOD-97-10 checksum for Nimiq address
function nimiq_iban_checksum(base32_str) {
    const raw = base32_str + "NQ00";
    let numeric = "";
    for (let i = 0; i < raw.length; i++) {
        const c = raw.charCodeAt(i);
        numeric += (c >= 48 && c <= 57) ? raw[i] : (c - 55).toString();
    }
    let remainder = 0;
    for (let i = 0; i < numeric.length; i++) {
        remainder = (remainder * 10 + parseInt(numeric[i])) % 97;
    }
    return str_pad((98 - remainder).toString(), 2);
}

// 20-byte raw address hex → full Nimiq address
function to_nimiq_address(raw_hex) {
    const base32 = hex_to_nimiq_base32(raw_hex),
        padded = base32.padStart(32, NIMIQ_ALPHABET[0]),
        checksum = nimiq_iban_checksum(padded);
    return "NQ" + checksum + padded;
}

// Encode Uint8Array to Nano base32
// Bit-packing: reads bits MSB-first, emits 5-bit groups
function encode_nano_base32(input) {
    const len = input.length,
        leftover = (8 * len) % 5,
        pad = leftover === 0 ? 0 : 5 - leftover;
    let bits = 0,
        result = "",
        count = 0;
    for (let i = 0; i < len; i++) {
        bits = (bits << 8) | input[i];
        count += 8;
        while (count >= 5) {
            result += NANO_ALPHABET[(bits >>> (count + pad - 5)) & 31];
            count -= 5;
        }
    }
    if (count > 0) {
        result += NANO_ALPHABET[(bits << (5 - (count + pad))) & 31];
    }
    return result;
}

// Public key hex → full Nano address
function to_nano_address(pubkey_hex) {
    const pubkey_bytes = hex_to_bytes(pubkey_hex),
        checksum = blake2b(pubkey_bytes, 5).reverse(),
        body = encode_nano_base32(pubkey_bytes),
        check = encode_nano_base32(checksum);
    return "nano_" + body + check;
}

// NANO to RAW conversion (1 NANO = 10^30 RAW)
function nano_to_raw(amount) {
    const str = amount.toString(),
        dot = str.indexOf(".");
    if (dot === -1) {
        return str + "0".repeat(30);
    }
    const integer = str.slice(0, dot),
        fraction = str.slice(dot + 1).slice(0, 30).padEnd(30, "0");
    return (integer + fraction).replace(/^0+/, "") || "0";
}

// ============================================
// MODULE EXPORT
// ============================================

const CryptoUtils = {
    // Library info
    VERSION: "1.1.0",

    // Curve parameters
    secp,
    CURVE: CURVE,

    // === Core Helpers ===
    uint_8array,
    buffer,
    unbuffer,
    buf2hex,
    is_hex,
    str_pad,
    dec_to_hex,
    hex_to_dec,
    hex_to_number_string,
    hex_to_int,
    pad_binary,
    pad64,
    concat_bytes,
    encode_varint,

    // === SJCL Bit Operations ===
    to_bits,
    hex_to_bits,
    from_bits,
    bit_length,
    concat_array,

    // === String Utilities ===
    clean_string,
    normalize_string,
    split_words,
    join_words,

    // === Base Conversion ===
    binary_string_to_word_array,
    byte_array_to_word_array,
    byte_array_to_binary_string,
    hex_string_to_binary_string,
    mnemonic_to_binary_string,

    // === Base58 ===
    b58enc,
    b58enc_uint_array,
    b58dec,
    b58dec_uint_array,
    b58check_encode,
    b58check_decode,

    // === Bech32 ===
    to_words,
    from_words,
    convert_bits,
    polymod,
    hrp_expand,
    verify_checksum,
    verify_checksum_with_type,
    create_checksum,
    bech32_encode,
    bech32_decode,
    bech32_dec_array,
    lnurl_decodeb32,
    kaspa_polymod,
    kaspa_create_checksum,

    // === Byte/Hex Conversion ===
    hex_to_bytes,
    bytes_to_hex,
    hex_to_number,
    bytes_to_number,

    // === Elliptic Curve (secp256k1) ===
    mod,
    weierstrass,
    egcd,
    invert,
    pow_mod,
    sqrt_mod,

    // === Key Operations ===
    normalize_privatekey,
    get_publickey,
    priv_to_pub,
    privkey_wif,
    expand_pub,

    // === Key Operations ===
    ed25519_pubkey,
    nano_ed25519_pubkey,
    ed25519_point_multiply,
    ed_bytes_to_number_le,
    EdPoint,
    ED25519,

    // === Hashing ===
    hmacsha,
    hmac_bits,
    hmacsha_bits,
    sha_sub,
    keccak_256,
    hash160,
    blake2b,

    // === Address Generation ===
    pub_to_address,
    pub_to_address_bech32,
    pub_to_kaspa_address,
    hash160_to_address,
    pub_to_eth_address,
    to_checksum_address,
    to_nano_address,
    to_nimiq_address,
    nano_to_raw,

    // === Bitcoin Cash ===
    pub_to_cashaddr,
    bch_cashaddr,
    bch_legacy,

    // === Encryption ===
    aes_enc,
    aes_dec,

    // === Validation ===
    address_to_scripthash,
    convert5to8,

    // === Constants ===
    crypto_utils_const,

    // === Testing ===
    test_crypto_api,
    test_bigint,
    test_secp256k1,
    test_bech32,
    test_cashaddr,
    test_keccak256,
    test_kaspa,
    test_aes
};