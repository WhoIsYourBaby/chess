var GMResponse = require('./GMResponse.js');
var RoomManager = require('./RoomManager.js');
//经典牛牛
//绑定的room
var JdnnRoom = function (channel, sqlHelper, roomdata) {
  this.roomdata = roomdata;
  if (!this.roomdata.users) {
    this.roomdata.users = "";
  }
  this.channel = channel;
  this.sqlHelper = sqlHelper;
  this.chipList = {};

  this.readyList = {};

  this.state = 0;   //state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,空闲场景
};

module.exports = JdnnRoom;

JdnnRoom.prototype.joinUser = function (userid) {
  userid = userid.toString();
  if (this.hasUser(userid)) {
    return false;
  }
  if (this.roomdata.users.length > 0) {
    this.roomdata.users += (',' + userid);
  } else {
    this.roomdata.users += (userid);
  }
  this.roomdata.usercount ++;
  this.readyList[userid] = 0; //不用bool而用int
  //sql update
  var sqlstring = "update t_room set usercount = '" + this.roomdata.usercount 
  + "', users = '" + this.roomdata.users 
  + "' where roomid = '" + this.roomdata.roomid + "';";
  this.sqlHelper.query(sqlstring, null, function (error, results, fields){
    if (error) {
      console.error(error);
    }
  });
  return true;
};

JdnnRoom.prototype.hasUser = function (userid) {
  if (this.roomdata.users.indexOf(userid) < 0) {
    return false;
  } else return true;
};

JdnnRoom.prototype.userReady = function (userid, ready) {
  if (this.hasUser(userid) == false) {
    return null;
  } else {
    this.readyList[userid] = ready;
  }
  //检查房间所有玩家装备状态，并决定是否开始游戏
  if (this.checkAllReady()) {
  }
  return this.readyList;
};

JdnnRoom.prototype.getReadyList = function () {
  return this.readyList;
};

//检查准备状态字典所有值
JdnnRoom.prototype.checkAllReady = function () {
  for (var key in this.readyList) {
    if (this.readyList.hasOwnProperty(key)) {
      var element = this.readyList[key];
      if (element == 0) {
        return false;
      }
    }
  }
  return true;
};


JdnnRoom.prototype.exitUser = function (userid, serverid) {
  delete this.readyList[userid];
  var uarr = this.roomdata.users.split(',');
  
};