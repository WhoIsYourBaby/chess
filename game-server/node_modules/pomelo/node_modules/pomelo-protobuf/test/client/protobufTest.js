var protobuf = require('../../lib/client/protobuf');
var encoder = protobuf.encoder;
var decoder = protobuf.decoder;
var codec = protobuf.codec;
var parser = require('../../lib/protoParser');
var util = require('../../lib/util');
var should = require('should');

describe('msgEncoderTest', function(){
	var msg = {
		entityId : 1,
		paths : [{x : 1, y : 2, c : {a : 1}},
							{x : 3, y : 4, c : {a : 2}, tests : [{a:1}, {a:2}]}],
		speed : 110,
		speed1 : 'ss',
		a : 111.1111
	};

	var protos = parser.parse(require('../protos.json'));

	encoder.init(protos);
	decoder.init(protos);
	//protobuf.init({encoderProtos:protos, decoderProtos:protos});

	describe('encodeTest', function(){
		var buffer = encoder.encode('onMove', msg);

		console.log(buffer);
		var decodeMsg = decoder.decode('onMove', buffer);

		//msg.should.equal(decodeMsg);
		util.equal(msg, decodeMsg).should.equal(true);

		var l1 = codec.byteLength(JSON.stringify(msg));
		var l2 = buffer.length;
		console.log('old Length : %j, new length : %j, compress rate : %j%', l1, l2, Math.floor(l2/l1*10000)/100);
	});
});