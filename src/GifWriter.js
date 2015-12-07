import ByteArray from './ByteArray.js';

export default class GifWriter extends ByteArray {
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
