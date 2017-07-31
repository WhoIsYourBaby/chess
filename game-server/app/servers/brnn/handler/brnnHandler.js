
var GMResponse = require('../../../game/GMResponse.js');

module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
    this.channelService = app.get('channelService');
};

/*
下注
一个玩家可以对多付牌下注
 */
Handler.prototype.chipIn = function(msg, session, next) {
    var userid = msg.userid;
    var gold = msg.gold;
    var pkindex = msg.pkindex;
    var channel = this.channelService.getChannel('brnn', false);
    if (!channel) {
        next(null, new GMResponse(-101, '未找到房间'));
        return ;
    }
    var room = channel.gameRoom;
    var sqlHelper = this.app.get('sqlHelper');
    sqlHelper.queryUserInfo(userid, function(err, userinfo) {
        var cpr = room.chipIn(userid, gold, pkindex, userinfo.gold);
        if (cpr != null) {
            var response = new GMResponse(1, 'ok', cpr);
            next(null,response);
        } else {
            var response = new GMResponse(-105, '下注失败，可能余额不够');
            next(null,response);
        }
    }.bind(this));
};