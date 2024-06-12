import QrScanner from "./assets_js_lib_qr-scanner.js";
QrScanner.WORKER_PATH = "./assets_js_lib_qr-scanner-worker.min.js";

const video = $("#qr-video")[0],
    scanner = new QrScanner(video, result => setResult(result), error => {
        console.log(error);
    });
let currencyscan = null,
    scantype = null;

$(document).ready(function() {
    init_scan();
    cam_trigger();
    close_cam_trigger();
});

function init_scan() {
    if (glob_inframe === true) {
        glob_hascam = false;
        return
    }
    QrScanner.hasCamera().then(hasCamera => detect_cam(hasCamera));
}

function detect_cam(result) {
    glob_hascam = result;
}

function start_scan(currency, type) {
    scanner.start().then(() => {
        currencyscan = currency,
            scantype = type;
        const currentpage = geturlparameters().p,
            currentpage_correct = (currentpage) ? "?p=" + currentpage + "&scan=" : "?scan=",
            url = currentpage_correct + currency,
            title = "scanning " + currency + " " + type;
        openpage(url, title, "scan");
        show_cam();
        closeloader();
    }).catch((reason) => abort_cam(reason));
}

function abort_cam(reason) {
    console.log(reason);
    closeloader();
}

function cam_trigger() {
    $(document).on("click", ".qrscanner", function() {
        loader(true);
        loadertext(translate("loadingcamera"));
        const thisqr = $(this),
            currency = thisqr.attr("data-currency"),
            type = thisqr.attr("data-id");
        start_scan(currency, type);
    });
}

function close_cam_trigger() {
    $(document).on("click", "#closecam", function(e) {
        if (e.originalEvent) {
            window.history.back();
            return;
        }
        close_cam();
    });
}

function show_cam() {
    glob_body.addClass("showcam");
}

function close_cam() {
    glob_body.removeClass("showcam");
    scanner.stop();
    currencyscan = null;
}

function setResult(result) {
    scanner.stop();
    const payment = currencyscan,
        thistype = scantype;
    if (thistype == "lnconnect") {
        const params_url = renderlnconnect(result);
        if (params_url) {
            const resturl = params_url.resturl,
                macaroon = params_url.macaroon;
            if (resturl && macaroon) {
                const macval = b64urldecode(macaroon);
                if (macval) {
                    const set_vals = set_ln_fields(payment, resturl, macval);
                    if (set_vals) {
                        trigger_ln();
                    }
                }
            } else {
                popnotify("error", "unable to decode qr");
            }
        }
    } else if (thistype == "address") {
        const prefix = payment + ":",
            mid_result = (result.indexOf(prefix) >= 0 && payment != "kaspa") ? result.split(prefix).pop() : result,
            end_result = (result.indexOf("?") >= 0) ? mid_result.split("?")[0] : mid_result,
            isxpub = (end_result.length > 103),
            er_val = (payment == "nimiq") ? end_result.replace(/\s/g, "") : end_result,
            validate = (isxpub) ? check_xpub(end_result, xpub_prefix(payment), payment) :
            check_address(er_val, payment);
        clear_xpub_inputs();
        if (validate === true) {
            $("#popup .formbox input.address").val(er_val);
            if (glob_supportsTouch) {} else {
                $("#popup .formbox input.addresslabel").focus();
            }
            if (isxpub) {
                if (cxpub(payment)) {
                    clear_xpub_checkboxes();
                    validate_xpub($(".formbox"));
                } else {
                    popnotify("error", "invalid " + payment + " address");
                }
            }
        } else {
            if (isxpub) {
                xpub_fail(payment);
            } else {
                popnotify("error", "invalid " + payment + " address");
            }
        }
    } else if (thistype == "viewkey") {
        const validate = (result.length === 64) ? check_vk(result) : false;
        if (validate === true) {
            $("#popup .formbox input.vk_input").val(result);
            if (glob_supportsTouch) {} else {
                $("#popup .formbox input.addresslabel").focus();
            }
        } else {
            popnotify("error", "invalid " + payment + " viewkey");
        }
    }
    window.history.back();
    return false;
}