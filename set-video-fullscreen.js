(function() {
    let doc = document;

    // NFL GamePass video tag is in an iframe
    let frames = document.querySelectorAll('#divaIFrame');
    if (frames && frames.length && frames[0].contentWindow && frames[0].contentWindow.document) {
        doc = frames[0].contentWindow.document;
    }

    let videos = doc.querySelectorAll('video');
    if (!videos || !videos.length)
        return;

    let video = videos[0];
    if (video.webkitRequestFullscreen)
        video.webkitRequestFullscreen();
})();