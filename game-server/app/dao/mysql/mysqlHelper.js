

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