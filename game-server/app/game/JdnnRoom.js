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

  //0、产生庄家
  //1、非庄家选择分数倍数
  //2、发牌开始
  //3、开牌
  //4、空闲时间
  this.state = 0;
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
  this.roomdata.usercount++;
  this.readyList[userid] = 0; //不用bool而用int
  //sql update
  this.updateUserInSQL();
  return true;
};


//判断用户是否加入了该房间
JdnnRoom.prototype.hasUser = function (userid) {
  if (this.roomdata.users.indexOf(userid) < 0) {
    return false;
  } else return true;
};


//玩家准备状态修改
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

//玩家离开
JdnnRoom.prototype.exitUser = function (userid, serverid) {
  //把字符串变为
  delete this.readyList[userid];
  var uarr = this.roomdata.users.split(',');
  for (var index = 0; index < uarr.length; index++) {
    var element = uarr[index];
    if (element == userid) {
      uarr.splice(index, 1);
    }
  }
  this.roomdata.users = uarr.join(',');
  this.roomdata.usercount = uarr.length;
  this.updateUserInSQL();
  this.channel.leave(userid, serverid);
};

//更新数据库中该房间的用户信息
JdnnRoom.prototype.updateUserInSQL = function () {
  //sql update
  var sqlstring = "update t_room set usercount = '" + this.roomdata.usercount
    + "', users = '" + this.roomdata.users
    + "' where roomid = '" + this.roomdata.roomid + "';";
  this.sqlHelper.query(sqlstring, null, function (error, results, fields) {
    if (error) {
      console.error(error);
    }
  });
};

//重置各种数据为下一把做准备
JdnnRoom.prototype.reset = function () {
  this.chipList = {};
  this.state = 0;
};

//state
//0、准备
//1、产生庄家
//2、非庄家选择分数倍数
//3、发牌开始
//4、开牌 + 结算
//5、空闲时间
//->0
JdnnRoom.prototype.startGame = function () {
  this.reset();
  this.gamePrepare();
};

JdnnRoom.prototype.gamePrepare = function () {
  var self = this;
  var secPre = 3;
  var prepareTimer = setInterval(function () {
    var param = { state: 0, time: secPre };
    var response = new GMResponse(1, '准备时间', param);
    self.channel.pushMessage('jdnn.gamePrepare');
    //准备时间过后开始确定庄家
    secPre--;
    if (secPre <= 0) {
      clearInterval(prepareTimer);
      //开始选择庄家
      self.gameMarkBanker();
    }
  }, 1000);
};

//随机产生庄家
JdnnRoom.prototype.gameMarkBanker = function () {
  var uarr = this.roomdata.users.split(',');
  var bankerIndex = parseInt(Math.random() * uarr.length);
  var bankerUid = uarr[bankerIndex];
  var response = new GMResponse(1, '标记庄家', { 'banker': bankerUid });
  this.channel.pushMessage('jdnn.markBanker', response);

  this.gameChip();
};

//选择分数倍数
JdnnRoom.prototype.gameChip = function () {
  var self = this;
  var secChip = 3;
  var chipTimer = setInterval(function () {

    secChip --;
    if (secChip <= 0) {
      clearInterval(chipTimer);
      //todo发牌
    }
  }, 1000);
};