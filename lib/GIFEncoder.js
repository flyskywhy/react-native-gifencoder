/**
 * This class lets you encode animated GIF files
 * Base class :  http://www.java2s.com/Code/Java/2D-Graphics-GUI/AnimatedGifEncoder.htm
 * @author Kevin Weiner (original Java version - kweiner@fmsware.com)
 * @author Thibault Imbert (AS3 version - bytearray.org)
 * @author Kevin Kwok (JavaScript version - https://github.com/antimatter15/jsgif)
 * @version 0.1 AS3 implementation
 */

'use strict';

class ByteArray {
	constructor() {
		this.bin = [];

		this.chr = {};
		for (let i = 0; i < 256; i++) {
			this.chr[i] = String.fromCharCode(i);
		}
	}

	getData() {
		const length = this.bin.length;

		let data = '';
		for (let i = 0; i < length; i++) {
			data += this.chr[this.bin[i]];
		}

		return data;
	}

	writeByte(val) {
		this.bin.push(val);
	}

	writeUTFBytes(string) {
		var l = string.length;
		for (var i = 0; i < l; i++) {
			this.writeByte(string.charCodeAt(i));
		}
	}

	writeBytes(array, offset, length) {
		var o = offset || 0;
		var l = length || array.length;
		for (var i = o; i < l; i++) {
			this.writeByte(array[i]);
		}
	}
}

class GifWriter {
	constructor() {
		this.bytes = new ByteArray();
	}

	writeShort(value) {
		this.bytes.writeByte(value & 0xFF);
		this.bytes.writeByte((value >> 8) & 0xFF);
	}

	writeHeader() {
		// Signature
		this.bytes.writeUTFBytes('GIF');

		// Version
		this.bytes.writeUTFBytes('89a');
	}

	writeLogicalScreenDescriptor(width, height, gctFlag, colorResolution, sortFlag, gctSize, backgroundColorIndex, pixelAspectRatio) {
		this.writeShort(width); // Logical Screen Width
		this.writeShort(height); // Logical Screen Height

		// Packed Fields
		this.bytes.writeByte(
			gctFlag << 7 | // Global Color Table Flag (1 bit)
			colorResolution << 4 | // Color Resolution (3 bits)
			sortFlag << 3 | // Sort Flag (1 bit)
			gctSize // Size of Global Color Table (3 bits)
		);

		this.bytes.writeByte(backgroundColorIndex);
		this.bytes.writeByte(pixelAspectRatio);
	}

	writeColorTable(colorTable) {
		this.bytes.writeBytes(colorTable);
		var n = (3 * 256) - colorTable.length;
		for (var i = 0; i < n; i++) {
			this.bytes.writeByte(0);
		}
	}

	writeGraphicControlExtension(disposalMethod, userInputFlag, transparentColorFlag, delayTime, transParentColorIndex) {
		this.bytes.writeByte(0x21); // Extension Introducer
		this.bytes.writeByte(0xF9); // Graphic Control Label
		this.bytes.writeByte(4); // Block Size

		// Packed Fields
		this.bytes.writeByte(
			0 << 5 | // Reserved (3 bits)
			disposalMethod << 2 | // Disposal Method (3 bits)
			userInputFlag << 1 | // User Input Flag (1 bit)
			transparentColorFlag // Transparent Color Flag (1 bit)
		);

		this.writeShort(delayTime); // Delay Time
		this.bytes.writeByte(transParentColorIndex); // Transparent Color Index

		this.bytes.writeByte(0); // Block Terminator
	}

	writeCommentExtension(comments) {
		this.bytes.writeByte(0x21); // Extension Introducer
		this.bytes.writeByte(0xFE); // Comment Label

		// Comment Data
		for (const comment of comments) {
			// Data Sub-block
			this.bytes.writeByte(comment.length); // Block Size
			this.bytes.writeUTFBytes(comment); // Data Values
		}

		this.bytes.writeByte(0); // Block Terminator
	}

	writeApplicationExtension(applicationIdentifier, applicationAuthenticationCode, dataBlocks) {
		this.bytes.writeByte(0x21); // Extension Introducer
		this.bytes.writeByte(0xFF); // Application Extension Label
		this.bytes.writeByte(11); // Block Size

		this.bytes.writeUTFBytes(applicationIdentifier); // Application Identifier (8 bytes)
		this.bytes.writeUTFBytes(applicationAuthenticationCode); // Application Authentication Code (3 bytes)

		// Application Data
		for (const dataBlock of dataBlocks) {
			// Data Sub-block
			this.bytes.writeByte(dataBlock.length); // Block Size
			this.bytes.writeBytes(dataBlock); // Data Values
		}

		this.bytes.writeByte(0); // Block Terminator
	}

	// http://www.vurdalakov.net/misc/gif/netscape-looping-application-extension
	writeNetscapeLoopingApplicationExtension(loopCount) {
		const dataBlock = [
			1, // Sub-block ID
			loopCount & 0xFF, (loopCount >> 8) & 0xFF, // Loop Count (2 bytes)
		];

		this.writeApplicationExtension(
			'NETSCAPE',
			'2.0',
			[dataBlock]
		);
	}

	writeImageDescriptor(leftPosition, topPosition, width, height, lctFlag, interlaceFlag, sortFlag, lctSize) {
		this.bytes.writeByte(0x2C); // Image Separator
		this.writeShort(leftPosition); // Image Left Position
		this.writeShort(topPosition); // Image Top Position
		this.writeShort(width); // Image Width
		this.writeShort(height); // Image Height

		// Packed Fields
		this.bytes.writeByte(
			lctFlag << 7 | // Local Color Table Flag (1 bit)
			interlaceFlag << 6 | // Interlace Flag (1 bit)
			sortFlag << 5 | // Sort Flag (1 bit)
			0 << 3 | // Reserved (2 bits)
			lctSize // Size of Local Color Table (3 bits)
		);
	}

	writeTrailer() {
		this.bytes.writeByte(0x3B); // GIF Trailer
	}
}

function rgbaPixelsToRgbPixels(rgbaPixels) {
	const pixelCount = rgbaPixels.length / 4;
	const rgbPixels = new Uint8ClampedArray(pixelCount * 3);

	for (let i = 0; i < pixelCount; i++) {
		rgbPixels[i * 3 + 0] = rgbaPixels[i * 4 + 0];
		rgbPixels[i * 3 + 1] = rgbaPixels[i * 4 + 1];
		rgbPixels[i * 3 + 2] = rgbaPixels[i * 4 + 2];
	}

	return rgbPixels;
}

class GIFEncoder {
	/**
	 * Sets the delay time between each frame, or changes it for subsequent frames
	 * (applies to last frame added)
	 * int delay time in milliseconds
	 * @param milliseconds
	 */
	setDelay(milliseconds) {
		this.delay = Math.round(milliseconds / 10);
	}

	/**
	 * Sets the GIF frame disposal code for the last added frame and any
	 *
	 * subsequent frames. Default is 0 if no transparent color has been set,
	 * otherwise 2.
	 * @param code
	 * int disposal code.
	 */
	setDispose(code) {
		if (code >= 0) {
			this.dispose = code;
		}
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
	setRepeat(iter) {
		if (iter >= 0) {
			this.repeat = iter;
		}
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
	setTransparent(color) {
		this.transparent = color;
	}

	/**
	 * Sets the comment for the block comment
	 * @param comment
	 * string to be insterted as comment
	 */
	setComment(comment) {
		this.comment = comment;
	}

	/**
	 * The addFrame method takes an incoming BitmapData object to create each frames
	 * @param
	 * BitmapData object to be treated as a GIF's frame
	 */
	addFrame(frame, deferAnalysis) {
		// Check frame
		let rgbaPixels;
		if (frame instanceof CanvasRenderingContext2D) {
			// User passed a context
			rgbaPixels = frame.getImageData(0, 0, frame.canvas.width, frame.canvas.height).data;

			// Set size automatically
			if (!this.sizeSet) {
				this.setSize(frame.canvas.width, frame.canvas.height);
			}
		} else if (frame instanceof ImageData) {
			// User passed context.getImageData(...)
			rgbaPixels = frame.data;
		} else if (frame instanceof Uint8ClampedArray) {
			// User passed context.getImageData(...).data
			rgbaPixels = frame;
		} else {
			throw new Error('Parameter "frame" must be a CanvasRenderingContext2D, ImageData or Uint8ClampedArray.');
		}

		// Check if size is set
		if (!this.sizeSet) {
			throw new Error('setSize() must be used before using addFrame() when passing an ImageData or Uint8ClampedArray for the "frame" parameter.');
		}

		const analyzer = () => {
			const rgbPixels = rgbaPixelsToRgbPixels(rgbaPixels);
			return this.analyzePixels(rgbPixels, this.sample);
		};

		if (!deferAnalysis) {
			this.frames.push(analyzer());
		} else {
			this.frames.push(analyzer);
		}
	}

	/**
	 * Adds final trailer to the GIF stream, if you don't call the finish method
	 * the GIF stream will not be valid.
	 */
	finish() {
		const gctSize = 7;
		const colorDepth = 8;
		if (!this.frames.length) {
			throw new Error('No frames added. Use addFrame() to add frames.');
		}

		const gifWriter = new GifWriter();

		gifWriter.writeHeader();

		gifWriter.writeLogicalScreenDescriptor(
			this.width,
			this.height,
			0,
			7,
			0,
			0,
			0,
			0
		);

		for (const analysisResultOrFunction of this.frames) {
			let analysisResult;
			if (typeof analysisResultOrFunction === 'function') {
				analysisResult = analysisResultOrFunction();
			} else {
				analysisResult = analysisResultOrFunction;
			}

			const colorTable = analysisResult[0];
			const indexedPixels = analysisResult[1];

			if (this.repeat >= 0) {
				gifWriter.writeNetscapeLoopingApplicationExtension(this.repeat);
			}

			// get closest match to transparent color if specified
			let transParentColorIndex = 0;
			if (this.transparent !== null) {
				transParentColorIndex = this.findClosest(colorTable, this.transparent);
			}

			var transparentColorFlag;
			var disposalMethod;
			if (this.transparent === null) {
				transparentColorFlag = 0;
				disposalMethod = 0; // dispose = no action
			} else {
				transparentColorFlag = 1;
				disposalMethod = 2; // force clear if using transparent color
			}
			if (this.dispose >= 0) {
				disposalMethod = this.dispose & 7; // user override
			}

			gifWriter.writeGraphicControlExtension(
				disposalMethod,
				0,
				transparentColorFlag,
				this.delay,
				transParentColorIndex
			);

			// Write comment extension
			if (this.comment) {
				gifWriter.writeCommentExtension(this.comment);
			}

			// Write Image Descriptor
			gifWriter.writeImageDescriptor(
				0,
				0,
				this.width,
				this.height,
				1,
				0,
				0,
				gctSize
			);

			// Write Local Color Table
			gifWriter.writeColorTable(colorTable);

			// Write Image Data
			var lzwEncoder = new LZWEncoder(this.width, this.height, indexedPixels, colorDepth);
			lzwEncoder.encode(gifWriter.bytes);
		}

		// Write Trailer
		gifWriter.writeTrailer();

		this.out = gifWriter.bytes;
	}

	/**
	 * * Sets frame rate in frames per second. Equivalent to
	 * <code>setDelay(1000/fps)</code>.
	 * @param fps
	 * float frame rate (frames per second)
	 */
	setFrameRate(fps) {
		if (fps != 0xf) this.delay = Math.round(100 / fps);
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
	setQuality(quality) {
		if (quality < 1) quality = 1;
		this.sample = quality;
	}

	/**
	 * Sets the GIF frame size. The default size is the size of the first frame
	 * added if this method is not invoked.
	 * @param w
	 * int frame width.
	 * @param h
	 * int frame width.
	 */
	setSize(w, h) {
		this.width = w;
		this.height = h;
		if (this.width < 1) this.width = 320;
		if (this.height < 1) this.height = 240;
		this.sizeSet = true;
	}

	/**
	 * Analyzes image colors and creates color map.
	 */
	analyzePixels(pixels, sample) {
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
			this.usedEntry[index] = true;
			indexedPixels[j] = index;
		}

		return [colorTab, indexedPixels];
	}

	/**
	 * Returns index of palette color closest to c
	 */
	findClosest(colorTab, c) {
		if (colorTab === null) return -1;
		var r = (c & 0xFF0000) >> 16;
		var g = (c & 0x00FF00) >> 8;
		var b = (c & 0x0000FF);
		var minpos = 0;
		var dmin = 256 * 256 * 256;
		var len = colorTab.length;

		for (var i = 0; i < len;) {
			var dr = r - (colorTab[i++] & 0xff);
			var dg = g - (colorTab[i++] & 0xff);
			var db = b - (colorTab[i] & 0xff);
			var d = dr * dr + dg * dg + db * db;
			var index = i / 3;
			if (this.usedEntry[index] && (d < dmin)) {
				dmin = d;
				minpos = index;
			}
			i++;
		}
		return minpos;
	}

	/**
	 * Retrieves the GIF stream
	 */
	stream() {
		return this.out;
	}

	constructor() {
		this.frames = [];

		this.width; // image size
		this.height;
		this.transparent = null; // transparent color if given
		this.repeat = -1; // no repeat
		this.delay = 0; // frame delay (hundredths)
		this.out;
		this.usedEntry = []; // active palette entries
		this.dispose = -1; // disposal code (-1 = use default)
		this.sizeSet = false; // if false, get size from first frame
		this.sample = 10; // default sample interval for quantizer
		this.comment = "Generated by jsgif (https://github.com/antimatter15/jsgif/)"; // default comment for generated gif
	}
}
