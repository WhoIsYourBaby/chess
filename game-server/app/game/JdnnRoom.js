//百人牛牛
//绑定的room
var JdnnRoom = function (channel, sqlHelper, roomdata) {
  this.channel = channel;
  this.sqlHelper = sqlHelper;
  this.chipList = {};

  this.state = 0;   //state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,空闲场景
};

module.exports = DouniuRoom;