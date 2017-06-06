var DouniuRoom = require('../../../game/DouniuRoom.js');

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
ChatRemote.prototype.add = function(uid, sid, name, flag, cb) {
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
		}
		channel.add(uid, sid);
		channel.gameRoom.joinUser(uid);
		if (channel.getUserAmount() > 0) {
			channel.gameRoom.startGame();
		}
	}

	cb(this.get(name, flag));
};

/**
 * Get user from chat channel.
 *
 * @param {Object} opts parameters for request
 * @param {String} name channel name
 * @param {boolean} flag channel parameter
 * @return {Array} users uids in channel
 *
 */
ChatRemote.prototype.get = function(name, flag) {
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
 * Kick user out chat channel.
 *
 * @param {String} uid unique id for user
 * @param {String} sid server id
 * @param {String} name channel name
 *
 */
ChatRemote.prototype.kick = function(uid, sid, name) {
	var channel = this.channelService.getChannel(name, false);
	// leave channel
	if( !! channel) {
		channel.leave(uid, sid);
		channel.gameRoom.kickUser(uid);
	}
	var userid = uid.split('*')[0];
	var param = {
		route: 'onLeave',
		user: userid
	};
	channel.pushMessage(param);
};
