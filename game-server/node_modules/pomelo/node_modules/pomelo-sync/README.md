#data-sync
data sync module is simple sync memory data into store engine like mysql,redis,file.

As we known, updating data is very frequently in game application. Especial in MMORPG kind game. User game data,such as location,flood,equipment,etc. almost always change as time going. For the purpose of avoid such update action cost, we decide to keep a copy data in memory. And keep synchronized with a timer and log;

Data sync can support both timer call and instance invoke for the different
situation. Most of time the developer don't pay attention to it;

Data sync also can support memory operation like NOSQL database such as
redis,mongodb etc. most of time developer can seem as a memory database without
transaction.

Data sync features include timer sync,set,get,mset,mget,hset,hget,incr,decr,flush,merger,showdown,info,etc. and the developer can extend it very easily.

##Installation
```
npm install pomelo-sync
```

##Usage
``` javascript

var opt = opt || {};

var updateUser = function(dbclient,val) {
    console.log('mock save %j',val);
}

var dbclient = {};//db connection etc;
var id = 10001;
var optKey = 'updateUser';
var mapping = {optKey:updateUer}; //key function mapping 
opt.mapping = mapping;
opt.client = dbclient;
opt.interval = 2000;

var Sync = require('pomelo-sync');
var sync = new Sync(opt) ;
sync.exec(optKey,id,{name:'hello'});

``` 

##API
###sync.exec(key,id,val,cb)
Add a object to sync for timer exec call back. 
####Arguments
+ key - the key function mapping for wanted to call back,it must be unique.
+ id - object primary key for merger operation. 
+ val -  the object wanted to synchronized. 
+ cb - the function call back when timer exec.

###sync.flush(key,id,val,cb)
immediately synchronized the memory data with out waiting timer and will remove
waiting queue data;
####Arguments
+ key - the key function mapping for wanted to call back,it must be unique.
+ id - object primary key for merger operation. 
+ val -  the object wanted to synchronized. 
+ cb - the function call back when timer exec.

###sync.isDone
get the db sync status when the queue is empty,it should return true;otherwise
return false;

  

##Notice 
system default sync time is 1000 * 60,
if you use mysql or redis sync,you should set options.client,the file sync is default but it doesn't load in current.
Mysql OR mapping in this modules do not support,user should realize it self.

##ADD
for more usage detail , reading source and benchmark and test case from
source is recommended;
