module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
		this.app = app;
};

var handler = Handler.prototype;

/**
 * New client entry brnn server.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next stemp callback
 * @return {Void}
 */
handler.enter = function(msg, session, next) {
	var self = this;
	var rid = msg.rid;
	var uid = msg.userid + '*' + rid;
	var sessionService = self.app.get('sessionService');

	//duplicate log in
	if(!sessionService.getByUid(uid)) {
		session.bind(uid);
		session.set('rid', rid);
		session.push('rid', function(err) {
			if(err) {
				console.error('set rid for session service failed! error is : %j', err.stack);
			}
		});
		session.on('closed', onUserLeave.bind(null, self.app));
	}

	//put user into channel
	self.app.rpc.brnn.brnnRemote.add(session, uid, self.app.get('serverId'), rid, true, function(users){
		next(null, {
			users:users
		});
	});
};

/**
 * User log out handler
 *
 * @param {Object} app current application
 * @param {Object} session current session object
 *
 */
var onUserLeave = function(app, session) {
	if(!session || !session.uid) {
		return;
	}
	app.rpc.brnn.brnnRemote.exit(session, session.uid, app.get('serverId'), session.get('rid'), null);
};


handler.exit = function(msg, session, next) {
	this.app.rpc.brnn.brnnRemote.exit(session, session.uid, this.app.get('serverId'), session.get('rid'), function(res) {
		next(null, res);
	});
};