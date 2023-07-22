const fs = require('fs');
const sharp = require('sharp');

function any2webp(input, output) {
  return new Promise((resolve, reject) => {
    // Create a Readable Stream from the input file
    const source = fs.createReadStream(input);

    // Create a Writable Stream to write the output WebP file
    const dest = fs.createWriteStream(output);

    // Handle success and error events
    dest.on('finish', () => {
      resolve(output);
    });

    dest.on('error', (error) => {
      reject(error);
    });

    source.pipe(sharp().webp()).pipe(dest);
  });
}

module.exports = { any2webp };
