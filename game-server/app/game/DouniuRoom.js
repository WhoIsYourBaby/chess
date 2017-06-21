var PokerManager = require('./PokerManager.js');
//百人牛牛
//绑定的room
var DouniuRoom = function(channel) {
  this.channel = channel;
  this.userList = [];
  this.maxWillWait = 10; //sec
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
    clearInterval(this.willStartTimer);
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
    if (nnRes.nntype == 1 || nnRes.nntype == 2) {
      var tmp = aPkGroup[4];
      aPkGroup[4] = aPkGroup[nnRes.pIndex1];
      aPkGroup[nnRes.pIndex1] = tmp;

      var tmp = aPkGroup[3];
      aPkGroup[3] = aPkGroup[nnRes.pIndex2];
      aPkGroup[nnRes.pIndex2] = tmp;
    }

    delete nnRes.pIndex1;
    delete nnRes.pIndex2;

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

  setTimeout(this.startGame.bind(this), 3000);
};

var calculateResult = function(pokers) {
  //1 遍历所有元素，设置nnValue(大于10都设置为10)
  //顺便统计五花、四花(>10)、五小(<10)、炸弹条件满足情况
  var total = 0;
  //nntype表示用户牌型
  //炸弹(6) > 五小(5) > 五花(4) > 四花(3) > 牛牛(2) > 有分(1) > 没分(0)
  var nntype = 0;
  var wuxiaoCount = 0;  //小于5的牌张数
  var zhadanDic = {};
  var tenCount = 0;     //等于10的牌张数
  var huaCount = 0;     //大于10的牌张数
  for (var index = 0; index < pokers.length; index++) {
    var pk = pokers[index];
    pk.nnValue = pk.value > 10 ? 10 : pk.value;
    total += pk.nnValue;

    zhadanDic[pk.value] = ((zhadanDic[pk.value] == undefined) ? 1 : zhadanDic[pk.value] + 1);

    if (pk.value == 10) {
      tenCount ++;
    }

    if (pk.value > 10) {
      huaCount ++;
    }
  }

  var res = {};
  //2 优先判断炸弹
  for (var key in zhadanDic) {
    if (zhadanDic.hasOwnProperty(key)) {
      var element = zhadanDic[key];
      if (element == 4) {
        nntype = 6;
        res.nntype = nntype;
        res.niuN = key;     //炸弹的时候，niuN的值是炸弹牌
        res.pIndex1 = -1;
        res.pIndex2 = -1;
        return res;
      }
    }
  }

  //3 判断五小
  if (wuxiaoCount == 5 && total <= 10) {
    nntype = 5;
    res.nntype = nntype;
    res.niuN = 0;     //五小的时候为0
    res.pIndex1 = -1;
    res.pIndex2 = -1;
    return res;
  }

  //4 判断五花
  if (huaCount == 5) {
    nntype = 4;
    res.nntype = nntype;
    res.niuN = 0;     //五小的时候为0
    res.pIndex1 = -1;
    res.pIndex2 = -1;
    return res;
  }

  //5 判断四花
  if (huaCount == 4 && tenCount == 1) {
    nntype = 3;
    res.nntype = nntype;
    res.niuN = 0;     //五小的时候为0
    res.pIndex1 = -1;
    res.pIndex2 = -1;
    return res;
  }

  //6 判断牛牛
  var niuN = total % 10;
  var hasNiu = false;
  
  for (var index = 0; index < pokers.length; index++) {
    for (var sec = index + 1; sec < pokers.length; sec++) {
      var pkf = pokers[index];
      var pkl = pokers[sec];
      var testN = (pkf.nnValue + pkl.nnValue) % 10;
      if (testN == niuN) {
        hasNiu = true;
        if (niuN == 0) {
          res.nntype = 2;
        } else {
          res.nntype = 1;
        }
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
    res.nntype = 0;
    res.niuN = -1;
    res.pIndex1 = -1;
    res.pIndex2 = -1;
  }
  return res;
}