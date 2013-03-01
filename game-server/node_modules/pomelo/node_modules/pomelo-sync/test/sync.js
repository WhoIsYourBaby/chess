var DataSync = require('../');

var dbclient = require('./lib/mysql').client;


var opt = {};
var mappingPath = __dirname+ '/mapping';
opt.client = dbclient;
opt.interval = 1000 * 10;
opt.aof = false;
var sync = new DataSync(opt);
console.log('before loading ')
sync.mapping = sync.loadMapping(mappingPath);


console.log(sync.mapping);

var key = 'user_key';
var User = function User(name){
	this.name = name;
};

var user1 = new User('hello');
user1.x = user1.y = 999;
user1.uid = 10003;
user1.sceneId = 1;
var resp = sync.set(key,user1);

console.log('resp %j' , sync.get(key));

sync.execSync('bag.selectUser',10004,function(err,data){
	console.log(err + '  select data ' + data);
});

user1.x = 888;
user1.y = 777;

console.log(' count ' + sync.rewriter.count);

sync.exec('player.updateUser',10003,user1);

user1.x = 999;

sync.flush('player.updateUser',10003,user1);
 
setInterval(function(){
 console.log(' count:' + sync.rewriter.count + ' isDone: ' + sync.isDone());
},1000);
