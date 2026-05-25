<?php
/**
 * Shared secp256k1 helpers, implemented in pure PHP with bcmath.
 *
 * Used by:
 *   - spark/spark_preimage.php (ECIES, Shamir share-of-preimage ceremony)
 *   - nwc/nwc_native.php       (BIP-340 schnorr, NIP-04 ECDH fallback)
 *
 * Constants and functions are unprefixed (SECP256K1_*, secp256k1_*) so any
 * future caller doing secp256k1 over bcmath can drop a single require_once
 * and reuse the same primitives.
 *
 * Requires: bcmath extension. Verified on PHP 8.x.
 */

// === Curve constants ========================================================

if (!defined("SECP256K1_P_HEX"))  define("SECP256K1_P_HEX", "fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f");
if (!defined("SECP256K1_N_HEX"))  define("SECP256K1_N_HEX", "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
if (!defined("SECP256K1_GX_HEX")) define("SECP256K1_GX_HEX", "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798");
if (!defined("SECP256K1_GY_HEX")) define("SECP256K1_GY_HEX", "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8");

// === Cached bignum getters (avoid re-converting hex constants every call) ===

function _sp() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_P_HEX));}
function _sn() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_N_HEX));}
function _sgx() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_GX_HEX));}
function _sgy() {static $v; return $v ?? ($v = _hex2dec(SECP256K1_GY_HEX));}

// === Hex <-> arbitrary-precision decimal ====================================

function _hex2dec($hex) {
    $dec = "0";
    for ($i = 0; $i < strlen($hex); $i++) {
        $dec = bcadd(bcmul($dec, "16"), (string)hexdec($hex[$i]));
    }
    return $dec;
}

function _dec2hex($dec, $pad = 64) {
    if (bccomp($dec, "0") == 0) return str_pad("0", $pad, "0", STR_PAD_LEFT);
    $hex = "";
    $tmp = $dec;
    while (bccomp($tmp, "0") > 0) {
        $hex = dechex((int)bcmod($tmp, "16")) . $hex;
        $tmp = bcdiv($tmp, "16", 0);
    }
    return str_pad($hex, $pad, "0", STR_PAD_LEFT);
}

// === Modular arithmetic helpers =============================================

function _bcmod_pos($a, $m) {
    $r = bcmod($a, $m);
    if (bccomp($r, "0") < 0) $r = bcadd($r, $m);
    return $r;
}

function _bcinvert($a, $m) {
    $a = _bcmod_pos($a, $m);
    $old_r = $a; $r = $m;
    $old_s = "1"; $s = "0";
    while (bccomp($r, "0") != 0) {
        $q = bcdiv($old_r, $r, 0);
        $tmp = $r; $r = bcsub($old_r, bcmul($q, $r)); $old_r = $tmp;
        $tmp = $s; $s = bcsub($old_s, bcmul($q, $s)); $old_s = $tmp;
    }
    return _bcmod_pos($old_s, $m);
}

// === EC arithmetic on secp256k1 (affine coords) =============================

/** Decompress a 33-byte (02|03)+x compressed pubkey to ($x_hex, $y_hex). */
function secp256k1_decompress($compressed_hex) {
    $p = _sp();
    $prefix = substr($compressed_hex, 0, 2);
    $x = _hex2dec(substr($compressed_hex, 2));
    $y_sq = _bcmod_pos(bcadd(bcpowmod($x, "3", $p), "7"), $p);
    $exp = bcdiv(bcadd($p, "1"), "4", 0);
    $y = bcpowmod($y_sq, $exp, $p);
    $y_is_odd = bcmod($y, "2") !== "0";
    if (($prefix === "02" && $y_is_odd) || ($prefix === "03" && !$y_is_odd)) {
        $y = bcsub($p, $y);
    }
    return [_dec2hex($x), _dec2hex($y)];
}

/** Point addition. Falls through to doubling when P == Q. */
function secp256k1_add($px_hex, $py_hex, $qx_hex, $qy_hex) {
    $p = _sp();
    $px = _hex2dec($px_hex); $py = _hex2dec($py_hex);
    $qx = _hex2dec($qx_hex); $qy = _hex2dec($qy_hex);
    if (bccomp($px, $qx) == 0 && bccomp($py, $qy) == 0) {
        return secp256k1_double($px_hex, $py_hex);
    }
    $dx = _bcmod_pos(bcsub($qx, $px), $p);
    $dy = _bcmod_pos(bcsub($qy, $py), $p);
    $s = _bcmod_pos(bcmul($dy, _bcinvert($dx, $p)), $p);
    $rx = _bcmod_pos(bcsub(bcsub(bcpowmod($s, "2", $p), $px), $qx), $p);
    $ry = _bcmod_pos(bcsub(bcmul($s, bcsub($px, $rx)), $py), $p);
    return [_dec2hex($rx), _dec2hex($ry)];
}

/** Point doubling. */
function secp256k1_double($px_hex, $py_hex) {
    $p = _sp();
    $px = _hex2dec($px_hex); $py = _hex2dec($py_hex);
    $num = _bcmod_pos(bcmul("3", bcpowmod($px, "2", $p)), $p);
    $den = _bcmod_pos(bcmul("2", $py), $p);
    $s = _bcmod_pos(bcmul($num, _bcinvert($den, $p)), $p);
    $rx = _bcmod_pos(bcsub(bcpowmod($s, "2", $p), bcmul("2", $px)), $p);
    $ry = _bcmod_pos(bcsub(bcmul($s, bcsub($px, $rx)), $py), $p);
    return [_dec2hex($rx), _dec2hex($ry)];
}

/** Scalar * point using double-and-add. */
function secp256k1_mul($scalar_hex, $px_hex, $py_hex) {
    $k = _hex2dec($scalar_hex);
    $rx = null; $ry = null;
    $bits = "";
    $tmp = $k;
    while (bccomp($tmp, "0") > 0) {
        $bits = bcmod($tmp, "2") . $bits;
        $tmp = bcdiv($tmp, "2", 0);
    }
    for ($i = 0; $i < strlen($bits); $i++) {
        if ($rx !== null) list($rx, $ry) = secp256k1_double($rx, $ry);
        if ($bits[$i] === "1") {
            if ($rx === null) { $rx = $px_hex; $ry = $py_hex; }
            else list($rx, $ry) = secp256k1_add($rx, $ry, $px_hex, $py_hex);
        }
    }
    return [$rx, $ry];
}

// === Public key derivation from a 32-byte private key =======================

/** Full uncompressed public key: "04" || x || y (130 hex chars). */
function secp256k1_pubkey($privkey_hex) {
    list($x, $y) = secp256k1_mul($privkey_hex, SECP256K1_GX_HEX, SECP256K1_GY_HEX);
    return "04" . $x . $y;
}

/** Compressed public key: "02"|"03" prefix + x (66 hex chars). */
function secp256k1_pubkey_compressed($privkey_hex) {
    list($x, $y) = secp256k1_mul($privkey_hex, SECP256K1_GX_HEX, SECP256K1_GY_HEX);
    $y_is_odd = bcmod(_hex2dec($y), "2") !== "0";
    return ($y_is_odd ? "03" : "02") . $x;
}

/** BIP-340 x-only public key: x only (64 hex chars). Used by Nostr. */
function secp256k1_xonly_pubkey($privkey_hex) {
    list($x, $y) = secp256k1_mul($privkey_hex, SECP256K1_GX_HEX, SECP256K1_GY_HEX);
    return $x;
}