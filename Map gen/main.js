function checkVisible(elm) {
    var offset = $(elm).offset();
    var top = offset.top,
        bottom = offset.top + $(elm).outerHeight();
    var btmscreen = $(window).scrollTop() + $(window).innerHeight();
    var topscreen = $(window).scrollTop();

    var left = offset.left,
        right = offset.left + $(elm).outerWidth();
    var leftscreen = $(window).scrollLeft();
    var rghtscreen = $(window).scrollLeft() + $(window).innerWidth();

    return (btmscreen > top) && (topscreen < bottom) && rghtscreen > right && leftscreen < left;
}

// Copy Text to Clipboard from https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function() {
        console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
        console.error('Async: Could not copy text: ', err);
    });
}

var lhmap, map = false;

try {
    map = new URLSearchParams(window.location.search).get("map");
} catch (e) {}
lhmap = new LHMap(map);

var callback = function() {
    $('html, body').scrollTop($(document).height());

    var dp = document.getElementsByClassName("d-pad")[0];
    dp.style.left = LHMap.settings.mousepadposition.value.left + "px";
    dp.style.top = LHMap.settings.mousepadposition.value.top + "px";
    dp.style.display = LHMap.settings.showmousepad.value ? "block" : "none";
    document.getElementById('map').appendChild(lhmap.canvas);
    document.getElementById('pots').appendChild(lhmap.displaypots);
    document.getElementById('defenders').appendChild(lhmap.displaydefenders);
    document.getElementById('ratio').appendChild(lhmap.displayratio);
    document.getElementById('gpots').appendChild(lhmap.globalpots);
    document.getElementById('gdefenders').appendChild(lhmap.globaldefenders);
    document.getElementById('gratio').appendChild(lhmap.globalratio);
    document.querySelector("#settings-modal .modal-body").appendChild(LHMap.settings.generateTable());
    //document.getElementById('open-copy-mdl').addEventListener('click', function() {
    //    var img = document.querySelector("#copy-modal img");
    //    img.src = lhmap.canvas.toDataURL();
    //})
    document.querySelectorAll(".close").forEach(e => {
        e.addEventListener('click', function(evt) {
            document.querySelector(evt.target.dataset.for).style.display = "none";
        });
    });
    document.querySelectorAll(".open-modal").forEach(e => {
        e.addEventListener('click', function(evt) {
            document.querySelector(evt.target.dataset.for).style.display = "block";
        });
    });

    document.addEventListener('copy', function(evt) {
        document.getElementById('copy-modal').style.display = 'none';
    });

    window.addEventListener('click', function(evt) {
        if (evt.target.classList.contains("modal")) {
            evt.target.style.display = "none";
        }
    });

    window.addEventListener('keyup', e => {
        var keymodal = document.getElementById("keybind-modal");
        if (keymodal.style.display == "block") {
            if (e.key == "Escape")
                LHMap.settings[keymodal.dataset.key].value = "None";
            else {
                LHMap.settings[keymodal.dataset.key].value = e.key;

                var values = Object.values(LHMap.settings);
                for (var obj in values) {
                    if (values[obj] != LHMap.settings[keymodal.dataset.key] &&
                        values[obj].value == e.key)
                        values[obj].value = "None";
                }
            }
            LHMap.settings.save();

            document.getElementById("keybind-" + keymodal.dataset.key)
            keymodal.style.display = "none";

            var table = document.querySelector("#settings-modal table");
            table.remove();
            document.querySelector("#settings-modal .modal-body").appendChild(LHMap.settings.generateTable());
        }
    });

    document.getElementsByClassName('d-pad')[0].addEventListener('dragstart', e => {
        var mid = document.querySelector(".d-pad .center");
        if (e.target.querySelector(":hover") !== mid) {
            e.preventDefault();
            return false;
        }
        document.getElementsByClassName('d-pad')[0].classList.add('moving');
        var style = window.getComputedStyle(e.target, null);
        e.dataTransfer.setData("text/plain", (parseInt(style.getPropertyValue("left"), 10) - e.clientX) + "," +
            (parseInt(style.getPropertyValue("top"), 10) - e.clientY));
    }, false);

    var startpos = { x: 0, y: 0 }
    window.addEventListener('drop', e => {
        var offset = e.dataTransfer.getData("text/plain").split(',');
        var dpad = document.getElementsByClassName("d-pad")[0];
        dpad.classList.remove('moving');

        dpad.style.left = e.clientX + parseInt(offset[0], 10) + 'px';
        dpad.style.top = e.clientY + parseInt(offset[1], 10) + 'px';

        LHMap.settings.mousepadposition.value.top = e.clientY + parseInt(offset[1], 10);
        LHMap.settings.mousepadposition.value.left = e.clientX + parseInt(offset[0], 10);
        LHMap.settings.save();

        e.preventDefault();
        return false;
    }, false);

    var ignore_touch = false;
    window.addEventListener('touchstart', e => {
        var touch = (e.touches[0] || e.changedTouches[0]);
        if (!touch && e.originalEvent)
            touch = e.originalEvent.touches[0] || e.originalEvents.changedTouches[0];
        if (e.path[0] !== document.querySelector('.d-pad .center'))
            ignore_touch = true;
        else {
            ignore_touch = false;
            document.getElementsByClassName('d-pad')[0].classList.add('moving');
            //setdpadpos(e);
            startpos.x = touch.pageX;
            startpos.y = touch.pageY;
            e.preventDefault();
            e.stopPropagation();
        }
    }, false);
    window.addEventListener('touchmove', e => {
        if (ignore_touch)
            return;
        setdpadpos(e);
        e.preventDefault();
    })

    var offset_center = window.screen.orientation.angle ? { x: 100, y: 100 } : { x: 100, y: 10 };

    function resetdpad() {
        if (!checkVisible($(".d-pad .center")[0])) {
            $(".d-pad").css({ left: '200px', top: '200px' })
            LHMap.settings.mousepadposition.value.top = 200;
            LHMap.settings.mousepadposition.value.left = 200;
            LHMap.settings.save();
        }
    }
    window.addEventListener("orientationchange", e => {
        $('html, body').scrollTop($(document).height());

        if (e.target.screen.orientation.angle) {
            offset_center = { x: 100, y: 100 };
        } else {
            offset_center = { x: 100, y: 10 };
        }
        setTimeout(resetdpad, 50);
    })

    function setdpadpos(e) {
        var dpad = document.getElementsByClassName('d-pad')[0];
        var touch = (e.touches[0] || e.changedTouches[0]);
        if (!touch && e.originalEvent)
            touch = e.originalEvent.touches[0] || e.originalEvents.changedTouches[0];
        dpad.style.left = (touch.pageX - offset_center.x) + 'px';
        dpad.style.top = (touch.pageY - offset_center.y) + 'px';

        LHMap.settings.mousepadposition.value.top = (touch.pageY - offset_center.y);
        LHMap.settings.mousepadposition.value.left = (touch.pageX - offset_center.x);
        LHMap.settings.save();
    }

    window.addEventListener('touchend', e => {
        ignore_touch = false;
        var touch = (e.touches[0] || e.changedTouches[0]);
        if (!touch && e.originalEvent)
            touch = e.originalEvent.touches[0] || e.originalEvents.changedTouches[0];
        document.getElementsByClassName('d-pad')[0].classList.remove('moving');
        if (e.path[0].classList.contains("arrow")) {
            e.path[0].click();
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
        if (e.path[0] == document.querySelector(".d-pad .center") &&
            LHMap.settings.toggledpadcenterproc.value &&
            startpos.x == touch.pageX &&
            startpos.y == touch.pageY) {
            lhmap.setup();
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    }, false);

    window.addEventListener('dragover', e => {
        e.preventDefault();
        return false;
    }, false);



    if (Settings.settingsChanged)
        document.getElementById("settings-changed-modal").style.display = "block";
};

if (
    document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
    callback();
} else {
    document.addEventListener("DOMContentLoaded", callback);
}

function showImage() {
    var win = window.open(null, "_blank");
    win.document.write(`<iframe src="${lhmap.canvas.toDataURL('image/png')}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
}