module.exports = function(app) {
	return new Handler(app);
};

var Handler = function(app) {
	this.app = app;
};

var handler = Handler.prototype;

handler.test = function(msg, session, next) {
    next(null, {
        code : 1,
        msg : 'Test'
    });
};