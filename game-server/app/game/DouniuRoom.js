var PokerManager = require('./PokerManager.js');
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
  var data = {
    state : 0,
    time : this.willWait
  }
  this.channel.pushMessage('brnn.willstart', {
    code : 200,
    msg : "下注时间",
    data : data
  });
}

//给所有人push发牌结果消息
DouniuRoom.prototype.dealPokers = function() {
  var pkmanager = new PokerManager();
  pkmanager.recreatePoker(false);
  pkmanager.randomPoker();
  var pokerRes = [];
  for (var index = 0; index < 5; index++) {
    var aPkGroup = pkmanager.dealSomePoker(5);
    var nnRes = calculateResult(aPkGroup);

    //如果有牛替换组成牛大小的两张牌到数组末尾
    if (nnRes.hasNiu) {
      var tmp = aPkGroup[4];
      aPkGroup[4] = aPkGroup[nnRes.pIndex1];
      aPkGroup[nnRes.pIndex1] = tmp;

      var tmp = aPkGroup[3];
      aPkGroup[3] = aPkGroup[nnRes.pIndex2];
      aPkGroup[nnRes.pIndex2] = tmp;
    }
    var dic = {
      poker : aPkGroup,
      result : nnRes
    }
    pokerRes.push(dic);
  }
  this.channel.pushMessage('brnn.dealpoker', {
    code : 200,
    msg : '发牌啦',
    data : pokerRes
  })
};

var calculateResult = function(pokers) {
  var total = 0;
  for (var index = 0; index < pokers.length; index++) {
    var pk = pokers[index];
    pk.nnValue = pk.value > 10 ? 10 : pk.value;
    total += pk.nnValue;
  }
  var niuN = total % 10;
  var hasNiu = false;
  var res = {};
  for (var index = 0; index < pokers.length; index++) {
    for (var sec = index + 1; sec < pokers.length; sec++) {
      var pkf = pokers[index];
      var pkl = pokers[sec];
      var testN = (pkf.nnValue + pkl.nnValue) % 10;
      if (testN == niuN) {
        hasNiu = true;
        res.hasNiu = hasNiu;
        res.niuN = niuN;
        res.pIndex1 = index;
        res.pIndex2 = sec;
        break ;
      }
    }
    if (hasNiu) {
      break ;
    }
  }

  //没牛的情况
  if (!hasNiu) {
    res.hasNiu = false;
    res.niuN = -1;
    res.pIndex1 = -1;
    res.pIndex2 = -1;
  }
  return res;
}