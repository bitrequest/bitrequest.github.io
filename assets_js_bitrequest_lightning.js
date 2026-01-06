$(document).ready(function() {
    // ** Core Lightning Settings: **
    setup_lightning_settings();
    toggle_lightning_network();
    //render_lightning_interface
    //template_dialog_temp
    //get_lightning_settings

    // ** Node Management: **
    //node_option_li
    //test_lnd_option_li
    //test_c_lightning_option_li
    //test_lnbits_option_li
    //lightning_option_li
    //update_connection_status
    remove_lnd();
    handle_node_selection();

    // ** Proxy Management: **
    //add_proxy_option
    //create_proxy_option
    toggle_proxy_drawer();
    toggle_proxy_mode();
    toggle_proxy_input();
    handle_node_proxy_toggle();
    //test_proxy_connection
    handle_proxy_selection();
    remove_rpc_proxy();
    //test_lnd_proxy
    //add_custom_proxy

    // ** Implementation Management: **
    handle_implementation_selection();
    toggle_invoice_details();
    //trigger_ln
    //test_create_invoice
    //add_ln_imp

    // ** Proxy Authentication: **
    unlock_proxy1();
    unlock_proxy2();
    unlock_proxy3();
    unlock_proxy4();
    //prompt_proxy_unlock

    // ** Utility Functions: **
    //lnd_pick_proxy
    //s_lnd_proxy
    //is_local_node
    //cancelpd
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

    // ** Node Status Functions: **
    //validate_lnurl_connection
    //check_lnd_status
    //check_c_lightning_status
    //check_lnbits_status
    //set_ln_fields
});

// ** Core Lightning Settings: **

// Establishes event handler for Lightning Network settings menu activation
function setup_lightning_settings() {
    $(document).on("click", ".cc_settinglist li[data-id='Lightning network'] .atext", function() {
        render_lightning_interface();
    })
}

// Manages Lightning Network enable/disable toggle with confirmation and state persistence
function toggle_lightning_network() {
    $(document).on("mouseup", ".cc_settinglist li[data-id='Lightning network'] .switchpanel.custom", function() {
        const network_switch = $(this),
            lightning_item = get_lightning_settings();
        if (network_switch.hasClass("true")) {
            const confirm_result = confirm(tl("disablelightning"));
            if (confirm_result === true) {
                lightning_item.data("selected", false);
                network_switch.removeClass("true").addClass("false");
                save_cc_settings("bitcoin", true);
            }
        } else {
            const selected_service = lightning_item.data("selected_service");
            if (selected_service) {
                lightning_item.data("selected", true);
                network_switch.removeClass("false").addClass("true");
                save_cc_settings("bitcoin", true);
            } else {
                render_lightning_interface();
            }
        }
    })
}

// Generates and renders Lightning Network settings interface with node and proxy configuration options
function render_lightning_interface(replace) {
    const lightning_data = get_lightning_settings().data();
    if (lightning_data) {
        const {
            "services": node_services,
            "proxies": lightning_proxies,
            "selected_service": current_node,
            "selected_proxy": current_proxy
        } = lightning_data,
        has_nodes = Boolean(node_services && !empty_obj(node_services)),
            has_proxies = Boolean(lightning_proxies && !empty_obj(lightning_proxies)),
            node_title = has_nodes ? tl("lightningnode") : tl("addlightningnode"),
            has_proxy = Boolean(current_proxy),
            proxy_data = has_proxy ? lnurl_deform(current_proxy.proxy) : false,
            current_proxy_url = proxy_data ? proxy_data.url : "",
            current_proxy_id = current_proxy ? current_proxy.id : false,
            proxy_class = has_proxies ? " haslnurls" : "",
            node_class = has_nodes ? "" : " noln",
            camera_class = glob_let.hascam ? "" : " nocam",
            node_name = current_node ? current_node.name : "",
            current_node_id = current_node ? current_node.node_id : "",
            proxy_select = has_proxy ? "<div class='selectbox' id='lnd_proxy_select_input'>" +
            "<input type='text' value='" + current_proxy_url + "' data-pid='" + current_proxy_id + "' placeholder='https://...' readonly='readonly'/>" +
            "<div class='selectarrows icon-menu2' data-pe='none'></div>" +
            "<div class='options'></div>" +
            "</div><div id='add_proxy'><span class='ref'>" + tl("addrpcproxy") + "</span></div>" : "",
            lightning_markup = "<div class='popform" + node_class + proxy_class + camera_class + "'>" +
            "<div id='select_ln_node' class='selectbox' data-node_id='" + current_node_id + "'>" +
            "<input type='text' value='" + truncate_middle(node_name) + "' placeholder='Select lightning node' readonly='readonly' id='ln_nodeselect'/>" +
            "<div class='selectarrows icon-menu2' data-pe='none'></div>" +
            "<div id='ln_nodelist' class='options'></div>" +
            "</div>" +
            "<div id='ad_info_wrap'>" +
            "<ul>" +
            "<li><div class='d_trigger' id='add_lndnode_trigger'><span class='ref'><span class='icon-power'></span>" + tl("addnode") + "</span></div>" +
            "<div class='drawer2' id='adln_drawer'>" +
            "<div class='selectbox'>" +
            "<input type='text' value='' placeholder='" + tl("implementation") + "' id='lnd_select_input' readonly='readonly'/>" +
            "<div class='selectarrows icon-menu2' data-pe='none'></div>" +
            "<div class='options' id='implements'>" +
            "<span data-value='lnd' class='imp_select'><img src='" + c_icons("lnd") + "' class='lnd_icon'> LND</span>" +
            "<span data-value='core-lightning' class='imp_select'><img src='" + c_icons("core-lightning") + "' class='lnd_icon'> core-lightning</span>" +
            "<span data-value='lnbits' class='imp_select'><img src='" + c_icons("lnbits") + "' class='lnd_icon'> LNbits</span>" +
            "</div>" +
            "</div>" +
            "<div id='lnd_credentials'>" +
            "<div class='lndcd cs_lnd'>" +
            "<div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host' autocomplete='off' autocapitalize='off' spellcheck='false'/><div class='qrscanner' data-currency='lnd' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>" +
            "<div class='inputwrap'><input class='invoice_macaroon' type='text' value='' placeholder='Invoice macaroon' autocomplete='off' autocapitalize='off' spellcheck='false'/></div>" +
            "</div>" +
            "<div class='lndcd cs_core-lightning'>" +
            "<div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host' autocomplete='off' autocapitalize='off' spellcheck='false'/><div class='qrscanner' data-currency='core-lightning' data-id='lnconnect' title='scan qr-code'><span class='icon-qrcode'></span></div></div>" +
            "<div class='inputwrap'><input class='invoice_macaroon' type='text' value='' placeholder='Invoice rune' autocomplete='off' autocapitalize='off' spellcheck='false'/></div>" +
            "</div>" +
            "<div class='lndcd cs_lnbits'>" +
            "<div class='inputwrap'><input class='lnd_host' type='text' value='' placeholder='REST Host' autocomplete='off' autocapitalize='off' spellcheck='false'/></div>" +
            "<div class='inputwrap'><input class='invoice_macaroon' type='text' value='' placeholder='Invoice/read key' autocomplete='off' autocapitalize='off' spellcheck='false'/></div>" +
            "</div>" +
            "</div>" +
            "<div class='switch_wrap'>" +
            "<div id='lnurl_s'><span id='toggle_lnd' class='ref'>RPC proxy</span>" + switch_panel(has_proxies, " custom") + "</div>" +
            "</div>" +
            "</div>" +
            "</li>" +
            "<li><div class='d_trigger' id='add_proxy_trigger'><span class='ref'><span class='icon-sphere'></span>RPC proxy</span></div>" +
            "<div class='drawer2" + proxy_class + "' id='add_proxy_drawer'>" + proxy_select +
            "<div id='lnurl_proxy_drawer' class='lpd'>" +
            "<p id='lnurls_info'>" + tl("controlyourlnkeys") + "<br/><br/>" +
            "<strong>1.</strong> " + tl("lnnodestep1") + "<br/>" +
            "<strong>2.</strong> " + tl("lnnodestep2") + "<br/>" +
            "<strong>3.</strong> " + tl("lnnodestep3") + "<br/><br/>" +
            "</p>" +
            "<input type='text' value='' placeholder='https://...' id='lnd_proxy_url_input' autocomplete='off' autocapitalize='off' spellcheck='false'/>" +
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
                "elements": lightning_markup
            }),
            trigger = replace ? null : "trigger_ln";
        popdialog(content, trigger, null, null, replace);
        if (has_nodes) {
            Object.entries(node_services).forEach(([key, node]) => {
                const is_selected = node.node_id === current_node_id,
                    implementation = node.imp,
                    node_lnurl = node.lnurl;
                if (node_lnurl || node.proxy) {
                    const proxy_data = has_proxies ? fetch_proxy(lightning_proxies, node.proxy_id) : false,
                        used_proxy = proxy_data ? proxy_data.proxy : (current_proxy ? current_proxy.proxy : d_proxy()),
                        parsed_proxy = lnurl_deform(used_proxy),
                        proxy_url = parsed_proxy.url,
                        proxy_key = parsed_proxy.k;
                    node_option_li(node, is_selected, "append", proxy_url, proxy_key);
                } else {
                    switch (implementation) {
                        case "lnd":
                            test_lnd_option_li(node, is_selected, "append");
                            break;
                        case "core-lightning":
                            test_c_lightning_option_li(node, is_selected, "append");
                            break;
                        case "lnbits":
                            test_lnbits_option_li(node, is_selected, "append");
                            break;
                        default:
                            lightning_option_li(false, node, is_selected, "append");
                    }
                }
            });
        }
        if (has_proxies) {
            const proxy_list = $("#lnsettingsbox #add_proxy_drawer .options");
            Object.entries(lightning_proxies).forEach(([key, proxy]) => {
                const is_current_proxy = proxy.id === current_proxy_id;
                add_proxy_option(proxy_list, key, proxy, is_current_proxy);
            });
        }
        if (replace) {
            $("#dialogbody").slideDown(300);
        }
    }
}

// Generates formatted HTML dialog template with specified parameters
function template_dialog_temp(dialog_data) {
    const validated_class = dialog_data.validated ? " validated" : "",
        dialog_object = [{
            "div": {
                "id": dialog_data.id,
                "class": "formbox",
                "content": [{
                        "h2": {
                            "class": dialog_data.icon,
                            "content": dialog_data.title
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
                            "content": dialog_data.elements
                        }
                    }
                ]
            }
        }]
    return render_html(dialog_object);
}

// Returns Lightning Network settings DOM node
function get_lightning_settings() {
    return cs_node("bitcoin", "Lightning network");
}

// ** Node Management: **

// Creates node option elements with proxy connection validation and status handling
function node_option_li(node_info, selected, action, proxy_url, proxy_key) {
    loader(true);
    set_loader_text(tl("connecttolnur", {
        "url": truncate_middle(proxy_url)
    }));
    const implementation = node_info.imp,
        request_data = {
            "method": "POST",
            "cache": false,
            "timeout": 5000,
            "url": proxy_url + "/proxy/v1/ln/api/",
            "data": {
                "imp": implementation,
                "fn": "ln-list-invoices",
                "host": node_info.host,
                "key": node_info.key,
                "x-api": proxy_key
            }
        };
    $.ajax(request_data).done(function(response) {
            closeloader();
            const invoices = response.invoices,
                error = response.error;
            if (error) {
                const default_error = tl("unabletoconnect"),
                    error_message = error.message || (typeof error === "string" ? error : default_error),
                    error_code = error.code;
                locked = error_code && (error_code === 1 || error_code === 2) ? "locked" : null;
                if (action === "append") {
                    lightning_option_li(false, node_info, selected, locked, proxy_url);
                    popnotify("error", error_message);
                    return
                }
                update_connection_status();
                if (selected) {
                    popnotify("error", error_message);
                }
                return
            }
            const node_metadata = response.mdat,
                is_connected = q_obj(node_metadata, "connected");
            if (action === "append") {
                if (is_connected) {
                    lightning_option_li(true, node_info, selected, invoices, proxy_url);
                } else {
                    lightning_option_li(false, node_info, selected);
                }
                return
            }
            update_connection_status(is_connected);
        })
        .fail(function(xhr, status, error) {
            closeloader();
            if (action === "append") {
                lightning_option_li(false, node_info, selected);
                return
            }
            update_connection_status();
        });
}

// Validates LND node connection and creates corresponding option list item
function test_lnd_option_li(node_info, selected, action) {
    const node_host = node_info.host,
        is_onion_host = node_host.indexOf(".onion") > 0;
    loader(true);
    set_loader_text(tl("connecttolnur", {
        "url": truncate_middle(node_host)
    }));
    api_proxy({
        "proxy": is_onion_host,
        "api_url": node_host + "/v1/invoices?reversed=true",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "Grpc-Metadata-macaroon": node_info.key
            }
        }
    }).done(function(response) {
        closeloader();
        const api_result = br_result(response).result;
        if (api_result) {
            if (action === "append") {
                if (api_result.invoices) {
                    lightning_option_li(true, node_info, selected, api_result.invoices);
                    return
                }
                lightning_option_li(false, node_info, selected);
                return
            }
            if (api_result.invoices) {
                update_connection_status(true);
                return
            }
            update_connection_status();
        }
    }).fail(function(xhr, status, error) {
        closeloader();
        if (action === "append") {
            lightning_option_li(false, node_info, selected);
            return
        }
        update_connection_status();
    });
}

// Validates core-lightning node connection and creates corresponding option list item
function test_c_lightning_option_li(node_info, selected, action) {
    const node_host = node_info.host,
        is_onion_host = node_host.indexOf(".onion") > 0;
    loader(true);
    set_loader_text(tl("connecttolnur", {
        "url": truncate_middle(node_host)
    }));
    api_proxy({
        "proxy": is_onion_host,
        "api_url": node_host + "/v1/listinvoices",
        "params": {
            "method": "POST",
            "cache": false,
            "data": null,
            "headers": {
                "Rune": node_info.key
            }
        }
    }).done(function(response) {
        closeloader();
        const api_result = br_result(response).result;
        if (api_result) {
            if (action === "append") {
                if (api_result.invoices) {
                    lightning_option_li(true, node_info, selected, api_result.invoices);
                    return
                }
                lightning_option_li(false, node_info, selected);
                return
            }
            if (api_result.invoices) {
                update_connection_status(true);
                return
            }
            update_connection_status();
        }
    }).fail(function(xhr, status, error) {
        closeloader();
        if (action === "append") {
            lightning_option_li(false, node_info, selected);
            return
        }
        update_connection_status();
    });
}

// Validates LNbits node connection via wallet API and creates option list item
function test_lnbits_option_li(node_info, selected, action) {
    const node_host = node_info.host,
        is_onion_host = node_host.indexOf(".onion") > 0;
    loader(true);
    set_loader_text(tl("connecttolnur", {
        "url": truncate_middle(node_host)
    }));
    api_proxy({
        "proxy": is_onion_host,
        "api_url": node_host + "/api/v1/wallet",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "X-Api-Key": node_info.key
            }
        }
    }).done(function(response) {
        closeloader();
        const api_result = br_result(response).result;
        if (action === "append") {
            if (api_result && api_result.balance > -1) {
                lightning_option_li(true, node_info, selected, api_result.invoices);
                return
            }
            lightning_option_li(false, node_info, selected);
            return
        }
        if (api_result && api_result.balance > -1) {
            update_connection_status(true);
            return
        }
        update_connection_status();
    }).fail(function(xhr, status, error) {
        closeloader();
        if (action === "append") {
            lightning_option_li(false, node_info, selected);
            return
        }
        update_connection_status();
    });
}

// Creates and renders Lightning node UI elements with invoice history and status information
function lightning_option_li(is_live, node_info, selected, invoices, proxy_url) {
    const has_invoices = (invoices && invoices !== "locked") ? true : false,
        is_locked = (invoices && invoices === "locked") ? true : false,
        status_class = is_locked ? " locked" : (is_live === true ? " live" : ""),
        selected_class = (selected === true) ? " show" : "",
        node_id = node_info.node_id,
        proxy_id = node_info.proxy_id,
        implementation = node_info.imp,
        has_lnurls = Boolean(node_info.lnurl),
        lock_icon = is_locked ? "<div class='opt_icon c_stat icon-lock' data-pe='none'></div>" : "",
        tor = node_info.tor ? "<div class='opt_icon c_stat icon-tor' title='TOR support' data-pe='none'></div>" : "",
        node_name = node_info.name,
        implementation_icon = c_icons(implementation),
        lnurl_icon = has_lnurls ? "<div class='opt_icon icon-sphere' data-pe='none'></div>" : "",
        option = $("<div class='optionwrap" + status_class + selected_class + "' style='display:none' data-pe='none'>" +
            "<span data-value='" + node_name + "' data-node_id='" + node_id + "'>" +
            "<img src='" + implementation_icon + "' class='lnd_icon'/> <span class='cstat'>•</span> " + truncate_middle(node_name) + "</span>" +
            "<div class='opt_icon_box' data-pe='none'>\
            <div class='opt_icon icon-bin' data-pe='none'></div>" + lnurl_icon +
            lock_icon + tor +
            "</div></div>");
    let invoices_list = "";
    option.data(node_info).appendTo($("#ln_nodelist"));
    option.slideDown(500);
    if (has_invoices) {
        invoices.reverse().forEach(function(invoice) {
            const invoice_description = invoice.memo || invoice.description;
            if (invoice_description && invoice_description.indexOf("test invoice") === 0) {
                // filter out test invoices
            } else {
                const invoice_id = invoice.payment_request ? " " + invoice.payment_request.slice(0, 16) :
                    (invoice.serialized ? " " + invoice.serialized.slice(0, 16) : ""),
                    invoice_title = invoice_description || "invoice" + invoice_id,
                    bolt_card = invoice_title.indexOf("Boltcard") === 0 ? " <img src='boltcard.png' class='boltcard' title='paid with the boltcard'>" : "",
                    timestamp = invoice.creation_date || invoice.timestamp || false,
                    invoice_date = timestamp ? short_date(parseInt(timestamp * 1000)) : "",
                    settlement_icon = invoice.settled === true || invoice.status === "paid" ? "icon-checkmark" :
                    (invoice.settled === false || invoice.status === "expired" ? "icon-clock" : false),
                    icon_span = settlement_icon ? "<span class='" + settlement_icon + "'></span>" : "<img src='" + implementation_icon + "' class='lnd_icon'>";
                invoices_list += "<div class='ivli'><div class='invoice_memo clearfix'>" +
                    "<div class='iv_title' title='" + invoice_title + "'>" + icon_span + " " + truncate_middle(invoice_title, 10, 14, 25) + bolt_card + "</div>" +
                    "<div class='iv_date'>" + invoice_date + "</div></div>" +
                    "<div class='invoice_body'><pre>" + highlight_json_syntax(invoice) + "</pre></div></div>";
            }
        });
    } else {
        const invoice_msg = is_locked ? tl("invoiceslocked", {
            "proxy_id": proxy_id
        }) : (is_live === true ? tl("noinvoicesfound") : tl("invoiceoffline"));
        invoices_list = "<p>" + invoice_msg + "</p>";
    }
    const node_host = node_info.host,
        has_proxy = Boolean(node_info.proxy),
        proxy_value = has_proxy && proxy_url ? proxy_url : false,
        missing_proxy = has_lnurls && !proxy_value,
        hide_class = selected === true ? " node_selected hide" : " hide",
        lnurls_class = has_lnurls ? " lnurlclass" : "",
        node_display_name = missing_proxy ? "Proxy not found" : (has_lnurls ? "hidden by Proxy server" : "<span title='" + node_host + "'>" + truncate_middle(node_host)) + "</span>",
        lnurl_markup = has_lnurls ? "<strong><img src='" + implementation_icon + "' class='lnd_icon' style='opacity:0'/> Proxy server: </strong>" + proxy_value + "</br/>" : "",
        proxy_markup = has_lnurls ? "" : "<strong><img src='" + implementation_icon + "' class='lnd_icon' style='opacity:0'/> Proxy: </strong><span class='inline_pval'>" + proxy_value + "</span></br/>",
        info_markup = $("<li class='noln_ref" + hide_class + lnurls_class + "' data-id='" + node_id + "' data-pid='" + proxy_id + "'>" +
            "<div class='d_trigger'><span class='ref'><span class='icon-info'></span>Info</span></div>" +
            "<div class='drawer2 infodrawer' style='display:block'>" +
            "<div class='ln_info_wrap clearfix" + status_class + "'>" +
            "<div class='lni_dat'>" +
            "<img src='" + implementation_icon + "' class='lnd_icon'/> <strong>" + implementation + " Node: </strong>" + node_display_name + "<br/>" +
            lnurl_markup + proxy_markup +
            "<strong><img src='" + implementation_icon + "' class='lnd_icon' style='opacity:0'/> Status: </strong>" +
            "<span class='online_stat'> Online <span class='icon-connection'></span></span>" +
            "<span class='offline_stat'> Offline <span class='icon-wifi-off'></span></span>" +
            "<span class='locked_stat'> <span id='pw_unlock_info' data-pid='" + proxy_id + "' class='ref'>Locked</span> <span class='icon-lock'></span></span></br/>" +
            "</div>" +
            "<div class='lnurl_p'>Proxy" + switch_panel(has_proxy, " custom") + "</div>" +
            "</div></div></li>"),
        invoice_markup = $("<li class='noln_ref" + hide_class + "' data-id='" + node_id + "'>" +
            "<div class='d_trigger'><span class='ref'><span class='icon-files-empty'></span>Invoices</span></div>" +
            "<div class='drawer2'><div class='invoice_list'>" + invoices_list + "</div></div></li>");
    $("#lnsettingsbox #ad_info_wrap > ul").prepend(info_markup, invoice_markup);
    $("#ad_info_wrap .node_selected").delay(500).slideDown(300);
    update_connection_status(is_live);
}

// Updates Lightning node connection status UI indicators based on test results
function update_connection_status(is_connected) {
    const node_container = $("#lnsettingsbox .ln_info_wrap:visible");
    if (is_connected) {
        node_container.addClass("live");
        $("#ln_nodeselect").data("live", "connection");
    } else {
        node_container.removeClass("live");
        $("#ln_nodeselect").data("live", "wifi-off");
    }
}

// Manages Lightning node removal with confirmation and state persistence
function remove_lnd() {
    $(document).on("click", "#select_ln_node .options .opt_icon_box .icon-bin", function() {
        const selected_icon = $(this),
            selected_option = selected_icon.closest(".optionwrap"),
            node_info = selected_option.data(),
            confirm_removal = confirm(tl("confirmremovenode", {
                "thisval": node_info.name
            }));
        if (confirm_removal === true) {
            const lightning_item = get_lightning_settings(),
                lightning_data = lightning_item.data(),
                node_services = lightning_data.services,
                updated_node_list = fetch_other_nodes(node_services, node_info.node_id),
                is_node_list_empty = empty_obj(updated_node_list);
            selected_option.slideUp(500, function() {
                $(this).remove();
            });
            const final_node_list = is_node_list_empty ? [] : updated_node_list,
                selected_service = is_node_list_empty ? false : updated_node_list[0],
                is_selected = !is_node_list_empty;
            lightning_item.data({
                "selected_service": selected_service,
                "selected": is_selected,
                "services": final_node_list
            });
            if (is_node_list_empty) {
                lightning_item.find(".switchpanel").removeClass("true").addClass("false");
                selected_icon.closest(".selectbox").slideUp(500);
                $("#lnsettingsbox .popform").addClass("noln");
                save_cc_settings("bitcoin", true);
                canceldialog();
            } else {
                save_cc_settings("bitcoin", true);
                $("#ln_nodeselect").val(selected_service.host);
                $("#dialogbody").slideUp(300, function() {
                    render_lightning_interface(true);
                });
            }
            notify(tl("serviceremoved"));
            cancelpd();
        }
    })
}

// Manages Lightning node selection UI with status updates and info panel display
function handle_node_selection() {
    $(document).on("mousedown", "#ln_nodelist .optionwrap", function() {
        const selected_node = $(this);
        if (selected_node.hasClass("offline")) {
            play_audio("funk");
        }
        $("#ln_nodelist .optionwrap").not(selected_node).removeClass("show");
        selected_node.addClass("show");
        const node_id = selected_node.data("node_id"),
            all_node_refs = $("#lnsettingsbox #ad_info_wrap .noln_ref"),
            matching_node_refs = $("#lnsettingsbox #ad_info_wrap .noln_ref[data-id='" + node_id + "']");
        all_node_refs.hide();
        matching_node_refs.show().find(".infodrawer").slideDown(300);
    })
}

// ** Proxy Management: **

// Tests proxy connection and adds proxy option to UI with status indicators
function add_proxy_option(option_list, key, proxy_info, selected) {
    const proxy_data = lnurl_deform(proxy_info.proxy),
        proxy_url = proxy_data.url;
    let is_locked = false;
    loader(true);
    set_loader_text(tl("connecttolnur", {
        "url": truncate_middle(proxy_url)
    }));
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy_url + "/proxy/v1/ln/api/",
        "data": {
            "pingpw": true,
            "x-api": proxy_data.k
        }
    }).done(function(response) {
        closeloader();
        const api_result = br_result(response),
            result = api_result.result,
            error = result.error;
        if (error) {
            const error_code = error.code;
            is_locked = error_code && (error_code == 1 || error_code == 2);
            create_proxy_option(option_list, false, key, proxy_info, selected, proxy_url, is_locked);
            return
        }
        if (result === "pong") {
            create_proxy_option(option_list, true, key, proxy_info, selected, proxy_url, is_locked);
            return
        }
        create_proxy_option(option_list, false, key, proxy_info, selected, proxy_url, is_locked);
    }).fail(function(xhr, status, error) {
        closeloader();
        create_proxy_option(option_list, false, key, proxy_info, selected, proxy_url, is_locked);
    });
}

// Creates and appends proxy option element with connection status visualization
function create_proxy_option(option_list, is_live, key, proxy_info, selected, proxy_name, is_locked) {
    const status_class = is_live === true ? " live" : " offline",
        lock_icon = is_locked ? "<div class='opt_icon c_stat icon-lock' data-pe='none'></div>" : "",
        tor = proxy_info.tor ? "<div class='opt_icon c_stat icon-tor' title='TOR support' data-pe='none'></div>" : "",
        selected_class = selected === true ? " show" : "",
        option = $("<div class='optionwrap" + status_class + selected_class + "' style='display:none' data-pe='none' data-pid='" + proxy_info.id + "'>\
            <span data-value='" + proxy_name + "' data-pe='none'><span class='cstat'>•</span> " + truncate_middle(proxy_name) + "</span>" +
            "<div class='opt_icon_box' data-pe='none'>\
            <div class='opt_icon icon-bin' data-pe='none'></div>" + lock_icon + tor +
            "</div></div>");
    option_list.append(option);
    option.slideDown(500);
}

// Manages visibility toggling of Lightning Network proxy configuration UI
function toggle_proxy_drawer() {
    $(document).on("click", "#lnsettingsbox #toggle_lnd", function() {
        const proxy_drawer = $("#add_proxy_drawer");
        proxy_input = $("#lnd_proxy_url_input");
        if (proxy_drawer.is(":visible")) {
            proxy_input.blur();
            proxy_drawer.slideUp(200);
        } else {
            proxy_drawer.slideDown(200);
            proxy_input.focus();
        }
    })
}

// Handles switching between proxy and direct connection modes with UI updates
function toggle_proxy_mode() {
    $(document).on("mouseup", "#lnsettingsbox #lnurl_s .switchpanel.custom", function() {
        const network_switch = $(this),
            proxy_drawer = $("#add_proxy_drawer"),
            node_credentials = $("#lnd_credentials"),
            proxy_url_input = $("#lnd_proxy_url_input"),
            implementation_input = $("#lnd_select_input"),
            current_implementation = implementation_input.data("value");
        network_switch.toggleClass("true false");
        node_credentials.slideToggle(200);
        if (proxy_drawer.hasClass("haslnurls")) {
            return
        }
        proxy_drawer.slideToggle(200);
        if (!proxy_drawer.is(":visible")) {
            proxy_url_input.focus();
        }
    })
}

// Controls visibility of proxy addition interface section
function toggle_proxy_input() {
    $(document).on("click", "#lnsettingsbox #add_proxy .ref", function() {
        const proxy_input_drawer = $("#lnurl_proxy_drawer");
        proxy_input_drawer.slideToggle(200);
    })
}

// Manages individual node proxy settings with state persistence and connection testing
function handle_node_proxy_toggle() {
    $(document).on("mouseup", "#lnsettingsbox .lnurl_p .switchpanel.custom", function() {
        const lightning_item = get_lightning_settings(),
            lightning_data = lightning_item.data(),
            node_services = lightning_data.services;
        if (empty_obj(node_services)) {
            play_audio("funk");
            return
        }
        const network_switch = $(this),
            current_list_item = network_switch.closest(".noln_ref"),
            current_node_id = current_list_item.data("id"),
            current_node = fetch_node(node_services, current_node_id);
        if (!current_node) {
            popnotify("error", tl("nodenotfound"));
            return
        }
        const proxy_list = lightning_data.proxies,
            current_proxy_id = current_list_item.data("pid"),
            current_proxy = fetch_proxy(proxy_list, current_proxy_id),
            selected_proxy = current_proxy ? current_proxy.proxy : (lightning_data.selected_proxy ? lightning_data.selected_proxy.proxy : d_proxy()),
            proxy_data = lnurl_deform(selected_proxy),
            proxy_url = proxy_data.url,
            proxy_key = proxy_data.k;
        let proxy_text = "";
        if (!proxy_url) {
            popnotify("error", tl("proxynotfound"));
            return
        }
        const filtered_node_services = fetch_other_nodes(node_services, current_node_id);
        if (network_switch.hasClass("true")) {
            const confirm_disable = confirm(tl("disableproxy", {
                "set_proxy_val": proxy_url
            }));
            if (confirm_disable === true) {
                current_node.proxy = false;
                network_switch.removeClass("true").addClass("false");
                proxy_text = "false";
            } else {
                return
            }
        } else {
            const confirm_enable = confirm(tl("enableproxy", {
                "set_proxy_val": proxy_url
            }));
            if (confirm_enable === true) {
                current_node.proxy = true;
                network_switch.removeClass("false").addClass("true");
                proxy_text = proxy_url;
            } else {
                return
            }
        }
        test_proxy_connection(current_node, proxy_url, proxy_key);
        filtered_node_services.push(current_node);
        lightning_item.data({
            "selected_service": current_node,
            "services": filtered_node_services
        });
        save_cc_settings("bitcoin", true);
        const inline_proxy_value = current_list_item.find(".inline_pval");
        inline_proxy_value.text(proxy_text);
        cancelpd();
    })
}

// Tests Lightning Network node connection based on implementation type and proxy configuration
function test_proxy_connection(node_info, proxy_url, proxy_key) {
    if (node_info.lnurl || node_info.proxy) {
        node_option_li(node_info, null, "test_connect", proxy_url, proxy_key);
    } else {
        const implementation = node_info.imp;
        if (implementation === "lnd") {
            test_lnd_option_li(node_info, null, "test_connect");
        } else if (implementation === "lnbits") {
            test_lnbits_option_li(node_info, null, "test_connect");
        } else {}
    }
}

// Handles proxy selection interface with offline state validation
function handle_proxy_selection() {
    $(document).on("mousedown", "#lnd_proxy_select_input .optionwrap", function() {
        const selected_proxy = $(this);
        if (selected_proxy.hasClass("offline")) {
            play_audio("funk");
            return
        }
        $("#lnd_proxy_select_input > input").attr("data-pid", selected_proxy.data("pid"));
        $("#lnd_proxy_select_input .optionwrap").not(selected_proxy).removeClass("show");
        selected_proxy.addClass("show");
    })
}

// Handles removal of RPC proxy with node dependency checking and state updates
function remove_rpc_proxy() {
    $(document).on("click", "#lnd_proxy_select_input .options .opt_icon_box .icon-bin", function() {
        const selected_icon = $(this),
            selected_option = selected_icon.closest(".optionwrap"),
            proxy_info = selected_option.data(),
            lightning_item = get_lightning_settings(),
            lightning_data = lightning_item.data(),
            current_proxy_id = proxy_info.pid,
            dependent_nodes = lightning_data.services.find(node => node.proxy_id === current_proxy_id);
        if (dependent_nodes) {
            popnotify("error", tl("proxyinuse", {
                "imp": dependent_nodes.imp,
                "name": dependent_nodes.name
            }));
            return
        }
        const confirm_removal = confirm(tl("areyousure"));
        if (confirm_removal) {
            const proxy_list = lightning_data.proxies,
                current_proxy = lightning_data.selected_proxy,
                updated_proxy_list = fetch_other_proxies(proxy_list, current_proxy_id),
                is_proxy_list_empty = empty_obj(updated_proxy_list),
                final_proxy_list = is_proxy_list_empty ? [] : updated_proxy_list,
                selected_proxy = is_proxy_list_empty ? false :
                (current_proxy.id === current_proxy_id) ? updated_proxy_list[0] : current_proxy;
            lightning_item.data({
                "selected_proxy": selected_proxy,
                "proxies": final_proxy_list
            });
            if (is_proxy_list_empty) {
                selected_icon.closest(".selectbox").slideUp(500, function() {
                    render_lightning_interface(true);
                });
                cancelpd();
            } else {
                $("#lnd_proxy_select_input > input")
                    .val(lnurl_deform(selected_proxy.proxy).url)
                    .attr("data-pid", selected_proxy.id);
                selected_option.slideUp(500, function() {
                    selected_icon.remove();
                });
            }
            save_cc_settings("bitcoin", true);
            notify(tl("proxyremoved"));
            cancelpd();
        }
    })
}

// Validates and adds new Lightning proxy with error handling and persistence
function test_lnd_proxy(proxy, proxy_id, proxy_key) {
    loader(true);
    set_loader_text(tl("connecttolnur", {
        "url": truncate_middle(proxy)
    }));
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy + "/proxy/v1/ln/api/",
        "data": {
            "add": true,
            "x-api": proxy_key
        }
    }).done(function(response) {
        closeloader();
        const api_result = br_result(response),
            result = api_result.result,
            error = result.error;
        if (error) {
            const default_error = tl("unabletoconnect"),
                error_message = error.message || (typeof error === "string" ? error : default_error),
                formatted_message = error_message === "no write acces" ? tl("folderpermissions") : error_message,
                error_code = error.code;
            popnotify("error", formatted_message);
            if (error_code && (error_code === 1 || error_code === 2)) {
                $("#proxy_pw_input").slideDown(200, function() {
                    $(this).focus();
                })
            }
            return
        }
        if (result.add) {
            const lightning_item = get_lightning_settings(),
                lightning_data = lightning_item.data(),
                current_proxy_list = lightning_data.proxies,
                display = true,
                tor = q_obj(response, "ping.tor"),
                new_proxy = {
                    "proxy": lnurl_form(proxy, proxy_key),
                    "id": proxy_id,
                    display,
                    tor
                };
            current_proxy_list.push(new_proxy);
            lightning_item.data({
                "proxies": current_proxy_list,
                "selected_proxy": new_proxy
            });
            save_cc_settings("bitcoin", true);
            notify(tl("proxyadded"));
            $("#dialogbody").slideUp(300, function() {
                render_lightning_interface(true);
            });
            const proxy_object = {
                proxy,
                display,
                tor
            }
            add_custom_proxy(proxy_object);
            return
        }
        popnotify("error", tl("unabletoconnectto", {
            "value": proxy
        }));
    }).fail(function(xhr, status, error) {
        closeloader();
        popnotify("error", tl("unabletoconnect"));
    });
}

// Registers custom proxy URL to global proxy list with duplication prevention
function add_custom_proxy(proxy_object) {
    const proxy_node = $("#api_proxy"),
        proxy_node_data = proxy_node.data(),
        custom_proxies = proxy_node_data.custom_proxies,
        proxy = proxy_object.proxy;
    if (objectkey_in_array(glob_const.proxy_list, "proxy", proxy) || objectkey_in_array(custom_proxies, "proxy", proxy)) {
        return false
    }
    custom_proxies.push(proxy_object);
    set_setting("api_proxy", {
        "custom_proxies": custom_proxies
    });
    save_settings();
}

// ** Implementation Management: **

// Controls Lightning implementation selection with proxy requirements and credential form management
function handle_implementation_selection() {
    $(document).on("mousedown", "#implements .imp_select", function(e) {
        const selected_implementation = $(this),
            lightning_data = get_lightning_settings().data(),
            proxy_list = lightning_data.proxies,
            has_proxies = !empty_obj(proxy_list),
            implementation = selected_implementation.attr("data-value"),
            credential_sections = $("#lnd_credentials .lndcd"),
            selected_credential_section = $("#lnd_credentials .cs_" + implementation),
            proxy_switch = $("#lnsettingsbox #lnurl_s .switchpanel.custom"),
            has_proxy = proxy_switch.hasClass("true");
        $("#add_proxy_drawer").slideUp(200);
        $("#lnd_proxy_url_input").blur();
        credential_sections.not(selected_credential_section).hide();
        selected_credential_section.show();
    })
}

// Toggles visibility of invoice details in Lightning node interface
function toggle_invoice_details() {
    $(document).on("click", "#lnsettingsbox .invoice_memo", function() {
        const invoice_details = $(this).next(".invoice_body");
        invoice_details.slideToggle(200);
        $(".invoice_body").not(invoice_details).slideUp(200);
    })
}

// Orchestrates Lightning Network settings interface with proxy configuration and node management
function trigger_ln() {
    const lightning_item = get_lightning_settings(),
        lightning_data = lightning_item.data();
    let current_proxy = lightning_data.selected_proxy,
        implementation;
    const proxy_list = lightning_data.proxies,
        proxy_url_input = $("#lnd_proxy_url_input"),
        proxy_select_input = $("#lnd_proxy_select_input > input"),
        input_proxy_url = proxy_url_input.val();
    if (inj(input_proxy_url)) return
    const selected_proxy_url = proxy_select_input.val(),
        proxy_data = current_proxy ? lnurl_deform(current_proxy.proxy) : false,
        current_proxy_url = proxy_data ? proxy_data.url : false,
        no_proxy_change = current_proxy && current_proxy_url == selected_proxy_url;
    if (no_proxy_change || !current_proxy) {} else {
        const selected_proxy_id = proxy_select_input.attr("data-pid"),
            fetched_proxy = fetch_proxy(proxy_list, selected_proxy_id);
        if (fetched_proxy) {
            lightning_item.data({
                "selected_proxy": fetched_proxy
            });
            current_proxy = fetched_proxy;
            save_cc_settings("bitcoin", true);
        } else {
            notify(tl("proxynotfound"));
        }
    }
    if ($("#lnurl_proxy_drawer").is(":visible")) {
        if (input_proxy_url.length < 10) {
            topnotify(tl("enterserver"));
            proxy_url_input.val("").focus();
            play_audio("funk");
            return
        }
        const normalized_url = complete_url(input_proxy_url),
            is_default_proxy = objectkey_in_array(glob_const.proxy_list, "proxy", normalized_url);
        if (is_default_proxy) {
            popnotify("error", tl("defaultproxy", {
                "fixed_url": normalized_url
            }));
            return
        }
        const proxy_id = sha_sub(normalized_url, 6),
            existing_proxy = fetch_proxy(proxy_list, proxy_id);
        if (existing_proxy) {
            topnotify(tl("proxyexists"));
            $("#lnd_proxy_url_input").focus();
            play_audio("funk");
            return
        }
        if (normalized_url.indexOf("http") < 0) {
            topnotify(tl("invalidurl"));
            $("#lnd_proxy_url_input").focus();
            play_audio("funk");
            return
        }
        const proxy_key = $("#proxy_pw_input").val(),
            proxy_key_hash = proxy_key ? sha_sub(proxy_key, 10) : false;
        test_lnd_proxy(normalized_url, proxy_id, proxy_key_hash);
        if (no_proxy_change || !current_proxy) {} else {
            notify(tl("datasaved"));
        }
        return
    }
    if ($("#adln_drawer").is(":visible")) {
        const implementation_select = $("#lnd_select_input"),
            implementation_data = implementation_select.data();
        implementation = implementation_data.value;
        if (!implementation) {
            popnotify("error", tl("selectimplementation"));
            implementation_select.focus();
            return
        }
        const proxy_switch = $("#lnurl_s .switchpanel"),
            use_proxy = proxy_switch.hasClass("true");
        if (use_proxy && current_proxy) {
            test_create_invoice(implementation, current_proxy, null, null);
            return
        }
        const node_credentials = $("#lnd_credentials");
        if (node_credentials.is(":visible")) {
            const node_host_input = $("#lnd_credentials .cs_" + implementation + ":visible .lnd_host"),
                node_key_input = $("#lnd_credentials .cs_" + implementation + ":visible .invoice_macaroon"),
                node_host = node_host_input.val(),
                node_key_raw = node_key_input.val();
            if (inj(node_host)) return
            if (inj(node_key_raw)) return
            const host_length = node_host ? node_host.length : -1;
            if (host_length < 10) {
                popnotify("error", tl("selectlnhost", {
                    "imp": implementation
                }));
                node_host_input.focus();
                return
            }
            const node_key = (implementation === "core-lightning") ? node_key_raw : b64urldecode(node_key_raw);
            if (node_key) {
                const key_length = node_key.length;
                if (key_length < 5) {
                    const key_name = (implementation === "lnbits") ? "API key" : "Invoice Macaroon",
                        full_key_name = implementation + " " + key_name;
                    popnotify("error", tl("selectkeyname", {
                        "impkeyname": full_key_name
                    }));
                    node_key_input.focus();
                    return
                }
                if (key_length > 300) { // invoice macaroons should be less than 300 characters
                    popnotify("error", tl("entermacaroon"));
                    return
                }
                test_create_invoice(implementation, current_proxy, node_host, node_key);
            } else {
                popnotify("error", tl("invalidkeyformat"));
            }
            return
        }
        node_credentials.slideDown(200);
        proxy_switch.removeClass("true").addClass("false");
    } else {
        const node_selection = $("#ln_nodeselect").data();
        if (node_selection) {
            if (node_selection.live === "connection") {
                const node_services = lightning_data.services;
                if (empty_obj(node_services)) {
                    canceldialog();
                    return
                }
                const selected_service = fetch_node(node_services, node_selection.node_id),
                    current_node_id = $("#select_ln_node").data("node_id");
                if (!selected_service || (current_node_id == selected_service.node_id)) {
                    canceldialog();
                    return
                }
                lightning_item.data({
                    "selected": true,
                    "selected_service": selected_service
                }).find(".switchpanel").removeClass("false").addClass("true");
                canceldialog();
                notify(tl("datasaved"));
                save_cc_settings("bitcoin", true);
                cancelpd();
                return
            }
            if (node_selection.live === "lock") {
                notify(tl("proxylocked"));
                play_audio("funk");
                return
            }
            if (empty_obj(node_selection)) {
                canceldialog();
                return
            }
            const status_panel = $("#lnsettingsbox #ad_info_wrap .noln_ref:visible .switchpanel"),
                is_proxy_enabled = status_panel.hasClass("true"),
                proxy_action = is_proxy_enabled ? "disabling" : "enabling";
            notify(tl("proxyoffline", {
                "proxy_message": proxy_action
            }));
            play_audio("funk");
        }
    }
}

// Validates Lightning implementation by testing invoice creation capability
function test_create_invoice(implementation, proxy_data, node_host, node_key) {
    const is_onion_host = node_host && node_host.indexOf(".onion") > 0,
        proxy_details = proxy_data ? lnurl_deform(proxy_data.proxy) : false,
        proxy_url = proxy_details ? proxy_details.url : (is_onion_host ? d_proxy() : false),
        proxy_key = proxy_details ? proxy_details.k : false,
        lightning_item = get_lightning_settings(),
        lightning_data = lightning_item.data(),
        node_services = lightning_data.services,
        node_id_source = node_host ? (implementation === "lnbits" ? node_key : node_host) : proxy_url + implementation,
        node_id = sha_sub(node_id_source, 10),
        is_node_existing = objectkey_in_array(node_services, "node_id", node_id),
        default_error = tl("unabletoconnect"),
        unique_id = sha_sub(now_utc(), 10);
    if (is_node_existing) {
        popnotify("error", tl("proxynameexists", {
            "imp": implementation
        }));
        return
    }
    if (proxy_url) {
        loader(true);
        set_loader_text(tl("connecttolnur", {
            "url": truncate_middle(proxy_url)
        }));
        $.ajax({
            "method": "POST",
            "cache": false,
            "timeout": 20000,
            "url": proxy_url + "/proxy/v1/ln/api/",
            "data": {
                "imp": implementation,
                "host": node_host,
                "key": node_key,
                "fn": "ln-create-invoice",
                "amount": 10000,
                "memo": "test invoice " + implementation,
                "id": unique_id,
                "expiry": 180,
                "pingtest": true,
                "x-api": proxy_key
            }
        }).done(function(response) {
            closeloader();
            if (response) {
                const error = response.error;
                if (error) {
                    const error_message = error.message || (typeof error === "string" ? error : default_error),
                        error_code = error.code;
                    popnotify("error", error_message);
                    if (error_code && (error_code == 1 || error_code == 2)) {
                        setTimeout(function() {
                            prompt_proxy_unlock(proxy_data.id);
                        }, 500);
                    }
                    return
                }
                if (response.bolt11) {
                    const payment_type = response.type,
                        is_lnurl = payment_type === "lnurl",
                        tor = response.tor;
                    add_ln_imp(node_services, node_id, implementation, proxy_data, node_host, node_key, is_lnurl, tor);
                    return
                }
                popnotify("error", default_error);
                return
            }
            popnotify("error", default_error);
            return
        }).fail(function(xhr, status, error) {
            closeloader();
            popnotify("error", default_error);
        });
        return
    }

    const api_call_configs = {
        "lnd": {
            "api_url": node_host + "/v1/invoices",
            "data": {
                "value": 10000,
                "memo": "test invoice",
                "expiry": 180
            },
            "headers": {
                "Grpc-Metadata-macaroon": node_key
            },
            "successKey": "r_hash"
        },
        "core-lightning": {
            "api_url": node_host + "/v1/invoice",
            "data": {
                "amount_msat": 10000,
                "label": unique_id,
                "description": "test invoice",
                "expiry": 180
            },
            "headers": {
                "contentType": "application/json",
                "Rune": node_key,
            },
            "successKey": "payment_hash"
        },
        "lnbits": {
            "api_url": node_host + "/api/v1/payments",
            "data": {
                "out": false,
                "amount": 10000,
                "memo": "test invoice lnbits direct",
                "expiry": 180
            },
            "headers": {
                "X-Api-Key": node_key
            },
            "successKey": "payment_hash"
        }
    };

    if (api_call_configs[implementation]) {
        const api_params = api_call_configs[implementation];
        api_proxy({
            "proxy": false,
            "api_url": api_params.api_url,
            "params": {
                "method": "POST",
                "cache": false,
                "contentType": "application/json",
                "data": api_params.data,
                "headers": api_params.headers
            }
        }).done(function(response) {
            closeloader();
            if (response) {
                const error = response.error;
                if (error) {
                    const error_message = error.message || (typeof error === "string" ? error : default_error);
                    popnotify("error", error_message);
                    return
                }
                const invoice_connection = response[api_params.successKey];
                if (invoice_connection) {
                    add_ln_imp(node_services, node_id, implementation, false, node_host, node_key, false, is_onion_host);
                    return
                }
                popnotify("error", default_error);
            }
        }).fail(function(xhr, status, error) {
            closeloader();
            popnotify("error", default_error);
        });
    }
}

// Adds new Lightning implementation with proxy and credential configuration
function add_ln_imp(node_services, node_id, implementation, proxy_data, node_host, node_key, is_lnurl, tor) {
    const has_proxy = Boolean(proxy_data),
        proxy_details = has_proxy ? lnurl_deform(proxy_data.proxy) : false,
        proxy_url = has_proxy ? proxy_details.url : false,
        proxy_id = has_proxy ? proxy_data.id : false,
        node_name = node_host || proxy_url,
        lightning_item = get_lightning_settings(),
        new_service = {
            "imp": implementation,
            "node_id": node_id,
            "host": node_host,
            "key": node_key,
            "name": node_name,
            "proxy_id": proxy_id,
            "proxy": has_proxy,
            "lnurl": is_lnurl,
            tor
        };
    node_services.push(new_service);
    const updated_data = {
        "selected": true,
        "selected_service": new_service,
        "services": node_services
    };
    lightning_item.data(updated_data).find(".switchpanel").removeClass("false").addClass("true");
    save_cc_settings("bitcoin", true);
    const currency = "bitcoin",
        address_list = get_addresslist(currency).children("li");
    if (!address_list.length) {
        if (!set_up()) {
            save_settings();
            openpage("?p=home", "home", "loadpage");
        }
        const address_data = {
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
        append_address(currency, address_data);
        save_addresses(currency, true);
        currency_check(currency);
    }
    notify(tl("datasaved"));
    $("#dialogbody").slideUp(300, function() {
        render_lightning_interface(true);
    })
    cancelpd();
}

// ** Proxy Authentication: **

// Handles proxy unlock request from proxy selection interface
function unlock_proxy1() {
    $(document).on("click", "#lnd_proxy_select_input .options .opt_icon_box .icon-lock", function() {
        const selected_option = $(this).closest(".optionwrap");
        prompt_proxy_unlock(selected_option.data("pid"));
    })
}

// Handles proxy unlock request from node selection interface
function unlock_proxy2() {
    $(document).on("click", "#select_ln_node .options .opt_icon_box .icon-lock", function() {
        const selected_option = $(this).closest(".optionwrap");
        prompt_proxy_unlock(selected_option.data("proxy_id"));
    })
}

// Handles proxy unlock request from info panel
function unlock_proxy3() {
    $(document).on("click", "#lnsettingsbox #pw_unlock_info", function() {
        const proxy_id = $(this).attr("data-pid");
        prompt_proxy_unlock(proxy_id);
    })
}

// Handles proxy unlock request from invoices panel
function unlock_proxy4() {
    $(document).on("click", "#lnsettingsbox #pw_unlock_invoices", function() {
        const proxy_id = $(this).attr("data-pid");
        prompt_proxy_unlock(proxy_id);
    })
}

// Processes proxy unlock with password validation and connection testing
function prompt_proxy_unlock(proxy_id) {
    const lightning_item = get_lightning_settings(),
        lightning_data = lightning_item.data(),
        proxy_list = lightning_data.proxies,
        current_proxy = fetch_proxy(proxy_list, proxy_id);
    if (empty_obj(current_proxy)) {
        popnotify("error", tl("unknownproxy"));
        return
    }
    const proxy_details = lnurl_deform(current_proxy.proxy),
        proxy_url = proxy_details.url,
        proxy_password = prompt(tl("enterlnapikey", {
            "proxy": proxy_url
        })),
        proxy_key_hash = proxy_password ? sha_sub(proxy_password, 10) : false;
    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy_url + "/proxy/v1/ln/api/",
        "data": {
            "pingpw": true,
            "x-api": proxy_key_hash
        }
    }).done(function(response) {
        const api_result = br_result(response),
            result = api_result.result,
            error = result.error;
        if (error) {
            const default_error = tl("unabletoconnect"),
                error_message = error.message || (typeof error === "string" ? error : default_error);
            popnotify("error", error_message);
            return
        }
        if (result === "pong") {
            const updated_proxy_list = fetch_other_proxies(proxy_list, proxy_id),
                new_proxy = {
                    "proxy": lnurl_form(proxy_url, proxy_key_hash),
                    "id": proxy_id
                };
            const processed_proxy_list = get_default_object(updated_proxy_list),
                selected_proxy = lightning_data.selected_proxy,
                selected_proxy_id = selected_proxy.id;
            processed_proxy_list.push(new_proxy);
            const is_current_proxy = selected_proxy_id === proxy_id;
            lightning_item.data("proxies", processed_proxy_list);
            if (is_current_proxy) {
                lightning_item.data("selected_proxy", new_proxy);
            }
            save_cc_settings("bitcoin", true);
            notify(tl("proxyunlocked"));
            $("#dialogbody").slideUp(300, function() {
                render_lightning_interface(true);
            });
            return
        }
        popnotify("error", tl("unabletoconnectto", {
            "value": proxy_url
        }));
    }).fail(function(xhr, status, error) {
        popnotify("error", tl("unabletoconnect"));
    });
}

// ** Utility Functions: **

// Selects default or saved Lightning Network proxy
function lnd_pick_proxy() {
    const saved_proxy = s_lnd_proxy();
    return saved_proxy ? saved_proxy.proxy : d_proxy();
}

// Retrieves currently selected Lightning proxy from settings
function s_lnd_proxy() {
    const lightning_item = get_lightning_settings(),
        lightning_data = lightning_item.data();
    return lightning_data.selected_proxy || false;
}

// Checks if given host is localhost or 127.0.0.1
function is_local_node(host) {
    if (!host) return null;
    return host.includes("localhost") || host.includes("127.0.0.1");
}

// Cancels payment dialog when specific conditions are met
function cancelpd() {
    if (is_openrequest() === true) { // update request dialog
        cancel_paymentdialog();
    }
}

// Retrieves node by ID from node list
function fetch_node(node_services, node_id) {
    return node_services.find(node => node.node_id === node_id);
}

// Returns filtered list excluding specified node ID
function fetch_other_nodes(node_services, node_id) {
    return node_services.filter(node => node.node_id !== node_id);
}

// Retrieves proxy by ID from proxy list
function fetch_proxy(proxy_list, proxy_id) {
    return proxy_list.find(proxy => proxy.id === proxy_id);
}

// Returns filtered list excluding specified proxy ID
function fetch_other_proxies(proxy_list, proxy_id) {
    return proxy_list.filter(proxy => proxy.id !== proxy_id);
}

// Combines URL and password into encoded LNURL format
function lnurl_form(url, password) {
    const password_suffix = password ? "#" + password : "",
        full_url = url + password_suffix;
    return lnurl_encode("lnurl", full_url);
}

// Extracts URL and authentication key from LNURL string
function lnurl_deform(lnurl_string) {
    if (typeof lnurl_string !== "string") {
        console.error("error", "lnurl must be string")
        return false
    }
    if (lnurl_string.startsWith("lnurl")) {
        const decoded_url = lnurl_decode(lnurl_string).replace(/\0/g, ""),
            url_parts = decoded_url.split("#");
        return {
            "url": url_parts[0] || false,
            "k": url_parts[1] || false
        }
    }
    return {
        "url": lnurl_string,
        "pw": false
    }
}

// Formats URL for persistent storage with LNURL encoding
function lnurl_encode_save(url) {
    return url.startsWith("lnurl") ? url : lnurl_encode("lnurl", complete_url(url));
}

// Encodes data into LNURL format with specified prefix
function lnurl_encode(human_readable_part, url) {
    return bech32_encode(human_readable_part, to_words(buffer(url)));
}

// Decodes LNURL string to original data format
function lnurl_decode(lnurl) {
    return utf8_decoder.decode(uint_8array(from_words(lnurl_decodeb32(lnurl).data)));
}

// Decodes and sanitizes LNURL string
function lnurl_decode_c(lnurl) {
    return sanitize_string(lnurl_decode(lnurl));
}

// ** Node Status Functions: **

// Validates LNURL connectivity with status updates
function validate_lnurl_connection(lightning_node) {
    const implementation = lightning_node.imp || null,
        node_host = lightning_node.host || null,
        node_key = lightning_node.key || null,
        node_id = lightning_node.nid || null,
        proxy_details = lnurl_deform(lightning_node.proxy_host),
        proxy_host = proxy_details.url,
        proxy_key = proxy_details.k,
        proxy_url = proxy_host + "/proxy/v1/ln/api/";

    if (!proxy_host) {
        notify(tl("proxydatamissing"));
        return
    }

    $.ajax({
        "method": "POST",
        "cache": false,
        "timeout": 5000,
        "url": proxy_url,
        "data": {
            "fn": "ln-list-invoices",
            "imp": implementation,
            "host": node_host,
            "key": node_key,
            "nid": node_id,
            "pingtest": true,
            "x-api": proxy_key
        }
    }).done(function(response) {
        const error = response.error;
        if (error) {
            const default_error = tl("unabletoconnect"),
                error_message = error.message || (typeof error === "string" ? error : default_error);
            if (request.isrequest) {
                if (helper.lnd_only) {
                    topnotify(error_message);
                    br_offline(true);
                }
            } else {
                notify(error_message);
                $("#rq_errlog").append("<span class='rq_err'>" + error_message + "</span>");
            }
        }
        const node_metadata = response.mdat;
        if (node_metadata) {
            const is_connected = node_metadata.connected;
            if (is_connected) {
                helper.lnd_status = true;
                if (node_id) {
                    sessionStorage.setItem("lnd_timer_" + node_id, now_utc());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, status, error) {
        const error_object = xhr || status || error;
        proceed_pf({
            "error": error_object
        });
    });
}

// Verifies LND node connection and status
function check_lnd_status(lightning_node) {
    api_proxy({
        "proxy": false,
        "api_url": lightning_node.host + "/v1/invoices",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "Grpc-Metadata-macaroon": lightning_node.key
            }
        }
    }).done(function(response) {
        const node_data = br_result(response).result;
        if (node_data) {
            if (node_data.invoices) {
                helper.lnd_status = true;
                if (lightning_node.nid) {
                    sessionStorage.setItem("lnd_timer_" + lightning_node.nid, now_utc());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, status, error) {
        const error_object = xhr || status || error;
        proceed_pf({
            "error": error_object
        });
    });
}

function check_c_lightning_status(lightning_node) {
    api_proxy({
        "proxy": false,
        "api_url": lightning_node.host + "/v1/listinvoices",
        "params": {
            "method": "POST",
            "cache": false,
            "data": null,
            "headers": {
                "contentType": "application/json",
                "Rune": lightning_node.key
            }
        }
    }).done(function(response) {
        const node_data = br_result(response).result;
        if (node_data) {
            if (node_data.invoices) {
                helper.lnd_status = true;
                if (lightning_node.nid) {
                    sessionStorage.setItem("lnd_timer_" + lightning_node.nid, now_utc());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, status, error) {
        const error_object = xhr || status || error;
        proceed_pf({
            "error": error_object
        });
    });
}

// Verifies LNbits node connection and status
function check_lnbits_status(lightning_node) {
    api_proxy({
        "proxy": false,
        "api_url": lightning_node.host + "/api/v1/wallet",
        "params": {
            "method": "GET",
            "cache": false,
            "data": null,
            "headers": {
                "X-Api-Key": lightning_node.key
            }
        }
    }).done(function(response) {
        const node_data = br_result(response).result;
        if (node_data) {
            if (node_data.balance > -1) {
                helper.lnd_status = true;
                if (lightning_node.nid) {
                    sessionStorage.setItem("lnd_timer_" + lightning_node.nid, now_utc());
                }
            }
        }
        proceed_pf();
    }).fail(function(xhr, status, error) {
        const error_object = xhr || status || error;
        proceed_pf({
            "error": error_object
        });
    });
}

// Populates Lightning node credential fields based on implementation type
function set_ln_fields(implementation, rest_host, node_key) {
    if (implementation && rest_host && node_key) {
        const node_host_input = $("#lnd_credentials .cs_" + implementation + " .lnd_host"),
            node_key_input = $("#lnd_credentials .cs_" + implementation + " .invoice_macaroon");
        if (node_host_input.length && node_key_input.length) {
            node_host_input.val(rest_host);
            node_key_input.val(node_key);
            return true
        }
    }
    return false
}