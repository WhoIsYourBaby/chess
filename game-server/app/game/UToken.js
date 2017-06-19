
var UToken = function(userid){
    this.userid = userid;
    this.exp = new Date().getTime() + 1000 * 60 * 60;        //毫秒级
};

module.exports = UToken;

UToken.prototype.refresh = function(){
    this.exp = new Date().getTime() + 1000 * 60 * 60;
};

UToken.prototype.encrypt = function(){
    return 'aes encrypt string';
};


UToken.prototype.decrypt = function(tokenString){
    this.userid = '';
    this.exp = '';
}
