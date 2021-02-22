import QrScanner from "./lib/qr-scanner.js";
QrScanner.WORKER_PATH = "./assets/js/lib/qr-scanner-worker.min.js";

var video = $("#qr-video")[0],
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
    QrScanner.hasCamera().then(hasCamera => detect_cam(hasCamera));
}

function detect_cam(result) {
    hascam = result;
}

function start_scan(currency, type) {
    scanner.start().then(() => {
        currencyscan = currency,
        scantype = type;
        var currentpage = geturlparameters().p,
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
        var thisqr = $(this),
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
    var payment = currencyscan,
    	thistype = scantype;
    if (thistype == "address") {
	    var prefix = payment + ":",
	        mid_result = (result.indexOf(prefix) >= 0) ? result.split(prefix).pop() : result,
	        end_result = (result.indexOf("?") >= 0) ? mid_result.split("?")[0] : mid_result,
	        validate = (end_result.length > 103) ? check_xpub(end_result, xpub_prefix(payment)) :
	        check_address(end_result, payment);
	    if (validate === true) {
	        $("#popup .formbox input.address").val(end_result);
	        $("#popup .formbox input.addresslabel").focus();
	    } else {
	        popnotify("error", "invalid " + payment + " address");
	    }
    }
    else if (thistype == "viewkey") {
	    var validate = (result.length === 64) ? check_vk(result) : false;
	    if (validate === true) {
	        $("#popup .formbox input.vk_input").val(result);
	        $("#popup .formbox input.addresslabel").focus();
	    } else {
	        popnotify("error", "invalid " + payment + " viewkey");
	    }
    }
    window.history.back();
	return false;
}