const request = require('request');
const fs = require('fs');
const encode = require('image-encode');
const decodeIco = require('decode-ico')
const arrayBufferToBuffer = require('arraybuffer-to-buffer');
const util = require('electron-util');

function icoToPng (source, size) {
    const images = decodeIco(source);
    let arrayBuffer = encode(images[0], [ size, size ], 'png');
    var buffer = arrayBufferToBuffer(arrayBuffer);

  return buffer;
}

function downloadFile(file_url , targetDir, targetFile, downloadedCallback){
    // Save variable to know progress
    var received_bytes = 0;
    var total_bytes = 0;

    var req = request({
        method: 'GET',
        uri: file_url
    });

    if (!fs.existsSync(targetDir)){
        fs.mkdirSync(targetDir);
    }

    var out = fs.createWriteStream(`${targetDir}/${targetFile}`);
    req.pipe(out);

    req.on('response', function ( data ) {
        // Change the total bytes value to get progress later.
        total_bytes = parseInt(data.headers['content-length' ]);
    });

    req.on('data', function(chunk) {
        // Update the received bytes
        received_bytes += chunk.length;
        //var percentage = (received_bytes * 100) / total_bytes;
        //console.log(percentage + "% | " + received_bytes + " bytes out of " + total_bytes + " bytes.");
    });

    req.on('end', function() {
        if (downloadedCallback) {
            downloadedCallback();
        }
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function centerWindowToParentWindow(parent, child) {
    let parentBounds = parent.getBounds();
    let childBounds = child.getBounds();
    childBounds.x = parentBounds.x + Math.floor((parentBounds.width - childBounds.width) / 2);
    childBounds.y = parentBounds.y + Math.floor((parentBounds.height - childBounds.height) / 2);
    child.setBounds(childBounds);
}

function isBoundsEqual(b1, b2) {
    return b1 && b2 && b1.x === b2.x && b1.y === b2.y && b1.width === b2.width && b1.height === b2.height; 
}

function getNumberFromKey(keycode) {
    if (!keycode)
        return null;

    let number = -1;

    if (util.is.windows) {
        const winNumberKeyCodes = [ 48, 49, 50, 51, 52, 53, 54, 55, 56, 57 ];
        number = winNumberKeyCodes.indexOf(keycode);
    } else if (util.is.macos) {
        const macNumberKeyCodes = [ 29, 18, 19, 20, 21, 23, 22, 26, 28, 25 ];
        number = macNumberKeyCodes.indexOf(keycode);
    }

    if (number < 0)
        return null;

    return number;
}

var exports = module.exports = {
    newGuid: uuidv4,
    downloadFile: downloadFile,
    icoToPng: icoToPng,
    centerWindowToParentWindow: centerWindowToParentWindow,
    isBoundsEqual: isBoundsEqual,
    getNumberFromKey: getNumberFromKey
};