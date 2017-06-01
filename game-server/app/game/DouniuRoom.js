//百人牛牛
//绑定的room
var DouniuRoom = function(channel) {
  this.channel = channel;
  this.userList = [];
  this.maxWillWait = 5; //sec
  this.willWait = 0;
};

module.exports = DouniuRoom;

//需要在外部对channel新增uid
DouniuRoom.prototype.joinUser = function(usermodel) {
    this.userList.push(usermodel);
};

//需要在外部对channel删除uid
DouniuRoom.prototype.kickUser = function(usermodel) {
  for (var index = 0; index < this.userList.length; index++) {
    var element = this.userList[index];
    if (element == usermodel) {
      this.userList.splice(index, 1);
    }
  }
};

//开始游戏，倒计时等待下注
//发5副牌，其中一个庄家
//房间所有玩家向非庄家下注
DouniuRoom.prototype.startGame = function() {
  this.willWait = this.maxWillWait;
  this.willStartTimer = setInterval(this.willStartTimerCall.bind(this), 1000);
};

DouniuRoom.prototype.willStartTimerCall = function() {
  this.willWait --;
  this.pushWillStartMessage();
  if (this.willWait == 0) {
    clearTimeout(this.willStartTimer);
    this.dealPokers();
  }
};


//state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,其他场景
DouniuRoom.prototype.pushWillStartMessage = function() {
  this.channel.pushMessage('brnn.willstart', {
    code : 200,
    msg : "下注时间 this.willWait秒",
    state : 0,
  });
}

//给所有人push发牌结果消息
DouniuRoom.prototype.dealPokers = function() {
  this.channel.pushMessage('brnn.dealpokers', {
    code : 200,
    msg : '发牌啦',
    data : '5副扑克+输赢计算结果'
  })
};