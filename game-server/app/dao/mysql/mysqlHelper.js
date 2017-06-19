
/*
对于callback的普适性：
第一个参数是error，第二个参数是正确返回的数据
一般情况下，两者仅有一个有效
*/
var mysqlHelper = function(app){
    var mysqlConfig = app.get('mysql');
    var mysql = require('mysql');
    var pool  = mysql.createPool(mysqlConfig);
    this.pool = pool;
};

module.exports = mysqlHelper;

mysqlHelper.prototype.query = function(sqlString, values, callback){
    if (values) {
        this.pool.query(sqlString, values, callback);
    } else {
        this.pool.query(sqlString, callback);
    }
};


mysqlHelper.prototype.guestLogin = function(callback) {
	var sql = "insert into t_user () values ();";
	this.query(sql, null, function(err, results, fileds){
        if (err) {
            callback(err, results);
        } else {
            var userid = results['insertId'];
            this.queryUserInfo(userid, callback);
        }
    }.bind(this));
};


mysqlHelper.prototype.queryUserInfo = function(userid, callback) {
    var sqlString = "select * from t_user where userid = '?'";
    this.query(sqlString, [userid], function(err, results, fileds){
        if (results.length > 0) {
            callback(err, results[0]);
        } else {
            callback("没有该用户", null);
        }
    });
};