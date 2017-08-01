require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function placeHoldersCount (b64) {
  var len = b64.length
  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // the number of equal signs (place holders)
  // if there are two placeholders, than the two characters before it
  // represent one byte
  // if there is only one, then the three characters before it represent 2 bytes
  // this is just a cheap hack to not do indexOf twice
  return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
}

function byteLength (b64) {
  // base64 is 4/3 + up to two characters of the original data
  return b64.length * 3 / 4 - placeHoldersCount(b64)
}

function toByteArray (b64) {
  var i, j, l, tmp, placeHolders, arr
  var len = b64.length
  placeHolders = placeHoldersCount(b64)

  arr = new Arr(len * 3 / 4 - placeHolders)

  // if there are placeholders, only get up to the last complete 4 chars
  l = placeHolders > 0 ? len - 4 : len

  var L = 0

  for (i = 0, j = 0; i < l; i += 4, j += 3) {
    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
    arr[L++] = (tmp >> 16) & 0xFF
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  if (placeHolders === 2) {
    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[L++] = tmp & 0xFF
  } else if (placeHolders === 1) {
    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[L++] = (tmp >> 8) & 0xFF
    arr[L++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var output = ''
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    output += lookup[tmp >> 2]
    output += lookup[(tmp << 4) & 0x3F]
    output += '=='
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
    output += lookup[tmp >> 10]
    output += lookup[(tmp >> 4) & 0x3F]
    output += lookup[(tmp << 2) & 0x3F]
    output += '='
  }

  parts.push(output)

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

/*
 * Export kMaxLength after typed array support is determined.
 */
exports.kMaxLength = kMaxLength()

function typedArraySupport () {
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42 && // typed array instances can be augmented
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

function createBuffer (that, length) {
  if (kMaxLength() < length) {
    throw new RangeError('Invalid typed array length')
  }
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = new Uint8Array(length)
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    if (that === null) {
      that = new Buffer(length)
    }
    that.length = length
  }

  return that
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
    return new Buffer(arg, encodingOrOffset, length)
  }

  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(this, arg)
  }
  return from(this, arg, encodingOrOffset, length)
}

Buffer.poolSize = 8192 // not used by this implementation

// TODO: Legacy, not needed anymore. Remove in next major version.
Buffer._augment = function (arr) {
  arr.__proto__ = Buffer.prototype
  return arr
}

function from (that, value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
    return fromArrayBuffer(that, value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(that, value, encodingOrOffset)
  }

  return fromObject(that, value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(null, value, encodingOrOffset, length)
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
  if (typeof Symbol !== 'undefined' && Symbol.species &&
      Buffer[Symbol.species] === Buffer) {
    // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
    Object.defineProperty(Buffer, Symbol.species, {
      value: null,
      configurable: true
    })
  }
}

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (that, size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(that, size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(that, size).fill(fill, encoding)
      : createBuffer(that, size).fill(fill)
  }
  return createBuffer(that, size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(null, size, fill, encoding)
}

function allocUnsafe (that, size) {
  assertSize(size)
  that = createBuffer(that, size < 0 ? 0 : checked(size) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < size; ++i) {
      that[i] = 0
    }
  }
  return that
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(null, size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(null, size)
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  var length = byteLength(string, encoding) | 0
  that = createBuffer(that, length)

  var actual = that.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    that = that.slice(0, actual)
  }

  return that
}

function fromArrayLike (that, array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  that = createBuffer(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array, byteOffset, length) {
  array.byteLength // this throws if `array` is not a valid ArrayBuffer

  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('\'offset\' is out of bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('\'length\' is out of bounds')
  }

  if (byteOffset === undefined && length === undefined) {
    array = new Uint8Array(array)
  } else if (length === undefined) {
    array = new Uint8Array(array, byteOffset)
  } else {
    array = new Uint8Array(array, byteOffset, length)
  }

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = array
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromArrayLike(that, array)
  }
  return that
}

function fromObject (that, obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    that = createBuffer(that, len)

    if (that.length === 0) {
      return that
    }

    obj.copy(that, 0, 0, len)
    return that
  }

  if (obj) {
    if ((typeof ArrayBuffer !== 'undefined' &&
        obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
      if (typeof obj.length !== 'number' || isnan(obj.length)) {
        return createBuffer(that, 0)
      }
      return fromArrayLike(that, obj)
    }

    if (obj.type === 'Buffer' && isArray(obj.data)) {
      return fromArrayLike(that, obj.data)
    }
  }

  throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
}

function checked (length) {
  // Note: cannot use `length < kMaxLength()` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
      (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
// Buffer instances.
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (isNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (Buffer.TYPED_ARRAY_SUPPORT &&
        typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = this.subarray(start, end)
    newBuf.__proto__ = Buffer.prototype
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; ++i) {
      newBuf[i] = this[i + start]
    }
  }

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; ++i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, start + len),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if (code < 256) {
        val = code
      }
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : utf8ToBytes(new Buffer(val, encoding).toString())
    var len = bytes.length
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

function isnan (val) {
  return val !== val // eslint-disable-line no-self-compare
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":1,"ieee754":5,"isarray":3}],3:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],4:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],5:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],"AlertView":[function(require,module,exports){
"use strict";
cc._RF.push(module, '261731wfhNK/YolG//aSKGB', 'AlertView');
// Script/tool/AlertView.js

'use strict';

//AlertView Prefab 's script

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        labelMsg: {
            default: null,
            type: cc.Label
        },

        btnCancel: {
            default: null,
            type: cc.Button
        },

        btnOK: {
            default: null,
            type: cc.Button
        }
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.btnCancel.node.on('click', this.dismiss, this);
        this.btnOK.node.on('click', this.dismiss, this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    dismiss: function dismiss() {
        this.node.removeFromParent();
    }

});

cc._RF.pop();
},{}],"BrnnProto":[function(require,module,exports){
"use strict";
cc._RF.push(module, '70a39jq8S9NFIXRHLbVwvAB', 'BrnnProto');
// Script/protocol/BrnnProto.js

'use strict';

require("../pomelo/pomelo-client");

var BrnnProto = function BrnnProto() {};

module.exports = BrnnProto;

BrnnProto.chipIn = function (gold, pkindex, callback) {
    var data = {};
    data.userid = pomelo.userinfo.userid;
    data.gold = gold;
    data.pkindex = pkindex;

    pomelo.request('brnn.brnnHandler.chipIn', data, callback);
};

//有用户离开房间
BrnnProto.onLeave = function (callback) {
    pomelo.on('brnn.onLeave', callback);
};

//有用户加入房间
BrnnProto.onAdd = function (callback) {
    pomelo.on('brnn.onAdd', callback);
};

//即将发牌的下注时期
BrnnProto.onWillStart = function (callback) {
    pomelo.on('brnn.onWillStart', callback);
};

//发牌
BrnnProto.onDealPoker = function (callback) {
    pomelo.on('brnn.onDealPoker', callback);
};

//计算输赢结果
BrnnProto.onGoldResult = function (callback) {
    pomelo.on('brnn.onGoldResult', callback);
};

BrnnProto.disableEvent = function () {
    pomelo.removeAllListeners('brnn.onGoldResult');
    pomelo.removeAllListeners('brnn.onDealPoker');
    pomelo.removeAllListeners('brnn.onWillStart');
    pomelo.removeAllListeners('brnn.onAdd');
    pomelo.removeAllListeners('brnn.onLeave');
};

cc._RF.pop();
},{"../pomelo/pomelo-client":"pomelo-client"}],"BrnnRoomController":[function(require,module,exports){
"use strict";
cc._RF.push(module, '40ab20udtRN8ZFE0aDEK7p3', 'BrnnRoomController');
// Script/ui/BrnnRoomController.js

"use strict";

require("../pomelo/pomelo-client");
var GateConnector = require("../protocol/GateConnector");
var BrnnProto = require("../protocol/BrnnProto");
var MResponse = require("../protocol/MResponse");

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        buttonExit: {
            default: null,
            type: cc.Button
        },

        stateSprite: {
            default: null,
            type: cc.Sprite
        },

        timeLabel: {
            default: null,
            type: cc.Label
        },

        chipLayout: {
            default: null,
            type: cc.Layout
        },

        masterView: {
            default: null,
            type: cc.Node
        },

        brnnState: 2, //state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,其他场景
        brnnChipSelect: 2000,
        brnnChipInDic: new Array(), //{'1':0, '2':0, '3':0, '4':0};

        chipViewSC: {
            default: new Array()
        }
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.brnnChipInDic = { '1': 0, '2': 0, '3': 0, '4': 0 };
        var masterViewSC = this.masterView.getComponent('ChipViewScript');
        this.chipViewSC.push(masterViewSC);

        for (var index = 1; index < 5; index++) {
            var childName = 'chipView' + index;
            var cp = this.chipLayout.node.getChildByName(childName);
            var cpscript = cp.getComponent('ChipViewScript');
            this.chipViewSC.push(cpscript);
        }
    },

    onEnable: function onEnable() {
        this.buttonExit.node.on('click', this.buttonExitTap, this);
        this.initBrnnEvent();
    },

    onDisable: function onDisable() {
        this.buttonExit.node.off('click', this.buttonExitTap, this);
        BrnnProto.disableEvent();
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    buttonExitTap: function buttonExitTap() {
        GateConnector.connectorExit(function () {
            cc.director.loadScene('Home');
        });
    },

    initBrnnEvent: function initBrnnEvent() {
        var self = this;
        BrnnProto.onAdd(function (data) {
            console.log(data);
        });

        BrnnProto.onLeave(function (data) {
            console.log(data);
        });

        BrnnProto.onWillStart(function (data) {
            var res = new MResponse(data);
            if (res.hasError()) {
                console.error(res.msg);
                return;
            }

            self.brnnState = res.data['state'];
            var time = res.data['time'];
            self.updateStateAndTime(self.brnnState, time);
        });

        BrnnProto.onDealPoker(function (data) {
            var res = new MResponse(data);
            if (res.hasError()) {
                console.log(res.msg);
                return;
            }
            self.brnnState = 1;
            self.updateStateAndTime(self.brnnState, -1);
            self.pushPokerToChipView(res.data['pokerRes']);
        });

        BrnnProto.onGoldResult(function (data) {
            self.brnnState = 2;
            self.updateStateAndTime(self.brnnState, -1);
            self.brnnChipInDic = { '1': 0, '2': 0, '3': 0, '4': 0 };
            self.scheduleOnce(function () {
                this.resetChipView();
            }, 3);
        });
    },

    //下注金额按钮点击事件
    //chipin 是下注金额
    buttonChipInTap: function buttonChipInTap(event, chipin) {
        this.brnnChipSelect = parseInt(chipin);
    },

    //下注牌点击事件，真正完成下注
    buttonChipPokerTap: function buttonChipPokerTap(event, pkindex) {
        if (this.brnnState != 0) {
            console.log('下注时间已过');
            return;
        }
        this.brnnChipInDic[pkindex] += this.brnnChipSelect;

        var self = this;
        BrnnProto.chipIn(this.brnnChipInDic[pkindex], pkindex, function (data) {
            var res = new MResponse(data);
            if (res.hasError()) {
                console.log(res.msg);
                self.brnnChipInDic[pkindex] -= self.brnnChipSelect;
                return;
            }
            self.updateChipView(res.data);
        });
    },

    //update state and time ui
    //time < 0 的时候隐藏imagetime
    updateStateAndTime: function updateStateAndTime(state, time) {
        //update time
        this.timeLabel.node.active = time >= 0;
        var fullTime = time;
        if (fullTime < 10) {
            fullTime = '0' + time;
        }
        this.timeLabel.string = fullTime;

        //更新state
        var stateurl = 'png/brnnstate_' + state;
        var self = this;
        cc.loader.loadRes(stateurl, cc.SpriteFrame, function (error, sf) {
            self.stateSprite.spriteFrame = sf;
        });
    },

    updateChipView: function updateChipView(mychip) {
        for (var index = 1; index < 5; index++) {
            if (mychip[index] == null) {
                continue;
            }
            var childName = 'chipView' + index;
            var cp = this.chipLayout.node.getChildByName(childName);
            var cpscript = cp.getComponent('ChipViewScript');
            cpscript.updateGold(mychip[index], null);
        }
    },

    resetChipView: function resetChipView() {
        var masterViewSC = this.masterView.getComponent('ChipViewScript');
        masterViewSC.resetState();
        for (var index = 1; index < 5; index++) {
            var childName = 'chipView' + index;
            var cp = this.chipLayout.node.getChildByName(childName);
            var cpscript = cp.getComponent('ChipViewScript');
            cpscript.resetState();
        }
    },

    pushPokerToChipView: function pushPokerToChipView(pokerGroup) {
        if (pokerGroup.length !== 5) {
            console.log('pokerGroup长度不对');
            return;
        }
        var masterPkItem = pokerGroup[0];
        var masterViewSC = this.chipViewSC[0];
        masterViewSC.pokerPosFromWorld = new cc.Vec2(cc.winSize.width / 2 - 160, cc.winSize.height / 2 + 45);
        masterViewSC.bindPokers(masterPkItem['poker'], masterPkItem['result']);
        masterViewSC.pokerAnimationDelay(0);

        for (var index = 1; index < pokerGroup.length; index++) {
            var element = pokerGroup[index];
            var cpscript = this.chipViewSC[index];
            cpscript.bindPokers(element['poker'], element['result']);
            cpscript.pokerAnimationDelay(0.1 * (index + 1));
        }
        //2s后展示牌面大小
        this.scheduleOnce(function () {
            for (var index = 0; index < 5; index++) {
                var cpscript = this.chipViewSC[index];
                cpscript.showNiuNiu();
            }
        }, 2);
    }
});

cc._RF.pop();
},{"../pomelo/pomelo-client":"pomelo-client","../protocol/BrnnProto":"BrnnProto","../protocol/GateConnector":"GateConnector","../protocol/MResponse":"MResponse"}],"ChipViewScript":[function(require,module,exports){
"use strict";
cc._RF.push(module, '62ab4O3VqdESKQhmJzPxree', 'ChipViewScript');
// Script/ui/ChipViewScript.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        labelTotal: {
            default: null,
            type: cc.Label
        },

        labelMine: {
            default: null,
            type: cc.Label
        },

        pokerPrefab: {
            default: null,
            type: cc.Prefab
        },

        //扑克起始点的世界坐标系
        pokerPosFromWorld: {
            default: null,
            visible: false
        },

        myPokerList: null, //发牌的数据
        myResult: null,
        myPokerNodes: null },

    // use this for initialization
    onLoad: function onLoad() {
        this.pokerPosFromWorld = new cc.Vec2(cc.winSize.width / 2 - 150, cc.winSize.height / 2 - 30);
        var self = this;
        cc.loader.loadRes('prefab/PokerItem', function (error, pref) {
            if (error) {
                console.error(error);
                return;
            }
            self.pokerPrefab = pref;
        });
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    //绑定数据model
    //pokerList：牌数组
    //result：   结果数据
    bindPokers: function bindPokers(pokerList, result) {
        this.myPokerList = pokerList;
        this.myResult = result;
    },

    //更新总下注金额、我的下注金额
    updateGold: function updateGold(mine, total) {
        if (total) {
            this.labelTotal.string = total;
        }

        this.labelMine.string = mine;
    },

    //延迟一定时间开始发牌动画
    pokerAnimationDelay: function pokerAnimationDelay(delay) {
        if (this.myPokerList.length <= 0) {
            return;
        }
        this.myPokerNodes = new Array();
        for (var index = 0; index < this.myPokerList.length; index++) {
            var element = this.myPokerList[index];
            var pkitem = cc.instantiate(this.pokerPrefab);
            pkitem.parent = this.node;
            var fromPos = this.node.convertToNodeSpace(this.pokerPosFromWorld);
            pkitem.setPosition(fromPos);
            var PokerItemSC = pkitem.getComponent('PokerItem');
            PokerItemSC.bindPokerModel(element);
            var viewsize = this.node.getContentSize();
            var pksize = pkitem.getContentSize();
            var posTo = new cc.Vec2((index - 2) * pksize.width * 0.8, 0);
            PokerItemSC.animationMoveTo(delay + index * 0.1, posTo, this.pokerMoveOverCallback, this);
            this.myPokerNodes.push(pkitem);
        }
    },

    pokerMoveOverCallback: function pokerMoveOverCallback(pkitem) {
        //移动-》翻转显示正面
        var PokerItemSC = pkitem.getComponent('PokerItem');
        PokerItemSC.animationFlipTo(true, this.pokerFlipOverCallback, this);
    },

    pokerFlipOverCallback: function pokerFlipOverCallback(pkitem) {
        //do nothing
    },

    //重置ChipView上的状态
    //移除上面的扑克、赌注
    resetState: function resetState() {
        if (this.labelMine != null) {
            this.labelMine.string = '0';
        }
        if (this.labelTotal != null) {
            this.labelTotal.string = '0';
        }
        if (this.myPokerNodes == null) {
            return;
        }
        this.myPokerNodes.forEach(function (element) {
            element.parent = null;
            element.destroy();
        }, this);
        this.myPokerNodes = null;
    },

    /*
    nntype表示用户牌型
    炸弹(6) > 五小(5) > 五花(4) > 四花(3) > 牛牛(2) > 有牛(1) > 没牛(0)
    niuN
    牌面大小
    */
    showNiuNiu: function showNiuNiu() {
        //牌型大小
        var resName = 'png/nm';
        if (this.myResult.nntype == 6) {
            resName = 'png/nzd';
        }
        if (this.myResult.nntype == 5) {
            resName = 'png/nwx';
        }
        if (this.myResult.nntype == 4) {
            resName = 'png/nwh';
        }
        if (this.myResult.nntype == 3) {
            resName = 'png/nsh';
        }
        if (this.myResult.nntype == 2) {
            resName = 'png/nn';
        }
        if (this.myResult.nntype == 1) {
            //有牛区分牛几
            resName = 'png/n' + this.myResult.niuN;
        }
        if (this.myResult.nntype == 0) {
            resName = 'png/nm';
        }
        var self = this;
        cc.loader.loadRes(resName, cc.SpriteFrame, function (error, spriteFrame) {
            var ppNode = new cc.Node('nntype');
            var sprite = ppNode.addComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
            self.node.addChild(ppNode);

            var move = new cc.moveBy(0.5, 0, ppNode.getContentSize().height / 8 * 5);
            var scale = new cc.scaleTo(0.5, 0.5, 0.5);
            var sp = new cc.spawn(move, scale);
            ppNode.runAction(sp);

            self.myPokerNodes.push(ppNode);
        });

        //输赢显示
        //庄家没有单独的输赢标识，但是要显示倍数
        if (this.myResult.win == null || this.myResult.win == true) {
            return;
        } else {
            cc.loader.loadRes('png/shu', cc.SpriteFrame, function (error, spriteFrame) {
                var ppNode = new cc.Node('shu');
                var sprite = ppNode.addComponent(cc.Sprite);
                sprite.spriteFrame = spriteFrame;
                self.node.addChild(ppNode);

                var move = new cc.moveBy(0.5, 0, -ppNode.getContentSize().height / 8 * 5);
                var scale = new cc.scaleTo(0.5, 0.5, 0.5);
                var sp = new cc.spawn(move, scale);
                ppNode.runAction(sp);

                self.myPokerNodes.push(ppNode);
            });
        }
    }
});

cc._RF.pop();
},{}],"GateConnector":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'cae37Raf7xPf5NVD8IN3MHe', 'GateConnector');
// Script/protocol/GateConnector.js

'use strict';

require("../pomelo/pomelo-client");

var GateConnector = function GateConnector() {};

module.exports = GateConnector;

GateConnector.onLoginSuccess = function (data, callback) {
    pomelo.userinfo = data['data']['userinfo'];
    pomelo.connector = data['data']['connector'];
    var token = data['data']['token'];
    if (token) {
        pomelo.token = token;
        cc.sys.localStorage.setItem('token', pomelo.token);
    }
    pomelo.disconnect();
    if (typeof callback === 'function') {
        callback(data);
    }
};

//guest login on gate
GateConnector.gateGuestLogin = function (host, port, callback) {
    pomelo.init({
        host: host,
        port: port,
        user: {},
        handshakeCallback: function handshakeCallback() {}
    }, function () {
        pomelo.request('gate.gateHandler.guestLogin', {}, function (data) {
            GateConnector.onLoginSuccess(data, callback);
        });
    });
};

//guest login on gate
GateConnector.gateRefreshToken = function (host, port, callback) {
    pomelo.init({
        host: host,
        port: port,
        user: {},
        handshakeCallback: function handshakeCallback() {}
    }, function () {
        pomelo.request('gate.gateHandler.refreshToken', { 'token': cc.sys.localStorage.getItem('token') }, function (data) {
            GateConnector.onLoginSuccess(data, callback);
        });
    });
};

GateConnector.connectToConnector = function (callback) {
    var host = pomelo.connector.host;
    var port = pomelo.connector.port;
    pomelo.init({
        host: host,
        port: port,
        user: {},
        handshakeCallback: function handshakeCallback() {}
    }, callback);
};

//rtype room type
//rid   room id
GateConnector.connectorEnterRoom = function (rtype, rid, callback) {
    var data = {};
    data.token = pomelo.token;
    data.rtype = rtype;
    if (rid != null) {
        data.rid = rid;
    }
    pomelo.request('connector.entryHandler.enterRoom', data, callback);
};

GateConnector.connectorExit = function (callback) {
    pomelo.request('connector.entryHandler.exit', function () {
        pomelo.disconnect();
        callback();
    });
};

cc._RF.pop();
},{"../pomelo/pomelo-client":"pomelo-client"}],"HomeController":[function(require,module,exports){
"use strict";
cc._RF.push(module, '90669obLwNDL7euzc7PDlS+', 'HomeController');
// Script/ui/HomeController.js

'use strict';

var GateConnector = require("../protocol/GateConnector");

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        buttonBrnnRoom: {
            default: null,
            type: cc.Button
        }
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.buttonBrnnRoom.node.on('click', this.buttonBrnnRoomTap, this);
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    buttonBrnnRoomTap: function buttonBrnnRoomTap() {
        GateConnector.connectToConnector(function () {
            GateConnector.connectorEnterRoom('brnn', null, function (data) {
                console.log(data);
                cc.director.loadScene('BrnnRoom');
            });
        });
    }
});

cc._RF.pop();
},{"../protocol/GateConnector":"GateConnector"}],"LoginController":[function(require,module,exports){
"use strict";
cc._RF.push(module, '280c3rsZJJKnZ9RqbALVwtK', 'LoginController');
// Script/ui/LoginController.js

'use strict';

var GateConnector = require("../protocol/GateConnector");

cc.Class({
    extends: cc.Component,

    properties: {
        label: {
            default: null,
            type: cc.Label
        },
        // defaults, set visually when attaching this script to the Canvas
        text: 'Hello, World!',

        buttonGuestLogin: {
            default: null,
            type: cc.Button
        }
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.label.string = this.text;

        this.buttonGuestLogin.node.on('click', this.btnGuestLoginTap, this);
    },

    // called every frame
    update: function update(dt) {},

    btnGuestLoginTap: function btnGuestLoginTap() {
        // var token = cc.sys.localStorage.getItem('token');
        // if (token) {
        //     GateConnector.gateRefreshToken('39.108.83.192', 3101, function (data) {
        //         cc.director.loadScene('Home');
        //     });
        // } else {
        GateConnector.gateGuestLogin('39.108.83.192', 3101, function (data) {
            cc.director.loadScene('Home');
        });
        // }
    }
});

cc._RF.pop();
},{"../protocol/GateConnector":"GateConnector"}],"MResponse":[function(require,module,exports){
"use strict";
cc._RF.push(module, '14b41/pBN5AfYN2vq3X5mMW', 'MResponse');
// Script/protocol/MResponse.js

'use strict';

var MResponse = function MResponse(data) {
    this.data = data['data'];
    this.code = data['code'];
    this.msg = data['msg'];
};

module.exports = MResponse;

MResponse.prototype.hasError = function () {
    return this.code <= 0;
};

MResponse.prototype.isOK = function () {
    return this.code > 0;
};

cc._RF.pop();
},{}],"PokerItem":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'b0463P0KZ5B65hOhjkYc58h', 'PokerItem');
// Script/tool/PokerItem.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        pokerModel: null,
        frontState: false
    },

    // use this for initialization
    onLoad: function onLoad() {},

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    bindPokerModel: function bindPokerModel(pkmodel) {
        this.pokerModel = pkmodel;
    },

    animationMoveTo: function animationMoveTo(delay, pos, finishCallback, target) {
        var dl = cc.delayTime(delay);
        var bpos = new cc.Vec2(pos.x, this.node.getPositionY());
        // var mt1 = cc.moveTo(0.15, bpos);
        // var mt2 = cc.moveTo(0.15, pos);
        //改为贝塞尔移动
        var ar = [this.node.getPosition(), bpos, pos];
        var beiz = cc.bezierTo(0.3, ar);

        var cal = cc.callFunc(finishCallback, target, this);
        var seq = cc.sequence(dl, beiz, cal);
        this.node.runAction(seq);
    },

    animationFlipTo: function animationFlipTo(isFront, finishCallback, target) {
        this.frontState = isFront;
        var flip0 = cc.scaleTo(0.2, 0, 1);
        var cal = cc.callFunc(this.switchSprite, this);
        var flip1 = cc.scaleTo(0.2, 1, 1);
        var calFinish = cc.callFunc(finishCallback, target, this);
        var seq = cc.sequence(flip0, cal, flip1, calFinish);
        this.node.runAction(seq);
    },

    switchSprite: function switchSprite() {
        var resname = null;
        if (this.frontState) {
            resname = 'png/' + this.pokerModel.value + this.pokerModel.color;
        } else {
            resname = 'png/pk_back';
        }
        var self = this;
        cc.loader.loadRes(resname, cc.SpriteFrame, function (error, spriteFrame) {
            var oriSize = self.node.getContentSize();
            var sprite = self.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
            self.node.setContentSize(oriSize);
        });
    }
});

cc._RF.pop();
},{}],"pomelo-client":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'c7eeacah4xEBL3HCGu/vlVf', 'pomelo-client');
// Script/pomelo/pomelo-client.js

"use strict";

require("protobuf");
require("protocol");
(function () {
  if (typeof console.warn === "undefined") {
    console.warn = cc.warn;
  }
  if (typeof console.error === "undefined") {
    console.error = cc.error;
  }
  var JS_WS_CLIENT_TYPE = 'js-websocket';
  var JS_WS_CLIENT_VERSION = '0.0.1';

  var Protocol = window.Protocol;
  var protobuf = window.protobuf;
  var decodeIO_protobuf = window.decodeIO_protobuf;
  var decodeIO_encoder = null;
  var decodeIO_decoder = null;
  var Package = Protocol.Package;
  var Message = Protocol.Message;
  var EventEmitter = require("events");
  var rsa = window.rsa;

  if (typeof window != "undefined" && typeof sys != 'undefined' && sys.localStorage) {
    window.localStorage = sys.localStorage;
  }

  var RES_OK = 200;
  var RES_FAIL = 500;
  var RES_OLD_CLIENT = 501;

  if (typeof Object.create !== 'function') {
    Object.create = function (o) {
      function F() {}
      F.prototype = o;
      return new F();
    };
  }

  var root = window;
  var pomelo = Object.create(EventEmitter.prototype); // object extend from object
  root.pomelo = pomelo;
  var socket = null;
  var reqId = 0;
  var callbacks = {};
  var handlers = {};
  //Map from request id to route
  var routeMap = {};
  var dict = {}; // route string to code
  var abbrs = {}; // code to route string
  var serverProtos = {};
  var clientProtos = {};
  var protoVersion = 0;

  var heartbeatInterval = 0;
  var heartbeatTimeout = 0;
  var nextHeartbeatTimeout = 0;
  var gapThreshold = 100; // heartbeat gap threashold
  var heartbeatId = null;
  var heartbeatTimeoutId = null;
  var handshakeCallback = null;

  var decode = null;
  var encode = null;

  var reconnect = false;
  var reconncetTimer = null;
  var reconnectUrl = null;
  var reconnectAttempts = 0;
  var reconnectionDelay = 5000;
  var DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

  var useCrypto;

  var handshakeBuffer = {
    'sys': {
      type: JS_WS_CLIENT_TYPE,
      version: JS_WS_CLIENT_VERSION,
      rsa: {}
    },
    'user': {}
  };

  //非官方函数
  /**
   * @return {bool} true正常回调, false不再调用rpc的回调函数
   */
  var filterAfter = function filterAfter(data) {
    return true;
  };

  pomelo.setFilterAfter = function (cb) {
    filterAfter = cb;
  };
  // 非官方函数结束

  var initCallback = null;

  pomelo.init = function (params, cb) {
    initCallback = cb;
    var host = params.host;
    var port = params.port;

    encode = params.encode || defaultEncode;
    decode = params.decode || defaultDecode;

    var url = 'ws://' + host;
    if (port) {
      url += ':' + port;
    }

    handshakeBuffer.user = params.user;
    if (params.encrypt) {
      useCrypto = true;
      rsa.generate(1024, "10001");
      var data = {
        rsa_n: rsa.n.toString(16),
        rsa_e: rsa.e
      };
      handshakeBuffer.sys.rsa = data;
    }
    handshakeCallback = params.handshakeCallback;
    connect(params, url, cb);
  };

  var defaultDecode = pomelo.decode = function (data) {
    //probuff decode
    var msg = Message.decode(data);

    if (msg.id > 0) {
      msg.route = routeMap[msg.id];
      delete routeMap[msg.id];
      if (!msg.route) {
        return;
      }
    }

    msg.body = deCompose(msg);
    return msg;
  };

  var defaultEncode = pomelo.encode = function (reqId, route, msg) {
    var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    //compress message by protobuf
    if (protobuf && clientProtos[route]) {
      msg = protobuf.encode(route, msg);
    } else if (decodeIO_encoder && decodeIO_encoder.lookup(route)) {
      var Builder = decodeIO_encoder.build(route);
      msg = new Builder(msg).encodeNB();
    } else {
      msg = Protocol.strencode(JSON.stringify(msg));
    }

    var compressRoute = 0;
    if (dict && dict[route]) {
      route = dict[route];
      compressRoute = 1;
    }

    return Message.encode(reqId, type, compressRoute, route, msg);
  };

  var connect = function connect(params, url, cb) {
    console.log('connect to ' + url);

    var params = params || {};
    var maxReconnectAttempts = params.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS;
    reconnectUrl = url;
    //Add protobuf version
    if (window.localStorage && window.localStorage.getItem('protos') && protoVersion === 0) {
      var protos = JSON.parse(window.localStorage.getItem('protos'));

      protoVersion = protos.version || 0;
      serverProtos = protos.server || {};
      clientProtos = protos.client || {};

      if (!!protobuf) {
        protobuf.init({ encoderProtos: clientProtos, decoderProtos: serverProtos });
      }
      if (!!decodeIO_protobuf) {
        decodeIO_encoder = decodeIO_protobuf.loadJson(clientProtos);
        decodeIO_decoder = decodeIO_protobuf.loadJson(serverProtos);
      }
    }
    //Set protoversion
    handshakeBuffer.sys.protoVersion = protoVersion;

    var onopen = function onopen(event) {
      if (!!reconnect) {
        pomelo.emit('reconnect');
      }
      reset();
      var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
      send(obj);
    };
    var onmessage = function onmessage(event) {
      processPackage(Package.decode(event.data), cb);
      // new package arrived, update the heartbeat timeout
      if (heartbeatTimeout) {
        nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      }
    };
    var onerror = function onerror(event) {
      pomelo.emit('io-error', event);
      console.error('socket error: ', event);
    };
    var onclose = function onclose(event) {
      pomelo.emit('close', event);
      pomelo.emit('disconnect', event);
      console.error('socket close: ', event);
      if (!!params.reconnect && reconnectAttempts < maxReconnectAttempts) {
        reconnect = true;
        reconnectAttempts++;
        reconncetTimer = setTimeout(function () {
          connect(params, reconnectUrl, cb);
        }, reconnectionDelay);
        reconnectionDelay *= 2;
      }
    };
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
  };

  pomelo.disconnect = function () {
    if (socket) {
      if (socket.disconnect) socket.disconnect();
      if (socket.close) socket.close();
      console.log('disconnect');
      socket = null;
    }

    if (heartbeatId) {
      clearTimeout(heartbeatId);
      heartbeatId = null;
    }
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }
  };

  var reset = function reset() {
    reconnect = false;
    reconnectionDelay = 1000 * 5;
    reconnectAttempts = 0;
    clearTimeout(reconncetTimer);
  };

  pomelo.request = function (route, msg, cb) {
    if (arguments.length === 2 && typeof msg === 'function') {
      cb = msg;
      msg = {};
    } else {
      msg = msg || {};
    }
    route = route || msg.route;
    if (!route) {
      return;
    }
    pomelo.emit('beforeRPC');
    reqId++;
    sendMessage(reqId, route, msg);

    callbacks[reqId] = cb;
    routeMap[reqId] = route;
  };

  pomelo.notify = function (route, msg) {
    msg = msg || {};
    sendMessage(0, route, msg);
  };

  var sendMessage = function sendMessage(reqId, route, msg) {
    if (useCrypto) {
      msg = JSON.stringify(msg);
      var sig = rsa.signString(msg, "sha256");
      msg = JSON.parse(msg);
      msg['__crypto__'] = sig;
    }

    if (encode) {
      msg = encode(reqId, route, msg);
    }

    var packet = Package.encode(Package.TYPE_DATA, msg);
    send(packet);
  };

  var send = function send(packet) {
    if (socket) socket.send(packet.buffer);
  };

  var handler = {};

  var heartbeat = function heartbeat(data) {
    if (!heartbeatInterval) {
      // no heartbeat
      return;
    }

    var obj = Package.encode(Package.TYPE_HEARTBEAT);
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }

    if (heartbeatId) {
      // already in a heartbeat interval
      return;
    }
    heartbeatId = setTimeout(function () {
      heartbeatId = null;
      send(obj);

      nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
    }, heartbeatInterval);
  };

  var heartbeatTimeoutCb = function heartbeatTimeoutCb() {
    var gap = nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
    } else {
      console.error('server heartbeat timeout');
      pomelo.emit('heartbeat timeout');
      pomelo.disconnect();
    }
  };

  var handshake = function handshake(data) {
    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
      pomelo.emit('error', 'client version not fullfill');
      return;
    }

    if (data.code !== RES_OK) {
      pomelo.emit('error', 'handshake fail');
      return;
    }

    handshakeInit(data);

    var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    send(obj);
    if (initCallback) {
      initCallback(socket);
    }
  };

  var onData = function onData(data) {
    var msg = data;
    if (decode) {
      msg = decode(msg);
    }
    processMessage(pomelo, msg);
  };

  var onKick = function onKick(data) {
    data = JSON.parse(Protocol.strdecode(data));
    pomelo.emit('onKick', data);
  };

  handlers[Package.TYPE_HANDSHAKE] = handshake;
  handlers[Package.TYPE_HEARTBEAT] = heartbeat;
  handlers[Package.TYPE_DATA] = onData;
  handlers[Package.TYPE_KICK] = onKick;

  var processPackage = function processPackage(msgs) {
    if (Array.isArray(msgs)) {
      for (var i = 0; i < msgs.length; i++) {
        var msg = msgs[i];
        handlers[msg.type](msg.body);
      }
    } else {
      handlers[msgs.type](msgs.body);
    }
  };

  var processMessage = function processMessage(pomelo, msg) {
    if (!msg.id) {
      // server push message
      pomelo.emit(msg.route, msg.body);
      return;
    }

    //if have a id then find the callback function with the request
    var cb = callbacks[msg.id];

    delete callbacks[msg.id];
    if (typeof cb !== 'function') {
      return;
    }
    pomelo.emit("afterRPC");
    if (filterAfter(msg.body)) {
      cb(msg.body);
    }
    return;
  };

  var processMessageBatch = function processMessageBatch(pomelo, msgs) {
    for (var i = 0, l = msgs.length; i < l; i++) {
      processMessage(pomelo, msgs[i]);
    }
  };

  var deCompose = function deCompose(msg) {
    var route = msg.route;

    //Decompose route from dict
    if (msg.compressRoute) {
      if (!abbrs[route]) {
        return {};
      }

      route = msg.route = abbrs[route];
    }
    if (protobuf && serverProtos[route]) {
      return protobuf.decodeStr(route, msg.body);
    } else if (decodeIO_decoder && decodeIO_decoder.lookup(route)) {
      return decodeIO_decoder.build(route).decode(msg.body);
    } else {
      return JSON.parse(Protocol.strdecode(msg.body));
    }
  };

  var handshakeInit = function handshakeInit(data) {
    if (data.sys && data.sys.heartbeat) {
      heartbeatInterval = data.sys.heartbeat * 1000; // heartbeat interval
      heartbeatTimeout = heartbeatInterval * 2; // max heartbeat timeout
    } else {
      heartbeatInterval = 0;
      heartbeatTimeout = 0;
    }

    initData(data);

    if (typeof handshakeCallback === 'function') {
      handshakeCallback(data.user);
    }
  };

  //Initilize data used in pomelo client
  var initData = function initData(data) {
    if (!data || !data.sys) {
      return;
    }
    dict = data.sys.dict;
    var protos = data.sys.protos;

    //Init compress dict
    if (dict) {
      dict = dict;
      abbrs = {};

      for (var route in dict) {
        abbrs[dict[route]] = route;
      }
    }

    //Init protobuf protos
    if (protos) {
      protoVersion = protos.version || 0;
      serverProtos = protos.server || {};
      clientProtos = protos.client || {};

      //Save protobuf protos to localStorage
      window.localStorage.setItem('protos', JSON.stringify(protos));

      if (!!protobuf) {
        protobuf.init({ encoderProtos: protos.client, decoderProtos: protos.server });
      }
      if (!!decodeIO_protobuf) {
        decodeIO_encoder = decodeIO_protobuf.loadJson(clientProtos);
        decodeIO_decoder = decodeIO_protobuf.loadJson(serverProtos);
      }
    }
  };

  module.exports = pomelo;
})();

cc._RF.pop();
},{"events":4,"protobuf":"protobuf","protocol":"protocol"}],"protobuf":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'f635fQ2xQtHJK4k4b/kTIdJ', 'protobuf');
// Script/pomelo/protobuf.js

"use strict";

/* ProtocolBuffer client 0.1.0*/

/**
 * pomelo-protobuf
 * @author <zhang0935@gmail.com>
 */

/**
 * Protocol buffer root
 * In browser, it will be window.protbuf
 */
(function (exports, global) {
  var Protobuf = exports;

  Protobuf.init = function (opts) {
    //On the serverside, use serverProtos to encode messages send to client
    Protobuf.encoder.init(opts.encoderProtos);

    //On the serverside, user clientProtos to decode messages receive from clients
    Protobuf.decoder.init(opts.decoderProtos);
  };

  Protobuf.encode = function (key, msg) {
    return Protobuf.encoder.encode(key, msg);
  };

  Protobuf.decode = function (key, msg) {
    return Protobuf.decoder.decode(key, msg);
  };

  // exports to support for components
  module.exports = Protobuf;
  if (typeof window != "undefined") {
    window.protobuf = Protobuf;
  }
})(typeof window == "undefined" ? module.exports : window.protobuf = {}, undefined);

/**
 * constants
 */
(function (exports, global) {
  var constants = exports.constants = {};

  constants.TYPES = {
    uInt32: 0,
    sInt32: 0,
    int32: 0,
    double: 1,
    string: 2,
    message: 2,
    float: 5
  };
})('undefined' !== typeof protobuf ? protobuf : module.exports, undefined);

/**
 * util module
 */
(function (exports, global) {

  var Util = exports.util = {};

  Util.isSimpleType = function (type) {
    return type === 'uInt32' || type === 'sInt32' || type === 'int32' || type === 'uInt64' || type === 'sInt64' || type === 'float' || type === 'double';
  };
})('undefined' !== typeof protobuf ? protobuf : module.exports, undefined);

/**
 * codec module
 */
(function (exports, global) {

  var Codec = exports.codec = {};

  var buffer = new ArrayBuffer(8);
  var float32Array = new Float32Array(buffer);
  var float64Array = new Float64Array(buffer);
  var uInt8Array = new Uint8Array(buffer);

  Codec.encodeUInt32 = function (n) {
    var n = parseInt(n);
    if (isNaN(n) || n < 0) {
      return null;
    }

    var result = [];
    do {
      var tmp = n % 128;
      var next = Math.floor(n / 128);

      if (next !== 0) {
        tmp = tmp + 128;
      }
      result.push(tmp);
      n = next;
    } while (n !== 0);

    return result;
  };

  Codec.encodeSInt32 = function (n) {
    var n = parseInt(n);
    if (isNaN(n)) {
      return null;
    }
    n = n < 0 ? Math.abs(n) * 2 - 1 : n * 2;

    return Codec.encodeUInt32(n);
  };

  Codec.decodeUInt32 = function (bytes) {
    var n = 0;

    for (var i = 0; i < bytes.length; i++) {
      var m = parseInt(bytes[i]);
      n = n + (m & 0x7f) * Math.pow(2, 7 * i);
      if (m < 128) {
        return n;
      }
    }

    return n;
  };

  Codec.decodeSInt32 = function (bytes) {
    var n = this.decodeUInt32(bytes);
    var flag = n % 2 === 1 ? -1 : 1;

    n = (n % 2 + n) / 2 * flag;

    return n;
  };

  Codec.encodeFloat = function (float) {
    float32Array[0] = float;
    return uInt8Array;
  };

  Codec.decodeFloat = function (bytes, offset) {
    if (!bytes || bytes.length < offset + 4) {
      return null;
    }

    for (var i = 0; i < 4; i++) {
      uInt8Array[i] = bytes[offset + i];
    }

    return float32Array[0];
  };

  Codec.encodeDouble = function (double) {
    float64Array[0] = double;
    return uInt8Array.subarray(0, 8);
  };

  Codec.decodeDouble = function (bytes, offset) {
    if (!bytes || bytes.length < offset + 8) {
      return null;
    }

    for (var i = 0; i < 8; i++) {
      uInt8Array[i] = bytes[offset + i];
    }

    return float64Array[0];
  };

  Codec.encodeStr = function (bytes, offset, str) {
    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      var codes = encode2UTF8(code);

      for (var j = 0; j < codes.length; j++) {
        bytes[offset] = codes[j];
        offset++;
      }
    }

    return offset;
  };

  /**
   * Decode string from utf8 bytes
   */
  Codec.decodeStr = function (bytes, offset, length) {
    var array = [];
    var end = offset + length;

    while (offset < end) {
      var code = 0;

      if (bytes[offset] < 128) {
        code = bytes[offset];

        offset += 1;
      } else if (bytes[offset] < 224) {
        code = ((bytes[offset] & 0x3f) << 6) + (bytes[offset + 1] & 0x3f);
        offset += 2;
      } else {
        code = ((bytes[offset] & 0x0f) << 12) + ((bytes[offset + 1] & 0x3f) << 6) + (bytes[offset + 2] & 0x3f);
        offset += 3;
      }

      array.push(code);
    }

    var str = '';
    for (var i = 0; i < array.length;) {
      str += String.fromCharCode.apply(null, array.slice(i, i + 10000));
      i += 10000;
    }

    return str;
  };

  /**
   * Return the byte length of the str use utf8
   */
  Codec.byteLength = function (str) {
    if (typeof str !== 'string') {
      return -1;
    }

    var length = 0;

    for (var i = 0; i < str.length; i++) {
      var code = str.charCodeAt(i);
      length += codeLength(code);
    }

    return length;
  };

  /**
   * Encode a unicode16 char code to utf8 bytes
   */
  function encode2UTF8(charCode) {
    if (charCode <= 0x7f) {
      return [charCode];
    } else if (charCode <= 0x7ff) {
      return [0xc0 | charCode >> 6, 0x80 | charCode & 0x3f];
    } else {
      return [0xe0 | charCode >> 12, 0x80 | (charCode & 0xfc0) >> 6, 0x80 | charCode & 0x3f];
    }
  }

  function codeLength(code) {
    if (code <= 0x7f) {
      return 1;
    } else if (code <= 0x7ff) {
      return 2;
    } else {
      return 3;
    }
  }
})('undefined' !== typeof protobuf ? protobuf : module.exports, undefined);

/**
 * encoder module
 */
(function (exports, global) {

  var protobuf = exports;
  var MsgEncoder = exports.encoder = {};

  var codec = protobuf.codec;
  var constant = protobuf.constants;
  var util = protobuf.util;

  MsgEncoder.init = function (protos) {
    this.protos = protos || {};
  };

  MsgEncoder.encode = function (route, msg) {
    //Get protos from protos map use the route as key
    var protos = this.protos[route];

    //Check msg
    if (!checkMsg(msg, protos)) {
      return null;
    }

    //Set the length of the buffer 2 times bigger to prevent overflow
    var length = codec.byteLength(JSON.stringify(msg));

    //Init buffer and offset
    var buffer = new ArrayBuffer(length);
    var uInt8Array = new Uint8Array(buffer);
    var offset = 0;

    if (!!protos) {
      offset = encodeMsg(uInt8Array, offset, protos, msg);
      if (offset > 0) {
        return uInt8Array.subarray(0, offset);
      }
    }

    return null;
  };

  /**
   * Check if the msg follow the defination in the protos
   */
  function checkMsg(msg, protos) {
    if (!protos) {
      return false;
    }

    for (var name in protos) {
      var proto = protos[name];

      //All required element must exist
      switch (proto.option) {
        case 'required':
          if (typeof msg[name] === 'undefined') {
            console.warn('no property exist for required! name: %j, proto: %j, msg: %j', name, proto, msg);
            return false;
          }
        case 'optional':
          if (typeof msg[name] !== 'undefined') {
            var message = protos.__messages[proto.type] || MsgEncoder.protos['message ' + proto.type];
            if (!!message && !checkMsg(msg[name], message)) {
              console.warn('inner proto error! name: %j, proto: %j, msg: %j', name, proto, msg);
              return false;
            }
          }
          break;
        case 'repeated':
          //Check nest message in repeated elements
          var message = protos.__messages[proto.type] || MsgEncoder.protos['message ' + proto.type];
          if (!!msg[name] && !!message) {
            for (var i = 0; i < msg[name].length; i++) {
              if (!checkMsg(msg[name][i], message)) {
                return false;
              }
            }
          }
          break;
      }
    }

    return true;
  }

  function encodeMsg(buffer, offset, protos, msg) {
    for (var name in msg) {
      if (!!protos[name]) {
        var proto = protos[name];

        switch (proto.option) {
          case 'required':
          case 'optional':
            offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
            offset = encodeProp(msg[name], proto.type, offset, buffer, protos);
            break;
          case 'repeated':
            if (msg[name].length > 0) {
              offset = encodeArray(msg[name], proto, offset, buffer, protos);
            }
            break;
        }
      }
    }

    return offset;
  }

  function encodeProp(value, type, offset, buffer, protos) {
    switch (type) {
      case 'uInt32':
        offset = writeBytes(buffer, offset, codec.encodeUInt32(value));
        break;
      case 'int32':
      case 'sInt32':
        offset = writeBytes(buffer, offset, codec.encodeSInt32(value));
        break;
      case 'float':
        writeBytes(buffer, offset, codec.encodeFloat(value));
        offset += 4;
        break;
      case 'double':
        writeBytes(buffer, offset, codec.encodeDouble(value));
        offset += 8;
        break;
      case 'string':
        var length = codec.byteLength(value);

        //Encode length
        offset = writeBytes(buffer, offset, codec.encodeUInt32(length));
        //write string
        codec.encodeStr(buffer, offset, value);
        offset += length;
        break;
      default:
        var message = protos.__messages[type] || MsgEncoder.protos['message ' + type];
        if (!!message) {
          //Use a tmp buffer to build an internal msg
          var tmpBuffer = new ArrayBuffer(codec.byteLength(JSON.stringify(value)) * 2);
          var length = 0;

          length = encodeMsg(tmpBuffer, length, message, value);
          //Encode length
          offset = writeBytes(buffer, offset, codec.encodeUInt32(length));
          //contact the object
          for (var i = 0; i < length; i++) {
            buffer[offset] = tmpBuffer[i];
            offset++;
          }
        }
        break;
    }

    return offset;
  }

  /**
   * Encode reapeated properties, simple msg and object are decode differented
   */
  function encodeArray(array, proto, offset, buffer, protos) {
    var i = 0;

    if (util.isSimpleType(proto.type)) {
      offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
      offset = writeBytes(buffer, offset, codec.encodeUInt32(array.length));
      for (i = 0; i < array.length; i++) {
        offset = encodeProp(array[i], proto.type, offset, buffer);
      }
    } else {
      for (i = 0; i < array.length; i++) {
        offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
        offset = encodeProp(array[i], proto.type, offset, buffer, protos);
      }
    }

    return offset;
  }

  function writeBytes(buffer, offset, bytes) {
    for (var i = 0; i < bytes.length; i++, offset++) {
      buffer[offset] = bytes[i];
    }

    return offset;
  }

  function encodeTag(type, tag) {
    var value = constant.TYPES[type] || 2;

    return codec.encodeUInt32(tag << 3 | value);
  }
})('undefined' !== typeof protobuf ? protobuf : module.exports, undefined);

/**
 * decoder module
 */
(function (exports, global) {
  var protobuf = exports;
  var MsgDecoder = exports.decoder = {};

  var codec = protobuf.codec;
  var util = protobuf.util;

  var buffer;
  var offset = 0;

  MsgDecoder.init = function (protos) {
    this.protos = protos || {};
  };

  MsgDecoder.setProtos = function (protos) {
    if (!!protos) {
      this.protos = protos;
    }
  };

  MsgDecoder.decode = function (route, buf) {
    var protos = this.protos[route];

    buffer = buf;
    offset = 0;

    if (!!protos) {
      return decodeMsg({}, protos, buffer.length);
    }

    return null;
  };

  function decodeMsg(msg, protos, length) {
    while (offset < length) {
      var head = getHead();
      var type = head.type;
      var tag = head.tag;
      var name = protos.__tags[tag];

      switch (protos[name].option) {
        case 'optional':
        case 'required':
          msg[name] = decodeProp(protos[name].type, protos);
          break;
        case 'repeated':
          if (!msg[name]) {
            msg[name] = [];
          }
          decodeArray(msg[name], protos[name].type, protos);
          break;
      }
    }

    return msg;
  }

  /**
   * Test if the given msg is finished
   */
  function isFinish(msg, protos) {
    return !protos.__tags[peekHead().tag];
  }
  /**
   * Get property head from protobuf
   */
  function getHead() {
    var tag = codec.decodeUInt32(getBytes());

    return {
      type: tag & 0x7,
      tag: tag >> 3
    };
  }

  /**
   * Get tag head without move the offset
   */
  function peekHead() {
    var tag = codec.decodeUInt32(peekBytes());

    return {
      type: tag & 0x7,
      tag: tag >> 3
    };
  }

  function decodeProp(type, protos) {
    switch (type) {
      case 'uInt32':
        return codec.decodeUInt32(getBytes());
      case 'int32':
      case 'sInt32':
        return codec.decodeSInt32(getBytes());
      case 'float':
        var float = codec.decodeFloat(buffer, offset);
        offset += 4;
        return float;
      case 'double':
        var double = codec.decodeDouble(buffer, offset);
        offset += 8;
        return double;
      case 'string':
        var length = codec.decodeUInt32(getBytes());

        var str = codec.decodeStr(buffer, offset, length);
        offset += length;

        return str;
      default:
        var message = protos && (protos.__messages[type] || MsgDecoder.protos['message ' + type]);
        if (!!message) {
          var length = codec.decodeUInt32(getBytes());
          var msg = {};
          decodeMsg(msg, message, offset + length);
          return msg;
        }
        break;
    }
  }

  function decodeArray(array, type, protos) {
    if (util.isSimpleType(type)) {
      var length = codec.decodeUInt32(getBytes());

      for (var i = 0; i < length; i++) {
        array.push(decodeProp(type));
      }
    } else {
      array.push(decodeProp(type, protos));
    }
  }

  function getBytes(flag) {
    var bytes = [];
    var pos = offset;
    flag = flag || false;

    var b;

    do {
      b = buffer[pos];
      bytes.push(b);
      pos++;
    } while (b >= 128);

    if (!flag) {
      offset = pos;
    }
    return bytes;
  }

  function peekBytes() {
    return getBytes(true);
  }
})('undefined' !== typeof protobuf ? protobuf : module.exports, undefined);

cc._RF.pop();
},{}],"protocol":[function(require,module,exports){
(function (Buffer){
"use strict";
cc._RF.push(module, 'b5d97r2J8NHSaN2fJ7+h1Hb', 'protocol');
// Script/pomelo/protocol.js

"use strict";

(function (exports, ByteArray, global) {
  var Protocol = exports;

  var PKG_HEAD_BYTES = 4;
  var MSG_FLAG_BYTES = 1;
  var MSG_ROUTE_CODE_BYTES = 2;
  var MSG_ID_MAX_BYTES = 5;
  var MSG_ROUTE_LEN_BYTES = 1;

  var MSG_ROUTE_CODE_MAX = 0xffff;

  var MSG_COMPRESS_ROUTE_MASK = 0x1;
  var MSG_COMPRESS_GZIP_MASK = 0x1;
  var MSG_COMPRESS_GZIP_ENCODE_MASK = 1 << 4;
  var MSG_TYPE_MASK = 0x7;

  var Package = Protocol.Package = {};
  var Message = Protocol.Message = {};

  Package.TYPE_HANDSHAKE = 1;
  Package.TYPE_HANDSHAKE_ACK = 2;
  Package.TYPE_HEARTBEAT = 3;
  Package.TYPE_DATA = 4;
  Package.TYPE_KICK = 5;

  Message.TYPE_REQUEST = 0;
  Message.TYPE_NOTIFY = 1;
  Message.TYPE_RESPONSE = 2;
  Message.TYPE_PUSH = 3;

  /**
   * pomele client encode
   * id message id;
   * route message route
   * msg message body
   * socketio current support string
   */
  Protocol.strencode = function (str) {
    if (typeof Buffer !== "undefined" && ByteArray === Buffer) {
      // encoding defaults to 'utf8'
      return new Buffer(str);
    } else {
      var byteArray = new ByteArray(str.length * 3);
      var offset = 0;
      for (var i = 0; i < str.length; i++) {
        var charCode = str.charCodeAt(i);
        var codes = null;
        if (charCode <= 0x7f) {
          codes = [charCode];
        } else if (charCode <= 0x7ff) {
          codes = [0xc0 | charCode >> 6, 0x80 | charCode & 0x3f];
        } else {
          codes = [0xe0 | charCode >> 12, 0x80 | (charCode & 0xfc0) >> 6, 0x80 | charCode & 0x3f];
        }
        for (var j = 0; j < codes.length; j++) {
          byteArray[offset] = codes[j];
          ++offset;
        }
      }
      var _buffer = new ByteArray(offset);
      copyArray(_buffer, 0, byteArray, 0, offset);
      return _buffer;
    }
  };

  /**
   * client decode
   * msg String data
   * return Message Object
   */
  Protocol.strdecode = function (buffer) {
    if (typeof Buffer !== "undefined" && ByteArray === Buffer) {
      // encoding defaults to 'utf8'
      return buffer.toString();
    } else {
      var bytes = new ByteArray(buffer);
      var array = [];
      var offset = 0;
      var charCode = 0;
      var end = bytes.length;
      while (offset < end) {
        if (bytes[offset] < 128) {
          charCode = bytes[offset];
          offset += 1;
        } else if (bytes[offset] < 224) {
          charCode = ((bytes[offset] & 0x1f) << 6) + (bytes[offset + 1] & 0x3f);
          offset += 2;
        } else {
          charCode = ((bytes[offset] & 0x0f) << 12) + ((bytes[offset + 1] & 0x3f) << 6) + (bytes[offset + 2] & 0x3f);
          offset += 3;
        }
        array.push(charCode);
      }
      return String.fromCharCode.apply(null, array);
    }
  };

  /**
   * Package protocol encode.
   *
   * Pomelo package format:
   * +------+-------------+------------------+
   * | type | body length |       body       |
   * +------+-------------+------------------+
   *
   * Head: 4bytes
   *   0: package type,
   *      1 - handshake,
   *      2 - handshake ack,
   *      3 - heartbeat,
   *      4 - data
   *      5 - kick
   *   1 - 3: big-endian body length
   * Body: body length bytes
   *
   * @param  {Number}    type   package type
   * @param  {ByteArray} body   body content in bytes
   * @return {ByteArray}        new byte array that contains encode result
   */
  Package.encode = function (type, body) {
    var length = body ? body.length : 0;
    var buffer = new ByteArray(PKG_HEAD_BYTES + length);
    var index = 0;
    buffer[index++] = type & 0xff;
    buffer[index++] = length >> 16 & 0xff;
    buffer[index++] = length >> 8 & 0xff;
    buffer[index++] = length & 0xff;
    if (body) {
      copyArray(buffer, index, body, 0, length);
    }
    return buffer;
  };

  /**
   * Package protocol decode.
   * See encode for package format.
   *
   * @param  {ByteArray} buffer byte array containing package content
   * @return {Object}           {type: package type, buffer: body byte array}
   */
  Package.decode = function (buffer) {
    var offset = 0;
    var bytes = new ByteArray(buffer);
    var length = 0;
    var rs = [];
    while (offset < bytes.length) {
      var type = bytes[offset++];
      length = (bytes[offset++] << 16 | bytes[offset++] << 8 | bytes[offset++]) >>> 0;
      var body = length ? new ByteArray(length) : null;
      if (body) {
        copyArray(body, 0, bytes, offset, length);
      }
      offset += length;
      rs.push({ 'type': type, 'body': body });
    }
    return rs.length === 1 ? rs[0] : rs;
  };

  /**
   * Message protocol encode.
   *
   * @param  {Number} id            message id
   * @param  {Number} type          message type
   * @param  {Number} compressRoute whether compress route
   * @param  {Number|String} route  route code or route string
   * @param  {Buffer} msg           message body bytes
   * @return {Buffer}               encode result
   */
  Message.encode = function (id, type, compressRoute, route, msg, compressGzip) {
    // caculate message max length
    var idBytes = msgHasId(type) ? caculateMsgIdBytes(id) : 0;
    var msgLen = MSG_FLAG_BYTES + idBytes;

    if (msgHasRoute(type)) {
      if (compressRoute) {
        if (typeof route !== 'number') {
          throw new Error('error flag for number route!');
        }
        msgLen += MSG_ROUTE_CODE_BYTES;
      } else {
        msgLen += MSG_ROUTE_LEN_BYTES;
        if (route) {
          route = Protocol.strencode(route);
          if (route.length > 255) {
            throw new Error('route maxlength is overflow');
          }
          msgLen += route.length;
        }
      }
    }

    if (msg) {
      msgLen += msg.length;
    }

    var buffer = new ByteArray(msgLen);
    var offset = 0;

    // add flag
    offset = encodeMsgFlag(type, compressRoute, buffer, offset, compressGzip);

    // add message id
    if (msgHasId(type)) {
      offset = encodeMsgId(id, buffer, offset);
    }

    // add route
    if (msgHasRoute(type)) {
      offset = encodeMsgRoute(compressRoute, route, buffer, offset);
    }

    // add body
    if (msg) {
      offset = encodeMsgBody(msg, buffer, offset);
    }

    return buffer;
  };

  /**
   * Message protocol decode.
   *
   * @param  {Buffer|Uint8Array} buffer message bytes
   * @return {Object}            message object
   */
  Message.decode = function (buffer) {
    var bytes = new ByteArray(buffer);
    var bytesLen = bytes.length || bytes.byteLength;
    var offset = 0;
    var id = 0;
    var route = null;

    // parse flag
    var flag = bytes[offset++];
    var compressRoute = flag & MSG_COMPRESS_ROUTE_MASK;
    var type = flag >> 1 & MSG_TYPE_MASK;
    var compressGzip = flag >> 4 & MSG_COMPRESS_GZIP_MASK;

    // parse id
    if (msgHasId(type)) {
      var m = 0;
      var i = 0;
      do {
        m = parseInt(bytes[offset]);
        id += (m & 0x7f) << 7 * i;
        offset++;
        i++;
      } while (m >= 128);
    }

    // parse route
    if (msgHasRoute(type)) {
      if (compressRoute) {
        route = bytes[offset++] << 8 | bytes[offset++];
      } else {
        var routeLen = bytes[offset++];
        if (routeLen) {
          route = new ByteArray(routeLen);
          copyArray(route, 0, bytes, offset, routeLen);
          route = Protocol.strdecode(route);
        } else {
          route = '';
        }
        offset += routeLen;
      }
    }

    // parse body
    var bodyLen = bytesLen - offset;
    var body = new ByteArray(bodyLen);

    copyArray(body, 0, bytes, offset, bodyLen);

    return { 'id': id, 'type': type, 'compressRoute': compressRoute,
      'route': route, 'body': body, 'compressGzip': compressGzip };
  };

  var copyArray = function copyArray(dest, doffset, src, soffset, length) {
    if ('function' === typeof src.copy) {
      // Buffer
      src.copy(dest, doffset, soffset, soffset + length);
    } else {
      // Uint8Array
      for (var index = 0; index < length; index++) {
        dest[doffset++] = src[soffset++];
      }
    }
  };

  var msgHasId = function msgHasId(type) {
    return type === Message.TYPE_REQUEST || type === Message.TYPE_RESPONSE;
  };

  var msgHasRoute = function msgHasRoute(type) {
    return type === Message.TYPE_REQUEST || type === Message.TYPE_NOTIFY || type === Message.TYPE_PUSH;
  };

  var caculateMsgIdBytes = function caculateMsgIdBytes(id) {
    var len = 0;
    do {
      len += 1;
      id >>= 7;
    } while (id > 0);
    return len;
  };

  var encodeMsgFlag = function encodeMsgFlag(type, compressRoute, buffer, offset, compressGzip) {
    if (type !== Message.TYPE_REQUEST && type !== Message.TYPE_NOTIFY && type !== Message.TYPE_RESPONSE && type !== Message.TYPE_PUSH) {
      throw new Error('unkonw message type: ' + type);
    }

    buffer[offset] = type << 1 | (compressRoute ? 1 : 0);

    if (compressGzip) {
      buffer[offset] = buffer[offset] | MSG_COMPRESS_GZIP_ENCODE_MASK;
    }

    return offset + MSG_FLAG_BYTES;
  };

  var encodeMsgId = function encodeMsgId(id, buffer, offset) {
    do {
      var tmp = id % 128;
      var next = Math.floor(id / 128);

      if (next !== 0) {
        tmp = tmp + 128;
      }
      buffer[offset++] = tmp;

      id = next;
    } while (id !== 0);

    return offset;
  };

  var encodeMsgRoute = function encodeMsgRoute(compressRoute, route, buffer, offset) {
    if (compressRoute) {
      if (route > MSG_ROUTE_CODE_MAX) {
        throw new Error('route number is overflow');
      }

      buffer[offset++] = route >> 8 & 0xff;
      buffer[offset++] = route & 0xff;
    } else {
      if (route) {
        buffer[offset++] = route.length & 0xff;
        copyArray(buffer, offset, route, 0, route.length);
        offset += route.length;
      } else {
        buffer[offset++] = 0;
      }
    }

    return offset;
  };

  var encodeMsgBody = function encodeMsgBody(msg, buffer, offset) {
    copyArray(buffer, offset, msg, 0, msg.length);
    return offset + msg.length;
  };

  module.exports = Protocol;
  if (typeof window != "undefined") {
    window.Protocol = Protocol;
  }
})(typeof window == "undefined" ? module.exports : window.Protocol = {}, typeof window == "undefined" ? Buffer : Uint8Array, undefined);

cc._RF.pop();
}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},["pomelo-client","protobuf","protocol","BrnnProto","GateConnector","MResponse","AlertView","PokerItem","BrnnRoomController","ChipViewScript","HomeController","LoginController"]);
