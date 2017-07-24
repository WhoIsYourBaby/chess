var MResponse = function (data) {
    this.data = data['data'];
    this.code = data['code'];
    this.msg = data['msg'];
}

module.exports = MResponse;


MResponse.prototype.hasError = function() {
    return this.code <= 0;
}

MResponse.prototype.isOK = function() {
    return this.code > 0;
}