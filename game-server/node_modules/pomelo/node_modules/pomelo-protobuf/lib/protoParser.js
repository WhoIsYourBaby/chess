var Parser = module.exports;

Parser.parse = function(protos){
	var maps = {};
	for(var key in protos){
		maps[key] = parseObject(protos[key]);
	}
	
	return maps;
}

function parseObject(obj){
	var proto = {};
	var nestProtos = {};
	var tags = {};
	
	for(var name in obj){
		var tag = obj[name];
		var params = name.split(' ');
		
		switch(params[0]){
			case 'message':
				if(params.length != 2)
					continue;
				nestProtos[params[1]] = parseObject(tag);
				continue;
			case 'required':
			case 'optional':
			case 'repeated':{
				//params length should be 3 and tag can't be duplicated
				if(params.length != 3 || !!tags[tag]){
					continue;
				}
				proto[params[2]] = {
					option : params[0],
					type : params[1],
					tag : tag
				}
				tags[tag] = params[2];
			}
		}
	}
	
	proto.__messages = nestProtos;
	proto.__tags = tags;
	return proto;	
}