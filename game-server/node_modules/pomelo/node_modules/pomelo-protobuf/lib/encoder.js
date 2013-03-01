var Encoder = module.exports;

Encoder.encodeUInt32 = function(num){
	var n = parseInt(num);
	if(isNaN(n) || n < 0){
		console.log(n);
		return null;
	}

	var result = [];
	do{
		var tmp = n % 128;
		var next = Math.floor(n/128);

		if(next !== 0){
			tmp = tmp + 128;
		}
		result.push(tmp);
		n = next;
	} while(n !== 0);

	return result;
};

Encoder.encodeSInt32 = function(n){
	var n = parseInt(n);
	if(isNaN(n)){
		return null;
	}
	//console.log('n : %j, n<0 : %j, -n*2 : %j, -1 : %j',n, n<0, (-n)*2-1);
	n = n<0?(Math.abs(n)*2-1):n*2;

	//console.log(n);
	return Encoder.encodeUInt32(n);
}

Encoder.decodeUInt32 = function(bytes){
	var n = 0;

	for(var i = 0; i < bytes.length; i++){
		var m = parseInt(bytes[i]);
		n = n + ((m & 0x7f) * Math.pow(2,(7*i)));
		if(m < 128)
			return n;
	}

	return n;
}


Encoder.decodeSInt32 = function(bytes){
	var n = this.decodeUInt32(bytes);
	var flag = ((n%2) === 1)?-1:1;

	n = ((n%2 + n)/2)*flag;

	return n;
}
