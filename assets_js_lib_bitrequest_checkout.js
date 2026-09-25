(function() {
    const root_html = document.documentElement,
        b_url = (function() {
            const here = document.currentScript && document.currentScript.src;
            if (here) {
                try {
                    return new URL(here).origin;
                } catch (e) {}
            }
            // Fallback: locate this helper by filename in the script tag list.
            const scripts = document.getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                const src = scripts[i].src || "";
                if (src.indexOf("assets_js_lib_bitrequest_checkout.js") !== -1) {
                    try {
                        return new URL(src).origin;
                    } catch (e) {}
                }
            }
            return "https://bitrequest.github.io";
        })();

    function init() {
        document.addEventListener("click", function(e) {
            // Logic for checkout button clicks
            if (e.target.matches(".br_checkout")) {
                e.preventDefault();
                checkout(e.target);
            }
            // Logic for closing the loader
            if (e.target.matches("#br_loadbox")) {
                closeloader();
            }
        });
        window.addEventListener("message", crossframe);
        keyup();
    }

    // Handles the checkout process when a checkout button is clicked.
    function checkout(clicked_elem) {
        const request_url = clicked_elem.getAttribute("href");
        let request_origin = null;
        try {
            request_origin = new URL(request_url, document.baseURI).origin;
        } catch (e) {}
        if (request_origin !== b_url) {
            console.error("Invalid request URL:", request_url);
            return
        }
        let payment_frame = document.querySelector("#br_framebox iframe");
        showloader();
        if (payment_frame) {
            payment_frame.setAttribute("src", request_url);
        } else {
            append_iframe(request_url);
        }
    }

    // Appends an iframe to the body with the given source URL.
    function append_iframe(frame_url) {
        const framebox = document.createElement("div"),
            frame = document.createElement("iframe");
        framebox.id = "br_framebox";
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
        frame.src = frame_url;
        framebox.appendChild(frame);
        document.body.appendChild(framebox);
        document.body.insertAdjacentHTML("beforeend", "<div id='br_loadbox'><div id='br_loadpanel'><div id='br_loader'></div><p>Loading request...</p></div></div>");
        iframe_loaded();
    }

    // Sets up a load event listener for the newly created iframe.
    function iframe_loaded() {
        const payment_frame = document.querySelector("#br_framebox iframe");
        payment_frame.addEventListener("load", () => {
            const frame_url = payment_frame.getAttribute("src");
            if (frame_url && frame_url !== b_url) {
                showframe();
            }
        });
    }

    // Handles cross-frame communication from the iframe.
    function crossframe(e) {
        // Check origin to prevent unauthorized messages
        if (e.origin !== b_url) {
            return
        }
        const message = e.data;
        switch (message) {
            case "close_loader":
                closeloader();
                break;
            case "close_request_confirm":
                setTimeout(closeframe_confirm, 200);
                break;
            case "close_request":
                setTimeout(closeframe, 200);
                break;
            default:
                // Check for object messages like the result callback.
                if (message && message.id === "result") {
                    const callback = typeof window.result_callback === "function" ? window.result_callback : default_result_callback;
                    callback(message.data);
                }
        }
    }

    // Default result handler. Define your own global `function result_callback(post_data) {}` to receive results.
    // The result is a UX signal (close the dialog, show a thank-you), NOT proof of payment: any script on your
    // page, including the customer's own browser console, can call your callback with made-up data.
    // Before fulfilling an order, verify the payment server-side (txhash, receiving address, amount, confirmations).
    function default_result_callback(post_data) {
        console.log("Define a global result_callback(post_data) function to handle payment results");
        console.log(post_data);
    }

    // Shows the iframe by adding CSS classes to the root HTML element.
    function showframe() {
        root_html.classList.add("showframe", "zoomframe");
    }

    // Prompts for confirmation before closing the iframe.
    function closeframe_confirm() {
        if (confirm("Close request?")) {
            closeframe();
        }
    }

    // Closes the iframe by removing CSS classes.
    function closeframe() {
        if (root_html.classList.contains("zoomframe")) {
            root_html.classList.remove("zoomframe");
            setTimeout(() => {
                root_html.classList.remove("showframe");
                const payment_frame = document.querySelector("#br_framebox iframe");
                if (payment_frame) {
                    payment_frame.setAttribute("src", b_url);
                }
            }, 400);
        }
    }

    // Shows the loader by adding CSS classes.
    function showloader() {
        root_html.classList.add("slide_loader", "fade_loader");
    }

    // Closes the loader by removing CSS classes.
    function closeloader() {
        if (root_html.classList.contains("fade_loader")) {
            root_html.classList.remove("fade_loader");
            setTimeout(() => {
                root_html.classList.remove("slide_loader");
            }, 1000);
        }
    }

    // Sets up a keyup event listener for the ESC key.
    function keyup() {
        document.addEventListener("keyup", function(e) {
            if (e.key === "Escape" || e.keyCode === 27) {
                if (root_html.classList.contains("slide_loader")) {
                    closeloader();
                    return; // Exit early to prevent fall-through
                }
                if (root_html.classList.contains("showframe")) {
                    closeframe_confirm();
                }
            }
        });
    }

    // Also works when the script is loaded async or injected after DOMContentLoaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();