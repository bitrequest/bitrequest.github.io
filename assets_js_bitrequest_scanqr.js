import QrScanner from "./assets_js_lib_qr-scanner.js";
QrScanner.WORKER_PATH = "./assets_js_lib_qr-scanner-worker.min.js";

let video = $("#qr-video")[0],
    scanner = new QrScanner(video, result => setResult(result), error => {
        console.log(error);
    }),
    currencyscan = null,
    scantype = null;

$(document).ready(function() {
    init_scan();
    cam_trigger();
    close_cam_trigger();
});

function init_scan() {
    if (inframe === true) {
        hascam = false;
        return
    }
    QrScanner.hasCamera().then(hasCamera => detect_cam(hasCamera));
}

function detect_cam(result) {
    hascam = result;
}

function start_scan(currency, type) {
    scanner.start().then(() => {
        currencyscan = currency,
            scantype = type;
        let currentpage = geturlparameters().p,
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
        loadertext("Loading camera");
        let thisqr = $(this),
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
    body.addClass("showcam");
}

function close_cam() {
    body.removeClass("showcam");
    scanner.stop();
    currencyscan = null;
}

function setResult(result) {
    scanner.stop();
    let payment = currencyscan,
        thistype = scantype;
    if (thistype == "lnconnect") {
        let params_url = renderlnconnect(result);
        if (params_url) {
            let resturl = params_url.resturl,
                macaroon = params_url.macaroon;
            if (resturl && macaroon) {
                let macval = b64urldecode(macaroon);
                if (macval) {
                    let lnd_host_input = $("#lnd_credentials .cs_" + payment + ":visible .lnd_host"),
                        lnd_key_input = $("#lnd_credentials .cs_" + payment + ":visible .invoice_macaroon");
                    lnd_host_input.val(resturl);
                    lnd_key_input.val(macval);
                    trigger_ln();
                }
            } else {
                popnotify("error", "unable to decode qr");
            }
        }
    } else if (thistype == "address") {
        let prefix = payment + ":",
            mid_result = (result.indexOf(prefix) >= 0 && payment != "kaspa") ? result.split(prefix).pop() : result,
            end_result = (result.indexOf("?") >= 0) ? mid_result.split("?")[0] : mid_result,
            isxpub = (end_result.length > 103),
            er_val = (payment == "nimiq") ? end_result.replace(/\s/g, "") : end_result,
            validate = (isxpub) ? check_xpub(end_result, xpub_prefix(payment), payment) :
            check_address(er_val, payment);
        clear_xpub_inputs();
        if (validate === true) {
            $("#popup .formbox input.address").val(er_val);
            if (supportsTouch === true) {} else {
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
        let validate = (result.length === 64) ? check_vk(result) : false;
        if (validate === true) {
            $("#popup .formbox input.vk_input").val(result);
            if (supportsTouch === true) {} else {
                $("#popup .formbox input.addresslabel").focus();
            }
        } else {
            popnotify("error", "invalid " + payment + " viewkey");
        }
    }
    window.history.back();
    return false;
}