const root_html = document.documentElement,
    b_url = "https://bitrequest.github.io";

document.addEventListener("DOMContentLoaded", function() {
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
});

// Handles the checkout process when a checkout button is clicked.
function checkout(clicked_elem) {
    const request_url = clicked_elem.getAttribute("href");
    // Sanitize URL: Ensure it starts with BASE_URL to prevent open redirects/XSS
    if (!request_url.startsWith(b_url)) {
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
    const framebox = "<div id='br_framebox'><iframe src='" + frame_url + "' sandbox='allow-scripts allow-same-origin allow-popups'></iframe></div><div id='br_loadbox'><div id='br_loadpanel'><div id='br_loader'></div><p>Loading request...</p></div></div>";
    // Insert the new elements at the end of the body.
    document.body.insertAdjacentHTML("beforeend", framebox);
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
        console.warn("Message from untrusted origin:", e.origin);
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
                result_callback(message.data);
            }
    }
}

// Placeholder function for handling result data.
function result_callback(post_data) {
    // Overwrite this function for your callback.
    console.log("Overwrite this function for your callback");
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