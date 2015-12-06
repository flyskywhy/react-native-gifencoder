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

		this.out = new ByteArray();

		// Write header
		this.out.writeUTFBytes('GIF89a');

		var ok = true;

		try {
			let firstFrame = true;
			for (const analysisResultOrFunction of this.frames) {
				let analysisResult;
				if (typeof analysisResultOrFunction === 'function') {
					analysisResult = analysisResultOrFunction();
				} else {
					analysisResult = analysisResultOrFunction;
				}

				const colorTab = analysisResult[0];
				const indexedPixels = analysisResult[1];
				const colorDepth = 8;
				const palSize = 7;

				// get closest match to transparent color if specified
				let transIndex = 0;
				if (this.transparent !== null) {
					transIndex = this.findClosest(colorTab, this.transparent);
				}

				if (firstFrame) {
					this.writeLSD(palSize); // logical screen descriptior
					this.writePalette(colorTab); // global color table
					if (this.repeat >= 0) {
						// use NS app extension to indicate reps
						this.writeNetscapeExt();
					}
				}

				this.writeGraphicCtrlExt(transIndex); // write graphic control extension

				if (this.comment !== '') {
					this.writeCommentExt(); // write comment extension
				}

				this.writeImageDesc(firstFrame, palSize); // image descriptor

				if (!firstFrame) {
					this.writePalette(colorTab); // local color table
				}

				// encode and write pixel data
				var myencoder = new LZWEncoder(this.width, this.height, indexedPixels, colorDepth);
				myencoder.encode(this.out);

				firstFrame = false;
			}

			this.out.writeByte(0x3b); // gif trailer
		} catch (e) {
			console.error(e);
			ok = false;
		}

		return ok;
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
	 * Writes Graphic Control Extension
	 */
	writeGraphicCtrlExt(transIndex) {
		this.out.writeByte(0x21); // extension introducer
		this.out.writeByte(0xf9); // GCE label
		this.out.writeByte(4); // data block size
		var transp;
		var disp;
		if (this.transparent === null) {
			transp = 0;
			disp = 0; // dispose = no action
		} else {
			transp = 1;
			disp = 2; // force clear if using transparent color
		}
		if (this.dispose >= 0) {
			disp = this.dispose & 7; // user override
		}
		disp <<= 2;
		// packed fields
		this.out.writeByte(0 | // 1:3 reserved
			disp | // 4:6 disposal
			0 | // 7 user input - 0 = none
			transp); // 8 transparency flag

		this.WriteShort(this.delay); // delay x 1/100 sec
		this.out.writeByte(transIndex); // transparent color index
		this.out.writeByte(0); // block terminator
	}

	/**
	 * Writes Comment Extention
	 */
	writeCommentExt() {
		this.out.writeByte(0x21); // extension introducer
		this.out.writeByte(0xfe); // comment label
		this.out.writeByte(this.comment.length); // Block Size (s)
		this.out.writeUTFBytes(this.comment);
		this.out.writeByte(0); // block terminator
	}

	/**
	 * Writes Image Descriptor
	 */
	writeImageDesc(firstFrame, palSize) {
		this.out.writeByte(0x2c); // image separator
		this.WriteShort(0); // image position x,y = 0,0
		this.WriteShort(0);
		this.WriteShort(this.width); // image size
		this.WriteShort(this.height);

		// packed fields
		if (firstFrame) {
			// no LCT - GCT is used for first (or only) frame
			this.out.writeByte(0);
		} else {
			// specify normal LCT
			this.out.writeByte(0x80 | // 1 local color table 1=yes
				0 | // 2 interlace - 0=no
				0 | // 3 sorted - 0=no
				0 | // 4-5 reserved
				palSize); // 6-8 size of color table
		}
	}

	/**
	 * Writes Logical Screen Descriptor
	 */
	writeLSD(palSize) {
		// logical screen size
		this.WriteShort(this.width);
		this.WriteShort(this.height);
		// packed fields
		this.out.writeByte((0x80 | // 1 : global color table flag = 1 (gct used)
			0x70 | // 2-4 : color resolution = 7
			0x00 | // 5 : gct sort flag = 0
			palSize)); // 6-8 : gct size

		this.out.writeByte(0); // background color index
		this.out.writeByte(0); // pixel aspect ratio - assume 1:1
	}

	/**
	 * Writes Netscape application extension to define repeat count.
	 */
	writeNetscapeExt() {
		this.out.writeByte(0x21); // extension introducer
		this.out.writeByte(0xff); // app extension label
		this.out.writeByte(11); // block size
		this.out.writeUTFBytes('NETSCAPE' + '2.0'); // app id + auth code
		this.out.writeByte(3); // sub-block size
		this.out.writeByte(1); // loop sub-block id
		this.WriteShort(this.repeat); // loop count (extra iterations, 0=repeat forever)
		this.out.writeByte(0); // block terminator
	}

	/**
	 * Writes color table
	 */
	writePalette(colorTab) {
		this.out.writeBytes(colorTab);
		var n = (3 * 256) - colorTab.length;
		for (var i = 0; i < n; i++) this.out.writeByte(0);
	}

	WriteShort(pValue) {
		this.out.writeByte(pValue & 0xFF);
		this.out.writeByte((pValue >> 8) & 0xFF);
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
