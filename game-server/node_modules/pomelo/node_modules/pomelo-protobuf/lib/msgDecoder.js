var protoParser = require('./protoParser');
var encoder = require('./encoder');
var util = require('./util');

var MsgDecoder = module.exports;

var buffer;
var offset = 0;

MsgDecoder.init = function(protos){
	this.protos = protos || {};
};

MsgDecoder.setProtos = function(protos){
	if(!!protos){
		this.protos = protos;
	}
};

MsgDecoder.decode = function(route, buf){
	var protos = this.protos[route];

	buffer = buf;
	offset = 0;

	if(!!protos){
		return decodeMsg({}, protos, buffer.length);
	}

	return null;
};

function decodeMsg(msg, protos, length){
	while(offset<length){
		//console.log('offset : %j, length : %j, head bytes : %j', offset, length, peekBytes());
		var head = getHead();
		var type = head.type;
		var tag = head.tag;

		var name = protos.__tags[tag];

//		console.log('decode bytes : %j', peekBytes());
//		console.log('tag : %j, tags : %j', tag, protos.__tags);

		switch(protos[name].option){
			case 'optional' :
			case 'required' :
				msg[name] = decodeProp(protos[name].type, protos);
			break;
			case 'repeated' :
				//console.log('decode array');
				if(!msg[name]){
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
function isFinish(msg, protos){
	//console.log('head : %j, tags : %j, result : %j', peekHead(), protos.__tags, !!protos.__tags[peekHead().tag]);
	return (!protos.__tags[peekHead().tag]);
}
/**
 * Get property head from protobuf
 */
function getHead(){
	var tag = encoder.decodeUInt32(getBytes());

	return {
		type : tag&0x7,
		tag	: tag>>3
	};
}

/**
 * Get tag head without move the offset
 */
function peekHead(){
	var tag = encoder.decodeUInt32(peekBytes());

	return {
		type : tag&0x7,
		tag	: tag>>3
	};
}

function decodeProp(type, protos){
	//console.log('type : %j, protos : %j', type, protos);
	switch(type){
		case 'uInt32':
			return encoder.decodeUInt32(getBytes());
		case 'int32' :
		case 'sInt32' :
			return encoder.decodeSInt32(getBytes());
		case 'float' :
			var float = buffer.readFloatLE(offset);
			offset += 4;
			return float;
		case 'double' :
			var double = buffer.readDoubleLE(offset)
			offset += 8;
			return double;
		case 'string' :
			var length = encoder.decodeUInt32(getBytes());

			var str =  buffer.toString('utf8', offset, offset+length);
			offset += length;

			return str;
		default :
			//console.log('object type : %j, protos: %j', type, protos);
			if(!!protos && !!protos.__messages[type]){
				var length = encoder.decodeUInt32(getBytes());
				var msg = {};
				decodeMsg(msg, protos.__messages[type], offset+length);
				return msg;
			}
		break;
	}
}

function decodeArray(array, type, protos){
	if(util.isSimpleType(type)){
		var length = encoder.decodeUInt32(getBytes());

		for(var i = 0; i < length; i++){
			array.push(decodeProp(type));
		}
	}else{
		array.push(decodeProp(type, protos));
	}
}

function getBytes(flag){
	var bytes = [];
	var pos = offset;
	flag = flag || false;

	do{
		var b = buffer.readUInt8(pos);
		bytes.push(b);
		pos++;
	}while(b >= 128);

	if(!flag){
		offset = pos;
	}
	return bytes;
}

function peekBytes(){
	return getBytes(true);
}