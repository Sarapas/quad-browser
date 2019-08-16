(function() {
    let doc = document;

    // NFL GamePass video tag is in an iframe
    let frames = document.querySelectorAll('#divaIFrame');
    if (frames && frames.length && frames[0].contentWindow && frames[0].contentWindow.document) {
        doc = frames[0].contentWindow.document;
    }

    if (doc.webkitExitFullscreen)
        doc.webkitExitFullscreen();
})();