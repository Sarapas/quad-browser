var request = require('request');
var fs = require('fs');

function downloadFile(file_url , targetDir, targetFile){
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

        showProgress(received_bytes, total_bytes);
    });

    req.on('end', function() {
    });
}

function showProgress(received,total){
    var percentage = (received * 100) / total;
    console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
}

var exports = (module.exports = {
    downloadFile: downloadFile
});