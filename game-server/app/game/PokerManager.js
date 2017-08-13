

var PokerManager = function() {
    this.pokers = [];
};


module.exports = PokerManager;

//bool hasJoker, false则不会有joker
PokerManager.prototype.recreatePoker = function(hasJoker) {
    for (var index = 1; index <= 13; index++) {
        //color D:方块,C:梅花,B:红桃,A:黑桃,E:joker
        var arrColor = ['A','B','C','D'];
        for (var color = 0; color < 4; color++) {
            var card = {
                    color : arrColor[color],
                    value : index
                }
            this.pokers.push(card);
        }
    }

    if (hasJoker) {
        var jokerLittle = {
            color : 'F',
            value : -1,
        };
        this.pokers.push(jokerLittle);

        var jokerBig = {
            color : 'E',
            value : 0,
        };
        this.pokers.push(jokerBig);
    }
}


//洗牌
PokerManager.prototype.randomPoker = function() {
    //随机轮训5次洗牌
    for (var index = 0; index < 5; index++) {
        //与随机顺序的牌置换位置
        for (var cindex = 0; cindex < this.pokers.length; cindex++) {
            var temp = this.pokers[cindex];
            var rindex = Math.floor(Math.random() * this.pokers.length);
            this.pokers[cindex] = this.pokers[rindex];
            this.pokers[rindex] = temp;
        }
    }
};

PokerManager.prototype.getPokers = function() {
    return this.pokers;
};

//发一张牌
PokerManager.prototype.dealOnePoker = function() {
    return this.pokers.pop();
}

//发count张牌
PokerManager.prototype.dealSomePoker = function(count) {
    var somepk = this.pokers.slice(-count);
    this.pokers.splice(-count, count);
    return somepk;
}


//static method

//for 牛牛
//计算牌面大小

//pokers -> 5张牌数组
PokerManager.nnResultForPoker = function(pokers) {
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
PokerManager.nnComparePoker = function(pk1, pk2) {
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
PokerManager.nnResultMuti = function(nnResult) {
  switch (nnResult.nntype) {
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
        if (nnResult.niuN > 6) {
          return 2;
        } else return 1;
      }
    case 0:
      return 1;
    default:
      return 1;
  }
}