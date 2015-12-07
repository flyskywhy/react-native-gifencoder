'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })(); /**
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * This class lets you encode animated GIF files
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * Base class :  http://www.java2s.com/Code/Java/2D-Graphics-GUI/AnimatedGifEncoder.htm
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * @author Kevin Weiner (original Java version - kweiner@fmsware.com)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * @author Thibault Imbert (AS3 version - bytearray.org)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * @author Kevin Kwok (JavaScript version - https://github.com/antimatter15/jsgif)
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        * @version 0.1 AS3 implementation
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        */

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _GifWriter = require('./GifWriter.js');

var _GifWriter2 = _interopRequireDefault(_GifWriter);

var _ImageEncoder = require('./ImageEncoder.js');

var _ImageEncoder2 = _interopRequireDefault(_ImageEncoder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GIFEncoder = (function () {
	function GIFEncoder() {
		_classCallCheck(this, GIFEncoder);

		this.images = [];

		this.size = [320, 240];
		this.transparentColor = undefined;
		this.loopCount = undefined;
		this.fps = 1;
		this.disposalMethod = 0;
		this.samplingFactor = 10;
		this.comment = undefined;
	}

	/**
  * Sets the delay time between each frame, or changes it for subsequent frames
  * (applies to last frame added)
  * int delay time in milliseconds
  * @param milliseconds
  * NOT MILLISECONDS BUT 100ths of a second!!!!!
  */

	_createClass(GIFEncoder, [{
		key: 'addImage',

		/**
   * The addImage method takes an incoming BitmapData object to create each frames
   * @param
   * BitmapData object to be treated as a GIF's frame
   */
		value: function addImage(image, left, top, width, height, disposalMethod, delayTime, transparentColor) {
			// Check image
			var rgbaPixels = undefined;
			if (image instanceof CanvasRenderingContext2D) {
				// User passed a context
				rgbaPixels = image.getImageData(0, 0, image.canvas.width, image.canvas.height).data;
			} else if (image instanceof ImageData) {
				// User passed context.getImageData(...)
				rgbaPixels = image.data;
			} else if (image instanceof Uint8ClampedArray) {
				// User passed context.getImageData(...).data
				rgbaPixels = image;
			} else {
				throw new Error('Parameter "image" must be a CanvasRenderingContext2D, ImageData or Uint8ClampedArray.');
			}

			this.images.push([rgbaPixels, left, top, width, height, disposalMethod, delayTime, transparentColor]);
		}
	}, {
		key: 'encode',
		value: function encode() {
			if (!this.images.length) {
				throw new Error('No images added. Use addImage() to add images.');
			}

			var gifWriter = new _GifWriter2.default();

			gifWriter.writeHeader();

			gifWriter.writeLogicalScreenDescriptor(this.width, this.height, 0, 7, 0, 0, 0, 0);

			if (this.comment) {
				gifWriter.writeCommentExtension(this.comment);
			}

			if (this.loopCount !== undefined) {
				gifWriter.writeNetscapeLoopingApplicationExtension(this.loopCount);
			}

			// Initialize the ImageEncoder which will take care of generating
			// Local Color Table and LZW-encoded Table Based Image Data
			var imageEncoder = new _ImageEncoder2.default();

			// Loop images
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this.images[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var image = _step.value;

					var _image = _slicedToArray(image, 8);

					var rgbaPixels = _image[0];
					var _image$ = _image[1];
					var left = _image$ === undefined ? 0 : _image$;
					var _image$2 = _image[2];
					var top = _image$2 === undefined ? 0 : _image$2;
					var _image$3 = _image[3];
					var width = _image$3 === undefined ? this.width : _image$3;
					var _image$4 = _image[4];
					var height = _image$4 === undefined ? this.height : _image$4;
					var _image$5 = _image[5];
					var disposalMethod = _image$5 === undefined ? this.disposalMethod : _image$5;
					var _image$6 = _image[6];
					var delayTime = _image$6 === undefined ? this.delayTime : _image$6;
					var _image$7 = _image[7];
					var transparentColor = _image$7 === undefined ? this.transparentColor : _image$7;

					// Encode the image

					var _imageEncoder$encodeI = imageEncoder.encodeImage(rgbaPixels, this.samplingFactor, width, height, transparentColor);

					var _imageEncoder$encodeI2 = _slicedToArray(_imageEncoder$encodeI, 3);

					var localColorTable = _imageEncoder$encodeI2[0];
					var transparentColorIndex = _imageEncoder$encodeI2[1];
					var tableBasedImageData = _imageEncoder$encodeI2[2];

					// Write the image

					gifWriter.writeImage(left, top, width, height, disposalMethod, delayTime, transparentColorIndex, localColorTable, tableBasedImageData);
				}

				// Write Trailer
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			gifWriter.writeTrailer();

			return gifWriter.getData();
		}
	}, {
		key: 'delayTime',
		get: function get() {
			return this._delayTime;
		},
		set: function set(delayTime) {
			if (!Number.isInteger(delayTime) || delayTime < 0 || delayTime > 65535) {
				throw new Error('Property "delayTime" must be an integer between 0 and 65535.');
			}

			this._delayTime = delayTime;
		}

		/**
   * * Sets frame rate in frames per second. Equivalent to
   * <code>setDelay(1000/fps)</code>.
   * @param fps
   * float frame rate (frames per second)
   */

	}, {
		key: 'fps',
		set: function set(fps) {
			if (!Number.isInteger(fps)) {
				throw new Error('Property "fps" must be an integer.');
			}

			if (fps == 0xF) {
				throw new Error('???');
			}

			this.delayTime = 100 / fps;
		}

		/**
   * Sets the GIF frame disposal code for the last added frame and any
   *
   * subsequent frames.
   *
   * 0: No disposal specified. The decoder is not required to take any action.
   * 1: Do not dispose. The graphic is to be left in place.
   * 2: Restore to background color. The area used by the graphic must be restored to the background color.
   * 3: Restore to previous. The decoder is required to restore the area overwritten by the graphic with what was there prior to rendering the graphic.
   * 4-7: To be defined.
   * @param code
   * int disposal code.
   */

	}, {
		key: 'disposalMethod',
		get: function get() {
			return this._disposalMethod;
		},
		set: function set(disposalMethod) {
			if (!Number.isInteger(disposalMethod) || disposalMethod < 0 || disposalMethod > 7) {
				throw new Error('Property "disposalMethod" must be an integer between 0 and 7.');
			}

			this._disposalMethod = disposalMethod;
		}

		/**
   * Sets the number of times the set of GIF frames should be played. Default is
   * 1; 0 means play indefinitely. Must be invoked before the first image is
   * added.
   *
   * @param iter
   * int number of iterations.
   * @return
   */

	}, {
		key: 'loopCount',
		get: function get() {
			return this._loopCount;
		},
		set: function set(loopCount) {
			if (loopCount !== undefined && !Number.isInteger(loopCount) || loopCount < 0 || loopCount > 65535) {
				throw new Error('Property "loopCount" must be an integer between 0 and 65535 or undefined.');
			}

			this._loopCount = loopCount;
		}

		/**
   * Sets the transparent color for the last added frame and any subsequent
   * frames. Since all colors are subject to modification in the quantization
   * process, the color in the final palette for each frame closest to the given
   * color becomes the transparent color for that frame. May be set to null to
   * indicate no transparent color.
   * @param color
   * Color to be treated as transparent on display.
   */

	}, {
		key: 'transparentColor',
		get: function get() {
			return this._transparentColor;
		},
		set: function set(transparentColor) {
			// TODO: Check value

			this._transparentColor = transparentColor;
		}

		/**
   * Sets the comment for the block comment
   * @param comment
   * string to be insterted as comment
   */

	}, {
		key: 'comment',
		get: function get() {
			return this._comment;
		},
		set: function set(comment) {
			if (comment !== undefined && typeof comment !== 'string') {
				throw new Error('Property "comment" must be a string or undefined.');
			}

			this._comment = comment;
		}

		/**
   * Sets quality of color quantization (conversion of images to the maximum 256
   * colors allowed by the GIF specification). Lower values (minimum = 1)
   * produce better colors, but slow processing significantly. 10 is the
   * default, and produces good color mapping at reasonable speeds. Values
   * greater than 20 do not yield significant improvements in speed.
   * @param quality
   * int greater than 0.
   * @return
   */

	}, {
		key: 'samplingFactor',
		get: function get() {
			return this._samplingFactor;
		},
		set: function set(samplingFactor) {
			if (!Number.isInteger(samplingFactor) || samplingFactor < 1 || samplingFactor > 256) {
				throw new Error('Property "samplingFactor" must be an integer between 1 and 256.');
			}

			this._samplingFactor = samplingFactor;
		}
	}, {
		key: 'width',
		get: function get() {
			return this._width;
		},
		set: function set(width) {
			if (!Number.isInteger(width) || width < 1 || width > 65535) {
				throw new Error('Property "width" must be an integer between 1 and 65535.');
			}

			this._width = width;
		}
	}, {
		key: 'height',
		get: function get() {
			return this._height;
		},
		set: function set(height) {
			if (!Number.isInteger(height) || height < 1 || height > 65535) {
				throw new Error('Property "height" must be an integer between 1 and 65535.');
			}

			this._height = height;
		}

		/**
   * Sets the GIF frame size. The default size is the size of the first frame
   * added if this method is not invoked.
   * @param w
   * int frame width.
   * @param h
   * int frame width.
   */

	}, {
		key: 'size',
		get: function get() {
			return [this._width, this._height];
		},
		set: function set(_ref) {
			var _ref2 = _slicedToArray(_ref, 2);

			var width = _ref2[0];
			var height = _ref2[1];

			this.width = width;
			this.height = height;
		}
	}]);

	return GIFEncoder;
})();

exports.default = GIFEncoder;
//# sourceMappingURL=GIFEncoder.js.map
