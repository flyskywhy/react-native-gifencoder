'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ByteArray2 = require('./ByteArray.js');

var _ByteArray3 = _interopRequireDefault(_ByteArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GifWriter = (function (_ByteArray) {
	_inherits(GifWriter, _ByteArray);

	function GifWriter() {
		_classCallCheck(this, GifWriter);

		return _possibleConstructorReturn(this, Object.getPrototypeOf(GifWriter).call(this));
	}

	_createClass(GifWriter, [{
		key: 'writeShort',
		value: function writeShort(value) {
			this.writeByte(value & 0xFF);
			this.writeByte(value >> 8 & 0xFF);
		}
	}, {
		key: 'writeHeader',
		value: function writeHeader() {
			// Signature
			this.writeUTFBytes('GIF');

			// Version
			this.writeUTFBytes('89a');
		}
	}, {
		key: 'writeLogicalScreenDescriptor',
		value: function writeLogicalScreenDescriptor(width, height, gctFlag, colorResolution, sortFlag, gctSize, backgroundColorIndex, pixelAspectRatio) {
			this.writeShort(width); // Logical Screen Width
			this.writeShort(height); // Logical Screen Height

			// Packed Fields
			this.writeByte(gctFlag << 7 | // Global Color Table Flag (1 bit)
			colorResolution << 4 | // Color Resolution (3 bits)
			sortFlag << 3 | // Sort Flag (1 bit)
			gctSize // Size of Global Color Table (3 bits)
			);

			this.writeByte(backgroundColorIndex);
			this.writeByte(pixelAspectRatio);
		}
	}, {
		key: 'writeColorTable',
		value: function writeColorTable(colorTable) {
			this.writeBytes(colorTable);
			var n = 3 * 256 - colorTable.length;
			for (var i = 0; i < n; i++) {
				this.writeByte(0);
			}
		}
	}, {
		key: 'writeGraphicControlExtension',
		value: function writeGraphicControlExtension(disposalMethod, userInputFlag, transparentColorFlag, delayTime, transparentColorIndex) {
			this.writeByte(0x21); // Extension Introducer
			this.writeByte(0xF9); // Graphic Control Label
			this.writeByte(4); // Block Size

			// Packed Fields
			this.writeByte(0 << 5 | // Reserved (3 bits)
			disposalMethod << 2 | // Disposal Method (3 bits)
			userInputFlag << 1 | // User Input Flag (1 bit)
			transparentColorFlag // Transparent Color Flag (1 bit)
			);

			this.writeShort(delayTime); // Delay Time
			this.writeByte(transparentColorIndex); // Transparent Color Index

			this.writeByte(0); // Block Terminator
		}
	}, {
		key: 'writeCommentExtension',
		value: function writeCommentExtension(comments) {
			this.writeByte(0x21); // Extension Introducer
			this.writeByte(0xFE); // Comment Label

			// Comment Data
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = comments[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var comment = _step.value;

					// Data Sub-block
					this.writeByte(comment.length); // Block Size
					this.writeUTFBytes(comment); // Data Values
				}
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

			this.writeByte(0); // Block Terminator
		}
	}, {
		key: 'writeApplicationExtension',
		value: function writeApplicationExtension(applicationIdentifier, applicationAuthenticationCode, dataBlocks) {
			this.writeByte(0x21); // Extension Introducer
			this.writeByte(0xFF); // Application Extension Label
			this.writeByte(11); // Block Size

			this.writeUTFBytes(applicationIdentifier); // Application Identifier (8 bytes)
			this.writeUTFBytes(applicationAuthenticationCode); // Application Authentication Code (3 bytes)

			// Application Data
			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = dataBlocks[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var dataBlock = _step2.value;

					// Data Sub-block
					this.writeByte(dataBlock.length); // Block Size
					this.writeBytes(dataBlock); // Data Values
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			this.writeByte(0); // Block Terminator
		}

		// http://www.vurdalakov.net/misc/gif/netscape-looping-application-extension

	}, {
		key: 'writeNetscapeLoopingApplicationExtension',
		value: function writeNetscapeLoopingApplicationExtension(loopCount) {
			var dataBlock = [1, // Sub-block ID
			loopCount & 0xFF, loopCount >> 8 & 0xFF];

			// Loop Count (2 bytes)
			this.writeApplicationExtension('NETSCAPE', '2.0', [dataBlock]);
		}
	}, {
		key: 'writeImageDescriptor',
		value: function writeImageDescriptor(leftPosition, topPosition, width, height, lctFlag, interlaceFlag, sortFlag, lctSize) {
			this.writeByte(0x2C); // Image Separator
			this.writeShort(leftPosition); // Image Left Position
			this.writeShort(topPosition); // Image Top Position
			this.writeShort(width); // Image Width
			this.writeShort(height); // Image Height

			// Packed Fields
			this.writeByte(lctFlag << 7 | // Local Color Table Flag (1 bit)
			interlaceFlag << 6 | // Interlace Flag (1 bit)
			sortFlag << 5 | // Sort Flag (1 bit)
			0 << 3 | // Reserved (2 bits)
			lctSize // Size of Local Color Table (3 bits)
			);
		}
	}, {
		key: 'writeTrailer',
		value: function writeTrailer() {
			this.writeByte(0x3B); // GIF Trailer
		}
	}, {
		key: 'writeImage',
		value: function writeImage(left, top, width, height, disposalMethod, delayTime, transparentColorIndex, localColorTable, tableBasedImageData) {
			this.writeGraphicControlExtension(disposalMethod, 0, +(transparentColorIndex !== undefined), delayTime, transparentColorIndex !== undefined ? transparentColorIndex : 0);

			// Write Image Descriptor
			this.writeImageDescriptor(left, top, width, height, +!!localColorTable, 0, 0, localColorTable ? Math.log2(localColorTable.length / 3) - 1 : 0);

			// Write Local Color Table
			this.writeColorTable(localColorTable);

			// Write Table Based Image Data
			this.writeBytes(tableBasedImageData);
		}
	}]);

	return GifWriter;
})(_ByteArray3.default);

exports.default = GifWriter;
//# sourceMappingURL=GifWriter.js.map
