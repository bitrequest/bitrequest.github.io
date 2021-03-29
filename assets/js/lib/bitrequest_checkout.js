$(document).ready(function() {
    checkout();
    window.addEventListener("message", crossframe);
    keyup();
    closeframe_trigger();
    closeloader_trigger();
});

function checkout() {
    $(document).on("click", ".br_checkout", function(e) {
        e.preventDefault();
        var checkout_url = $(this).attr("href"),
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

function append_iframe(framesrc) {
    $("body").append("<div id='br_framebox'><iframe src='" + framesrc + "'></iframe><div id='br_closeframe' class='br_close_overlay'>Close</div></div><div id='br_loadbox'><div id='br_loadpanel'><div id='br_loader'></div><p>Loading request...</p></div></div>");
    iframe_loaded();
}

function iframe_loaded() {
    var requestframe = $("#br_framebox iframe");
    requestframe.on("load", function() {
        if (requestframe.attr("src") !== undefined) {
            showframe();
        }
    });
}

function crossframe(e) {
    var data = e.data;
    if (data == "close_loader") {
        closeloader();
    } else if (data.id == "result") {
        result_callback(data.data);
    }
}

function result_callback(post_data) {
    // put you callback function here
    console.log("put you callback function here");
    console.log(post_data);
    closeframe();
}

function showframe() {
    $("html").addClass("showframe zoomframe");
}

function closeframe_trigger() {
    $(document).on("click", "#br_closeframe", function() {
        closeframe_confirm();
    });
}

function closeframe_confirm() {
    var result = confirm("Close request?");
    if (result === true) {
        closeframe();
    }
}

function closeframe() {
    var html_node = $("html");
    if (html_node.hasClass("zoomframe")) {
        html_node.removeClass("zoomframe");
        setTimeout(function() {
            html_node.removeClass("showframe");
            $("#br_framebox iframe").removeAttr("src");
        }, 400);
    }
}

function showloader() {
    $("html").addClass("slide_loader fade_loader");
}

function closeloader_trigger() {
    $(document).on("click", "#br_loadbox", function() {
        closeloader();
    });
}

function closeloader() {
    var html_node = $("html");
    if (html_node.hasClass("fade_loader")) {
        html_node.removeClass("fade_loader");
        setTimeout(function() {
            html_node.removeClass("slide_loader");
        }, 1000);
    }
}

function keyup() {
    $(document).keyup(function(e) {
        if (e.keyCode == 27) {
            if (html.hasClass("slide_loader")) {
                closeloader();
                return false;
            }
            if (html.hasClass("showframe")) {
                closeframe_confirm();
                return false;
            }
        }
    });
}