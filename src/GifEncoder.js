/**
 * This class lets you encode animated GIF files
 * Base class :  http://www.java2s.com/Code/Java/2D-Graphics-GUI/AnimatedGifEncoder.htm
 * @author Kevin Weiner (original Java version - kweiner@fmsware.com)
 * @author Thibault Imbert (AS3 version - bytearray.org)
 * @author Kevin Kwok (JavaScript version - https://github.com/antimatter15/jsgif)
 * @version 0.1 AS3 implementation
 */

import 'babel-polyfill';
import GifWriter from './GifWriter.js';
import ImageEncoder from './ImageEncoder.js';

export default class GifEncoder {
	constructor() {
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
	get delayTime() {
		return this._delayTime;
	}
	set delayTime(delayTime) {
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
	set fps(fps) {
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
	get disposalMethod() {
		return this._disposalMethod;
	}
	set disposalMethod(disposalMethod) {
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
	get loopCount() {
		return this._loopCount;
	}
	set loopCount(loopCount) {
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
	get transparentColor() {
		return this._transparentColor;
	}
	set transparentColor(transparentColor) {
		// TODO: Check value

		this._transparentColor = transparentColor;
	}

	/**
	 * Sets the comment for the block comment
	 * @param comment
	 * string to be insterted as comment
	 */
	get comment() {
		return this._comment;
	}
	set comment(comment) {
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
	get samplingFactor() {
		return this._samplingFactor;
	}
	set samplingFactor(samplingFactor) {
		if (!Number.isInteger(samplingFactor) || samplingFactor < 1 || samplingFactor > 256) {
			throw new Error('Property "samplingFactor" must be an integer between 1 and 256.');
		}

		this._samplingFactor = samplingFactor;
	}

	get width() {
		return this._width;
	}
	set width(width) {
		if (!Number.isInteger(width) || width < 1 || width > 65535) {
			throw new Error('Property "width" must be an integer between 1 and 65535.');
		}

		this._width = width;
	}

	get height() {
		return this._height;
	}
	set height(height) {
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
	get size() {
 		return [this._width, this._height];
 	}
 	set size([width, height]) {
		this.width = width;
		this.height = height;
 	}

	/**
	 * The addImage method takes an incoming BitmapData object to create each frames
	 * @param
	 * BitmapData object to be treated as a GIF's frame
	 */
	addImage(image, left, top, width, height, disposalMethod, delayTime, transparentColor) {
		// Check image
		let rgbaPixels;
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

	async encode() {
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

		if (this.loopCount !== undefined) {
			gifWriter.writeNetscapeLoopingApplicationExtension(this.loopCount);
		}

		// Initialize the ImageEncoder which will take care of generating
		// Local Color Table and LZW-encoded Table Based Image Data
		const imageEncoder = new ImageEncoder();

		// Loop images
		for (const image of this.images) {
			const [
				rgbaPixels,
				left = 0,
				top = 0,
				width = this.width,
				height = this.height,
				disposalMethod = this.disposalMethod,
				delayTime = this.delayTime,
				transparentColor = this.transparentColor,
			] = image;

			// Encode the image
			const [
				localColorTable,
				transparentColorIndex,
				tableBasedImageData
			] = imageEncoder.encodeImage(rgbaPixels, this.samplingFactor, width, height, transparentColor);

			// Write the image
			gifWriter.writeImage(
				left,
				top,
				width,
				height,
				disposalMethod,
				delayTime,
				transparentColorIndex,
				localColorTable,
				tableBasedImageData
			);
		}

		// Write Trailer
		gifWriter.writeTrailer();

		return gifWriter.bytes;
	}
}
