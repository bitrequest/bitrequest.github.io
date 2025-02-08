const root_html = document.documentElement,
    base_url = "https://bitrequest.github.io";

document.addEventListener("DOMContentLoaded", function() {
    checkout();
    window.addEventListener("message", crossframe);
    keyup();
    closeloader_trigger();
});

// Handles the checkout process when a checkout button is clicked
function checkout() {
    document.addEventListener("click", function(e) {
        const clicked_elem = e.target;
        if (!clicked_elem.matches(".br_checkout")) return;
        e.preventDefault();
        const request_url = clicked_elem.getAttribute("href"),
            payment_frame = document.querySelector("#br_framebox iframe");
        if (payment_frame) {
            showloader();
            payment_frame.setAttribute("src", request_url);
        } else {
            append_iframe(request_url);
            showloader();
        }
    });
}

// Appends an iframe to the body with the given source URL
function append_iframe(frame_url) {
    const container = document.createElement("div");
    container.innerHTML = "<div id='br_framebox'><iframe src='" + frame_url + "'></iframe></div><div id='br_loadbox'><div id='br_loadpanel'><div id='br_loader'></div><p>Loading request...</p></div></div>";
    document.body.appendChild(container.firstElementChild);
    iframe_loaded();
}

// Sets up a load event listener for the iframe
function iframe_loaded() {
    const payment_frame = document.querySelector("#br_framebox iframe");
    payment_frame.addEventListener("load", function() {
        const frame_url = payment_frame.getAttribute("src");
        if (frame_url) {
            if (frame_url === base_url) {
                return
            }
            showframe();
        }
    });
}

// Handles cross-frame communication
function crossframe(e) {
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
            if (message.id === "result") {
                result_callback(message.data);
            }
    }
}

// Placeholder function for handling result data
function result_callback(post_data) {
    // overwrite this function for your callback
    console.log("overwrite this function for your callback");
    console.log(post_data);
}

// Shows the iframe by adding CSS classes
function showframe() {
    root_html.classList.add("showframe", "zoomframe");
}

// Prompts for confirmation before closing the frame
function closeframe_confirm() {
    if (confirm("Close request?")) {
        closeframe();
    }
}

// Closes the iframe by removing CSS classes
function closeframe() {
    if (root_html.classList.contains("zoomframe")) {
        root_html.classList.remove("zoomframe");
        setTimeout(function() {
            root_html.classList.remove("showframe");
            const payment_frame = document.querySelector("#br_framebox iframe");
            if (payment_frame) {
                payment_frame.setAttribute("src", base_url);
            }
        }, 400);
    }
}

// Shows the loader by adding CSS classes
function showloader() {
    root_html.classList.add("slide_loader", "fade_loader");
}

// Sets up a click event listener to close the loader
function closeloader_trigger() {
    document.addEventListener("click", function(e) {
        if (e.target.matches("#br_loadbox")) {
            closeloader();
        }
    });
}

// Closes the loader by removing CSS classes
function closeloader() {
    if (root_html.classList.contains("fade_loader")) {
        root_html.classList.remove("fade_loader");
        setTimeout(function() {
            root_html.classList.remove("slide_loader");
        }, 1000);
    }
}

// Sets up a keyup event listener for the ESC key
function keyup() {
    document.addEventListener("keyup", function(e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            if (root_html.classList.contains("slide_loader")) {
                closeloader();
                return
            }
            if (root_html.classList.contains("showframe")) {
                closeframe_confirm();
                return
            }
        }
    });
}