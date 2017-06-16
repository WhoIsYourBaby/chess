
var UToken = function(userid){
    this.userid = userid;
    this.exp = '';
};

module.exports = UToken;

UToken.prototype.refresh = function(){
    this.exp = '';
};

UToken.prototype.encrypt = function(){
    return 'aes encrypt string';
};


UToken.prototype.decrypt = function(tokenString){
    this.userid = '';
    this.exp = '';
}
