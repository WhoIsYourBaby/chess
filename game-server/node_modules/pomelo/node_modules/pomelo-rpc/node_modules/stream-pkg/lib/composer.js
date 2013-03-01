var EventEmitter = require('events').EventEmitter;
var util = require('util');

var DEFAULT_MAX_LENGTH = -1;	// default max package size: unlimited
var LEFT_SHIFT_BITS = 1 << 7;

var ST_LENGTH = 1;	// state that we should read length
var ST_DATA = 2;	// state that we should read data
var ST_ERROR = 3;	// state that something wrong has happened

var Composer = function(opts) {
	EventEmitter.call(this);

	opts = opts || {};
	this.maxLength = opts.maxLength || DEFAULT_MAX_LENGTH;

	this.offset = 0;
	this.left = 0;
	this.length = 0;
	this.buf = null;

	this.state = ST_LENGTH;
};

module.exports = Composer;

util.inherits(Composer, EventEmitter);

var pro = Composer.prototype;

/**
 * Compose data into package.
 * 
 * @param  {String|Buffer}	data data that would be composed.
 * @return {Buffer}      	compose result in Buffer.
 */
pro.compose = function(data) {
	if(typeof data === 'string') {
		data = new Buffer(data, 'utf-8');
	}

	if(!(data instanceof Buffer)) {
		throw new Error('data should be an instance of String or Buffer');
	}

	if(data.length === 0) {
		throw new Error('data should not be empty.');
	}

	if(this.maxLength > 0 && data.length > this.maxLength) {
		throw new Error('data length exceeds the limitation:' + this.maxLength);
	}

	var lsize = calLengthSize(data.length);
	var buf = new Buffer(lsize + data.length);
	fillLength(buf, data.length, lsize);
	data.copy(buf, lsize);

	return buf;
};

/**
 * Feed data into composer. It would emit the package by an event when the package finished.
 *
 * @param  {Buffer} data   next chunk of data read from stream.
 * @param  {Number} offset (Optional) offset index of the data Buffer. 0 by default.
 * @param  {Number} end    (Optional) end index (not includ) of the data Buffer. data.lenght by default.
 * @return {Void}	       
 */
pro.feed = function(data, offset, end) {
	if(!data) {
		return;
	}
	
	if(this.state === ST_ERROR) {
		throw new Error('compose in error state, reset it first');
	}

	offset = offset || 0;
	end = end || data.length;
	while(offset < end) {
		if(this.state === ST_LENGTH) {
			offset = this._readLength(data, offset, end);
		}

		if(this.state === ST_DATA) {
			offset = this._readData(data, offset, end);
		}

		if(this.state === ST_ERROR) {
			break;
		}
	}
};

/**
 * Reset composer to the init status.
 */
pro.reset = function() {
	this.state = ST_LENGTH;
	this.buf = null;
	this.length = 0;
	this.offset = 0;
	this.left = 0;
};

// read length part of package
pro._readLength = function(data, offset, end) {
	var b, i, length = this.length, finish;
	for(i=0; i<end; i++) {
		b = data.readUInt8(i + offset);
		length *= LEFT_SHIFT_BITS;		// left shift only within 32 bits
		length += (b & 0x7f);

		if(length > this.maxLength) {
			this.state = ST_ERROR;
			this.emit('length_limit', this, data, offset);
			return -1;
		}

		if(!(b & 0x80)) {
			i++;
			finish = true;
			break;
		}
	}

	this.length = length;

	if(finish) {
		this.state = ST_DATA;
		this.offset = 0;
		this.left = this.length;
		this.buf = new Buffer(this.length);
	}
	return i + offset;
};

// read data part of package
pro._readData = function(data, offset, end) {
	var left = end - offset;
	var size = Math.min(left, this.left);
	data.copy(this.buf, this.offset, offset, offset + size);
	this.left -= size;
	this.offset += size;

	if(this.left === 0) {
		var buf = this.buf;
		this.reset();
		this.emit('data', buf);	
	}

	return offset + size;
};

var calLengthSize = function(length) {
	var res = 0;
	while(length > 0) {
		length >>>= 7;
		res++;
	}

	return res;
};

var fillLength = function(buf, data, size) {
	var offset = size - 1, b;
	for(; offset >= 0; offset--) {
		b = data % LEFT_SHIFT_BITS;
		if(offset < size - 1) {
			b |= 0x80;
		}
		buf.writeUInt8(b, offset);
		data >>>= 7;
	}
};