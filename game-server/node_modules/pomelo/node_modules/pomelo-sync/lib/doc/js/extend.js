if(!Array.prototype.indexOf || !Array.prototype.reduce || !String.prototype.trim || !Object.keys){
	Array.prototype.indexOf=function(searchElement,fromIndex){
		var len=this.length;
		if(!len)return -1;
		var i = fromIndex==null ? 0 :  fromIndex < 0 ? Math.max(0,len+fromIndex) : fromIndex;
		for(;i<len;i++)
			if(i in this && this[i]===searchElement) return i;
		return -1;
	};

	Array.prototype.lastIndexOf=function(searchElement,fromIndex){
		var len=this.length;
		if(!len)return -1;
		var n= fromIndex==null ? len-1 : fromIndex >= 0 ? Math.min(len-1,fromIndex) : len+fromIndex;
		for(;n>-1;n--)
			if(n in this && this[n]===searchElement) return n;
		return -1;
	};

	Array.prototype.every=function(callbackfn,thisArg){
		if(typeof callbackfn !== 'function') throw new TypeError();
		var scope=thisArg || window;
		for(var i=0,l=this.length;i<l;i++)
			if(i in this && !callbackfn.call(scope,this[i],i,this)) return false;
		return true;
	};

	Array.prototype.some=function(callbackfn,thisArg){
		if(typeof callbackfn !== 'function') throw new TypeError();
		var scope=thisArg || window;
		for(var i=0,l=this.length;i<l;i++)
			if(i in this && callbackfn.call(scope,this[i],i,this)) return true;
		return false;
	};

	Array.prototype.forEach=function(callbackfn,thisArg){
		if(typeof callbackfn !== 'function') throw new TypeError();
		var scope=thisArg || window;
		for(var i=0,l=this.length;i<l;i++)
			if(i in this)callbackfn.call(scope,this[i],i,this);
	};

	Array.prototype.map=function(callbackfn,thisArg){
		if(typeof callbackfn !== 'function') throw new TypeError();
		var scope=thisArg || window;
		var ret=[];
		for(var i=0,l=this.length;i<l;i++)
			if(i in this)ret.push(callbackfn.call(scope,this[i],i,this));
		return ret;
	};

	Array.prototype.filter=function(callbackfn,thisArg){
		if(typeof callbackfn !== 'function') throw new TypeError();
		var scope=thisArg || window;
		var ret=[];
		for(var i=0,l=this.length;i<l;i++)
			if(i in this && callbackfn.call(scope,this[i],i,this))ret.push(this[i]);
		return ret;
	};

	Array.prototype.reduce=function(callbackfn,initialValue){
		if(typeof callbackfn !== 'function' || (!this.length && arguments.length==1)) throw new TypeError();
		var len=this.length,i=0,rv;
		if(arguments.length>=2) rv=arguments[1];
		else
			do{
				if(i in this){
					rv=this[i++];
					break;
				}
				if(++i>=len) throw new TypeError();
			}while(true);
		for(;i<len;i++){
			if(i in this)rv=callbackfn.call(null,rv,this[i],i,this);
		}
		return rv;
	};

	Array.prototype.reduceRight=function(callbackfn,initialValue){
		if(typeof callbackfn !== 'function' || (!this.length && arguments.length==1)) throw new TypeError();
		var len=this.length,n=len-1,rv;
		if(arguments.length>=2) rv=arguments[1];
		else
			do{
				if(n in this){
					rv=this[n--];
					break;
				}
				if(--n<0) throw new TypeError();
			}while(true);
		for(;n>-1;n--){
			if(n in this)rv=callbackfn.call(null,rv,this[n],n,this);
		}
		return rv;
	};

	String.prototype.trim=function(){
		return this.replace(/(^\s*)|(\s*$)/g,'');
	};

	Object.keys = (function(){
		var DONT_ENUM='propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor'.split(',');
		var hasOwn=({}).hasOwnProperty;
		return function(obj){
			var ret=[];
			for(var key in obj)
				if(hasOwn.call(obj,key))ret.push(key);
			if(DONT_ENUM && obj)
				for(var i=0;key=DONT_ENUM[i];i++)
					if(hasOwn.call(obj,key))ret.push(key);
			return ret;
		};
	})();
}