var DouniuRoom = require('../../../game/DouniuRoom.js');
var logger = require('pomelo-logger').getLogger('pomelo', __filename);

module.exports = function(app) {
	return new BrnnRemote(app);
};

var BrnnRemote = function(app) {
	this.app = app;
	this.channelService = app.get('channelService');
};

/**
 * Add user into brnn channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 *
 */
BrnnRemote.prototype.add = function(uid, sid, name, flag, cb) {
	var channel = this.channelService.getChannel(name, flag);
	var userid = uid.split('*')[0];
	var param = {
		route: 'brnn.onAdd',
		user: userid
	};
	channel.pushMessage(param);

	if( !! channel) {
		if (!channel.gameRoom) {
			var room = new DouniuRoom(channel);
			channel.gameRoom = room;
			channel.gameRoom.startGame();
		}
		channel.add(uid, sid);
		channel.gameRoom.joinUser(uid);
	}

	cb(this.get(name, flag));
};

/**
 * Get user from Brnn channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
BrnnRemote.prototype.get = function(name, flag) {
	var users = [];
	var channel = this.channelService.getChannel(name, flag);
	if( !! channel) {
		users = channel.getMembers();
	}
	for(var i = 0; i < users.length; i++) {
		users[i] = users[i].split('*')[0];
	}
	return users;
};

/**
 * Kick user out brnn channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
BrnnRemote.prototype.kick = function(uid, sid, name) {
	var channel = this.channelService.getChannel(name, false);
	// leave channel
	if( !! channel) {
		channel.leave(uid, sid);
		channel.gameRoom.kickUser(uid);
	}
	var userid = uid.split('*')[0];
	var param = {
		route: 'brnn.onLeave',
		user: userid
	};
	channel.pushMessage(param);
};


BrnnRemote.prototype.exit = function(uid, sid, name, cb) {
    var rid = name;
    var userid = uid.split('*')[0];
    var channelService = this.app.get('channelService');
    var channel = channelService.getChannel(rid, false);
    if (!channel) {
		cb({
            code : 0,
            msg : '未找到指定房间'
        });
        return ;
    }
    channel.leave(uid, sid);
    channel.gameRoom.kickUser(uid);
    if (channel.getUserAmount() == 0) {
        channel.destroy();
		cb({
            code : 1,
            msg : '离开房间，房间被销毁'
        });
    } else {
        channel.pushMessage('brnn.onLeave', {
            code : 1,
            msg : '有用户离开房间',
            data : {
                userid : userid
            }
        });
		cb({
            code : 1,
            msg : '离开房间'
        });
    }
};