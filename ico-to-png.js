const encode = require('image-encode');
const decodeIco = require('decode-ico')
var arrayBufferToBuffer = require('arraybuffer-to-buffer');

module.exports = function icoToPng (source, size) {
    const images = decodeIco(source);
    let arrayBuffer = encode(images[0], [ size, size ], 'png');
    var buffer = arrayBufferToBuffer(arrayBuffer);

  return buffer;
}