var PokerManager = require('./PokerManager.js');
var GMResponse = require('./GMResponse.js');
//百人牛牛
//绑定的room
var DouniuRoom = function(channel, sqlHelper) {
  this.channel = channel;
  this.sqlHelper = sqlHelper;
  this.userList = [];     //所有在房间中的玩家的userid
  this.chipList = {};

  this.maxWillWait = 10; //sec
  this.willWait = 0;

  this.state = 0;   //state: 0,下注时间等待开始 | 1,游戏开始计算输赢 | 2,其他场景
};

module.exports = DouniuRoom;

//需要在外部对channel新增userid
DouniuRoom.prototype.joinUser = function(userid) {
    this.userList.push(userid);
};

//需要在外部对channel删除uid
DouniuRoom.prototype.kickUser = function(userid) {
  for (var index = 0; index < this.userList.length; index++) {
    var element = this.userList[index];
    if (element == userid) {
      this.userList.splice(index, 1);
    }
  }
};

//开始游戏，倒计时等待下注
//发5副牌，其中一个庄家
//房间所有玩家向非庄家下注
DouniuRoom.prototype.startGame = function() {
  this.state = 0;
  this.willWait = this.maxWillWait;
  this.chipList = {};
  this.willStartTimer = setInterval(this.willStartTimerCall.bind(this), 1000);
};

DouniuRoom.prototype.willStartTimerCall = function() {
  this.willWait --;
  if (this.willWait <=1) {
    this.state = 1;
  }
  this.pushWillStartMessage();
  if (this.willWait == 0) {
    clearInterval(this.willStartTimer);
    this.dealPokers();
  }
};


DouniuRoom.prototype.pushWillStartMessage = function() {
  var data = {
    state : this.state,
    time : this.willWait
  }
  var response = new GMResponse(1, 'ok', data);
  this.channel.pushMessage('brnn.onWillStart', response);
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

    if (index > 0) {
      var pk0 = pokerRes[0]['result'];
      if (comparePoker(pk0, nnRes) >= 0) {
        //比庄家牌小
        nnRes.win = false;
      } else {
        nnRes.win = true;
      }
    }

    var dic = {
      poker : aPkGroup,
      result : nnRes
    }
    pokerRes.push(dic);
  }
  var data = {
    state : this.state,
    pokerRes : pokerRes
  };
  var response = new GMResponse(1, 'ok', data);
  this.channel.pushMessage('brnn.onDealPoker', response);

  setTimeout(function() {
    this.pushGoldResult(pokerRes);
    this.state = 2;
  }.bind(this), 1000 * 10);
};

//return 下注成功返回该用户目前的下注情况，否则null（可能余额不够、或者非下注时间）
//pkindex > 0
//balance : 余额
DouniuRoom.prototype.chipIn = function(userid, gold, pkindex, balance) {
  if (pkindex <= 0 ||  this.state != 0) {
    return null;
  }
  
  var goldBefore = this.getGoldChipedForUser(userid);
  if (goldBefore >= balance) {
    return null;
  }
  if (!this.chipList[userid]) {
    this.chipList[userid] = {};
  }
  this.chipList[userid][pkindex] = parseInt(gold);
  return this.chipList[userid];
};


DouniuRoom.prototype.getGoldChipedForUser = function(userid) {
  var chipinfo = this.chipList[userid];
  var goldnow = 0;
  for (var key in chipinfo) {
    if (chipinfo.hasOwnProperty(key)) {
      var element = chipinfo[key];
      goldnow += element;
    }
  }
  return goldnow;
}

DouniuRoom.prototype.pushGoldResult = function (pokerRes) {
  var compareResult = {};
  for (var index = 1; index < pokerRes.length; index++) {
    var pkn = pokerRes[index]['result'];
    var pk0 = pokerRes[0]['result'];
    if (comparePoker(pk0, pkn) >= 0) {
      var dbcount = doubleCountForPoker(pk0);
      dbcount *= -1;  //赢钱是正，输钱是负
      compareResult[index] = dbcount;
    } else {
      var dbcount = doubleCountForPoker(pkn);
      compareResult[index] = dbcount;
    }
  }

  var userGoldResult = [];
  for (var userid in this.chipList) {
    if (this.chipList.hasOwnProperty(userid)) {
      var chipinfo = this.chipList[userid];
      var goldResult = 0;
      for (var pkindex in chipinfo) {
        if (chipinfo.hasOwnProperty(pkindex)) {
          var goldChiped = chipinfo[pkindex];
          //计算所有下注的牌输赢
          dbcount = compareResult[pkindex];
          goldResult += (dbcount * goldChiped);
        }
      }
      var allGoldInfo = {getGold : goldResult, userid : userid};
      userGoldResult.push(allGoldInfo);
    }
  }

  //如果没有人下注，直接返回，无需再查数据库
  if (userGoldResult.length == 0) {
    var res = new GMResponse(1, 'ok', []);
    this.channel.pushMessage('brnn.onGoldResult', res);
    setTimeout(this.startGame.bind(this), 3000);
    return ;
  }
  //根据userid排序,方便查询这些用户的总金币并显示
  userGoldResult.sort(function(a, b){
    return a.userid > b.userid;
  });
  this.sqlHelper.updateUsersGold(userGoldResult, function(err, allGoldResult) {
    if (err) {
      var res = new GMResponse(-1001, '无法正确结算', err);
      this.channel.pushMessage('brnn.onGoldResult', res);
    } else {
      var res = new GMResponse(1, 'ok', allGoldResult);
      this.channel.pushMessage('brnn.onGoldResult', res);
    }

    setTimeout(this.startGame.bind(this), 8000);
  }.bind(this));
};


DouniuRoom.prototype.destroy = function () {
  clearInterval(this.willStartTimer);
  clearTimeout(this.startGame);
};


//计算牌面大小
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


//pk1 > pk2 -> 1;
//pk1 = pk2 -> 0;
//pk1 < pk2 -> -1;
var comparePoker = function(pk1, pk2) {
  if (pk1.nntype > pk2.nntype) {
    return 1;
  } else if (pk1.nntype == pk2.nntype) {
    if (pk1.niuN > pk2.niuN) {
      return 1;
    } else if (pk1.niuN == pk2.niuN) {
      return 0;
    } else {
      return -1;
    }
  } else {
    return -1;
  }
}


/*
nntype表示用户牌型
炸弹(6) > 五小(5) > 五花(4) > 四花(3) > 牛牛(2) > 有分(1) > 没分(0)
牌型翻倍情况：
无分和牛1，牛2，牛3，牛4，牛5，牛6： 1倍
牛7，牛8，牛9： 2倍
牛牛： 3倍
四花： 4倍
五花： 5倍
五小： 6倍
炸弹： 8倍
*/
var doubleCountForPoker = function(poker) {
  switch (poker.nntype) {
    case 6:
      return 8;
    case 5:
      return 6;
    case 4:
      return 5;
    case 3:
      return 4;
    case 2:
      return 3;
    case 1:
      {
        if (poker.niuN > 6) {
          return 2;
        } else return 1;
      }
    case 0:
      return 1;
    default:
      return 1;
  }
}