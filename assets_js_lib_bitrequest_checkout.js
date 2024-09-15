const html_node = $("html");

$(document).ready(function() {
    checkout();
    window.addEventListener("message", crossframe);
    keyup();
    closeloader_trigger();
});

// Handles the checkout process when a checkout button is clicked
function checkout() {
    $(document).on("click", ".br_checkout", function(e) {
        e.preventDefault();
        const checkout_url = $(this).attr("href"),
            br_frame = $("#br_framebox iframe");
        if (br_frame.length > 0) {
            showloader();
            br_frame.attr("src", checkout_url);
        } else {
            append_iframe(checkout_url);
            showloader();
        }
    });
}

// Appends an iframe to the body with the given source URL
function append_iframe(framesrc) {
    $("body").append("<div id='br_framebox'><iframe src='" + framesrc + "'></iframe></div><div id='br_loadbox'><div id='br_loadpanel'><div id='br_loader'></div><p>Loading request...</p></div></div>");
    iframe_loaded();
}

// Sets up a load event listener for the iframe
function iframe_loaded() {
    const requestframe = $("#br_framebox iframe");
    requestframe.on("load", function() {
        if (requestframe.attr("src") !== undefined) {
            showframe();
        }
    });
}

// Handles cross-frame communication
function crossframe(e) {
    const data = e.data;
    if (data == "close_loader") {
        closeloader();
        return
    }
    if (data == "close_request_confirm") {
        setTimeout(function() {
            closeframe_confirm();
        }, 200);
        return
    }
    if (data == "close_request") {
        setTimeout(function() {
            closeframe();
        }, 200);
        return
    }
    if (data.id == "result") {
        result_callback(data.data);
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
    html_node.addClass("showframe zoomframe");
}

// Prompts for confirmation before closing the frame
function closeframe_confirm() {
    const result = confirm("Close request?");
    if (result === true) {
        closeframe();
    }
}

// Closes the iframe by removing CSS classes
function closeframe() {
    if (html_node.hasClass("zoomframe")) {
        html_node.removeClass("zoomframe");
        setTimeout(function() {
            html_node.removeClass("showframe");
            $("#br_framebox iframe").removeAttr("src");
        }, 400);
    }
}

// Shows the loader by adding CSS classes
function showloader() {
    html_node.addClass("slide_loader fade_loader");
}

// Sets up a click event listener to close the loader
function closeloader_trigger() {
    $(document).on("click", "#br_loadbox", function() {
        closeloader();
    });
}

// Closes the loader by removing CSS classes
function closeloader() {
    if (html_node.hasClass("fade_loader")) {
        html_node.removeClass("fade_loader");
        setTimeout(function() {
            html_node.removeClass("slide_loader");
        }, 1000);
    }
}

// Sets up a keyup event listener for the ESC key
function keyup() {
    $(document).keyup(function(e) {
        if (e.keyCode == 27) {
            if (html_node.hasClass("slide_loader")) {
                closeloader();
                return false;
            }
            if (html_node.hasClass("showframe")) {
                closeframe_confirm();
                return false;
            }
        }
    });
}