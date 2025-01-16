$(document).ready(function() {
    lightning_management();
    lnd_cc_switch();
    //lm_function
    //node_option_li
    //test_lnd_option_li
    //test_eclair_option_li
    //test_lnbits_option_li
    //tconnectcb
    //lightning_option_li
    //syntaxHighlight
    //lnd_append_proxy
    //lnd_proxy_option_li
    toggle_ln_proxy();
    proxy_switch();
    toggle_add_proxy();
    lnd_proxy_switch();
    //test_pconnect
    lnd_select_node();
    lnd_select_proxy();
    lnd_select_implementation();
    toggle_invoices();
    //trigger_ln
    //test_lnd_proxy
    //add_custom_proxy
    //test_create_invoice
    //add_ln_imp
    remove_rpc_proxy();
    unlock_proxy1();
    unlock_proxy2();
    unlock_proxy3();
    unlock_proxy4();
    //p_promt
    remove_lnd();

    /* helpers */
    //lndli
    //is_local_node
    //cancelpd
    //node_exists
    //fetch_node
    //fetch_other_nodes
    //fetch_proxy
    //fetch_other_proxies
    //lnurl_form
    //lnurl_deform
    //lnurl_encode_save
    //lnurl_encode
    //lnurl_decode
    //lnurl_decode_c
});

// Initializes event listener for Lightning Network settings
function lightning_management() {
    $(document).on("click", ".cc_settinglist li[data-id='Lightning network'] .atext", function() {
        lm_function();
    })
}

// Handles the switching of Lightning Network functionality on/off
function lnd_cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Lightning network'] .switchpanel.custom", function() {
        const this_switch = $(this),
            lnli = lndli();
        if (this_switch.hasClass("true")) {
            const result = confirm(translate("disablelightning"));
            if (result === true) {
                lnli.data("selected", false);
                this_switch.removeClass("true").addClass("false");
                save_cc_settings("bitcoin", true);
            }
        } else {
            const selected = lnli.data("selected_service");
            if (selected) {
                lnli.data("selected", true);
                this_switch.removeClass("false").addClass("true");
                save_cc_settings("bitcoin", true);
            } else {
                lm_function();
            }
        }
    })
}

// Main function for managing Lightning Network settings and UI
function lm_function(replace) {
    const this_data = lndli().data();
    if (this_data) {
        const {
            "services": node_list,
            "proxies": lnd_proxy_list,
            "selected_service": current_node,
            "selected_proxy": current_proxy
        } = this_data,
        has_nodes = Boolean(node_list && !empty_obj(node_list)),
            has_proxies = Boolean(lnd_proxy_list && !empty_obj(lnd_proxy_list)),
            node_title = has_nodes ? translate("lightningnode") : translate("addlightningnode"),
            has_proxy = Boolean(current_proxy),
            p_arr = has_proxy ? lnurl_deform(current_proxy.proxy) : false,
            cp_format = p_arr ? p_arr.url : "",
            cp_id = current_proxy ? current_proxy.id : false,
            p_class = has_proxies ? " haslnurls" : "",
            n_class = has_nodes ? "" : " noln",
            camclass = glob_let.hascam ? "" : " nocam",
            node_name = current_node ? current_node.name : "",
            c_node_id = current_node ? current_node.node_id : "",
            proxy_select = has_proxy ? "<div class='selectbox' id='lnd_proxy_select_input'>" +
            "<input type='text' value='" + cp_format + "' data-pid='" + cp_id + "' placeholder='https://...' readonly='readonly'/>" +
            "<div class='selectarrows icon-menu2' data-pe='none'></div>" +
            "<div class='options'></div>" +
            "</div><div id='add_proxy'><span class='ref'>" + translate("addrpcproxy") + "</span></div>" : "",
            ln_markup = "<div class='popform" + n_class + p_class + camclass + "'>" +
            "<div id='select_ln_node' class='selectbox' data-nodeid='" + c_node_id + "'>" +
            "<input type='text' value='" + node_name + "' placeholder='Select lightning node' readonly='readonly' id='ln_nodeselect'/>" +
            "<div class='selectarrows icon-menu2' data-pe='none'></div>" +
            "<div id='ln_nodelist' class='options'></div>" +
            "</div>" +
            "<div id='ad_info_wrap'>" +
            "<ul>" +
            "<li><div class='d_trigger' id='add_lndnode_trigger'><span class='ref'><span class='icon-power'></span>" + translate("addnode") + "</span></div>" +
            "<div class='drawer2' id='adln_drawer'>" +
            "<div class='selectbox'>" +
            "<input type='text' value='' placeholder='" + translate("implementation") + "' id='lnd_select_input' readonly='readonly'/>" +
            "<div class='selectarrows icon-menu2' data-pe='none'></div>" +
            "<div class='options' id='implements'>" +
            "<span data-value='lnd' class='imp_select'><img src='" + c_icons("lnd") + "' class='lnd_icon'> LND</span>" +
            "<span data-value='eclair' class='imp_select'><img src='" + c_icons("eclair") + "' class='lnd_icon'> Eclair</span>" +
            "<span data-value='c-lightning' class='imp_select'><img src='" + c_icons("c-lightning") + "' class='lnd_icon'> c-lightning </span>" +
            "<span data-value='lnbits' class='imp_select'><img src='" + c_icons("lnbits") + "' class='lnd_icon'> LNbits</span>" +
            "</div>" +
            "</div>" +
            "<div id='lnd_credentials'>" +
            "<div class='lndcd cs_lnd'>" +
            "<div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/><div class='qrscanner' data-currency='lnd' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>" +
            "<div class='inputwrap'><input class='invoice_macaroon (hex)' type='text' value='' placeholder='Invoice macaroon'/></div>" +
            "</div>" +
            "<div class='lndcd cs_eclair'>" +
            "<div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/></div>" +
            "<div class='inputwrap'><input class='invoice_macaroon (hex)' type='text' value='' placeholder='Password'/></div>" +
            "</div>" +
            "<div class='lndcd cs_c-lightning'>" +
            "<div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/><div class='qrscanner' data-currency='c-lightning' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>" +
            "<div class='inputwrap'><input class='invoice_macaroon' type='text' value='' placeholder='Invoice macaroon'/></div>" +
            "</div>" +
            "<div class='lndcd cs_lnbits'>" +
            "<div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/></div>" +
            "<div class='inputwrap'><input class='invoice_macaroon' type='text' value='' placeholder='Invoice/read key'/></div>" +
            "</div>" +
            "</div>" +
            "<div class='switch_wrap'>" +
            "<div id='lnurl_s'><span id='toggle_lnd' class='ref'>RPC proxy</span>" + switchpanel(has_proxies, " custom") + "</div>" +
            "</div>" +
            "</div>" +
            "</li>" +
            "<li><div class='d_trigger' id='add_proxy_trigger'><span class='ref'><span class='icon-sphere'></span>RPC proxy</span></div>" +
            "<div class='drawer2" + p_class + "' id='add_proxy_drawer'>" + proxy_select +
            "<div id='lnurl_proxy_drawer' class='lpd'>" +
            "<p id='lnurls_info'>" + translate("controlyourlnkeys") + "<br/><br/>" +
            "<strong>1.</strong> " + translate("lnnodestep1") + "<br/>" +
            "<strong>2.</strong> " + translate("lnnodestep2") + "<br/>" +
            "<strong>3.</strong> " + translate("lnnodestep3") + "<br/><br/>" +
            "</p>" +
            "<input type='text' value='' placeholder='https://...' id='lnd_proxy_url_input'/>" +
            "<input type='password' value='' placeholder='API key' id='proxy_pw_input'/>" +
            "</div>" +
            "</div>" +
            "</li>" +
            "<ul>" +
            "</div>" +
            "</div>",
            content = template_dialog_temp({
                "id": "lnsettingsbox",
                "icon": "icon-power",
                "title": node_title,
                "elements": ln_markup
            }),
            trigger = replace ? null : "trigger_ln";
        popdialog(content, trigger, null, null, replace);
        if (has_nodes) {
            Object.entries(node_list).forEach(([key, value]) => {
                const nselect = value.node_id === c_node_id,
                    imp = value.imp,
                    lnurl = value.lnurl;
                if (lnurl || value.proxy) {
                    const fetchproxy = has_proxies ? fetch_proxy(lnd_proxy_list, value.proxy_id) : false,
                        proxy_dat = fetchproxy ? fetchproxy.proxy : (current_proxy ? current_proxy.proxy : d_proxy()),
                        p_arr = lnurl_deform(proxy_dat),
                        proxy = p_arr.url,
                        pw = p_arr.k;
                    node_option_li(value, nselect, "append", proxy, pw);
                } else {
                    switch (imp) {
                        case "lnd":
                            test_lnd_option_li(value, nselect, "append");
                            break;
                        case "c-lightning":
                            test_c_lightning_option_li(value, nselect, "append");
                            break;
                        case "eclair":
                            test_eclair_option_li(value, nselect, "append");
                            break;
                        case "lnbits":
                            test_lnbits_option_li(value, nselect, "append");
                            break;
                        default:
                            lightning_option_li(false, value, nselect, "append");
                    }
                }
            });
        }
        if (has_proxies) {
            const proxylist = $("#lnsettingsbox #add_proxy_drawer .options");
            Object.entries(lnd_proxy_list).forEach(([key, value]) => {
                const current_p = value.id === cp_id;
                lnd_append_proxy(proxylist, key, value, current_p);
            });
        }
        if (replace) {
            $("#dialogbody").slideDown(300);
        }
    }
}

// Handles the creation and appending of Lightning Network node options
function node_option_li(value, selected, fn, proxy, pw) {
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": proxy
    }));
    const imp = value.imp,
        postdata = {
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy + "proxy/v1/ln/api/",
            "data": {
                "imp": imp,
                "fn": "ln-list-invoices",
                "host": value.host,
                "key": value.key,
                "x-api": pw
            }
        };
    $.ajax(postdata).done(function(e) {
            closeloader();
            const invoices = e.invoices,
                error = e.error;
            if (error) {
                const default_error = translate("unabletoconnect"),
                    message = error ? (error.message ? error.message : (typeof error === "string" ? error : default_error)) : default_error,
                    code = error.code;
                locked = code && (code === 1 || code === 2) ? "locked" : null;
                if (fn === "append") {
                    lightning_option_li(false, value, selected, locked, proxy);
                    popnotify("error", message);
                } else if (fn === "test_connect") {
                    tconnectcb();
                    if (selected) {
                        popnotify("error", message);
                    }
                }
                return;
            }
            const mdat = e.mdat,
                connected = mdat.connected;
            if (fn === "append") {
                if (e && connected) {
                    lightning_option_li(true, value, selected, invoices, proxy);
                } else {
                    lightning_option_li(false, value, selected);
                }
            } else if (fn === "test_connect") {
                tconnectcb(connected);
            }
        })
        .fail(function(xhr, stat, err) {
            closeloader();
            if (fn === "append") {
                lightning_option_li(false, value, selected);
            } else if (fn === "test_connect") {
                tconnectcb();
            }
        });
}

// Tests and creates an option list item for an LND (Lightning Network Daemon) node
function test_lnd_option_li(value, selected, fn) {
    const host = value.host,
        proxy = host.indexOf(".onion") > 0;
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": host
    }));
    api_proxy({
        "proxy": proxy,
        "api_url": host + "/v1/invoices",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "Grpc-Metadata-macaroon": value.key
            }
        }
    }).done(function(e) {
        closeloader();
        const data = br_result(e).result;
        if (fn === "append") {
            if (data && data.invoices) {
                lightning_option_li(true, value, selected, data.invoices);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            if (data && data.invoices) {
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(xhr, stat, err) {
        closeloader();
        if (fn === "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            tconnectcb();
        }
        return
    });
}

// Tests and creates an option list item for a c-lightning node
function test_c_lightning_option_li(value, selected, fn) {
    const host = value.host,
        proxy = host.indexOf(".onion") > 0;
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": host
    }));
    api_proxy({
        "proxy": proxy,
        "api_url": host + "/v1/invoice/listInvoices",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "macaroon": value.key,
                "encodingtype": "hex"
            }
        }
    }).done(function(e) {
        closeloader();
        const data = br_result(e).result;
        if (fn === "append") {
            if (data && data.invoices) {
                lightning_option_li(true, value, selected, data.invoices);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            if (data && data.invoices) {
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(xhr, stat, err) {
        closeloader();
        if (fn === "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            tconnectcb();
        }
        return
    });
}

// Tests and creates an option list item for an Eclair Lightning node
function test_eclair_option_li(value, selected, fn) {
    const host = value.host,
        proxy = host.indexOf(".onion") > 0;
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": host
    }));
    api_proxy({
        "proxy": proxy,
        "api_url": host + "/listinvoices",
        "params": {
            "method": "POST",
            "cache": false,
            "contentType": "application/x-www-form-urlencoded",
            "data": null,
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(":" + value.key)
            }
        }
    }).done(function(e) {
        closeloader();
        const data = br_result(e).result;
        if (fn === "append") {
            if (data) {
                if (data.error) {
                    lightning_option_li(false, value, selected);
                    return
                }
                lightning_option_li(true, value, selected, data);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            if (data) {
                if (data.error) {
                    tconnectcb();
                    return
                }
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(xhr, stat, err) {
        closeloader();
        if (fn === "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            tconnectcb();
        }
        return
    });
}

// Tests and creates an option list item for an LNbits Lightning node
function test_lnbits_option_li(value, selected, fn) {
    const host = value.host,
        proxy = host.indexOf(".onion") > 0;
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": host
    }));
    api_proxy({
        "proxy": proxy,
        "api_url": host + "/api/v1/wallet",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "X-Api-Key": value.key
            }
        }
    }).done(function(e) {
        closeloader();
        const data = br_result(e).result;
        if (fn === "append") {
            if (data && data.balance > -1) {
                lightning_option_li(true, value, selected, data.invoices);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            if (data && data.balance > -1) {
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(xhr, stat, err) {
        closeloader();
        if (fn === "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn === "test_connect") {
            tconnectcb();
        }
        return
    });
}

// Callback function for testing connection to a Lightning node
function tconnectcb(add) {
    const pnode = $("#lnsettingsbox .ln_info_wrap:visible");
    if (add) {
        pnode.addClass("live");
        $("#ln_nodeselect").data("live", "connection");
    } else {
        pnode.removeClass("live");
        $("#ln_nodeselect").data("live", "wifi-off");
    }
}

// Creates and appends a Lightning node option to the UI
function lightning_option_li(live, value, selected, invoices, proxy) {
    const has_invoices = (invoices && invoices !== "locked") ? true : false,
        locked = (invoices && invoices === "locked") ? true : false,
        liveclass = locked ? " locked" : (live === true ? " live" : ""),
        selected_class = (selected === true) ? " show" : "",
        node_id = value.node_id,
        proxy_id = value.proxy_id,
        imp = value.imp,
        lnurls_bool = value.lnurl ? true : false,
        icon = locked ? "lock" : (live === true ? "connection" : "wifi-off"),
        name = value.name,
        icon_loc = c_icons(imp),
        lnurl_icon = lnurls_bool ? "<div class='opt_icon icon-sphere' data-pe='none'></div>" : "",
        option = $("<div class='optionwrap" + liveclass + selected_class + "' style='display:none' data-pe='none'>" +
            "<span data-value='" + node_id + "' data-live='" + icon + "'>" +
            "<img src='" + icon_loc + "' class='lnd_icon'/> " + name + "</span>" +
            "<div class='opt_icon_box' data-pe='none'>" +
            "<div class='opt_icon icon-bin' data-pe='none'></div>" +
            "<div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div>" +
            lnurl_icon +
            "</div></div>");
    let invoiceslist = "";
    option.data(value).appendTo($("#ln_nodelist"));
    option.slideDown(500);
    if (has_invoices) {
        invoices.reverse().forEach(function(value) {
            const inv_id = value.payment_request ? " " + value.payment_request.slice(0, 16) :
                (value.serialized ? " " + value.serialized.slice(0, 16) : ""),
                inv_title = value.memo || value.description || "invoice" + inv_id,
                timestamp = value.creation_date || value.timestamp || false,
                inv_date = timestamp ? short_date(parseInt(timestamp * 1000) + glob_const.timezone) : "",
                settle_icon = value.settled === true || value.status === "paid" ? "icon-checkmark" :
                (value.settled === false || value.status === "expired" ? "icon-clock" : false),
                icon_span = settle_icon ? "<span class='" + settle_icon + "'></span>" : "<img src='" + icon_loc + "' class='lnd_icon'>";
            invoiceslist += "<div class='ivli'><div class='invoice_memo clearfix'>" +
                "<div class='iv_title'>" + icon_span + " " + inv_title + "</div>" +
                "<div class='iv_date'>" + inv_date + "</div></div>" +
                "<div class='invoice_body'><pre>" + syntaxHighlight(value) + "</pre></div></div>";
        });
    } else {
        const invoice_msg = locked ? translate("invoiceslocked", {
            "proxy_id": proxy_id
        }) : (live === true ? translate("noinvoicesfound") : translate("invoiceoffline"));
        invoiceslist = "<p>" + invoice_msg + "</p>";
    }
    const host = value.host,
        proxy_bool = (value.proxy) ? true : false,
        proxy_val = proxy_bool && proxy ? proxy : false,
        missing_proxy = lnurls_bool && !proxy_val,
        hideclass = selected === true ? " node_selected hide" : " hide",
        lnurls_class = lnurls_bool ? " lnurlclass" : "",
        node_name = missing_proxy ? "Proxy not found" : (lnurls_bool ? "hidden by Proxy server" : host),
        lnurl_markup = lnurls_bool ? "<strong><img src='" + icon_loc + "' class='lnd_icon' style='opacity:0'/> Proxy server: </strong>" + proxy_val + "</br/>" : "",
        proxy_markup = lnurls_bool ? "" : "<strong><img src='" + icon_loc + "' class='lnd_icon' style='opacity:0'/> Proxy: </strong><span class='inline_pval'>" + proxy_val + "</span></br/>",
        info_markup = $("<li class='noln_ref" + hideclass + lnurls_class + "' data-id='" + node_id + "' data-pid='" + proxy_id + "'>" +
            "<div class='d_trigger'><span class='ref'><span class='icon-info'></span>Info</span></div>" +
            "<div class='drawer2 infodrawer' style='display:block'>" +
            "<div class='ln_info_wrap clearfix" + liveclass + "'>" +
            "<div class='lni_dat'>" +
            "<img src='" + icon_loc + "' class='lnd_icon'/> <strong>" + imp + " Node: </strong>" + node_name + "<br/>" +
            lnurl_markup + proxy_markup +
            "<strong><img src='" + icon_loc + "' class='lnd_icon' style='opacity:0'/> Status: </strong>" +
            "<span class='online_stat'> Online <span class='icon-connection'></span></span>" +
            "<span class='offline_stat'> Offline <span class='icon-wifi-off'></span></span>" +
            "<span class='locked_stat'> <span id='pw_unlock_info' data-pid='" + proxy_id + "' class='ref'>Locked</span> <span class='icon-lock'></span></span></br/>" +
            "</div>" +
            "<div class='lnurl_p'>Proxy" + switchpanel(proxy_bool, " custom") + "</div>" +
            "</div></div></li>"),
        invoice_markup = $("<li class='noln_ref" + hideclass + "' data-id='" + node_id + "'>" +
            "<div class='d_trigger'><span class='ref'><span class='icon-files-empty'></span>Invoices</span></div>" +
            "<div class='drawer2'><div class='invoice_list'>" + invoiceslist + "</div></div></li>");
    $("#lnsettingsbox #ad_info_wrap > ul").prepend(info_markup, invoice_markup);
    $("#ad_info_wrap .node_selected").delay(500).slideDown(300);
}

// Applies syntax highlighting to JSON data for display
function syntaxHighlight(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }
    const htmlEntities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;"
    };
    json = json.replace(/[&<>]/g, function(match) {
        return htmlEntities[match];
    });
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        let cssClass = "number";
        if (/^"/.test(match)) {
            cssClass = /:$/.test(match) ? "key" : "string";
        } else if (/true|false/.test(match)) {
            cssClass = "boolean";
        } else if (/null/.test(match)) {
            cssClass = "null";
        }
        return "<span class='" + cssClass + "'>" + match + "</span>";
    });
}

// Appends a Lightning Network proxy option to the list and tests its connection
function lnd_append_proxy(optionlist, key, value, selected) { // make test api call
    const p_arr = lnurl_deform(value.proxy),
        proxy = p_arr.url;
    let locked = false;
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": proxy
    }));
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy + "proxy/v1/ln/api/",
        "data": {
            "pingpw": true,
            "x-api": p_arr.k
        }
    }).done(function(e) {
        closeloader();
        const api_result = br_result(e),
            result = api_result.result,
            error = result.error;
        if (error) {
            const code = error.code;
            locked = code && (code == 1 || code == 2);
            lnd_proxy_option_li(optionlist, false, key, value, selected, proxy, locked);
            return
        }
        if (result === "pong") {
            lnd_proxy_option_li(optionlist, true, key, value, selected, proxy, locked);
            return
        }
        lnd_proxy_option_li(optionlist, false, key, value, selected, proxy, locked);
    }).fail(function(xhr, stat, err) {
        closeloader();
        lnd_proxy_option_li(optionlist, false, key, value, selected, proxy, locked);
    });
}

// Creates and appends a Lightning Network proxy option to the list
function lnd_proxy_option_li(optionlist, live, key, value, selected, proxy_name, locked) {
    const liveclass = live === true ? " live" : " offline",
        icon = locked ? "lock" : (live === true ? "connection" : "wifi-off"),
        selected_class = selected === true ? " show" : "",
        option = $("<div class='optionwrap" + liveclass + selected_class + "' style='display:none' data-pe='none' data-value='" + proxy_name + "' data-pid='" + value.id + "'>" +
            "<span data-pe='none'>" + proxy_name + "</span>" +
            "<div class='opt_icon_box' data-pe='none'>" +
            "<div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div>" +
            "<div class='opt_icon icon-bin' data-pe='none'></div>" +
            "</div></div>");
    optionlist.append(option);
    option.slideDown(500);
}

// Toggles the visibility of the Lightning Network proxy drawer
function toggle_ln_proxy() {
    $(document).on("click", "#lnsettingsbox #toggle_lnd", function() {
        const lpd = $("#add_proxy_drawer");
        lpd_input = $("#lnd_proxy_url_input");
        if (lpd.is(":visible")) {
            lpd_input.blur();
            lpd.slideUp(200);
        } else {
            lpd.slideDown(200);
            lpd_input.focus();
        }
    })
}

// Handles the switching between Lightning Network proxy and direct connection
function proxy_switch() {
    $(document).on("mouseup", "#lnsettingsbox #lnurl_s .switchpanel.custom", function() {
        const this_switch = $(this),
            lpd = $("#add_proxy_drawer"),
            ldc = $("#lnd_credentials"),
            lpd_input = $("#lnd_proxy_url_input"),
            lnd_imp_input = $("#lnd_select_input"),
            imp = lnd_imp_input.data("value");
        this_switch.toggleClass("true false");
        ldc.slideToggle(200);
        if (lpd.hasClass("haslnurls")) {
            return;
        }
        lpd.slideToggle(200);
        if (!lpd.is(":visible")) {
            lpd_input.focus();
        }
    })
}

// Toggles the visibility of the add proxy drawer
function toggle_add_proxy() {
    $(document).on("click", "#lnsettingsbox #add_proxy .ref", function() {
        const lupd = $("#lnurl_proxy_drawer");
        lupd.slideToggle(200);
    })
}

// Handles the switching of Lightning Network proxy for individual nodes
function lnd_proxy_switch() {
    $(document).on("mouseup", "#lnsettingsbox .lnurl_p .switchpanel.custom", function() {
        const lnli = lndli(),
            ln_dat = lnli.data(),
            nodelist = ln_dat.services;
        if (empty_obj(nodelist)) {
            playsound(glob_const.funk);
            return
        }
        const this_switch = $(this),
            this_li = this_switch.closest(".noln_ref"),
            this_id = this_li.data("id"),
            current_node = fetch_node(nodelist, this_id);
        if (!current_node) {
            popnotify("error", translate("nodenotfound"));
            return
        }
        const lnd_proxy_list = ln_dat.proxies,
            this_pid = this_li.data("pid"),
            current_proxy = fetch_proxy(lnd_proxy_list, this_pid),
            select_proxy = current_proxy ? current_proxy.proxy : (ln_dat.selected_proxy ? ln_dat.selected_proxy.proxy : d_proxy()),
            p_arr = lnurl_deform(select_proxy),
            set_proxy_val = p_arr.url,
            pw = p_arr.k;
        let p_text = "";
        if (!set_proxy_val) {
            popnotify("error", translate("proxynotfound"));
            return
        }
        const filtered_nodelist = fetch_other_nodes(nodelist, this_id);
        if (this_switch.hasClass("true")) {
            const result = confirm(translate("disableproxy", {
                "set_proxy_val": set_proxy_val
            }));
            if (result === true) {
                current_node.proxy = false;
                this_switch.removeClass("true").addClass("false");
                p_text = "false";
            } else {
                return
            }
        } else {
            const result = confirm(translate("enableproxy", {
                "set_proxy_val": set_proxy_val
            }));
            if (result === true) {
                current_node.proxy = true;
                this_switch.removeClass("false").addClass("true");
                p_text = set_proxy_val;
            } else {
                return
            }
        }
        test_pconnect(current_node, set_proxy_val, pw);
        filtered_nodelist.push(current_node);
        lnli.data({
            "selected_service": current_node,
            "services": filtered_nodelist
        });
        save_cc_settings("bitcoin", true);
        const inline_pval = this_li.find(".inline_pval");
        inline_pval.text(p_text);
        cancelpd();
    })
}

// Tests the connection to a Lightning Network node
function test_pconnect(value, proxy, pw) {
    if (value.lnurl || value.proxy) {
        node_option_li(value, null, "test_connect", proxy, pw);
    } else {
        const imp = value.imp;
        if (imp == "lnd") {
            test_lnd_option_li(value, null, "test_connect");
        } else if (imp == "eclair") {
            test_eclair_option_li(value, null, "test_connect");
        } else if (imp == "lnbits") {
            test_lnbits_option_li(value, null, "test_connect");
        } else {}
    }
}

// Handles the selection of a Lightning Network node from the list
function lnd_select_node() {
    $(document).on("click", "#ln_nodelist .optionwrap", function() {
        const thisnode = $(this);
        if (thisnode.hasClass("offline")) {
            playsound(glob_const.funk);
        }
        $("#ln_nodelist .optionwrap").not(thisnode).removeClass("show");
        thisnode.addClass("show");
        const node_id = thisnode.data("node_id"),
            allrefs = $("#lnsettingsbox #ad_info_wrap .noln_ref"),
            refs = $("#lnsettingsbox #ad_info_wrap .noln_ref[data-id='" + node_id + "']");
        allrefs.hide();
        refs.show().find(".infodrawer").slideDown(300);
    })
}

// Handles the selection of a Lightning Network proxy from the list
function lnd_select_proxy() {
    $(document).on("click", "#lnd_proxy_select_input .optionwrap", function() {
        const thisnode = $(this);
        if (thisnode.hasClass("offline")) {
            playsound(glob_const.funk);
            return
        }
        $("#lnd_proxy_select_input > input").attr("data-pid", thisnode.data("pid"));
        $("#lnd_proxy_select_input .optionwrap").not(thisnode).removeClass("show");
        thisnode.addClass("show");
    })
}

// Manages the selection of Lightning Network implementation
function lnd_select_implementation() {
    $(document).on("click", "#implements .imp_select", function(e) {
        const thisnode = $(this),
            this_data = lndli().data(),
            lnd_proxy_list = this_data.proxies,
            has_proxies = !empty_obj(lnd_proxy_list),
            imp = thisnode.attr("data-value"),
            cs_boxes = $("#lnd_credentials .lndcd"),
            cd_box_select = $("#lnd_credentials .cs_" + imp),
            proxy_switch = $("#lnsettingsbox #lnurl_s .switchpanel.custom"),
            hasproxy = proxy_switch.hasClass("true");
        /*if (imp == "lnd" || imp == "eclair" || imp == "c-lightning") {
            if (hasproxy === false || has_proxies === false) {
                popnotify("error", imp + " requires a proxy server");
                $("#add_proxy_drawer").slideDown(200);
                //$("#lnd_proxy_url_input").focus();
                cs_boxes.hide();
                return
            }
        }*/
        $("#add_proxy_drawer").slideUp(200);
        $("#lnd_proxy_url_input").blur();
        cs_boxes.not(cd_box_select).hide();
        cd_box_select.show();
    })
}

// Toggles the visibility of invoice details
function toggle_invoices() {
    $(document).on("click", "#lnsettingsbox .invoice_memo", function() {
        const drawer = $(this).next(".invoice_body");
        drawer.slideToggle(200);
        $(".invoice_body").not(drawer).slideUp(200);
    })
}

// Main function to handle Lightning Network settings and actions
function trigger_ln() {
    const lnli = lndli(),
        ln_dat = lnli.data();
    let cp_dat = ln_dat.selected_proxy,
        imp;
    const lnd_proxy_list = ln_dat.proxies,
        lnd_pu_input = $("#lnd_proxy_url_input"),
        lnd_sb_input = $("#lnd_proxy_select_input > input"),
        lndpu_val = lnd_pu_input.val(),
        lndsb_val = lnd_sb_input.val(),
        p_arr = cp_dat ? lnurl_deform(cp_dat.proxy) : false,
        current_proxy = p_arr ? p_arr.url : false,
        no_change = cp_dat && current_proxy == lndsb_val;
    if (no_change || !cp_dat) {} else {
        const pid_select = lnd_sb_input.attr("data-pid"),
            get_proxy = fetch_proxy(lnd_proxy_list, pid_select);
        if (get_proxy) {
            lnli.data({
                "selected_proxy": get_proxy
            });
            cp_dat = get_proxy;
            save_cc_settings("bitcoin", true);
        } else {
            notify(translate("proxynotfound"));
        }
    }
    if ($("#lnurl_proxy_drawer").is(":visible")) {
        if (lndpu_val.length < 10) {
            topnotify(translate("enterserver"));
            lnd_pu_input.val("").focus();
            playsound(glob_const.funk);
            return
        }
        const fixed_url = complete_url(lndpu_val),
            is_default = $.inArray(fixed_url, glob_const.proxy_list) !== -1;
        if (is_default) {
            popnotify("error", translate("defaultproxy", {
                "fixed_url": fixed_url
            }));
            return
        }
        const proxy_id = sha_sub(fixed_url, 6),
            proxie_exists = fetch_proxy(lnd_proxy_list, proxy_id);
        if (proxie_exists) {
            topnotify(translate("proxyexists"));
            $("#lnd_proxy_url_input").focus();
            playsound(glob_const.funk);
            return
        }
        if (fixed_url.indexOf("http") < 0) {
            topnotify(translate("invalidurl"));
            $("#lnd_proxy_url_input").focus();
            playsound(glob_const.funk);
            return
        }
        const p_key = $("#proxy_pw_input").val(),
            pwsha = p_key ? sha_sub(p_key, 10) : false;
        test_lnd_proxy(fixed_url, proxy_id, pwsha);
        if (no_change || !cp_dat) {} else {
            notify(translate("datasaved"));
        }
        return
    }
    if ($("#adln_drawer").is(":visible")) {
        const lnd_select = $("#lnd_select_input"),
            lnd_imp = lnd_select.data();
        imp = lnd_imp.value;
        if (!imp) {
            popnotify("error", translate("selectimplementation"));
            lnd_select.focus();
            return
        }
        const proxy_switch = $("#lnurl_s .switchpanel"),
            use_lnurl = proxy_switch.hasClass("true");
        if (use_lnurl && cp_dat) {
            test_create_invoice(imp, cp_dat, null, null);
            return
        }
        const lndcd = $("#lnd_credentials");
        if (lndcd.is(":visible")) {
            /*if (imp == "lnd" || imp == "eclair" || imp == "c-lightning") {
                popnotify("error", imp + " requires a proxy server");
                return
            }*/
            const lnd_host_input = $("#lnd_credentials .cs_" + imp + ":visible .lnd_host"),
                lnd_key_input = $("#lnd_credentials .cs_" + imp + ":visible .invoice_macaroon"),
                lnd_host_val = lnd_host_input.val(),
                lnd_key_v = lnd_key_input.val(),
                host_length = lnd_host_val ? lnd_host_val.length : -1;
            if (host_length < 10) {
                popnotify("error", translate("selectlnhost", {
                    "imp": imp
                }));
                lnd_host_input.focus();
                return
            }
            const lnd_key_val = b64urldecode(lnd_key_v);
            if (lnd_key_val) {
                const key_length = lnd_key_val.length;
                if (key_length < 5) {
                    const key_name = (imp == "lnbits") ? "API key" : (imp == "eclair") ? "Password" : "Invoice Macaroon",
                        impkeyname = imp + " " + key_name;
                    popnotify("error", translate("selectkeyname", {
                        "impkeyname": impkeyname
                    }));
                    lnd_key_input.focus();
                    return
                }
                if (key_length > 300) { // invoice macaroons should be less then 300 characters
                    popnotify("error", translate("entermacaroon"));
                    return
                }
                test_create_invoice(imp, cp_dat, lnd_host_val, lnd_key_val);
            } else {
                popnotify("error", translate("invalidkeyformat"));
            }
            return
        }
        lndcd.slideDown(200);
        proxy_switch.removeClass("true").addClass("false");
    } else {
        const thisval = $("#ln_nodeselect").data();
        if (thisval) {
            if (thisval.live == "connection") {
                const nodelist = ln_dat.services;
                if (empty_obj(nodelist)) {
                    canceldialog();
                    return
                }
                const selected_service = fetch_node(nodelist, thisval.value),
                    current_id = $("#select_ln_node").data("nodeid");
                if (!selected_service || (current_id == selected_service.node_id)) {
                    canceldialog();
                    return
                }
                lnli.data({
                    "selected": true,
                    "selected_service": selected_service
                }).find(".switchpanel").removeClass("false").addClass("true");
                canceldialog();
                notify(translate("datasaved"));
                save_cc_settings("bitcoin", true);
                cancelpd();
                return
            }
            if (thisval.live == "lock") {
                notify(translate("proxylocked"));
                playsound(glob_const.funk);
                return
            }
            if (empty_obj(thisval)) {
                canceldialog();
                return
            }
            const spanel = $("#lnsettingsbox #ad_info_wrap .noln_ref:visible .switchpanel"),
                switch_val = spanel.hasClass("true"),
                proxy_message = switch_val ? "disabling" : "enabling";
            notify(translate("proxyoffline", {
                "proxy_message": proxy_message
            }));
            playsound(glob_const.funk);
        }
    }
}

// Tests the connection to a Lightning Network proxy and adds it if successful
function test_lnd_proxy(value, pid, pw) { // make test api call
    loader(true);
    loadertext(translate("connecttolnur", {
        "url": value
    }));
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": value + "proxy/v1/ln/api/",
        "data": {
            "add": true,
            "x-api": pw
        }
    }).done(function(e) {
        closeloader();
        const api_result = br_result(e),
            result = api_result.result,
            error = result.error;
        if (error) {
            const default_error = translate("unabletoconnect"),
                message = error ? (error.message ? error.message : (typeof error === "string" ? error : default_error)) : default_error,
                msg = message === "no write acces" ? translate("folderpermissions") : message,
                code = error.code;
            popnotify("error", msg);
            if (code && (code === 1 || code === 2)) {
                $("#proxy_pw_input").slideDown(200, function() {
                    $(this).focus();
                })
            }
            return
        }
        if (result.add) {
            const lnli = lndli(),
                lnlidat = lnli.data(),
                this_proxy_list = lnlidat.proxies,
                p_obj = {
                    "proxy": lnurl_form(value, pw),
                    "id": pid
                };
            this_proxy_list.push(p_obj);
            lnli.data({
                "proxies": this_proxy_list,
                "selected_proxy": p_obj
            });
            save_cc_settings("bitcoin", true);
            notify(translate("proxyadded"));
            $("#dialogbody").slideUp(300, function() {
                lm_function(true);
            });
            add_custom_proxy(value);
            return
        }
        popnotify("error", translate("unabletoconnectto", {
            "value": value
        }));
    }).fail(function(xhr, stat, err) {
        closeloader();
        popnotify("error", translate("unabletoconnect"));
    });
}

// Adds a custom proxy to the list of available proxies
function add_custom_proxy(value) {
    const proxy_node = $("#api_proxy"),
        proxy_node_data = proxy_node.data(),
        custom_proxies = proxy_node_data.custom_proxies;
    if (custom_proxies.includes(value) || glob_const.proxy_list.includes(value)) {
        return false;
    }
    custom_proxies.push(value);
    set_setting("api_proxy", {
        "custom_proxies": custom_proxies
    });
    savesettings();
}

// Tests the creation of an invoice for a Lightning Network implementation
function test_create_invoice(imp, proxydat, host, key) {
    const is_onion = host && host.indexOf(".onion") > 0,
        p_arr = proxydat ? lnurl_deform(proxydat.proxy) : false,
        proxy = p_arr ? p_arr.url : (is_onion ? d_proxy() : false),
        pw = p_arr ? p_arr.k : false,
        lnli = lndli(),
        ln_dat = lnli.data(),
        nodelist = ln_dat.services,
        nid_src = host ? (imp == "lnbits" ? key : host) : proxy + imp,
        node_id = sha_sub(nid_src, 10),
        n_exists = node_exists(nodelist, node_id),
        default_error = translate("unabletoconnect"),
        pid = sha_sub(now(), 10);
    if (n_exists) {
        popnotify("error", translate("proxynameexists", {
            "imp": imp
        }));
        return
    }
    if (proxy) {
        loader(true);
        loadertext(translate("connecttolnur", {
            "url": proxy
        }));
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy + "proxy/v1/ln/api/",
            "data": {
                "imp": imp,
                "host": host,
                "key": key,
                "fn": "ln-create-invoice",
                "amount": 10000,
                "memo": "test invoice " + imp,
                "id": pid,
                "expiry": 180,
                "pingtest": true,
                "x-api": pw
            }
        }).done(function(e) {
            closeloader();
            if (e) {
                const error = e.error;
                if (error) {
                    const message = error.message ? error.message : (typeof error == "string" ? error : default_error),
                        code = error.code;
                    popnotify("error", message);
                    if (code && (code == 1 || code == 2)) {
                        setTimeout(function() {
                            p_promt(proxydat.id);
                        }, 500);
                    }
                    return
                }
                if (e.bolt11) {
                    const ptype = e.type,
                        lnurl = ptype == "lnurl";
                    add_ln_imp(nodelist, node_id, imp, proxydat, host, key, lnurl);
                    return
                }
                popnotify("error", default_error);
                return
            }
            popnotify("error", default_error);
            return
        }).fail(function(xhr, stat, err) {
            closeloader();
            popnotify("error", default_error);
        });
        return
    }
    const api_call_params = {
        "lnd": {
            "api_url": host + "/v1/invoices",
            "data": JSON.stringify({
                "value": 10000,
                "memo": "test invoice LND direct",
                "expiry": 180
            }),
            "headers": {
                "Grpc-Metadata-macaroon": key
            },
            "successKey": "r_hash"
        },
        "c-lightning": {
            "api_url": host + "/v1/invoice/genInvoice",
            "data": JSON.stringify({
                "amount": 10000,
                "description": "test invoice c-lightning direct",
                "label": pid,
                "expiry": 180
            }),
            "headers": {
                "contentType": "application/json",
                "macaroon": key,
                "encodingtype": "hex"
            },
            "successKey": "payment_hash"
        },
        "eclair": {
            "api_url": host + "/createinvoice",
            "data": $.param({
                "amount": 10000,
                "description": "test invoice Eclair direct",
                "memo": "test invoice Eclair direct",
                "expireIn": 180
            }),
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(":" + key)
            },
            "successKey": "paymentHash"
        },
        "lnbits": {
            "api_url": host + "/api/v1/payments",
            "data": JSON.stringify({
                "out": false,
                "amount": 10000,
                "memo": "test invoice LNbits direct",
                "expiry": 180
            }),
            "headers": {
                "X-Api-Key": key
            },
            "successKey": "payment_hash"
        }
    };

    if (api_call_params[imp]) {
        const params = api_call_params[imp];
        api_proxy({
            "proxy": false,
            "api_url": params.api_url,
            "params": {
                "method": "POST",
                "cache": false,
                "contentType": "application/json",
                "data": params.data,
                "headers": params.headers
            }
        }).done(function(e) {
            closeloader();
            if (e) {
                const error = e.error;
                if (error) {
                    const message = error.message ? error.message : (typeof error == "string" ? error : default_error);
                    popnotify("error", message);
                    return;
                }
                const connected = e[params.successKey];
                if (connected) {
                    add_ln_imp(nodelist, node_id, imp, false, host, key, false);
                    return;
                }
                popnotify("error", default_error);
            }
        }).fail(function(xhr, stat, err) {
            closeloader();
            popnotify("error", default_error);
        });
    }
}

// Adds a new Lightning Network implementation to the node list
function add_ln_imp(nodelist, node_id, imp, proxydat, host, key, lnurl) {
    const has_proxy = (proxydat) ? true : false,
        p_arr = has_proxy ? lnurl_deform(proxydat.proxy) : false,
        proxy = has_proxy ? p_arr.url : false,
        proxy_id = has_proxy ? proxydat.id : false,
        name = host || proxy,
        lnli = lndli(),
        new_service = {
            "imp": imp,
            "node_id": node_id,
            "host": host,
            "key": key,
            "name": name,
            "proxy_id": proxy_id,
            "proxy": has_proxy,
            "lnurl": lnurl
        };
    nodelist.push(new_service);
    const newdat = {
        "selected": true,
        "selected_service": new_service,
        "services": nodelist
    };
    lnli.data(newdat).find(".switchpanel").removeClass("false").addClass("true");
    save_cc_settings("bitcoin", true);
    const currency = "bitcoin",
        pobox = get_addresslist(currency).children("li");
    if (!pobox.length) {
        if (glob_const.body.hasClass("showstartpage")) {
            const acountname = $("#eninput").val();
            $("#accountsettings").data("selected", acountname).find("p").text(acountname);
            savesettings();
            openpage("?p=home", "home", "loadpage");
            glob_const.body.removeClass("showstartpage");
        }
        const ad = {
            "currency": currency,
            "ccsymbol": "btc",
            "cmcid": 1,
            "erc20": false,
            "checked": true,
            "address": "lnurl", // dummy address for lightning
            "label": "Lightning node",
            "a_id": "btc1",
            "vk": false
        };
        appendaddress(currency, ad);
        saveaddresses(currency, true);
        currency_check(currency);
    }
    notify(translate("datasaved"));
    $("#dialogbody").slideUp(300, function() {
        lm_function(true);
    })
    cancelpd();
}

// Removes an RPC proxy from the list
function remove_rpc_proxy() {
    $(document).on("click", "#lnd_proxy_select_input .options .opt_icon_box .icon-bin", function() {
        const thisnode = $(this),
            thisoption = thisnode.closest(".optionwrap"),
            thisval = thisoption.data(),
            result = confirm(translate("confirmremovenode", {
                "thisval": thisval.value
            }));
        if (result === true) {
            const lnli = lndli(),
                ln_dat = lnli.data(),
                pid = thisval.pid,
                hosted_nodes = ln_dat.services.find(value => value.proxy_id === pid);
            if (hosted_nodes) {
                popnotify("error", translate("proxyinuse", {
                    "imp": hosted_nodes.imp,
                    "name": hosted_nodes.name
                }));
                return
            }
            const proxylist = ln_dat.proxies,
                selected_proxy = ln_dat.selected_proxy,
                new_array = fetch_other_proxies(proxylist, pid),
                empty_arr = empty_obj(new_array),
                proxy_array = empty_arr ? [] : new_array,
                select_proxy = empty_arr ? false : (selected_proxy.id === pid) ? new_array[0] : selected_proxy;
            lnli.data({
                "selected_proxy": select_proxy,
                "proxies": proxy_array
            });
            if (empty_arr) {
                thisnode.closest(".selectbox").slideUp(500, function() {
                    lm_function(true);
                });
                cancelpd();
            } else {
                $("#lnd_proxy_select_input > input").val(lnurl_deform(select_proxy.proxy).url).attr("data-pid", select_proxy.id);
                thisoption.slideUp(500, function() {
                    thisnode.remove();
                });
            }
            save_cc_settings("bitcoin", true);
            notify(translate("proxyremoved"));
            cancelpd();
        }
    })
}

// Removes a Lightning Network node from the list
function remove_lnd() {
    $(document).on("click", "#select_ln_node .options .opt_icon_box .icon-bin", function() {
        const thisnode = $(this),
            thisoption = thisnode.closest(".optionwrap"),
            thisval = thisoption.data(),
            result = confirm(translate("confirmremovenode", {
                "thisval": thisval.name
            }));
        if (result === true) {
            const lnli = lndli(),
                ln_dat = lnli.data(),
                services = ln_dat.services,
                new_array = fetch_other_nodes(services, thisval.node_id),
                empty_arr = empty_obj(new_array);
            thisoption.slideUp(500, function() {
                $(this).remove();
            });
            const services_array = empty_arr ? [] : new_array,
                select_service = empty_arr ? false : new_array[0],
                selected = !empty_arr;
            lnli.data({
                "selected_service": select_service,
                "selected": selected,
                "services": services_array
            });
            if (empty_arr) {
                lnli.find(".switchpanel").removeClass("true").addClass("false");
                thisnode.closest(".selectbox").slideUp(500);
                $("#lnsettingsbox .popform").addClass("noln");
                save_cc_settings("bitcoin", true);
                canceldialog();
            } else {
                save_cc_settings("bitcoin", true);
                $("#ln_nodeselect").val(select_service.host);
                $("#dialogbody").slideUp(300, function() {
                    lm_function(true);
                });
            }
            notify(translate("serviceremoved"));
            cancelpd();
        }
    })
}

// Initiates the unlock process for a proxy from the proxy select input
function unlock_proxy1() {
    $(document).on("click", "#lnd_proxy_select_input .options .opt_icon_box .icon-lock", function() {
        const thisoption = $(this).closest(".optionwrap");
        p_promt(thisoption.data("pid"));
    })
}

// Initiates the unlock process for a proxy from the Lightning Network node select
function unlock_proxy2() {
    $(document).on("click", "#select_ln_node .options .opt_icon_box .icon-lock", function() {
        const thisoption = $(this).closest(".optionwrap");
        p_promt(thisoption.data("proxy_id"));
    })
}

// Initiates the unlock process for a proxy from the info section
function unlock_proxy3() {
    $(document).on("click", "#lnsettingsbox #pw_unlock_info", function() {
        const pid = $(this).attr("data-pid");
        p_promt(pid);
    })
}

// Initiates the unlock process for a proxy from the invoices section
function unlock_proxy4() {
    $(document).on("click", "#lnsettingsbox #pw_unlock_invoices", function() {
        const pid = $(this).attr("data-pid");
        p_promt(pid);
    })
}

// Prompts for a password to unlock a proxy and tests the connection
function p_promt(pid) {
    const lnli = lndli(),
        ln_dat = lnli.data(),
        proxylist = ln_dat.proxies,
        this_proxy = fetch_proxy(proxylist, pid);
    if (empty_obj(this_proxy)) {
        popnotify("error", translate("unknownproxy"));
        return
    }
    const p_arr = lnurl_deform(this_proxy.proxy),
        proxy = p_arr.url,
        password = prompt(translate("enterlnapikey", {
            "proxy": proxy
        })),
        pwsha = password ? sha_sub(password, 10) : false;
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy + "proxy/v1/ln/api/",
        "data": {
            "pingpw": true,
            "x-api": pwsha
        }
    }).done(function(e) {
        const api_result = br_result(e),
            result = api_result.result,
            error = result.error;
        if (error) {
            const default_error = translate("unabletoconnect"),
                message = error ? (error.message ? error.message : (typeof error === "string" ? error : default_error)) : default_error;
            popnotify("error", message);
            return
        }
        if (result == "pong") {
            const other_proxies = fetch_other_proxies(proxylist, pid),
                p_obj = {
                    "proxy": lnurl_form(proxy, pwsha),
                    "id": pid
                };
            const op = br_dobj(other_proxies),
                selected_proxy = ln_dat.selected_proxy,
                selected_id = selected_proxy.id;
            op.push(p_obj);
            const is_current = selected_id === pid;
            lnli.data("proxies", op);
            if (is_current) {
                lnli.data("selected_proxy", p_obj);
            }
            save_cc_settings("bitcoin", true);
            notify(translate("proxyunlocked"));
            $("#dialogbody").slideUp(300, function() {
                lm_function(true);
            });
            return
        }
        popnotify("error", translate("unabletoconnectto", {
            "value": proxy
        }));
    }).fail(function(xhr, stat, err) {
        popnotify("error", translate("unabletoconnect"));
    });
}

/* helpers */

// Returns the Lightning Network settings node
function lndli() {
    return cs_node("bitcoin", "Lightning network");
}

// Selects and returns a Lightning Network proxy
function lnd_pick_proxy() {
    const saved_proxy = s_lnd_proxy();
    return saved_proxy ? saved_proxy.proxy : d_proxy();
}

// Retrieves the selected Lightning Network proxy
function s_lnd_proxy() {
    const lnli = lndli(),
        ln_dat = lnli.data();
    return ln_dat.selected_proxy || false;
}

// Checks if the given host is a local node
function is_local_node(host) {
    if (!host) return null;
    return host.includes("localhost") || host.includes("127.0.0.1");
}

// Cancels the payment dialog if it's open
function cancelpd() {
    if (is_openrequest() === true) { // update request dialog
        cancelpaymentdialog();
    }
}

// Checks if a node with the given ID exists in the node list
function node_exists(nodelist, node_id) {
    if (empty_obj(nodelist)) {
        return false;
    }
    return nodelist.some(value => value.node_id === node_id);
}

// Fetches a node from the list by its ID
function fetch_node(list, pid) {
    return list.find(value => value.node_id === pid);
}

// Fetches all nodes from the list except the one with the given ID
function fetch_other_nodes(list, pid) {
    return list.filter(value => value.node_id !== pid);
}

// Fetches a proxy from the list by its ID
function fetch_proxy(list, pid) {
    return list.find(value => value.id === pid);
}

// Fetches all proxies from the list except the one with the given ID
function fetch_other_proxies(list, pid) {
    return list.filter(value => value.id !== pid);
}

// Formats a Lightning Network URL with an optional password
function lnurl_form(url, pw) {
    const get = pw ? "#" + pw : "",
        lnurl = url + get;
    return lnurl_encode("lnurl", lnurl);
}

// Decodes a Lightning Network URL
function lnurl_deform(lrl) {
    if (typeof lrl !== "string") {
        console.error("error", "lnurl must be string")
        return false;
    }
    if (lrl.startsWith("lnurl")) {
        const dec = lnurl_decode(lrl).replace(/\0/g, ""),
            arr = dec.split("#");
        return {
            "url": arr[0] || false,
            "k": arr[1] || false
        }
    }
    return {
        "url": lrl,
        "pw": false
    }
}

// Encodes a URL for saving
function lnurl_encode_save(url) {
    return url.startsWith("lnurl") ? url : lnurl_encode("lnurl", complete_url(url));
}

// Encodes a Lightning Network URL
function lnurl_encode(hrp, url) {
    return bech32_encode(hrp, toWords(buffer(url)));
}

// Decodes a Lightning Network URL
function lnurl_decode(lnurl) {
    return utf8Decoder.decode(uint_8Array(fromWords(lnurl_decodeb32(lnurl).data)));
}

// Decodes and cleans a Lightning Network URL
function lnurl_decode_c(lnurl) {
    return clean_str(lnurl_decode(lnurl));
}

/* Tools */

// Generates a template for a dialog box
function template_dialog_temp(ddat) {
    const validated_class = ddat.validated ? " validated" : "",
        dialog_object = [{
            "div": {
                "id": ddat.id,
                "class": "formbox",
                "content": [{
                        "h2": {
                            "class": ddat.icon,
                            "content": ddat.title
                        }
                    },
                    {
                        "div": {
                            "class": "popnotify"
                        }
                    },
                    {
                        "div": {
                            "class": "pfwrap",
                            "content": ddat.elements
                        }
                    }
                ]
            }
        }]
    return render_html(dialog_object);
}

// Tests the status of a Lightning Network URL
function test_lnurl_status(lnd) {
    const imp = lnd.imp || null,
        host = lnd.host || null,
        key = lnd.key || null,
        node_id = lnd.nid || null,
        p_arr = lnurl_deform(lnd.proxy_host),
        proxy_host = p_arr.url,
        pk = p_arr.k,
        proxy_url = proxy_host + "proxy/v1/ln/api/";
    if (!proxy_host) {
        notify(translate("proxydatamissing"));
        return
    }
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy_url,
        "data": {
            "fn": "ln-list-invoices",
            "imp": imp,
            "host": host,
            "key": key,
            "nid": node_id,
            "pingtest": true,
            "x-api": pk
        }
    }).done(function(e) {
        const error = e.error;
        if (error) {
            const default_error = translate("unabletoconnect"),
                message = error ? (error.message ? error.message : (typeof error === "string" ? error : default_error)) : default_error;
            if (request.isrequest) {
                if (helper.lnd_only) {
                    topnotify(message);
                    notify(translate("notmonitored"), 500000, "yes");
                }
            } else {
                notify(message);
                $("#rq_errlog").append("<span class='rq_err'>" + message + "</span>");
            }
        }
        const mdat = e.mdat;
        if (mdat) {
            const connected = mdat.connected;
            if (connected) {
                helper.lnd_status = true;
                if (node_id) {
                    sessionStorage.setItem("lnd_timer_" + node_id, now());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, stat, err) {
        const error_object = xhr || stat || err,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

// Checks the status of a Lightning Network node
function check_lnd_status(lnd) {
    api_proxy({
        "proxy": false,
        "api_url": lnd.host + "/v1/invoices",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "Grpc-Metadata-macaroon": lnd.key
            }
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            if (data.invoices) {
                helper.lnd_status = true;
                if (lnd.nid) {
                    sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, stat, err) {
        const error_object = xhr || stat || err,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

// Checks the status of a c-lightning node
function check_c_lightning_status(lnd) {
    api_proxy({
        "proxy": false,
        "api_url": lnd.host + "/v1/invoice/listInvoices",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "macaroon": lnd.key,
                "encodingtype": "hex"
            }
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            if (data.invoices) {
                helper.lnd_status = true;
                if (lnd.nid) {
                    sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, stat, err) {
        const error_object = xhr || stat || err,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

// Checks the status of an Eclair node
function check_eclair_status(lnd) {
    api_proxy({
        "proxy": false,
        "api_url": lnd.host + "/listinvoices",
        "params": {
            "method": "POST",
            "cache": false,
            "contentType": "application/x-www-form-urlencoded",
            "data": null,
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + btoa(":" + lnd.key)
            }
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            if (data.error) {
                const error_data = get_api_error_data(data.error);
                proceed_pf(error_data);
                return
            }
            helper.lnd_status = true;
            if (lnd.nid) {
                sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
            }
        }
        proceed_pf();
    }).fail(function(xhr, stat, err) {
        const error_object = xhr || stat || err,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

// Checks the status of an LNbits node
function check_lnbits_status(lnd) {
    api_proxy({
        "proxy": false,
        "api_url": lnd.host + "/api/v1/wallet",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "X-Api-Key": lnd.key
            }
        }
    }).done(function(e) {
        const data = br_result(e).result;
        if (data) {
            if (data.balance > -1) {
                helper.lnd_status = true;
                if (lnd.nid) {
                    sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, stat, err) {
        const error_object = xhr || stat || err,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

// Sets the Lightning Network fields for LND or c-lightning implementations
function set_ln_fields(imp, rest, mac) {
    if (imp && rest && mac) {
        if (imp === "lnd" || imp === "c-lightning") {
            const lnd_host_input = $("#lnd_credentials .cs_" + imp + " .lnd_host"),
                lnd_key_input = $("#lnd_credentials .cs_" + imp + " .invoice_macaroon");
            if (lnd_host_input.length && lnd_key_input.length) {
                lnd_host_input.val(rest);
                lnd_key_input.val(mac);
                return true;
            }
        }
    }
    return false;
}