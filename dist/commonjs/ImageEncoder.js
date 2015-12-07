'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.rgbaPixelsToRgbPixels = rgbaPixelsToRgbPixels;
exports.findClosestColorIndex = findClosestColorIndex;
exports.analyzePixels = analyzePixels;

var _LZWEncoder = require('./LZWEncoder.js');

var _LZWEncoder2 = _interopRequireDefault(_LZWEncoder);

var _NeuQuant = require('./NeuQuant.js');

var _NeuQuant2 = _interopRequireDefault(_NeuQuant);

var _ByteArray = require('./ByteArray.js');

var _ByteArray2 = _interopRequireDefault(_ByteArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function rgbaPixelsToRgbPixels(rgbaPixels) {
	var pixelCount = rgbaPixels.length / 4;
	var rgbPixels = new Uint8ClampedArray(pixelCount * 3);

	for (var i = 0; i < pixelCount; i++) {
		rgbPixels[i * 3 + 0] = rgbaPixels[i * 4 + 0];
		rgbPixels[i * 3 + 1] = rgbaPixels[i * 4 + 1];
		rgbPixels[i * 3 + 2] = rgbaPixels[i * 4 + 2];
	}

	return rgbPixels;
}

function findClosestColorIndex(colorTable, color, usedEntry) {
	if (!colorTable) {
		return -1;
	}

	var r = (color & 0xFF0000) >> 16;
	var g = (color & 0x00FF00) >> 8;
	var b = color & 0x0000FF;

	var minpos = 0;
	var dmin = 256 * 256 * 256;
	var len = colorTable.length;

	for (var i = 0; i < len;) {
		var dr = r - (colorTable[i++] & 0xff);
		var dg = g - (colorTable[i++] & 0xff);
		var db = b - (colorTable[i] & 0xff);
		var d = dr * dr + dg * dg + db * db;
		var index = i / 3;
		if (usedEntry[index] && d < dmin) {
			dmin = d;
			minpos = index;
		}
		i++;
	}
	return minpos;
}

function analyzePixels(pixels, sample, usedEntry) {
	var len = pixels.length;
	var nPix = len / 3;
	var indexedPixels = [];
	var nq = new _NeuQuant2.default(pixels, len, sample);

	// initialize quantizer
	var colorTab = nq.process(); // create reduced palette

	// map image pixels to new palette
	var k = 0;
	for (var j = 0; j < nPix; j++) {
		var index = nq.map(pixels[k++] & 0xff, pixels[k++] & 0xff, pixels[k++] & 0xff);
		usedEntry[index] = true;
		indexedPixels[j] = index;
	}

	return [colorTab, indexedPixels];
}

var ImageEncoder = (function () {
	function ImageEncoder() {
		_classCallCheck(this, ImageEncoder);

		this.usedEntry = [];
	}

	_createClass(ImageEncoder, [{
		key: 'encodeImage',
		value: function encodeImage(rgbaPixels, sample, width, height, transparentColor) {
			// Remove alpha channel from pixel array
			var rgbPixels = rgbaPixelsToRgbPixels(rgbaPixels);

			// Analyze pixels

			var _analyzePixels = analyzePixels(rgbPixels, sample, this.usedEntry);

			var _analyzePixels2 = _slicedToArray(_analyzePixels, 2);

			var localColorTable = _analyzePixels2[0];
			var indexedPixels = _analyzePixels2[1];

			// Encode the pixels

			var tableBasedImageDataBytes = new _ByteArray2.default();
			var lzwEncoder = new _LZWEncoder2.default(width, height, indexedPixels, 8);
			lzwEncoder.encode(tableBasedImageDataBytes);

			// Get closest match to the specified transparent color
			var transparentColorIndex = undefined;
			if (transparentColor !== undefined) {
				transparentColorIndex = findClosestColorIndex(localColorTable, transparentColor, this.usedEntry);
			}

			return [localColorTable, transparentColorIndex, tableBasedImageDataBytes.bytes];
		}
	}]);

	return ImageEncoder;
})();

exports.default = ImageEncoder;
//# sourceMappingURL=ImageEncoder.js.map
