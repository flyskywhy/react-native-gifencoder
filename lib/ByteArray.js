export default class ByteArray {
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
