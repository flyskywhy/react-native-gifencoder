'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ByteArray = (function () {
	function ByteArray() {
		_classCallCheck(this, ByteArray);

		this.bytes = [];

		this.chr = {};
		for (var i = 0; i < 256; i++) {
			this.chr[i] = String.fromCharCode(i);
		}
	}

	_createClass(ByteArray, [{
		key: 'getData',
		value: function getData() {
			var length = this.bytes.length;

			var data = '';
			for (var i = 0; i < length; i++) {
				data += this.chr[this.bytes[i]];
			}

			return data;
		}
	}, {
		key: 'writeByte',
		value: function writeByte(val) {
			this.bytes.push(val);
		}
	}, {
		key: 'writeUTFBytes',
		value: function writeUTFBytes(string) {
			var l = string.length;
			for (var i = 0; i < l; i++) {
				this.writeByte(string.charCodeAt(i));
			}
		}
	}, {
		key: 'writeBytes',
		value: function writeBytes(array, offset, length) {
			var o = offset || 0;
			var l = length || array.length;
			for (var i = o; i < l; i++) {
				this.writeByte(array[i]);
			}
		}
	}]);

	return ByteArray;
})();

exports.default = ByteArray;
//# sourceMappingURL=ByteArray.js.map
