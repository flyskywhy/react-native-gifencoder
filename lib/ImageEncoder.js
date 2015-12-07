import LZWEncoder from './LZWEncoder.js';
import NeuQuant from './NeuQuant.js';
import ByteArray from './ByteArray.js';

export function rgbaPixelsToRgbPixels(rgbaPixels) {
	const pixelCount = rgbaPixels.length / 4;
	const rgbPixels = new Uint8ClampedArray(pixelCount * 3);

	for (let i = 0; i < pixelCount; i++) {
		rgbPixels[i * 3 + 0] = rgbaPixels[i * 4 + 0];
		rgbPixels[i * 3 + 1] = rgbaPixels[i * 4 + 1];
		rgbPixels[i * 3 + 2] = rgbaPixels[i * 4 + 2];
	}

	return rgbPixels;
}

export function findClosestColorIndex(colorTable, color, usedEntry) {
	if (!colorTable) {
		return -1;
	}

	const r = (color & 0xFF0000) >> 16;
	const g = (color & 0x00FF00) >> 8;
	const b = (color & 0x0000FF);

	var minpos = 0;
	var dmin = 256 * 256 * 256;
	var len = colorTable.length;

	for (var i = 0; i < len;) {
		var dr = r - (colorTable[i++] & 0xff);
		var dg = g - (colorTable[i++] & 0xff);
		var db = b - (colorTable[i] & 0xff);
		var d = dr * dr + dg * dg + db * db;
		var index = i / 3;
		if (usedEntry[index] && (d < dmin)) {
			dmin = d;
			minpos = index;
		}
		i++;
	}
	return minpos;
}

export function analyzePixels(pixels, sample, usedEntry) {
	var len = pixels.length;
	var nPix = len / 3;
	const indexedPixels = [];
	var nq = new NeuQuant(pixels, len, sample);

	// initialize quantizer
	const colorTab = nq.process(); // create reduced palette

	// map image pixels to new palette
	var k = 0;
	for (var j = 0; j < nPix; j++) {
		var index = nq.map(pixels[k++] & 0xff, pixels[k++] & 0xff, pixels[k++] & 0xff);
		usedEntry[index] = true;
		indexedPixels[j] = index;
	}

	return [colorTab, indexedPixels];
}

export default class ImageEncoder {
  constructor() {
    this.usedEntry = [];
  }

  encodeImage(rgbaPixels, sample, width, height, transparentColor) {
    // Remove alpha channel from pixel array
    const rgbPixels = rgbaPixelsToRgbPixels(rgbaPixels);

    // Analyze pixels
    const [
      localColorTable,
      indexedPixels,
    ] = analyzePixels(rgbPixels, sample, this.usedEntry);

    // Encode the pixels
    const tableBasedImageDataBytes = new ByteArray();
    var lzwEncoder = new LZWEncoder(width, height, indexedPixels, 8);
    lzwEncoder.encode(tableBasedImageDataBytes);

    // Get closest match to the specified transparent color
    let transparentColorIndex;
    if (transparentColor !== undefined) {
      transparentColorIndex = findClosestColorIndex(localColorTable, transparentColor, this.usedEntry);
    }

    return [
      localColorTable,
      transparentColorIndex,
      tableBasedImageDataBytes.bytes,
    ];
  }
}
