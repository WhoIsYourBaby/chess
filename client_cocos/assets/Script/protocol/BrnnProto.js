require("../pomelo/pomelo-client");

var BrnnProto = function () {}

module.exports = BrnnProto;

BrnnProto.chipIn = function (gold, pkindex, callback) {
    var data = {};
    data.userid = pomelo.userinfo.userid;
    data.gold = gold;
    data.pkindex = pkindex;

    pomelo.request('brnn.brnnHandler.chipIn', data, callback);
}

//有用户离开房间
BrnnProto.onLeave = function (callback) {
    pomelo.on('brnn.onLeave', callback);
}

//有用户加入房间
BrnnProto.onAdd = function (callback) {
    pomelo.on('brnn.onAdd', callback);
}

//即将发牌的下注时期
BrnnProto.onWillStart = function (callback) {
    pomelo.on('brnn.onWillStart', callback);
}

//发牌
BrnnProto.onDealPoker = function (callback) {
    pomelo.on('brnn.onDealPoker', callback);
}

//计算输赢结果
BrnnProto.onGoldResult = function (callback) {
    pomelo.on('brnn.onGoldResult', callback);
}

BrnnProto.disableEvent = function() {
    pomelo.removeAllListeners('brnn.onGoldResult');
    pomelo.removeAllListeners('brnn.onDealPoker');
    pomelo.removeAllListeners('brnn.onWillStart');
    pomelo.removeAllListeners('brnn.onAdd');
    pomelo.removeAllListeners('brnn.onLeave');
}