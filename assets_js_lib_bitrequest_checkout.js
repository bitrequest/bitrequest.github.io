const html_node = document.documentElement,
    b_url = "https://bitrequest.github.io";

document.addEventListener("DOMContentLoaded", function() {
    checkout();
    window.addEventListener("message", crossframe);
    keyup();
    closeloader_trigger();
});

// Handles the checkout process when a checkout button is clicked
function checkout() {
    document.addEventListener("click", function(e) {
        const target = e.target;
        if (!target.matches(".br_checkout")) return;
        e.preventDefault();
        const checkout_url = target.getAttribute("href"),
            br_frame = document.querySelector("#br_framebox iframe");
        if (br_frame) {
            showloader();
            br_frame.setAttribute("src", checkout_url);
        } else {
            append_iframe(checkout_url);
            showloader();
        }
    });
}

// Appends an iframe to the body with the given source URL
function append_iframe(framesrc) {
    const div = document.createElement("div");
    div.innerHTML = "<div id='br_framebox'><iframe src='" + framesrc + "'></iframe></div><div id='br_loadbox'><div id='br_loadpanel'><div id='br_loader'></div><p>Loading request...</p></div></div>";
    document.body.appendChild(div.firstElementChild);
    iframe_loaded();
}

// Sets up a load event listener for the iframe
function iframe_loaded() {
    const requestframe = document.querySelector("#br_framebox iframe");
    requestframe.addEventListener("load", function() {
        const frame_source = requestframe.getAttribute("src");
        if (frame_source) {
            if (frame_source === b_url) {
                return
            }
            showframe();
        }
    });
}

// Handles cross-frame communication
function crossframe(e) {
    const data = e.data;
    switch (data) {
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
            if (data.id === "result") {
                result_callback(data.data);
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
    html_node.classList.add("showframe", "zoomframe");
}

// Prompts for confirmation before closing the frame
function closeframe_confirm() {
    if (confirm("Close request?")) {
        closeframe();
    }
}

// Closes the iframe by removing CSS classes
function closeframe() {
    if (html_node.classList.contains("zoomframe")) {
        html_node.classList.remove("zoomframe");
        setTimeout(function() {
            html_node.classList.remove("showframe");
            const iframe = document.querySelector("#br_framebox iframe");
            if (iframe) {
                iframe.setAttribute("src", b_url);
            }
        }, 400);
    }
}

// Shows the loader by adding CSS classes
function showloader() {
    html_node.classList.add("slide_loader", "fade_loader");
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
    if (html_node.classList.contains("fade_loader")) {
        html_node.classList.remove("fade_loader");
        setTimeout(function() {
            html_node.classList.remove("slide_loader");
        }, 1000);
    }
}

// Sets up a keyup event listener for the ESC key
function keyup() {
    document.addEventListener("keyup", function(e) {
        if (e.key === "Escape" || e.keyCode === 27) {
            if (html_node.classList.contains("slide_loader")) {
                closeloader();
                return
            }
            if (html_node.classList.contains("showframe")) {
                closeframe_confirm();
                return
            }
        }
    });
}