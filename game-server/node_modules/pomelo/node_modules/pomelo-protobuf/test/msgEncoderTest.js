var protobuf = require('../lib/protobuf');
var util = require('../lib/util');
var should = require('should');
var tc = require('./testMsg');


describe('msgEncoderTest', function(){

	var protos = protobuf.parse(require('./protos.json'));
	protobuf.init({encoderProtos:protos, decoderProtos:protos});


	describe('encodeTest', function(){
		for(var route in tc){
			var msg = tc[route];
			var buffer = protobuf.encode(route, msg);

			//console.log(str);
			var decodeMsg = protobuf.decode(route, buffer);

			//msg.should.equal(decodeMsg);
			//console.log(decodeMsg);
			if(route === 'area.playerHandler.enterScene'){
				var map = decodeMsg.map.weightMap;
				for(var key in map)
				console.log(map[key]);
			}
			util.equal(msg, decodeMsg).should.equal(true);

			//console.log(protobuf.encode(route, msg));
		}

		//console.log('old Length : %j, new length : %j, compress rate : %j%', Buffer.byteLength(oldStr), Buffer.byteLength(str), Math.floor(str.length/oldStr.length*10000)/100);
	});
});