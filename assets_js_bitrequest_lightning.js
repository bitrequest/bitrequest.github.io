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
});

function lightning_management() {
    $(document).on("click", ".cc_settinglist li[data-id='Lightning network'] .atext", function() {
        lm_function();
    })
}

function lnd_cc_switch() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Lightning network'] .switchpanel.custom", function() {
        let this_switch = $(this),
            lnli = lndli();
        if (this_switch.hasClass("true")) {
            let result = confirm("Disable lightning payments?");
            if (result === true) {
                lnli.data("selected", false);
                this_switch.removeClass("true").addClass("false");
                save_cc_settings("bitcoin", true);
            }
        } else {
            let selected = lnli.data("selected_service");
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

function lm_function(replace) {
    let this_data = lndli().data();
    if (this_data) {
        let node_list = this_data.services,
            has_nodes = ($.isEmptyObject(node_list)) ? false : true,
            lnd_proxy_list = this_data.proxies,
            has_proxies = ($.isEmptyObject(lnd_proxy_list)) ? false : true,
            node_title = (has_nodes) ? "lightning node" : "Add lightning node",
            current_node = this_data.selected_service,
            current_proxy = this_data.selected_proxy,
            has_proxy = (current_proxy) ? true : false,
            p_arr = (has_proxy) ? lnurl_deform(current_proxy.proxy) : false,
            cp_format = (p_arr) ? p_arr.url : "",
            cp_id = (current_proxy) ? current_proxy.id : false,
            p_class = (has_proxies) ? " haslnurls" : "",
            n_class = (has_nodes) ? "" : " noln",
            camclass = (hascam) ? "" : " nocam",
            node_name = (current_node) ? current_node.name : "",
            c_node_id = (current_node) ? current_node.node_id : "",
            proxy_select = (has_proxy) ? "<div class='selectbox' id='lnd_proxy_select_input'>\
            <input type='text' value='" + cp_format + "' data-pid='" + cp_id + "' placeholder='https://...' readonly='readonly'/>\
                <div class='selectarrows icon-menu2' data-pe='none'></div>\
                <div class='options'></div>\
            </div><div id='add_proxy'><span class='ref'>Add RPC proxy</span></div>" : "",
            ln_markup = "\
            <div class='popform" + n_class + p_class + camclass + "'>\
                <div id='select_ln_node' class='selectbox' data-nodeid='" + c_node_id + "'>\
                    <input type='text' value='" + node_name + "' placeholder='Select lightning node' readonly='readonly' id='ln_nodeselect'/>\
                    <div class='selectarrows icon-menu2' data-pe='none'></div>\
                    <div id='ln_nodelist' class='options'></div>\
                </div>\
                <div id='ad_info_wrap'>\
                    <ul>\
                        <li><div class='d_trigger' id='add_lndnode_trigger'><span class='ref'><span class='icon-power'></span>Add node</span></div>\
                            <div class='drawer2' id='adln_drawer'>\
                                <div class='selectbox'>\
                                    <input type='text' value='' placeholder='Implementation' id='lnd_select_input' readonly='readonly'/>\
                                    <div class='selectarrows icon-menu2' data-pe='none'></div>\
                                    <div class='options' id='implements'>\
                                        <span data-value='lnd' class='imp_select'><img src='" + c_icons("lnd") + "' class='lnd_icon'> LND</span>\
                                        <span data-value='eclair' class='imp_select'><img src='" + c_icons("eclair") + "' class='lnd_icon'> Eclair</span>\
                                        <span data-value='c-lightning' class='imp_select'><img src='" + c_icons("c-lightning") + "' class='lnd_icon'> c-lightning </span>\
                                        <span data-value='lnbits' class='imp_select'><img src='" + c_icons("lnbits") + "' class='lnd_icon'> LNbits</span>\
                                    </div>\
                                </div>\
                                <div id='lnd_credentials'>\
                                    <div class='lndcd cs_lnd'>\
                                        <div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/><div class='qrscanner' data-currency='lnd' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>\
                                        <div class='inputwrap'><input class='invoice_macaroon (hex)' type='text' value='' placeholder='Invoice macaroon'/><div class='qrscanner' data-currency='lnd' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>\
                                    </div>\
                                    <div class='lndcd cs_eclair'>\
                                        <div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/></div>\
                                        <div class='inputwrap'><input class='invoice_macaroon (hex)' type='text' value='' placeholder='Password'/></div>\
                                    </div>\
                                    <div class='lndcd cs_c-lightning'>\
                                        <div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/><div class='qrscanner' data-currency='c-lightning' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>\
                                        <div class='inputwrap'><input class='invoice_macaroon' type='text' value='' placeholder='Invoice macaroon'/><div class='qrscanner' data-currency='c-lightning' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>\
                                    </div>\
                                    <div class='lndcd cs_lnbits'>\
                                        <div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host'/></div>\
                                        <div class='inputwrap'><input class='invoice_macaroon' type='text' value='' placeholder='Invoice/read key'/></div>\
                                    </div>\
                                </div>\
                                <div class='switch_wrap'>\
                                    <div id='lnurl_s'><span id='toggle_lnd' class='ref'>RPC proxy</span>" + switchpanel(has_proxies, " custom") + "</div>\
                                </div>\
                            </div>\
                        </li>\
                        <li><div class='d_trigger' id='add_proxy_trigger'><span class='ref'><span class='icon-sphere'></span>RPC proxy</span></div>\
                            <div class='drawer2" + p_class + "' id='add_proxy_drawer'>" + proxy_select +
            "<div id='lnurl_proxy_drawer' class='lpd'>\
                                    <p id='lnurls_info'>\
                                        Control your own lightning node and keys:<br/><br/>\
                                        <strong>1.</strong> Host the <a href='https://github.com/bitrequest/bitrequest.github.io/tree/master/proxy' target='blank' class='exit ref'>proxy folder</a> on your webserver.<br/>\
                                        <strong>2.</strong> Enter your lightning node's REST host and keys in 'config.php'.<br/>\
                                        <strong>3.</strong> Enter your server address below.<br/><br/>\
                                    </p>\
                                    <input type='text' value='' placeholder='https://...' id='lnd_proxy_url_input'/>\
                                    <input type='password' value='' placeholder='API key' id='proxy_pw_input'/>\
                                </div>\
                            </div>\
                        </li>\
                    <ul>\
                </div>\
            </div>",
            content = template_dialog_temp({
                "id": "lnsettingsbox",
                "icon": "icon-power",
                "title": node_title,
                "elements": ln_markup
            }),
            trigger = (replace) ? null : "trigger_ln";
        popdialog(content, trigger, null, null, replace);
        if (has_nodes) {
            $.each(node_list, function(key, value) {
                let nselect = (value.node_id == c_node_id),
                    imp = value.imp,
                    lnurl = value.lnurl;
                if (lnurl || value.proxy) {
                    let fetchproxy = (has_proxies) ? fetch_proxy(lnd_proxy_list, value.proxy_id) : false,
                        proxy_dat = (fetchproxy) ? fetchproxy.proxy : (current_proxy) ? current_proxy.proxy : d_proxy(),
                        p_arr = lnurl_deform(proxy_dat),
                        proxy = p_arr.url,
                        pw = p_arr.k;
                    node_option_li(value, nselect, "append", proxy, pw);
                } else {
                    if (imp == "lnd") {
                        test_lnd_option_li(value, nselect, "append");
                    } else if (imp == "c-lightning") {
                        test_c_lightning_option_li(value, nselect, "append");
                    } else if (imp == "eclair") {
                        test_eclair_option_li(value, nselect, "append");
                    } else if (imp == "lnbits") {
                        test_lnbits_option_li(value, nselect, "append");
                    } else {
                        lightning_option_li(false, value, nselect, "append");
                    }
                }
            });
        };
        if (has_proxies) {
            let proxylist = $("#lnsettingsbox #add_proxy_drawer .options");
            $.each(lnd_proxy_list, function(key, value) {
                let current_p = (value.id == cp_id);
                lnd_append_proxy(proxylist, key, value, current_p);
            });
        }
        if (replace) {
            $("#dialogbody").slideDown(300);
        }
    }
}

function node_option_li(value, selected, fn, proxy, pw) {
    loader(true);
    loadertext("connecting to " + proxy);
    let imp = value.imp,
        default_error = "unable to connect",
        locked = null,
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
        let invoices = e.invoices,
            error = e.error;
        if (error) {
            let message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error,
                code = error.code,
                locked = (code && (code == 1 || code == 2)) ? "locked" : null;
            if (fn == "append") {
                lightning_option_li(false, value, selected, locked, proxy);
                popnotify("error", message);
            }
            if (fn == "test_connect") {
                tconnectcb();
                if (selected) {
                    popnotify("error", message);
                }
            }
            return
        }
        let mdat = e.mdat,
            connected = mdat.connected;
        if (fn == "append") {
            if (e && connected) {
                lightning_option_li(true, value, selected, invoices, proxy);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            if (e && connected) {
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        closeloader();
        if (fn == "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            tconnectcb();
        }
        return
    });
}

function test_lnd_option_li(value, selected, fn) {
    let host = value.host,
        proxy = (host.indexOf(".onion") > 0) ? true : false;
    loader(true);
    loadertext("connecting to " + host);
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
        let data = br_result(e).result;
        if (fn == "append") {
            if (data && data.invoices) {
                lightning_option_li(true, value, selected, data.invoices);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            if (data && data.invoices) {
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        closeloader();
        if (fn == "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            tconnectcb();
        }
        return
    });
}

function test_c_lightning_option_li(value, selected, fn) {
    let host = value.host,
        proxy = (host.indexOf(".onion") > 0) ? true : false;
    loader(true);
    loadertext("connecting to " + host);
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
        let data = br_result(e).result;
        if (fn == "append") {
            if (data && data.invoices) {
                lightning_option_li(true, value, selected, data.invoices);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            if (data && data.invoices) {
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        closeloader();
        if (fn == "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            tconnectcb();
        }
        return
    });
}

function test_eclair_option_li(value, selected, fn) {
    let host = value.host,
        proxy = (host.indexOf(".onion") > 0) ? true : false;
    loader(true);
    loadertext("connecting to " + host);
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
        let data = br_result(e).result;
        if (fn == "append") {
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
        if (fn == "test_connect") {
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
    }).fail(function(jqXHR, textStatus, errorThrown) {
        closeloader();
        if (fn == "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            tconnectcb();
        }
        return
    });
}

function test_lnbits_option_li(value, selected, fn) {
    let host = value.host,
        proxy = (host.indexOf(".onion") > 0) ? true : false;
    loader(true);
    loadertext("connecting to " + host);
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
        let data = br_result(e).result;
        if (fn == "append") {
            if (data && data.balance > -1) {
                lightning_option_li(true, value, selected, data.invoices);
                return
            }
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            if (data && data.balance > -1) {
                tconnectcb(true);
                return
            }
            tconnectcb();
        }
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        closeloader();
        if (fn == "append") {
            lightning_option_li(false, value, selected);
            return
        }
        if (fn == "test_connect") {
            tconnectcb();
        }
        return
    });
}

function tconnectcb(add) {
    let pnode = $("#lnsettingsbox .ln_info_wrap:visible");
    if (add) {
        pnode.addClass("live");
        $("#ln_nodeselect").data("live", "connection");
    } else {
        pnode.removeClass("live");
        $("#ln_nodeselect").data("live", "wifi-off");
    }
}

function lightning_option_li(live, value, selected, invoices, proxy) {
    let has_invoices = (invoices && invoices != "locked") ? true : false,
        locked = (invoices && invoices == "locked") ? true : false,
        invoiceslist = "",
        liveclass = (locked) ? " locked" : (live === true) ? " live" : "",
        selected_class = (selected === true) ? " show" : "",
        node_id = value.node_id,
        proxy_id = value.proxy_id,
        imp = value.imp,
        lnurls_bool = (value.lnurl) ? true : false,
        icon = (locked) ? "lock" : (live === true) ? "connection" : "wifi-off",
        name = value.name,
        icon_loc = c_icons(imp),
        lnurl_icon = (lnurls_bool) ? "<div class='opt_icon icon-sphere' data-pe='none'></div>" : "",
        option = $("<div class='optionwrap" + liveclass + selected_class + "' style='display:none' data-pe='none'><span data-value='" + node_id + "' data-live='" + icon + "'><img src='" + icon_loc + "' class='lnd_icon'/> " + name + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon icon-bin' data-pe='none'></div><div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div>" + lnurl_icon + "</div>");
    option.data(value).appendTo($("#ln_nodelist"));
    option.slideDown(500);
    if (has_invoices) {
        $.each(invoices.reverse(), function(key, value) {
            let inv_id = (value.payment_request) ? " " + value.payment_request.slice(0, 16) :
                (value.serialized) ? " " + value.serialized.slice(0, 16) : "",
                inv_title = (value.memo) ? value.memo : (value.description) ? value.description : "invoice" + inv_id,
                timestamp = (value.creation_date) ? value.creation_date : (value.timestamp) ? value.timestamp : false,
                inv_date = (timestamp) ? short_date(parseInt((timestamp) * 1000) + timezone) : "",
                settle_icon = (value.settled === true || value.status == "paid") ? "icon-checkmark" : (value.settled === false || value.status == "expired") ? "icon-clock" : false,
                icon_span = (settle_icon) ? "<span class='" + settle_icon + "'></span>" : "<img src='" + icon_loc + "' class='lnd_icon'>";
            invoiceslist += "<div class='ivli'><div class='invoice_memo clearfix'><div class='iv_title'>" + icon_span + " " + inv_title + "</div><div class='iv_date'>" + inv_date + "</div></div><div class='invoice_body'><pre>" + syntaxHighlight(value) + "</pre></div></div>";
        });
    } else {
        let invoice_msg = (locked) ? "Node proxy locked, unable to fetch invoices.<br/>Please enter your proxy <span id='pw_unlock_invoices' data-pid='" + proxy_id + "' class='ref'>API key</span>." : (live === true) ? "No invoices found." : "Node offline, unable to fetch invoices.",
            invoiceslist = "<p>" + invoice_msg + "</p>";
    }
    let host = value.host,
        proxy_bool = (value.proxy) ? true : false,
        proxy_val = (proxy_bool) ? (proxy) ? proxy : false : false,
        missing_proxy = (lnurls_bool && !proxy_val),
        hideclass = (selected === true) ? " node_selected hide" : " hide",
        lnurls_class = (lnurls_bool) ? " lnurlclass" : "",
        node_name = (missing_proxy) ? "Proxy not found" : (lnurls_bool) ? "hidden by Proxy server" : host,
        lnurl_markup = (lnurls_bool) ? "<strong><img src='" + icon_loc + "' class='lnd_icon' style='opacity:0'/> Proxy server: </strong>" + proxy_val + "</br/>" : "",
        proxy_markup = (lnurls_bool) ? "" : "<strong><img src='" + icon_loc + "' class='lnd_icon' style='opacity:0'/> Proxy: </strong><span class='inline_pval'>" + proxy_val + "</span></br/>",
        info_markup = $("<li class='noln_ref" + hideclass + lnurls_class + "' data-id='" + node_id + "' data-pid='" + proxy_id + "'>\
        <div class='d_trigger'>\
            <span class='ref'><span class='icon-info'></span>Info</span>\
        </div>\
        <div class='drawer2 infodrawer' style='display:block'>\
            <div class='ln_info_wrap clearfix" + liveclass + "'>\
                <div class='lni_dat'>\
                    <img src='" + icon_loc + "' class='lnd_icon'/> <strong>" + imp + " Node: </strong>" + node_name + "<br/>" +
            lnurl_markup + proxy_markup +
            "<strong><img src='" + icon_loc + "' class='lnd_icon' style='opacity:0'/> Status: </strong><span class='online_stat'> Online <span class='icon-connection'></span></span><span class='offline_stat'> Offline <span class='icon-wifi-off'></span></span><span class='locked_stat'> <span id='pw_unlock_info' data-pid='" + proxy_id + "' class='ref'>Locked</span> <span class='icon-lock'></span></span></br/>\
                </div>\
                <div class='lnurl_p'>Proxy" + switchpanel(proxy_bool, " custom") + "</div>\
            </div>\
        </div>\
    </li>"),
        invoice_markup = $("<li class='noln_ref" + hideclass + "' data-id='" + node_id + "'>\
        <div class='d_trigger'>\
            <span class='ref'><span class='icon-files-empty'></span>Invoices</span>\
        </div>\
        <div class='drawer2'>\
            <div class='invoice_list'>" + invoiceslist + "</div>\
        </div>\
    </li>");
    $("#lnsettingsbox #ad_info_wrap > ul").prepend(info_markup, invoice_markup);
    setTimeout(function() {
        $("#ad_info_wrap .node_selected").slideDown(300);
    }, 500);
}

function syntaxHighlight(json) {
    if (typeof json != "string") {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function(match) {
        let cls = "number";
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = "key";
            } else {
                cls = "string";
            }
        } else if (/true|false/.test(match)) {
            cls = "boolean";
        } else if (/null/.test(match)) {
            cls = "null";
        }
        return "<span class='" + cls + "'>" + match + "</span>";
    });
}

function lnd_append_proxy(optionlist, key, value, selected) { // make test api call
    let locked = false,
        p_arr = lnurl_deform(value.proxy),
        proxy = p_arr.url;
    loader(true);
    loadertext("connecting to " + proxy);
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
        let api_result = br_result(e),
            result = api_result.result,
            error = result.error;
        if (error) {
            let code = error.code,
                locked = (code && (code == 1 || code == 2)) ? true : false;
            lnd_proxy_option_li(optionlist, false, key, value, selected, proxy, locked);
            return
        }
        if (result == "pong") {
            lnd_proxy_option_li(optionlist, true, key, value, selected, proxy, locked);
            return
        }
        lnd_proxy_option_li(optionlist, false, key, value, selected, proxy, locked);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        closeloader();
        lnd_proxy_option_li(optionlist, false, key, value, selected, proxy, locked);
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    });
}

function lnd_proxy_option_li(optionlist, live, key, value, selected, proxy_name, locked) {
    let liveclass = (live === true) ? " live" : " offline",
        icon = (locked) ? "lock" : (live === true) ? "connection" : "wifi-off",
        selected_class = (selected === true) ? " show" : "",
        option = $("<div class='optionwrap" + liveclass + selected_class + "' style='display:none' data-pe='none' data-value='" + proxy_name + "' data-pid='" + value.id + "'><span data-pe='none'>" + proxy_name + "</span><div class='opt_icon_box' data-pe='none'><div class='opt_icon c_stat icon-" + icon + "' data-pe='none'></div><div class='opt_icon icon-bin' data-pe='none'></div></div>");
    optionlist.append(option);
    option.slideDown(500);
}

function toggle_ln_proxy() {
    $(document).on("click", "#lnsettingsbox #toggle_lnd", function() {
        let lpd = $("#add_proxy_drawer");
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

function proxy_switch() {
    $(document).on("mouseup", "#lnsettingsbox #lnurl_s .switchpanel.custom", function() {
        let this_switch = $(this),
            lpd = $("#add_proxy_drawer"),
            ldc = $("#lnd_credentials"),
            lpd_input = $("#lnd_proxy_url_input"),
            lnd_imp_input = $("#lnd_select_input"),
            imp = lnd_imp_input.data("value");
        if (this_switch.hasClass("true")) {
            ldc.slideDown(200);
            this_switch.removeClass("true").addClass("false");
        } else {
            ldc.slideUp(200);
            this_switch.removeClass("false").addClass("true");
        }
        if (lpd.hasClass("haslnurls")) {
            return
        }
        if (lpd.is(":visible")) {
            lpd.slideUp(200);
        } else {
            lpd.slideDown(200);
            lpd_input.focus();
        }
    })
}

function toggle_add_proxy() {
    $(document).on("click", "#lnsettingsbox #add_proxy .ref", function() {
        let lupd = $("#lnurl_proxy_drawer");
        if (lupd.is(":visible")) {
            lupd.slideUp(200);
        } else {
            lupd.slideDown(200);
        }
    })
}

function lnd_proxy_switch() {
    $(document).on("mouseup", "#lnsettingsbox .lnurl_p .switchpanel.custom", function() {
        let lnli = lndli(),
            ln_dat = lnli.data(),
            nodelist = ln_dat.services;
        if ($.isEmptyObject(nodelist)) {
            playsound(funk)
            return
        }
        let this_switch = $(this),
            this_li = this_switch.closest(".noln_ref"),
            this_id = this_li.data("id"),
            current_node = fetch_node(nodelist, this_id);
        if (!current_node) {
            popnotify("error", "Node not found");
            return
        }
        let lnd_proxy_list = ln_dat.proxies,
            this_pid = this_li.data("pid"),
            current_proxy = fetch_proxy(lnd_proxy_list, this_pid),
            select_proxy = (current_proxy) ? current_proxy.proxy : (ln_dat.selected_proxy) ? ln_dat.selected_proxy.proxy : d_proxy(),
            p_arr = lnurl_deform(select_proxy),
            set_proxy_val = p_arr.url,
            pw = p_arr.k,
            p_text = "";
        if (!set_proxy_val) {
            popnotify("error", "Proxy not found");
            return
        }
        let filtered_nodelist = fetch_other_nodes(nodelist, this_id);
        if (this_switch.hasClass("true")) {
            let result = confirm("Disable proxy " + set_proxy_val + "?");
            if (result === true) {
                current_node.proxy = false;
                this_switch.removeClass("true").addClass("false");
                p_text = "false";
            } else {
                return
            }
        } else {
            let result = confirm("Enable proxy " + set_proxy_val + "?");
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
        let inline_pval = this_li.find(".inline_pval");
        inline_pval.text(p_text);
        cancelpd();
    })
}

function test_pconnect(value, proxy, pw) {
    if (value.lnurl || value.proxy) {
        node_option_li(value, null, "test_connect", proxy, pw);
    } else {
        let imp = value.imp;
        if (imp == "lnd") {
            test_lnd_option_li(value, null, "test_connect");
        } else if (imp == "eclair") {
            test_eclair_option_li(value, null, "test_connect");
        } else if (imp == "lnbits") {
            test_lnbits_option_li(value, null, "test_connect");
        } else {}
    }
}

function lnd_select_node() {
    $(document).on("click", "#ln_nodelist .optionwrap", function() {
        let thisnode = $(this);
        if (thisnode.hasClass("offline")) {
            playsound(funk);
        }
        let alloptions = $("#ln_nodelist .optionwrap");
        alloptions.not(thisnode).removeClass("show");
        thisnode.addClass("show");
        let this_data = thisnode.data(),
            node_id = this_data.node_id,
            allrefs = $("#lnsettingsbox #ad_info_wrap .noln_ref"),
            refs = $("#lnsettingsbox #ad_info_wrap .noln_ref[data-id='" + node_id + "']");
        allrefs.hide();
        refs.show();
        refs.find(".infodrawer").slideDown(300);
    })
}

function lnd_select_proxy() {
    $(document).on("click", "#lnd_proxy_select_input .optionwrap", function() {
        let thisnode = $(this);
        if (thisnode.hasClass("offline")) {
            playsound(funk);
            return
        }
        let this_data = thisnode.data(),
            p_id = this_data.pid,
            alloptions = $("#lnd_proxy_select_input .optionwrap"),
            p_inpt = $("#lnd_proxy_select_input > input");
        p_inpt.attr("data-pid", p_id);
        alloptions.not(thisnode).removeClass("show");
        thisnode.addClass("show");
    })
}

function lnd_select_implementation() {
    $(document).on("click", "#implements .imp_select", function(e) {
        let thisnode = $(this),
            this_data = lndli().data();
        lnd_proxy_list = this_data.proxies,
            has_proxies = ($.isEmptyObject(lnd_proxy_list)) ? false : true,
            imp = thisnode.attr("data-value"),
            cs_boxes = $("#lnd_credentials .lndcd"),
            cd_box_select = $("#lnd_credentials .cs_" + imp),
            proxy_switch = $("#lnsettingsbox #lnurl_s .switchpanel.custom"),
            hasproxy = (proxy_switch.hasClass("true")) ? true : false;
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

function toggle_invoices() {
    $(document).on("click", "#lnsettingsbox .invoice_memo", function() {
        let thistrigger = $(this),
            drawer = thistrigger.next(".invoice_body");
        if (drawer.is(":visible")) {
            drawer.slideUp(200);
        } else {
            drawer.slideDown(200);
            $(".invoice_body").not(drawer).slideUp(200);
        }
    })
}

function trigger_ln() {
    let imp,
        lnli = lndli(),
        ln_dat = lnli.data(),
        cp_dat = ln_dat.selected_proxy,
        lnd_proxy_list = ln_dat.proxies,
        lnd_pu_input = $("#lnd_proxy_url_input"),
        lnd_sb_input = $("#lnd_proxy_select_input > input"),
        lndpu_val = lnd_pu_input.val(),
        lndsb_val = lnd_sb_input.val(),
        p_arr = (cp_dat) ? lnurl_deform(cp_dat.proxy) : false,
        current_proxy = (p_arr) ? p_arr.url : false,
        no_change = (cp_dat && current_proxy == lndsb_val);
    if (no_change || !cp_dat) {} else {
        let pid_select = lnd_sb_input.attr("data-pid"),
            get_proxy = fetch_proxy(lnd_proxy_list, pid_select);
        if (get_proxy) {
            lnli.data({
                "selected_proxy": get_proxy
            });
            let cp_dat = get_proxy;
            save_cc_settings("bitcoin", true);
        } else {
            notify("Proxy not found");
        }
    }
    if ($("#lnurl_proxy_drawer").is(":visible")) {
        if (lndpu_val.length < 10) {
            topnotify("Please enter server address");
            lnd_pu_input.val("").focus();
            playsound(funk);
            return
        }
        let fixed_url = complete_url(lndpu_val),
            is_default = ($.inArray(fixed_url, proxy_list) === -1) ? false : true;
        if (is_default) {
            popnotify("error", fixed_url + " is a default proxy");
            return
        }
        let proxy_id = sha_sub(fixed_url, 6),
            proxie_exists = fetch_proxy(lnd_proxy_list, proxy_id);
        if (proxie_exists) {
            topnotify("Proxy already added");
            $("#lnd_proxy_url_input").focus();
            playsound(funk);
            return
        }
        if (fixed_url.indexOf("http") < 0) {
            topnotify("Invalid url");
            $("#lnd_proxy_url_input").focus();
            playsound(funk);
            return
        }
        let p_key = $("#proxy_pw_input").val(),
            pwsha = (p_key) ? sha_sub(p_key, 10) : false;
        test_lnd_proxy(fixed_url, proxy_id, pwsha);
        if (no_change || !cp_dat) {} else {
            notify("Data saved");
        }
        return
    }
    if ($("#adln_drawer").is(":visible")) {
        let lnd_select = $("#lnd_select_input"),
            lnd_imp = lnd_select.data(),
            imp = lnd_imp.value;
        if (!imp) {
            popnotify("error", "Select implementation");
            lnd_select.focus();
            return
        }
        let proxy_switch = $("#lnurl_s .switchpanel"),
            use_lnurl = (proxy_switch.hasClass("true")) ? true : false;
        if (use_lnurl && cp_dat) {
            test_create_invoice(imp, cp_dat, null, null);
            return
        }
        let lndcd = $("#lnd_credentials");
        if (lndcd.is(":visible")) {
            /*if (imp == "lnd" || imp == "eclair" || imp == "c-lightning") {
                popnotify("error", imp + " requires a proxy server");
                return
            }*/
            let lnd_host_input = $("#lnd_credentials .cs_" + imp + ":visible .lnd_host"),
                lnd_key_input = $("#lnd_credentials .cs_" + imp + ":visible .invoice_macaroon"),
                lnd_host_val = lnd_host_input.val(),
                lnd_key_val = lnd_key_input.val(),
                host_length = (lnd_host_val) ? lnd_host_val.length : -1,
                key_length = (lnd_key_val) ? lnd_key_val.length : -1;
            if (host_length < 10) {
                popnotify("error", "Select " + imp + " Host");
                lnd_host_input.focus();
                return
            }
            if (key_length < 5) {
                let key_name = (imp == "lnbits") ? "API key" : (imp == "eclair") ? "Password" : "Invoice Macaroon";
                popnotify("error", "Select " + imp + " " + key_name);
                lnd_key_input.focus();
                return
            }
            test_create_invoice(imp, cp_dat, lnd_host_val, lnd_key_val);
            return
        }
        lndcd.slideDown(200);
        proxy_switch.removeClass("true").addClass("false");
    } else {
        let thisval = $("#ln_nodeselect").data();
        if (thisval) {
            if (thisval.live == "connection") {
                let nodelist = ln_dat.services;
                if ($.isEmptyObject(nodelist)) {
                    canceldialog();
                    return
                }
                let selected_service = fetch_node(nodelist, thisval.value),
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
                console.log("shift");
                notify("Data saved");
                save_cc_settings("bitcoin", true);
                cancelpd();
                return
            }
            if (thisval.live == "lock") {
                notify("Current node proxy is locked, please enter your API key");
                playsound(funk);
                return
            }
            if ($.isEmptyObject(thisval)) {
                canceldialog();
                return
            }
            let spanel = $("#lnsettingsbox #ad_info_wrap .noln_ref:visible .switchpanel"),
                switch_val = (spanel.hasClass("true")) ? true : false,
                proxy_message = (switch_val) ? "disabling" : "enabling";
            notify("Current node is offline, try " + proxy_message + " proxy");
            playsound(funk);
        }
    }
}

function test_lnd_proxy(value, pid, pw) { // make test api call
    loader(true);
    loadertext("connecting to " + value);
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
        let api_result = br_result(e),
            result = api_result.result,
            error = result.error;
        if (error) {
            let message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error,
                msg = (message == "no write acces") ? "Unable to write to cache, please check your folder permissions." : message,
                code = error.code;
            popnotify("error", msg);
            if (code && (code == 1 || code == 2)) {
                $("#proxy_pw_input").slideDown(200, function() {
                    $(this).focus();
                })
            }
            return
        }
        if (result.add) {
            let lnli = lndli(),
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
            notify("Proxy added");
            $("#dialogbody").slideUp(300, function() {
                lm_function(true);
            });
            add_custom_proxy(value);
            return
        }
        popnotify("error", "Unable to connect to " + value);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        closeloader();
        popnotify("error", "Unable to connect");
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    });
}

function add_custom_proxy(value) {
    let proxy_node = $("#api_proxy"),
        proxy_node_data = proxy_node.data(),
        custom_proxies = proxy_node_data.custom_proxies;
    if ($.inArray(value, custom_proxies) !== -1 || $.inArray(value, proxy_list) !== -1) {
        return false;
    }
    custom_proxies.push(value);
    set_setting("api_proxy", {
        "custom_proxies": custom_proxies
    });
    savesettings();
}

function test_create_invoice(imp, proxydat, host, key) {
    let is_onion = (host && host.indexOf(".onion") > 0) ? true : false,
        p_arr = (proxydat) ? lnurl_deform(proxydat.proxy) : false,
        proxy = (p_arr) ? p_arr.url : (is_onion) ? d_proxy() : false,
        pw = (p_arr) ? p_arr.k : false,
        lnli = lndli(),
        ln_dat = lnli.data(),
        nodelist = ln_dat.services,
        nid_src = (host) ? (imp == "lnbits") ? key : host : proxy + imp,
        node_id = sha_sub(nid_src, 10),
        n_exists = node_exists(nodelist, node_id),
        default_error = "unable to connect",
        pid = sha_sub(now(), 10);
    if (n_exists) {
        popnotify("error", imp + " node already added");
        return
    }
    if (proxy) {
        loader(true);
        loadertext("connecting to " + proxy);
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
                let error = e.error;
                if (error) {
                    let message = (error.message) ? error.message : (typeof error == "string") ? error : default_error,
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
                    let ptype = e.type,
                        lnurl = (ptype == "lnurl") ? true : false;
                    add_ln_imp(nodelist, node_id, imp, proxydat, host, key, lnurl);
                    return
                }
                popnotify("error", default_error);
                return
            }
            popnotify("error", default_error);
            return
        }).fail(function(jqXHR, textStatus, errorThrown) {
            closeloader();
            popnotify("error", default_error);
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
        return
    }
    if (imp == "lnd") {
        api_proxy({
            "proxy": false,
            "api_url": host + "/v1/invoices",
            "params": {
                "method": "POST",
                "cache": false,
                "data": JSON.stringify({
                    "value": 10000,
                    "memo": "test invoice LND direct",
                    "expiry": 180
                }),
                "headers": {
                    "Grpc-Metadata-macaroon": key
                }
            }
        }).done(function(e) {
            closeloader();
            if (e) {
                let error = e.error;
                if (error) {
                    let message = (error.message) ? error.message : (typeof error == "string") ? error : default_error;
                    popnotify("error", message);
                    return
                }
                let connected = e.r_hash;
                if (connected) {
                    add_ln_imp(nodelist, node_id, "lnd", false, host, key, false);
                    return
                }
                popnotify("error", default_error);
                return
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            closeloader();
            popnotify("error", default_error);
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
        return
    }
    if (imp == "c-lightning") {
        api_proxy({
            "proxy": false,
            "api_url": host + "/v1/invoice/genInvoice",
            "params": {
                "method": "POST",
                "cache": false,
                "contentType": "application/json",
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
                }
            }
        }).done(function(e) {
            closeloader();
            if (e) {
                let error = e.error;
                if (error) {
                    let message = (error.message) ? error.message : (typeof error == "string") ? error : default_error;
                    popnotify("error", message);
                    return
                }
                let connected = e.payment_hash;
                if (connected) {
                    add_ln_imp(nodelist, node_id, "c-lightning", false, host, key, false);
                    return
                }
                popnotify("error", default_error);
                return
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            closeloader();
            popnotify("error", default_error);
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
        return
    }
    if (imp == "eclair") {
        api_proxy({
            "proxy": false,
            "api_url": host + "/createinvoice",
            "params": {
                "method": "POST",
                "cache": false,
                "contentType": "application/x-www-form-urlencoded",
                "data": $.param({
                    "amount": 10000,
                    "description": "test invoice Eclair direct",
                    "memo": "test invoice Eclair direct",
                    "expireIn": 180
                }),
                "headers": {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": "Basic " + btoa(":" + key)
                }
            }
        }).done(function(e) {
            closeloader();
            if (e) {
                let error = e.error;
                if (error) {
                    let message = (error.message) ? error.message : (typeof error == "string") ? error : default_error;
                    popnotify("error", message);
                    return
                }
                let connected = e.paymentHash;
                if (connected) {
                    add_ln_imp(nodelist, node_id, "eclair", false, host, key, false);
                    return
                }
                popnotify("error", default_error);
                return
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            closeloader();
            popnotify("error", default_error);
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
        return
    }
    if (imp == "lnbits") {
        api_proxy({
            "api_url": host + "/api/v1/payments",
            "proxy": false,
            "params": {
                "method": "POST",
                "cache": false,
                "contentType": "application/json",
                "data": JSON.stringify({
                    "out": false,
                    "amount": 10000,
                    "memo": "test invoice LNbits direct",
                    "expiry": 180
                }),
                "headers": {
                    "X-Api-Key": key
                }
            }
        }).done(function(e) {
            closeloader();
            if (e) {
                let error = e.error;
                if (error) {
                    let message = (error.message) ? error.message : (typeof error == "string") ? error : default_error;
                    popnotify("error", message);
                    return
                }
                let connected = e.payment_hash;
                if (connected) {
                    add_ln_imp(nodelist, node_id, "lnbits", false, host, key, false);
                    return
                }
                popnotify("error", default_error);
                return
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            closeloader();
            popnotify("error", default_error);
            console.log(jqXHR);
            console.log(textStatus);
            console.log(errorThrown);
        });
        return
    }
}

function add_ln_imp(nodelist, node_id, imp, proxydat, host, key, lnurl) {
    let has_proxy = (proxydat) ? true : false,
        p_arr = (has_proxy) ? lnurl_deform(proxydat.proxy) : false,
        proxy = (has_proxy) ? p_arr.url : false,
        proxy_id = (has_proxy) ? proxydat.id : false,
        name = (host) ? host : proxy,
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
    let newdat = {
        "selected": true,
        "selected_service": new_service,
        "services": nodelist
    };
    lnli.data(newdat).find(".switchpanel").removeClass("false").addClass("true");
    save_cc_settings("bitcoin", true);
    notify("Data saved");
    $("#dialogbody").slideUp(300, function() {
        lm_function(true);
    })
    cancelpd();
    let startpage = (body.hasClass("showstartpage")) ? true : false,
        gets = geturlparameters(),
        lnconnect = (gets.lnconnect && gets.macaroon && gets.imp) ? true : false;
    if (startpage || lnconnect) {
        let currency = "bitcoin";
        ad = {
                "currency": "bitcoin",
                "ccsymbol": "btc",
                "cmcid": 1,
                "erc20": false,
                "checked": true,
                "address": "lnurl", // dummy address for lightning
                "label": "Lightning node",
                "a_id": "btc1",
                "vk": false
            },
            href = "?p=home&payment=bitcoin&uoa=btc&amount=0" + "&address=lnurl";
        if (startpage) {
            let acountname = $("#eninput").val();
            $("#accountsettings").data("selected", acountname).find("p").text(acountname);
            savesettings();
        }
        let pobox = get_addresslist(currency).children("li");
        if (!pobox.length) {
            appendaddress(currency, ad);
            saveaddresses(currency, true);
        }
        currency_check(currency);
        canceldialog();
        canceloptions();
        clear_savedurl();
        br_set_local("editurl", href); // to check if request is being edited
        openpage(href, "create " + currency + " request", "both");
        body.removeClass("showstartpage");
    }
}

function remove_rpc_proxy() {
    $(document).on("click", "#lnd_proxy_select_input .options .opt_icon_box .icon-bin", function() {
        let thisnode = $(this),
            thisoption = thisnode.closest(".optionwrap"),
            thisval = thisoption.data(),
            result = confirm("Are you sure you want to remove '" + thisval.value + "'?");
        if (result === true) {
            let lnli = lndli(),
                ln_dat = lnli.data(),
                pid = thisval.pid,
                hosted_nodes = $.grep(ln_dat.services, function(value) {
                    return value.proxy_id == pid;
                })[0];
            if (hosted_nodes) {
                popnotify("error", hosted_nodes.imp + ": '" + hosted_nodes.name + "' uses this proxy, remove it first");
                return
            }
            let proxylist = ln_dat.proxies,
                selected_proxy = ln_dat.selected_proxy,
                new_array = fetch_other_proxies(proxylist, pid),
                empty_arr = ($.isEmptyObject(new_array)),
                proxy_array = (empty_arr) ? [] : new_array,
                select_proxy = (empty_arr) ? false : (selected_proxy.id == pid) ? new_array[0] : selected_proxy;
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
            notify("RPC proxy removed");
            cancelpd();
        }
    })
}

function remove_lnd() {
    $(document).on("click", "#select_ln_node .options .opt_icon_box .icon-bin", function() {
        let thisnode = $(this),
            thisoption = thisnode.closest(".optionwrap"),
            thisval = thisoption.data(),
            result = confirm("Are you sure you want to remove '" + thisval.name + "'?");
        if (result === true) {
            let lnli = lndli(),
                ln_dat = lnli.data(),
                services = ln_dat.services,
                new_array = fetch_other_nodes(services, thisval.node_id),
                empty_arr = ($.isEmptyObject(new_array));
            thisoption.slideUp(500, function() {
                $(this).remove();
            });
            let services_array = (empty_arr) ? [] : new_array,
                select_service = (empty_arr) ? false : new_array[0],
                selected = (empty_arr) ? false : true;
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
            notify("Service removed");
            cancelpd();
        }
    })
}

function unlock_proxy1() {
    $(document).on("click", "#lnd_proxy_select_input .options .opt_icon_box .icon-lock", function() {
        let thisnode = $(this),
            thisoption = thisnode.closest(".optionwrap"),
            thisval = thisoption.data();
        p_promt(thisval.pid);
    })
}

function unlock_proxy2() {
    $(document).on("click", "#select_ln_node .options .opt_icon_box .icon-lock", function() {
        let thisnode = $(this),
            thisoption = thisnode.closest(".optionwrap"),
            thisval = thisoption.data();
        p_promt(thisval.proxy_id);
    })
}

function unlock_proxy3() {
    $(document).on("click", "#lnsettingsbox #pw_unlock_info", function() {
        let thisnode = $(this),
            pid = thisnode.attr("data-pid");
        p_promt(pid);
    })
}

function unlock_proxy4() {
    $(document).on("click", "#lnsettingsbox #pw_unlock_invoices", function() {
        let thisnode = $(this),
            pid = thisnode.attr("data-pid");
        p_promt(pid);
    })
}

function p_promt(pid) {
    let lnli = lndli(),
        ln_dat = lnli.data(),
        proxylist = ln_dat.proxies,
        this_proxy = fetch_proxy(proxylist, pid),
        empty_arr = ($.isEmptyObject(this_proxy));
    if (empty_arr) {
        popnotify("error", "Unknown proxy server");
        return
    }
    let p_arr = lnurl_deform(this_proxy.proxy),
        proxy = p_arr.url,
        password = prompt("Enter proxy API key to unlock '" + proxy + "'"),
        pwsha = (password) ? sha_sub(password, 10) : false;
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
        let api_result = br_result(e),
            result = api_result.result,
            error = result.error;
        if (error) {
            let message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error;
            popnotify("error", message);
            return
        }
        if (result == "pong") {
            let other_proxies = fetch_other_proxies(proxylist, pid),
                p_obj = {
                    "proxy": lnurl_form(proxy, pwsha),
                    "id": pid
                };
            let op = br_dobj(other_proxies),
                selected_proxy = ln_dat.selected_proxy,
                selected_id = selected_proxy.id;
            op.push(p_obj);
            let is_current = (selected_id == pid) ? true : false;
            lnli.data("proxies", op);
            if (is_current) {
                lnli.data("selected_proxy", p_obj);
            }
            save_cc_settings("bitcoin", true);
            notify("Proxy unlocked!");
            $("#dialogbody").slideUp(300, function() {
                lm_function(true);
            });
            return
        }
        popnotify("error", "Unable to connect to " + proxy);
    }).fail(function(jqXHR, textStatus, errorThrown) {
        popnotify("error", "Unable to connect");
        console.log(jqXHR);
        console.log(textStatus);
        console.log(errorThrown);
    });
}

/* helpers */

function lndli() {
    return $("#bitcoin_settings .cc_settinglist li[data-id='Lightning network']");
}

function lnd_pick_proxy() {
    let saved_proxy = s_lnd_proxy();
    return (saved_proxy) ? saved_proxy.proxy : d_proxy();
}

function s_lnd_proxy() {
    let lnli = lndli(),
        ln_dat = lnli.data();
    return (ln_dat.selected_proxy) ? ln_dat.selected_proxy : false;
}

function is_local_node(host) {
    return (host) ? ((host.indexOf("localhost") > -1) || (host.indexOf("127.0.0.1") > -1)) ? true : false : null;
}

function cancelpd() {
    if ($("#request_front").length > 0) { // update request dialog
        cancelpaymentdialog();
    }
}

function node_exists(nodelist, node_id) {
    if ($.isEmptyObject(nodelist)) {
        return false
    }
    let lnd_exists = false;
    $.each(nodelist, function(key, value) {
        if (value.node_id == node_id) {
            lnd_exists = true;
        }
    });
    return lnd_exists;
}

function fetch_node(list, pid) {
    return $.grep(list, function(value) {
        return value.node_id == pid;
    })[0];
}

function fetch_other_nodes(list, pid) {
    return $.grep(list, function(value) {
        return value.node_id != pid;
    });
}

function fetch_proxy(list, pid) {
    return $.grep(list, function(value) {
        return value.id == pid;
    })[0];
}

function fetch_other_proxies(list, pid) {
    return $.grep(list, function(value) {
        return value.id != pid;
    });
}

function lnurl_form(url, pw) {
    let get = (pw) ? "#" + pw : "",
        lnurl = url + get;
    return lnurl_encode("lnurl", lnurl);
}

function lnurl_deform(lrl) {
    if (typeof lrl != "string") {
        console.log("lnurl must be string")
        return false;
    }
    if (lrl.match("^lnurl")) {
        let dec = lnurl_decode(lrl).replace(/\0/g, ""),
            arr = dec.split("#"),
            k = (arr[1]) ? arr[1] : false;
        return {
            "url": arr[0],
            "k": arr[1]
        }
    }
    return {
        "url": lrl,
        "pw": false
    }
}

function lnurl_encode_save(url) {
    return (url.match("^lnurl")) ? url : lnurl_encode("lnurl", complete_url(url));
}

function lnurl_encode(hrp, url) {
    return bech32_encode(hrp, toWords(buffer(url)));
}

function lnurl_decode(lnurl) {
    return utf8Decoder.decode(uint_8Array(fromWords(lnurl_decodeb32(lnurl).data)));
}

/* Tools */

function template_dialog_temp(ddat) {
    let validated_class = (ddat.validated) ? " validated" : "",
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

function test_lnurl_status(lnd) {
    let imp = (lnd.imp) ? lnd.imp : null,
        host = (lnd.host) ? lnd.host : null,
        key = (lnd.key) ? lnd.key : null,
        node_id = (lnd.nid) ? lnd.nid : null,
        p_arr = lnurl_deform(lnd.proxy_host),
        proxy_host = p_arr.url,
        pk = p_arr.k,
        proxy_url = proxy_host + "proxy/v1/ln/api/";
    if (!proxy_host) {
        notify("Proxy data missing");
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
        let error = e.error,
            default_error = "unable to connect";
        if (error) {
            let message = (error) ? (error.message) ? error.message : (typeof error == "string") ? error : default_error : default_error;
            if (request.isrequest) {
                if (helper.lnd_only) {
                    topnotify(message);
                    notify("this request is not monitored", 500000, "yes");
                }
            } else {
                notify(message);
                $("#rq_errlog").append("<span class='rq_err'>" + message + "</span>");
            }
        }
        let mdat = e.mdat;
        if (mdat) {
            let connected = mdat.connected;
            if (connected) {
                helper.lnd_status = true;
                if (node_id) {
                    sessionStorage.setItem("lnd_timer_" + node_id, now());
                }
            }
        }
        proceed_pf();
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let error_object = (errorThrown) ? errorThrown : jqXHR,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

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
        let data = br_result(e).result;
        if (data) {
            if (data.invoices) {
                helper.lnd_status = true;
                if (lnd.nid) {
                    sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
                }
            }
        }
        proceed_pf();
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let error_object = (errorThrown) ? errorThrown : jqXHR,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

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
        let data = br_result(e).result;
        if (data) {
            if (data.invoices) {
                helper.lnd_status = true;
                if (lnd.nid) {
                    sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
                }
            }
        }
        proceed_pf();
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let error_object = (errorThrown) ? errorThrown : jqXHR,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

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
        let data = br_result(e).result;
        if (data) {
            if (data.error) {
                let error_data = get_api_error_data(data.error);
                proceed_pf(error_data);
                return
            }
            helper.lnd_status = true;
            if (lnd.nid) {
                sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
            }
        }
        proceed_pf();
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let error_object = (errorThrown) ? errorThrown : jqXHR,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

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
        let data = br_result(e).result;
        if (data) {
            if (data.balance > -1) {
                helper.lnd_status = true;
                if (lnd.nid) {
                    sessionStorage.setItem("lnd_timer_" + lnd.nid, now());
                }
            }
        }
        proceed_pf();
        return
    }).fail(function(jqXHR, textStatus, errorThrown) {
        let error_object = (errorThrown) ? errorThrown : jqXHR,
            error_data = get_api_error_data(error_object);
        proceed_pf(error_data);
    });
}

function set_ln_fields(imp, rest, mac) {
    if (imp && rest && mac) {
        if (imp == "lnd" || imp == "c-lightning") {
            let lnd_host_input = $("#lnd_credentials .cs_" + imp + " .lnd_host"),
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