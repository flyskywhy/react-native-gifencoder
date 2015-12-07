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
		this.bytes = [];

		this.chr = {};
		for (let i = 0; i < 256; i++) {
			this.chr[i] = String.fromCharCode(i);
		}
	}

	getData() {
		const length = this.bytes.length;

		let data = '';
		for (let i = 0; i < length; i++) {
			data += this.chr[this.bytes[i]];
		}

		return data;
	}

	writeByte(val) {
		this.bytes.push(val);
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

class GifWriter extends ByteArray {
	constructor() {
		super();
	}

	writeShort(value) {
		this.writeByte(value & 0xFF);
		this.writeByte((value >> 8) & 0xFF);
	}

	writeHeader() {
		// Signature
		this.writeUTFBytes('GIF');

		// Version
		this.writeUTFBytes('89a');
	}

	writeLogicalScreenDescriptor(width, height, gctFlag, colorResolution, sortFlag, gctSize, backgroundColorIndex, pixelAspectRatio) {
		this.writeShort(width); // Logical Screen Width
		this.writeShort(height); // Logical Screen Height

		// Packed Fields
		this.writeByte(
			gctFlag << 7 | // Global Color Table Flag (1 bit)
			colorResolution << 4 | // Color Resolution (3 bits)
			sortFlag << 3 | // Sort Flag (1 bit)
			gctSize // Size of Global Color Table (3 bits)
		);

		this.writeByte(backgroundColorIndex);
		this.writeByte(pixelAspectRatio);
	}

	writeColorTable(colorTable) {
		this.writeBytes(colorTable);
		var n = (3 * 256) - colorTable.length;
		for (var i = 0; i < n; i++) {
			this.writeByte(0);
		}
	}

	writeGraphicControlExtension(disposalMethod, userInputFlag, transparentColorFlag, delayTime, transparentColorIndex) {
		this.writeByte(0x21); // Extension Introducer
		this.writeByte(0xF9); // Graphic Control Label
		this.writeByte(4); // Block Size

		// Packed Fields
		this.writeByte(
			0 << 5 | // Reserved (3 bits)
			disposalMethod << 2 | // Disposal Method (3 bits)
			userInputFlag << 1 | // User Input Flag (1 bit)
			transparentColorFlag // Transparent Color Flag (1 bit)
		);

		this.writeShort(delayTime); // Delay Time
		this.writeByte(transparentColorIndex); // Transparent Color Index

		this.writeByte(0); // Block Terminator
	}

	writeCommentExtension(comments) {
		this.writeByte(0x21); // Extension Introducer
		this.writeByte(0xFE); // Comment Label

		// Comment Data
		for (const comment of comments) {
			// Data Sub-block
			this.writeByte(comment.length); // Block Size
			this.writeUTFBytes(comment); // Data Values
		}

		this.writeByte(0); // Block Terminator
	}

	writeApplicationExtension(applicationIdentifier, applicationAuthenticationCode, dataBlocks) {
		this.writeByte(0x21); // Extension Introducer
		this.writeByte(0xFF); // Application Extension Label
		this.writeByte(11); // Block Size

		this.writeUTFBytes(applicationIdentifier); // Application Identifier (8 bytes)
		this.writeUTFBytes(applicationAuthenticationCode); // Application Authentication Code (3 bytes)

		// Application Data
		for (const dataBlock of dataBlocks) {
			// Data Sub-block
			this.writeByte(dataBlock.length); // Block Size
			this.writeBytes(dataBlock); // Data Values
		}

		this.writeByte(0); // Block Terminator
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
		this.writeByte(0x2C); // Image Separator
		this.writeShort(leftPosition); // Image Left Position
		this.writeShort(topPosition); // Image Top Position
		this.writeShort(width); // Image Width
		this.writeShort(height); // Image Height

		// Packed Fields
		this.writeByte(
			lctFlag << 7 | // Local Color Table Flag (1 bit)
			interlaceFlag << 6 | // Interlace Flag (1 bit)
			sortFlag << 5 | // Sort Flag (1 bit)
			0 << 3 | // Reserved (2 bits)
			lctSize // Size of Local Color Table (3 bits)
		);
	}

	writeTrailer() {
		this.writeByte(0x3B); // GIF Trailer
	}

	writeImage(left, top, width, height, disposalMethod, delayTime, transparentColorIndex, localColorTable, tableBasedImageData) {
		this.writeGraphicControlExtension(
			disposalMethod,
			0,
			+(transparentColorIndex !== undefined),
			delayTime,
			(transparentColorIndex !== undefined) ? transparentColorIndex : 0
		);

		// Write Image Descriptor
		this.writeImageDescriptor(
			left,
			top,
			width,
			height,
			+!!localColorTable,
			0,
			0,
			localColorTable ? Math.log2(localColorTable.length / 3) - 1 : 0
		);

		// Write Local Color Table
		this.writeColorTable(localColorTable);

		// Write Table Based Image Data
		this.writeBytes(tableBasedImageData);
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

function findClosestColorIndex(colorTable, color, usedEntry) {
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
	 * The addImage method takes an incoming BitmapData object to create each frames
	 * @param
	 * BitmapData object to be treated as a GIF's frame
	 */
	addImage(image) {
		// Check image
		let rgbaPixels;
		if (image instanceof CanvasRenderingContext2D) {
			// User passed a context
			rgbaPixels = image.getImageData(0, 0, image.canvas.width, image.canvas.height).data;

			// Set size automatically
			if (!this.sizeSet) {
				this.setSize(image.canvas.width, image.canvas.height);
			}
		} else if (image instanceof ImageData) {
			// User passed context.getImageData(...)
			rgbaPixels = image.data;
		} else if (image instanceof Uint8ClampedArray) {
			// User passed context.getImageData(...).data
			rgbaPixels = image;
		} else {
			throw new Error('Parameter "image" must be a CanvasRenderingContext2D, ImageData or Uint8ClampedArray.');
		}

		// Check if size is set
		if (!this.sizeSet) {
			throw new Error('setSize() must be used before using addImage() when passing an ImageData or Uint8ClampedArray for the "frame" parameter.');
		}

		this.images.push(rgbaPixels);
	}

	encode() {
		const lctSize = 7;
		const colorDepth = 8;
		if (!this.images.length) {
			throw new Error('No images added. Use addImage() to add images.');
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

		if (this.comment) {
			gifWriter.writeCommentExtension(this.comment);
		}

		if (this.repeat >= 0) {
			gifWriter.writeNetscapeLoopingApplicationExtension(this.repeat);
		}

		const usedEntry = [];
		for (const rgbaPixels of this.images) {
			const rgbPixels = rgbaPixelsToRgbPixels(rgbaPixels);

			const analysisResult = this.analyzePixels(rgbPixels, this.sample, usedEntry);
			const localColorTable = analysisResult[0];
			const indexedPixels = analysisResult[1];


			const tableBasedImageData = new ByteArray();
			var lzwEncoder = new LZWEncoder(this.width, this.height, indexedPixels, colorDepth);
			lzwEncoder.encode(tableBasedImageData);

			// get closest match to transparent color if specified
			let transparentColorIndex;
			if (this.transparent !== null) {
				transparentColorIndex = this.findClosestColorIndex(localColorTable, this.transparent, usedEntry);
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

			gifWriter.writeImage(
				0,
				0,
				this.width,
				this.height,
				disposalMethod,
				this.delay,
				transparentColorIndex,
				localColorTable,
				tableBasedImageData.bytes
			);
		}

		// Write Trailer
		gifWriter.writeTrailer();

		return gifWriter.getData();
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
	analyzePixels(pixels, sample, usedEntry) {
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

	constructor() {
		this.images = [];

		this.width; // image size
		this.height;
		this.transparent = null; // transparent color if given
		this.repeat = -1; // no repeat
		this.delay = 0; // frame delay (hundredths)
		this.out;
		this.dispose = -1; // disposal code (-1 = use default)
		this.sizeSet = false; // if false, get size from first frame
		this.sample = 10; // default sample interval for quantizer
		this.comment = "Generated by jsgif (https://github.com/antimatter15/jsgif/)"; // default comment for generated gif
	}
}
