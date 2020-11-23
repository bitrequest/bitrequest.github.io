import QrScanner from "./lib/qr-scanner.js";
QrScanner.WORKER_PATH = "./assets/js/lib/qr-scanner-worker.min.js";

var video = $("#qr-video")[0],
	scanner = new QrScanner(video, result => setResult(result), error => {
	    console.log(error);
	}),
	currencyscan = null;

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

function start_scan(currency) {
	scanner.start().then(() => {
		currencyscan = currency;
		var currentpage = geturlparameters().p,
        	currentpage_correct = (currentpage) ? "?p=" + currentpage + "&scan=" : "?scan=",
			url = currentpage_correct + currency,
			title = "scanning " + currency + " address";
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
	$(document).on("click", "#qrscanner", function() {
		loader(true);
        loadertext("Loading camera");
		start_scan($(this).attr("data-currency"));
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
		prefix = payment + ":",
		mid_result = (result.indexOf(prefix) >= 0) ? result.split(prefix).pop() : result,
		end_result = (result.indexOf("?") >= 0) ? mid_result.split("?")[0] : mid_result,
		validate = check_address(end_result, payment);
	if (validate === true) {
		$("#popup .formbox input.address").val(end_result);
		$("#popup .formbox input.addresslabel").focus();
		
	}
	else {
		popnotify("error", "invalid " + payment + " address");
	}
	window.history.back();
	return false;
}