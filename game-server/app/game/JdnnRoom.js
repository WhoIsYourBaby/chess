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