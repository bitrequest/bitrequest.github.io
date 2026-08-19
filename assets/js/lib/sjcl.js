// Select components from sjcl to suit the crypto operations bip39 requires.

//// base.js

/** @fileOverview Javascript cryptography implementation.
 *
 * Crush to remove comments, shorten variable names and
 * generally reduce transmission size.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

"use strict";
/*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */
/*global document, window, escape, unescape, module, require, Uint32Array */

/** @namespace The Stanford Javascript Crypto Library, top-level namespace. */
const sjcl = {
    /** @namespace Symmetric ciphers. */
    cipher: {},

    /** @namespace Hash functions.  Right now only SHA256 is implemented. */
    hash: {},

    /** @namespace Key exchange functions.  Right now only SRP is implemented. */
    keyexchange: {},

    /** @namespace Block cipher modes of operation. */
    mode: {},

    /** @namespace Miscellaneous.  HMAC and PBKDF2. */
    misc: {},

    /**
     * @namespace Bit array encoders and decoders.
     *
     * @description
     * The members of this namespace are functions which translate between
     * SJCL's bitArrays and other objects (usually strings).  Because it
     * isn't always clear which direction is encoding and which is decoding,
     * the method names are "fromBits" and "toBits".
     */
    codec: {},

    /** @namespace Exceptions. */
    exception: {
        /** @constructor Ciphertext is corrupt. */
        corrupt: function(message) {
            this.toString = function() {
                return "CORRUPT: " + this.message;
            };
            this.message = message;
        },

        /** @constructor Invalid parameter. */
        invalid: function(message) {
            this.toString = function() {
                return "INVALID: " + this.message;
            };
            this.message = message;
        },

        /** @constructor Bug or missing feature in SJCL. @constructor */
        bug: function(message) {
            this.toString = function() {
                return "BUG: " + this.message;
            };
            this.message = message;
        },

        /** @constructor Something isn't ready. */
        notReady: function(message) {
            this.toString = function() {
                return "NOT READY: " + this.message;
            };
            this.message = message;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = sjcl;
}
if (typeof define === "function") {
    define([], function() {
        return sjcl;
    });
}


//// bitArray.js

sjcl.bitArray = {
    bitSlice: function(a, bstart, bend) {
        a = sjcl.bitArray._shiftRight(a.slice(bstart / 32), 32 - (bstart & 31)).slice(1);
        return (bend === undefined) ? a : sjcl.bitArray.clamp(a, bend - bstart);
    },

    extract: function(a, bstart, blength) {
        let x, sh = Math.floor((-bstart - blength) & 31);
        if ((bstart + blength - 1 ^ bstart) & -32) {
            x = (a[bstart / 32 | 0] << (32 - sh)) ^ (a[bstart / 32 + 1 | 0] >>> sh);
        } else {
            x = a[bstart / 32 | 0] >>> sh;
        }
        return x & ((1 << blength) - 1);
    },

    concat: function(a1, a2) {
        if (a1.length === 0 || a2.length === 0) {
            return a1.concat(a2);
        }

        let last = a1[a1.length - 1],
            shift = sjcl.bitArray.getPartial(last);
        if (shift === 32) {
            return a1.concat(a2);
        } else {
            return sjcl.bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
        }
    },

    bitLength: function(a) {
        let l = a.length,
            x;
        if (l === 0) {
            return 0;
        }
        x = a[l - 1];
        return (l - 1) * 32 + sjcl.bitArray.getPartial(x);
    },

    clamp: function(a, len) {
        if (a.length * 32 < len) {
            return a;
        }
        a = a.slice(0, Math.ceil(len / 32));
        let l = a.length;
        len = len & 31;
        if (l > 0 && len) {
            a[l - 1] = sjcl.bitArray.partial(len, a[l - 1] & 0x80000000 >> (len - 1), 1);
        }
        return a;
    },

    partial: function(len, x, _end) {
        if (len === 32) {
            return x;
        }
        return (_end ? x | 0 : x << (32 - len)) + len * 0x10000000000;
    },

    getPartial: function(x) {
        return Math.round(x / 0x10000000000) || 32;
    },

    equal: function(a, b) {
        if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) {
            return false;
        }
        let x = 0;
        for (let i = 0; i < a.length; i++) {
            x |= a[i] ^ b[i];
        }
        return (x === 0);
    },

    _shiftRight: function(a, shift, carry, out) {
        let i, last2 = 0,
            shift2;
        if (out === undefined) {
            out = [];
        }

        for (; shift >= 32; shift -= 32) {
            out.push(carry);
            carry = 0;
        }
        if (shift === 0) {
            return out.concat(a);
        }

        for (i = 0; i < a.length; i++) {
            out.push(carry | a[i] >>> shift);
            carry = a[i] << (32 - shift);
        }
        last2 = a.length ? a[a.length - 1] : 0;
        shift2 = sjcl.bitArray.getPartial(last2);
        out.push(sjcl.bitArray.partial(shift + shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(), 1));
        return out;
    },

    _xor4: function(x, y) {
        return [x[0] ^ y[0], x[1] ^ y[1], x[2] ^ y[2], x[3] ^ y[3]];
    },

    byteswapM: function(a) {
        let i, v, m = 0xff00;
        for (i = 0; i < a.length; ++i) {
            v = a[i];
            a[i] = (v >>> 24) | ((v >>> 8) & m) | ((v & m) << 8) | (v << 24);
        }
        return a;
    }
};


//// codecString.js

sjcl.codec.utf8String = {
    fromBits: function(arr) {
        let out = "",
            bl = sjcl.bitArray.bitLength(arr),
            i, tmp;
        for (i = 0; i < bl / 8; i++) {
            if ((i & 3) === 0) {
                tmp = arr[i / 4];
            }
            out += String.fromCharCode(tmp >>> 24);
            tmp <<= 8;
        }
        return decodeURIComponent(escape(out));
    },

    toBits: function(str) {
        str = unescape(encodeURIComponent(str));
        let out = [],
            i, tmp = 0;
        for (i = 0; i < str.length; i++) {
            tmp = tmp << 8 | str.charCodeAt(i);
            if ((i & 3) === 3) {
                out.push(tmp);
                tmp = 0;
            }
        }
        if (i & 3) {
            out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
        }
        return out;
    }
};


//// codecHex.js

sjcl.codec.hex = {
    fromBits: function(arr) {
        let out = "";
        for (let i = 0; i < arr.length; i++) {
            out += ((arr[i] | 0) + 0xF00000000000).toString(16).substr(4);
        }
        return out.substr(0, sjcl.bitArray.bitLength(arr) / 4);
    },

    toBits: function(str) {
        let i, out = [],
            len;
        str = str.replace(/\s|0x/g, "");
        len = str.length;
        str = str + "00000000";
        for (i = 0; i < str.length; i += 8) {
            out.push(parseInt(str.substr(i, 8), 16) ^ 0);
        }
        return sjcl.bitArray.clamp(out, len * 4);
    }
};


//// codecBase64.js (base64 + base64url)

sjcl.codec.base64 = {
    _chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",

    fromBits: function(arr, _noEquals, _url) {
        let out = "",
            i, bits = 0,
            c = sjcl.codec.base64._chars,
            ta = 0,
            bl = sjcl.bitArray.bitLength(arr);
        if (_url) {
            c = c.substr(0, 62) + '-_';
        }
        for (i = 0; out.length * 6 < bl;) {
            out += c.charAt((ta ^ arr[i] >>> bits) >>> 26);
            if (bits < 6) {
                ta = arr[i] << (6 - bits);
                bits += 26;
                i++;
            } else {
                ta <<= 6;
                bits -= 6;
            }
        }
        while ((out.length & 3) && !_noEquals) {
            out += "=";
        }
        return out;
    },

    toBits: function(str, _url) {
        str = str.replace(/\s|=/g, '');
        let out = [],
            i, bits = 0,
            c = sjcl.codec.base64._chars,
            ta = 0,
            x;
        if (_url) {
            c = c.substr(0, 62) + '-_';
        }
        for (i = 0; i < str.length; i++) {
            x = c.indexOf(str.charAt(i));
            if (x < 0) {
                throw new sjcl.exception.invalid("this isn't base64!");
            }
            if (bits > 26) {
                bits -= 26;
                out.push(ta ^ x >>> bits);
                ta = x << (32 - bits);
            } else {
                bits += 6;
                ta ^= x << (32 - bits);
            }
        }
        if (bits & 56) {
            out.push(sjcl.bitArray.partial(bits & 56, ta, 1));
        }
        return out;
    }
};

sjcl.codec.base64url = {
    fromBits: function(arr) {
        return sjcl.codec.base64.fromBits(arr, 1, 1);
    },
    toBits: function(str) {
        return sjcl.codec.base64.toBits(str, 1);
    }
};


//// AES.js

sjcl.cipher.aes = function(key) {
    if (!this._tables[0][0][0]) {
        this._precompute();
    }

    let i, j, tmp,
        encKey, decKey,
        sbox = this._tables[0][4],
        decTable = this._tables[1],
        keyLen = key.length,
        rcon = 1;

    if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) {
        throw new sjcl.exception.invalid("invalid aes key size");
    }

    this._key = [encKey = key.slice(0), decKey = []];

    for (i = keyLen; i < 4 * keyLen + 28; i++) {
        tmp = encKey[i - 1];

        if (i % keyLen === 0 || (keyLen === 8 && i % keyLen === 4)) {
            tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];
            if (i % keyLen === 0) {
                tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
                rcon = rcon << 1 ^ (rcon >> 7) * 283;
            }
        }

        encKey[i] = encKey[i - keyLen] ^ tmp;
    }

    for (j = 0; i; j++, i--) {
        tmp = encKey[j & 3 ? i : i - 4];
        if (i <= 4 || j < 4) {
            decKey[j] = tmp;
        } else {
            decKey[j] = decTable[0][sbox[tmp >>> 24]] ^
                decTable[1][sbox[tmp >> 16 & 255]] ^
                decTable[2][sbox[tmp >> 8 & 255]] ^
                decTable[3][sbox[tmp & 255]];
        }
    }
};

sjcl.cipher.aes.prototype = {
    encrypt: function(data) {
        return this._crypt(data, 0);
    },
    decrypt: function(data) {
        return this._crypt(data, 1);
    },

    _tables: [
        [
            [],
            [],
            [],
            [],
            []
        ],
        [
            [],
            [],
            [],
            [],
            []
        ]
    ],

    _precompute: function() {
        let encTable = this._tables[0],
            decTable = this._tables[1],
            sbox = encTable[4],
            sboxInv = decTable[4],
            i, x, xInv, d = [],
            th = [],
            x2, x4, x8, s, tEnc, tDec;

        for (i = 0; i < 256; i++) {
            th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
        }

        for (x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
            s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
            s = s >> 8 ^ s & 255 ^ 99;
            sbox[x] = s;
            sboxInv[s] = x;

            x8 = d[x4 = d[x2 = d[x]]];
            tDec = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
            tEnc = d[s] * 0x101 ^ s * 0x1010100;

            for (i = 0; i < 4; i++) {
                encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
                decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
            }
        }

        for (i = 0; i < 5; i++) {
            encTable[i] = encTable[i].slice(0);
            decTable[i] = decTable[i].slice(0);
        }
    },

    _crypt: function(input, dir) {
        if (input.length !== 4) {
            throw new sjcl.exception.invalid("invalid aes block size");
        }

        let key = this._key[dir],
            a = input[0] ^ key[0],
            b = input[dir ? 3 : 1] ^ key[1],
            c = input[2] ^ key[2],
            d = input[dir ? 1 : 3] ^ key[3],
            a2, b2, c2,
            nInnerRounds = key.length / 4 - 2,
            i,
            kIndex = 4,
            out = [0, 0, 0, 0],
            table = this._tables[dir],
            t0 = table[0],
            t1 = table[1],
            t2 = table[2],
            t3 = table[3],
            sbox = table[4];

        for (i = 0; i < nInnerRounds; i++) {
            a2 = t0[a >>> 24] ^ t1[b >> 16 & 255] ^ t2[c >> 8 & 255] ^ t3[d & 255] ^ key[kIndex];
            b2 = t0[b >>> 24] ^ t1[c >> 16 & 255] ^ t2[d >> 8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
            c2 = t0[c >>> 24] ^ t1[d >> 16 & 255] ^ t2[a >> 8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
            d = t0[d >>> 24] ^ t1[a >> 16 & 255] ^ t2[b >> 8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
            kIndex += 4;
            a = a2;
            b = b2;
            c = c2;
        }

        for (i = 0; i < 4; i++) {
            out[dir ? 3 & -i : i] =
                sbox[a >>> 24] << 24 ^
                sbox[b >> 16 & 255] << 16 ^
                sbox[c >> 8 & 255] << 8 ^
                sbox[d & 255] ^
                key[kIndex++];
            a2 = a;
            a = b;
            b = c;
            c = d;
            d = a2;
        }

        return out;
    }
};


//// gcm.js

sjcl.mode.gcm = {
    name: "gcm",

    encrypt: function(prf, plaintext, iv, adata, tlen) {
        let out, data = plaintext.slice(0),
            w = sjcl.bitArray;
        tlen = tlen || 128;
        adata = adata || [];

        out = sjcl.mode.gcm._ctrMode(true, prf, data, adata, iv, tlen);

        return w.concat(out.data, out.tag);
    },

    decrypt: function(prf, ciphertext, iv, adata, tlen) {
        let out, data = ciphertext.slice(0),
            tag, w = sjcl.bitArray,
            l = w.bitLength(data);
        tlen = tlen || 128;
        adata = adata || [];

        if (tlen <= l) {
            tag = w.bitSlice(data, l - tlen);
            data = w.bitSlice(data, 0, l - tlen);
        } else {
            tag = data;
            data = [];
        }

        out = sjcl.mode.gcm._ctrMode(false, prf, data, adata, iv, tlen);

        if (!w.equal(out.tag, tag)) {
            throw new sjcl.exception.corrupt("gcm: tag doesn't match");
        }
        return out.data;
    },

    _galoisMultiply: function(x, y) {
        let i, j, xi, Zi, Vi, lsb_Vi, w = sjcl.bitArray,
            xor = w._xor4;

        Zi = [0, 0, 0, 0];
        Vi = y.slice(0);

        for (i = 0; i < 128; i++) {
            xi = (x[Math.floor(i / 32)] & (1 << (31 - i % 32))) !== 0;
            if (xi) {
                Zi = xor(Zi, Vi);
            }

            lsb_Vi = (Vi[3] & 1) !== 0;

            for (j = 3; j > 0; j--) {
                Vi[j] = (Vi[j] >>> 1) | ((Vi[j - 1] & 1) << 31);
            }
            Vi[0] = Vi[0] >>> 1;

            if (lsb_Vi) {
                Vi[0] = Vi[0] ^ (0xe1 << 24);
            }
        }
        return Zi;
    },

    _ghash: function(H, Y0, data) {
        let Yi, i, l = data.length;

        Yi = Y0.slice(0);
        for (i = 0; i < l; i += 4) {
            Yi[0] ^= 0xffffffff & data[i];
            Yi[1] ^= 0xffffffff & data[i + 1];
            Yi[2] ^= 0xffffffff & data[i + 2];
            Yi[3] ^= 0xffffffff & data[i + 3];
            Yi = sjcl.mode.gcm._galoisMultiply(Yi, H);
        }
        return Yi;
    },

    _ctrMode: function(encrypt, prf, data, adata, iv, tlen) {
        let H, J0, S0, enc, i, ctr, tag, last, l, bl, abl, ivbl, w = sjcl.bitArray;

        l = data.length;
        bl = w.bitLength(data);
        abl = w.bitLength(adata);
        ivbl = w.bitLength(iv);

        H = prf.encrypt([0, 0, 0, 0]);
        if (ivbl === 96) {
            J0 = iv.slice(0);
            J0 = w.concat(J0, [1]);
        } else {
            J0 = sjcl.mode.gcm._ghash(H, [0, 0, 0, 0], iv);
            J0 = sjcl.mode.gcm._ghash(H, J0, [0, 0, Math.floor(ivbl / 0x100000000), ivbl & 0xffffffff]);
        }
        S0 = sjcl.mode.gcm._ghash(H, [0, 0, 0, 0], adata);

        ctr = J0.slice(0);
        tag = S0.slice(0);

        if (!encrypt) {
            tag = sjcl.mode.gcm._ghash(H, S0, data);
        }

        for (i = 0; i < l; i += 4) {
            ctr[3]++;
            enc = prf.encrypt(ctr);
            data[i] ^= enc[0];
            data[i + 1] ^= enc[1];
            data[i + 2] ^= enc[2];
            data[i + 3] ^= enc[3];
        }
        data = w.clamp(data, bl);

        if (encrypt) {
            tag = sjcl.mode.gcm._ghash(H, S0, data);
        }

        last = [
            Math.floor(abl / 0x100000000), abl & 0xffffffff,
            Math.floor(bl / 0x100000000), bl & 0xffffffff
        ];

        tag = sjcl.mode.gcm._ghash(H, tag, last);
        enc = prf.encrypt(J0);
        tag[0] ^= enc[0];
        tag[1] ^= enc[1];
        tag[2] ^= enc[2];
        tag[3] ^= enc[3];

        return {
            tag: w.bitSlice(tag, 0, tlen),
            data: data
        };
    }
};


//// sha512.js

sjcl.hash.sha512 = function(hash) {
    if (!this._key[0]) {
        this._precompute();
    }
    if (hash) {
        this._h = hash._h.slice(0);
        this._buffer = hash._buffer.slice(0);
        this._length = hash._length;
    } else {
        this.reset();
    }
};

sjcl.hash.sha512.hash = function(data) {
    return (new sjcl.hash.sha512()).update(data).finalize();
};

sjcl.hash.sha512.prototype = {
    blockSize: 1024,

    reset: function() {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this;
    },

    update: function(data) {
        if (typeof data === "string") {
            data = sjcl.codec.utf8String.toBits(data);
        }
        let i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
            ol = this._length,
            nl = this._length = ol + sjcl.bitArray.bitLength(data),
            offset = 0;

        for (i = 1024 + ol & -1024; i <= nl; i += 1024) {
            let block = b.slice(offset, offset + 32);
            offset += 32;
            this._block(block);
        }
        b.splice(0, offset);
        return this;
    },

    finalize: function() {
        let i, b = this._buffer,
            h = this._h;

        b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
        for (i = b.length + 4; i & 31; i++) {
            b.push(0);
        }

        b.push(0);
        b.push(0);
        b.push(Math.floor(this._length / 0x100000000));
        b.push(this._length | 0);

        while (b.length) {
            this._block(b.splice(0, 32));
        }

        this.reset();
        return h;
    },

    _init: [],
    _initr: [0xbcc908, 0xcaa73b, 0x94f82b, 0x1d36f1, 0xe682d1, 0x3e6c1f, 0x41bd6b, 0x7e2179],
    _key: [],
    _keyr: [0x28ae22, 0xef65cd, 0x4d3b2f, 0x89dbbc, 0x48b538, 0x05d019, 0x194f9b, 0x6d8118,
        0x030242, 0x706fbe, 0xe4b28c, 0xffb4e2, 0x7b896f, 0x1696b1, 0xc71235, 0x692694,
        0xf14ad2, 0x4f25e3, 0x8cd5b5, 0xac9c65, 0x2b0275, 0xa6e483, 0x41fbd4, 0x1153b5,
        0x66dfab, 0xb43210, 0xfb213f, 0xef0ee4, 0xa88fc2, 0x0aa725, 0x03826f, 0x0e6e70,
        0xd22ffc, 0x26c926, 0xc42aed, 0x95b3df, 0xaf63de, 0x77b2a8, 0xedaee6, 0x82353b,
        0xf10364, 0x423001, 0xf89791, 0x54be30, 0xef5218, 0x65a910, 0x71202a, 0xbbd1b8,
        0xd2d0c8, 0x41ab53, 0x8eeb99, 0x9b48a8, 0xc95a63, 0x418acb, 0x63e373, 0xb2b8a3,
        0xefb2fc, 0x172f60, 0xf0ab72, 0x6439ec, 0x631e28, 0x82bde9, 0xc67915, 0x72532b,
        0x26619c, 0xc0c207, 0xe0eb1e, 0x6ed178, 0x176fba, 0xc898a6, 0xf90dae, 0x1c471b,
        0x047d84, 0xc72493, 0xc9bebc, 0x100d4c, 0x3e42b6, 0x657e2a, 0xd6faec, 0x475817
    ],

    _precompute: function() {
        let i = 0,
            prime = 2,
            factor;

        function frac(x) {
            return (x - Math.floor(x)) * 0x100000000 | 0;
        }

        function frac2(x) {
            return (x - Math.floor(x)) * 0x10000000000 & 0xff;
        }

        outer: for (; i < 80; prime++) {
            for (factor = 2; factor * factor <= prime; factor++) {
                if (prime % factor === 0) {
                    continue outer;
                }
            }

            if (i < 8) {
                this._init[i * 2] = frac(Math.pow(prime, 1 / 2));
                this._init[i * 2 + 1] = (frac2(Math.pow(prime, 1 / 2)) << 24) | this._initr[i];
            }
            this._key[i * 2] = frac(Math.pow(prime, 1 / 3));
            this._key[i * 2 + 1] = (frac2(Math.pow(prime, 1 / 3)) << 24) | this._keyr[i];
            i++;
        }
    },

    _block: function(words) {
        let i, wrh, wrl,
            w = words.slice(0),
            h = this._h,
            k = this._key,
            h0h = h[0],
            h0l = h[1],
            h1h = h[2],
            h1l = h[3],
            h2h = h[4],
            h2l = h[5],
            h3h = h[6],
            h3l = h[7],
            h4h = h[8],
            h4l = h[9],
            h5h = h[10],
            h5l = h[11],
            h6h = h[12],
            h6l = h[13],
            h7h = h[14],
            h7l = h[15];

        let ah = h0h,
            al = h0l,
            bh = h1h,
            bl = h1l,
            ch = h2h,
            cl = h2l,
            dh = h3h,
            dl = h3l,
            eh = h4h,
            el = h4l,
            fh = h5h,
            fl = h5l,
            gh = h6h,
            gl = h6l,
            hh = h7h,
            hl = h7l;

        for (i = 0; i < 80; i++) {
            if (i < 16) {
                wrh = w[i * 2];
                wrl = w[i * 2 + 1];
            } else {
                let gamma0xh = w[(i - 15) * 2];
                let gamma0xl = w[(i - 15) * 2 + 1];
                let gamma0h =
                    ((gamma0xl << 31) | (gamma0xh >>> 1)) ^
                    ((gamma0xl << 24) | (gamma0xh >>> 8)) ^
                    (gamma0xh >>> 7);
                let gamma0l =
                    ((gamma0xh << 31) | (gamma0xl >>> 1)) ^
                    ((gamma0xh << 24) | (gamma0xl >>> 8)) ^
                    ((gamma0xh << 25) | (gamma0xl >>> 7));

                let gamma1xh = w[(i - 2) * 2];
                let gamma1xl = w[(i - 2) * 2 + 1];
                let gamma1h =
                    ((gamma1xl << 13) | (gamma1xh >>> 19)) ^
                    ((gamma1xh << 3) | (gamma1xl >>> 29)) ^
                    (gamma1xh >>> 6);
                let gamma1l =
                    ((gamma1xh << 13) | (gamma1xl >>> 19)) ^
                    ((gamma1xl << 3) | (gamma1xh >>> 29)) ^
                    ((gamma1xh << 26) | (gamma1xl >>> 6));

                let wr7h = w[(i - 7) * 2];
                let wr7l = w[(i - 7) * 2 + 1];

                let wr16h = w[(i - 16) * 2];
                let wr16l = w[(i - 16) * 2 + 1];

                wrl = gamma0l + wr7l;
                wrh = gamma0h + wr7h + ((wrl >>> 0) < (gamma0l >>> 0) ? 1 : 0);
                wrl += gamma1l;
                wrh += gamma1h + ((wrl >>> 0) < (gamma1l >>> 0) ? 1 : 0);
                wrl += wr16l;
                wrh += wr16h + ((wrl >>> 0) < (wr16l >>> 0) ? 1 : 0);
            }

            w[i * 2] = wrh |= 0;
            w[i * 2 + 1] = wrl |= 0;

            let chh = (eh & fh) ^ (~eh & gh);
            let chl = (el & fl) ^ (~el & gl);

            let majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
            let majl = (al & bl) ^ (al & cl) ^ (bl & cl);

            let sigma0h = ((al << 4) | (ah >>> 28)) ^ ((ah << 30) | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
            let sigma0l = ((ah << 4) | (al >>> 28)) ^ ((al << 30) | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));

            let sigma1h = ((el << 18) | (eh >>> 14)) ^ ((el << 14) | (eh >>> 18)) ^ ((eh << 23) | (el >>> 9));
            let sigma1l = ((eh << 18) | (el >>> 14)) ^ ((eh << 14) | (el >>> 18)) ^ ((el << 23) | (eh >>> 9));

            let krh = k[i * 2];
            let krl = k[i * 2 + 1];

            let t1l = hl + sigma1l;
            let t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
            t1l += chl;
            t1h += chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
            t1l += krl;
            t1h += krh + ((t1l >>> 0) < (krl >>> 0) ? 1 : 0);
            t1l = t1l + wrl | 0;
            t1h += wrh + ((t1l >>> 0) < (wrl >>> 0) ? 1 : 0);

            let t2l = sigma0l + majl;
            let t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

            hh = gh;
            hl = gl;
            gh = fh;
            gl = fl;
            fh = eh;
            fl = el;
            el = (dl + t1l) | 0;
            eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
            dh = ch;
            dl = cl;
            ch = bh;
            cl = bl;
            bh = ah;
            bl = al;
            al = (t1l + t2l) | 0;
            ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
        }

        h0l = h[1] = (h0l + al) | 0;
        h[0] = (h0h + ah + ((h0l >>> 0) < (al >>> 0) ? 1 : 0)) | 0;
        h1l = h[3] = (h1l + bl) | 0;
        h[2] = (h1h + bh + ((h1l >>> 0) < (bl >>> 0) ? 1 : 0)) | 0;
        h2l = h[5] = (h2l + cl) | 0;
        h[4] = (h2h + ch + ((h2l >>> 0) < (cl >>> 0) ? 1 : 0)) | 0;
        h3l = h[7] = (h3l + dl) | 0;
        h[6] = (h3h + dh + ((h3l >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
        h4l = h[9] = (h4l + el) | 0;
        h[8] = (h4h + eh + ((h4l >>> 0) < (el >>> 0) ? 1 : 0)) | 0;
        h5l = h[11] = (h5l + fl) | 0;
        h[10] = (h5h + fh + ((h5l >>> 0) < (fl >>> 0) ? 1 : 0)) | 0;
        h6l = h[13] = (h6l + gl) | 0;
        h[12] = (h6h + gh + ((h6l >>> 0) < (gl >>> 0) ? 1 : 0)) | 0;
        h7l = h[15] = (h7l + hl) | 0;
        h[14] = (h7h + hh + ((h7l >>> 0) < (hl >>> 0) ? 1 : 0)) | 0;
    }
};


//// hmac.js

sjcl.misc.hmac = function(key, Hash) {
    this._hash = Hash = Hash || sjcl.hash.sha256;
    let exKey = [
            [],
            []
        ],
        i,
        bs = Hash.prototype.blockSize / 32;
    this._baseHash = [new Hash(), new Hash()];

    if (key.length > bs) {
        key = Hash.hash(key);
    }

    for (i = 0; i < bs; i++) {
        exKey[0][i] = key[i] ^ 0x36363636;
        exKey[1][i] = key[i] ^ 0x5C5C5C5C;
    }

    this._baseHash[0].update(exKey[0]);
    this._baseHash[1].update(exKey[1]);
    this._resultHash = new Hash(this._baseHash[0]);
};

sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function(data) {
    if (!this._updated) {
        this.update(data);
        return this.digest(data);
    } else {
        throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
    }
};

sjcl.misc.hmac.prototype.reset = function() {
    this._resultHash = new this._hash(this._baseHash[0]);
    this._updated = false;
};

sjcl.misc.hmac.prototype.update = function(data) {
    this._updated = true;
    this._resultHash.update(data);
};

sjcl.misc.hmac.prototype.digest = function() {
    let w = this._resultHash.finalize(),
        result = new(this._hash)(this._baseHash[1]).update(w).finalize();

    this.reset();

    return result;
};


//// pbkdf2.js

sjcl.misc.pbkdf2 = function(password, salt, count, length, Prff) {
    count = count || 1000;

    if (length < 0 || count < 0) {
        throw sjcl.exception.invalid("invalid params to pbkdf2");
    }

    if (typeof password === "string") {
        password = sjcl.codec.utf8String.toBits(password);
    }

    if (typeof salt === "string") {
        salt = sjcl.codec.utf8String.toBits(salt);
    }

    Prff = Prff || sjcl.misc.hmac;

    let prf = new Prff(password),
        u, ui, i, j, k, out = [],
        b = sjcl.bitArray;

    for (k = 1; 32 * out.length < (length || 1); k++) {
        u = ui = prf.encrypt(b.concat(salt, [k]));

        for (i = 1; i < count; i++) {
            ui = prf.encrypt(ui);
            for (j = 0; j < ui.length; j++) {
                u[j] ^= ui[j];
            }
        }

        out = out.concat(u);
    }

    if (length) {
        out = b.clamp(out, length);
    }

    return out;
};


//// sha256.js

sjcl.hash.sha256 = function(hash) {
    if (!this._key[0]) {
        this._precompute();
    }
    if (hash) {
        this._h = hash._h.slice(0);
        this._buffer = hash._buffer.slice(0);
        this._length = hash._length;
    } else {
        this.reset();
    }
};

sjcl.hash.sha256.hash = function(data) {
    return (new sjcl.hash.sha256()).update(data).finalize();
};

sjcl.hash.sha256.prototype = {
    blockSize: 512,

    reset: function() {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this;
    },

    update: function(data) {
        if (typeof data === "string") {
            data = sjcl.codec.utf8String.toBits(data);
        }
        let i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
            ol = this._length,
            nl = this._length = ol + sjcl.bitArray.bitLength(data),
            offset = 0;

        for (i = 512 + ol & -512; i <= nl; i += 512) {
            let block = b.slice(offset, offset + 16);
            offset += 16;
            this._block(block);
        }
        b.splice(0, offset);
        return this;
    },

    finalize: function() {
        let i, b = this._buffer,
            h = this._h;

        b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
        for (i = b.length + 2; i & 15; i++) {
            b.push(0);
        }

        b.push(Math.floor(this._length / 0x100000000));
        b.push(this._length | 0);

        while (b.length) {
            this._block(b.splice(0, 16));
        }

        this.reset();
        return h;
    },

    _init: [],
    _key: [],

    _precompute: function() {
        let i = 0,
            prime = 2,
            factor;

        function frac(x) {
            return (x - Math.floor(x)) * 0x100000000 | 0;
        }

        outer: for (; i < 64; prime++) {
            for (factor = 2; factor * factor <= prime; factor++) {
                if (prime % factor === 0) {
                    continue outer;
                }
            }

            if (i < 8) {
                this._init[i] = frac(Math.pow(prime, 1 / 2));
            }
            this._key[i] = frac(Math.pow(prime, 1 / 3));
            i++;
        }
    },

    _block: function(words) {
        let i, tmp, a, b,
            w = words.slice(0),
            h = this._h,
            k = this._key,
            h0 = h[0],
            h1 = h[1],
            h2 = h[2],
            h3 = h[3],
            h4 = h[4],
            h5 = h[5],
            h6 = h[6],
            h7 = h[7];

        for (i = 0; i < 64; i++) {
            if (i < 16) {
                tmp = w[i];
            } else {
                a = w[(i + 1) & 15];
                b = w[(i + 14) & 15];
                tmp = w[i & 15] = ((a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) +
                    (b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) +
                    w[i & 15] + w[(i + 9) & 15]) | 0;
            }

            tmp = (tmp + h7 + (h4 >>> 6 ^ h4 >>> 11 ^ h4 >>> 25 ^ h4 << 26 ^ h4 << 21 ^ h4 << 7) + (h6 ^ h4 & (h5 ^ h6)) + k[i]);

            h7 = h6;
            h6 = h5;
            h5 = h4;
            h4 = h3 + tmp | 0;
            h3 = h2;
            h2 = h1;
            h1 = h0;

            h0 = (tmp + ((h1 & h2) ^ (h3 & (h1 ^ h2))) + (h1 >>> 2 ^ h1 >>> 13 ^ h1 >>> 22 ^ h1 << 30 ^ h1 << 19 ^ h1 << 10)) | 0;
        }

        h[0] = h[0] + h0 | 0;
        h[1] = h[1] + h1 | 0;
        h[2] = h[2] + h2 | 0;
        h[3] = h[3] + h3 | 0;
        h[4] = h[4] + h4 | 0;
        h[5] = h[5] + h5 | 0;
        h[6] = h[6] + h6 | 0;
        h[7] = h[7] + h7 | 0;
    }
};


//// ripemd160.js

sjcl.hash.ripemd160 = function(hash) {
    if (hash) {
        this._h = hash._h.slice(0);
        this._buffer = hash._buffer.slice(0);
        this._length = hash._length;
    } else {
        this.reset();
    }
};

sjcl.hash.ripemd160.hash = function(data) {
    return (new sjcl.hash.ripemd160()).update(data).finalize();
};

const _h0 = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
const _k1 = [0x00000000, 0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xa953fd4e];
const _k2 = [0x50a28be6, 0x5c4dd124, 0x6d703ef3, 0x7a6d76e9, 0x00000000];
for (let iRip = 4; iRip >= 0; --iRip) {
    for (let jRip = 1; jRip < 16; ++jRip) {
        _k1.splice(iRip, 0, _k1[iRip]);
        _k2.splice(iRip, 0, _k2[iRip]);
    }
}

const _r1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
    3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
    1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
    4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13
];
const _r2 = [5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
    6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
    15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13,
    8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
    12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11
];

const _s1 = [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
    7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
    11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
    11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
    9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6
];
const _s2 = [8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
    9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
    9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
    15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
    8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11
];

function _f0(x, y, z) {
    return x ^ y ^ z;
}

function _f1(x, y, z) {
    return (x & y) | (~x & z);
}

function _f2(x, y, z) {
    return (x | ~y) ^ z;
}

function _f3(x, y, z) {
    return (x & z) | (y & ~z);
}

function _f4(x, y, z) {
    return x ^ (y | ~z);
}

function _rol(n, l) {
    return (n << l) | (n >>> (32 - l));
}

function _cvt(n) {
    return ((n & 0xff << 0) << 24) |
        ((n & 0xff << 8) << 8) |
        ((n & 0xff << 16) >>> 8) |
        ((n & 0xff << 24) >>> 24);
}

function _block(X) {
    let A1 = this._h[0],
        B1 = this._h[1],
        C1 = this._h[2],
        D1 = this._h[3],
        E1 = this._h[4],
        A2 = this._h[0],
        B2 = this._h[1],
        C2 = this._h[2],
        D2 = this._h[3],
        E2 = this._h[4];

    let j = 0,
        T;

    for (; j < 16; ++j) {
        T = _rol(A1 + _f0(B1, C1, D1) + X[_r1[j]] + _k1[j], _s1[j]) + E1;
        A1 = E1;
        E1 = D1;
        D1 = _rol(C1, 10);
        C1 = B1;
        B1 = T;
        T = _rol(A2 + _f4(B2, C2, D2) + X[_r2[j]] + _k2[j], _s2[j]) + E2;
        A2 = E2;
        E2 = D2;
        D2 = _rol(C2, 10);
        C2 = B2;
        B2 = T;
    }
    for (; j < 32; ++j) {
        T = _rol(A1 + _f1(B1, C1, D1) + X[_r1[j]] + _k1[j], _s1[j]) + E1;
        A1 = E1;
        E1 = D1;
        D1 = _rol(C1, 10);
        C1 = B1;
        B1 = T;
        T = _rol(A2 + _f3(B2, C2, D2) + X[_r2[j]] + _k2[j], _s2[j]) + E2;
        A2 = E2;
        E2 = D2;
        D2 = _rol(C2, 10);
        C2 = B2;
        B2 = T;
    }
    for (; j < 48; ++j) {
        T = _rol(A1 + _f2(B1, C1, D1) + X[_r1[j]] + _k1[j], _s1[j]) + E1;
        A1 = E1;
        E1 = D1;
        D1 = _rol(C1, 10);
        C1 = B1;
        B1 = T;
        T = _rol(A2 + _f2(B2, C2, D2) + X[_r2[j]] + _k2[j], _s2[j]) + E2;
        A2 = E2;
        E2 = D2;
        D2 = _rol(C2, 10);
        C2 = B2;
        B2 = T;
    }
    for (; j < 64; ++j) {
        T = _rol(A1 + _f3(B1, C1, D1) + X[_r1[j]] + _k1[j], _s1[j]) + E1;
        A1 = E1;
        E1 = D1;
        D1 = _rol(C1, 10);
        C1 = B1;
        B1 = T;
        T = _rol(A2 + _f1(B2, C2, D2) + X[_r2[j]] + _k2[j], _s2[j]) + E2;
        A2 = E2;
        E2 = D2;
        D2 = _rol(C2, 10);
        C2 = B2;
        B2 = T;
    }
    for (; j < 80; ++j) {
        T = _rol(A1 + _f4(B1, C1, D1) + X[_r1[j]] + _k1[j], _s1[j]) + E1;
        A1 = E1;
        E1 = D1;
        D1 = _rol(C1, 10);
        C1 = B1;
        B1 = T;
        T = _rol(A2 + _f0(B2, C2, D2) + X[_r2[j]] + _k2[j], _s2[j]) + E2;
        A2 = E2;
        E2 = D2;
        D2 = _rol(C2, 10);
        C2 = B2;
        B2 = T;
    }

    T = this._h[1] + C1 + D2;
    this._h[1] = this._h[2] + D1 + E2;
    this._h[2] = this._h[3] + E1 + A2;
    this._h[3] = this._h[4] + A1 + B2;
    this._h[4] = this._h[0] + B1 + C2;
    this._h[0] = T;
}

sjcl.hash.ripemd160.prototype = {
    reset: function() {
        this._h = _h0.slice(0);
        this._buffer = [];
        this._length = 0;
        return this;
    },

    update: function(data) {
        if (typeof data === "string")
            data = sjcl.codec.utf8String.toBits(data);

        let i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
            ol = this._length,
            nl = this._length = ol + sjcl.bitArray.bitLength(data);
        if (nl > 9007199254740991) {
            throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
        }

        let offset = 0;
        for (i = 512 + ol - ((512 + ol) & 511); i <= nl; i += 512) {
            let words = b.slice(offset, offset + 16);
            offset += 16;
            for (let w = 0; w < 16; ++w)
                words[w] = _cvt(words[w]);

            _block.call(this, words);
        }
        b.splice(0, offset);

        return this;
    },

    finalize: function() {
        let b = sjcl.bitArray.concat(this._buffer, [sjcl.bitArray.partial(1, 1)]),
            l = (this._length + 1) % 512,
            z = (l > 448 ? 512 : 448) - l % 448,
            zp = z % 32;

        if (zp > 0)
            b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(zp, 0)]);
        for (; z >= 32; z -= 32)
            b.push(0);

        b.push(_cvt(this._length | 0));
        b.push(_cvt(Math.floor(this._length / 0x100000000)));

        while (b.length) {
            let words = b.splice(0, 16);
            for (let w = 0; w < 16; ++w)
                words[w] = _cvt(words[w]);

            _block.call(this, words);
        }

        let h = this._h;
        this.reset();

        for (let w = 0; w < 5; ++w)
            h[w] = _cvt(h[w]);

        return h;
    }
};


//// sha1.js

sjcl.hash.sha1 = function(hash) {
    if (hash) {
        this._h = hash._h.slice(0);
        this._buffer = hash._buffer.slice(0);
        this._length = hash._length;
    } else {
        this.reset();
    }
};

sjcl.hash.sha1.hash = function(data) {
    return (new sjcl.hash.sha1()).update(data).finalize();
};

sjcl.hash.sha1.prototype = {
    blockSize: 512,

    reset: function() {
        this._h = this._init.slice(0);
        this._buffer = [];
        this._length = 0;
        return this;
    },

    update: function(data) {
        if (typeof data === "string") {
            data = sjcl.codec.utf8String.toBits(data);
        }
        let i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
            ol = this._length,
            nl = this._length = ol + sjcl.bitArray.bitLength(data);
        if (nl > 9007199254740991) {
            throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
        }

        if (typeof Uint32Array !== 'undefined') {
            let c = new Uint32Array(b);
            let j = 0;
            for (i = this.blockSize + ol - ((this.blockSize + ol) & (this.blockSize - 1)); i <= nl; i += this.blockSize) {
                this._block(c.subarray(16 * j, 16 * (j + 1)));
                j += 1;
            }
            b.splice(0, 16 * j);
        } else {
            let offset = 0;
            for (i = this.blockSize + ol - ((this.blockSize + ol) & (this.blockSize - 1)); i <= nl; i += this.blockSize) {
                let block = b.slice(offset, offset + 16);
                offset += 16;
                this._block(block);
            }
            b.splice(0, offset);
        }
        return this;
    },

    finalize: function() {
        let i, b = this._buffer,
            h = this._h;

        b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
        for (i = b.length + 2; i & 15; i++) {
            b.push(0);
        }
        b.push(Math.floor(this._length / 0x100000000));
        b.push(this._length | 0);

        while (b.length) {
            this._block(b.splice(0, 16));
        }

        this.reset();
        return h;
    },

    _init: [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0],
    _key: [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6],

    _f: function(t, b, c, d) {
        if (t <= 19) {
            return (b & c) | (~b & d);
        } else if (t <= 39) {
            return b ^ c ^ d;
        } else if (t <= 59) {
            return (b & c) | (b & d) | (c & d);
        } else if (t <= 79) {
            return b ^ c ^ d;
        }
    },

    _S: function(n, x) {
        return (x << n) | (x >>> 32 - n);
    },

    _block: function(words) {
        let t, tmp, a, b, c, d, e,
            h = this._h;
        let w;
        if (typeof Uint32Array !== 'undefined') {
            w = Array(80);
            for (let j = 0; j < 16; j++) {
                w[j] = words[j];
            }
        } else {
            w = words;
        }

        a = h[0];
        b = h[1];
        c = h[2];
        d = h[3];
        e = h[4];

        for (t = 0; t <= 79; t++) {
            if (t >= 16) {
                w[t] = this._S(1, w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]);
            }
            tmp = (this._S(5, a) + this._f(t, b, c, d) + e + w[t] +
                this._key[Math.floor(t / 20)]) | 0;
            e = d;
            d = c;
            c = this._S(30, b);
            b = a;
            a = tmp;
        }

        h[0] = (h[0] + a) | 0;
        h[1] = (h[1] + b) | 0;
        h[2] = (h[2] + c) | 0;
        h[3] = (h[3] + d) | 0;
        h[4] = (h[4] + e) | 0;
    }
};