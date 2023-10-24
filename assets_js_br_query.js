function lss(dat, pref, ss, ns) {
	ddat = (ns) ? dat : JSON.stringify(dat);
	if (ss) {
		sessionStorage.setItem("bitrequest_" + pref, ddat);
	}
	localStorage.setItem("bitrequest_" + pref, ddat);
}

function lsg(pref, ss) {
	if (ss) {
		return sessionStorage.getItem("bitrequest_" + pref);
	}
	return localStorage.getItem("bitrequest_" + pref);
}