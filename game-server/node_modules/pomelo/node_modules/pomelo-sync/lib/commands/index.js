(function merge(type){
  var cmds = require('./' + type);
  for (var cmd in cmds) {
    exports[cmd] = cmds[cmd];
  }
  return merge;
})('keys')('string')('list')('hash')('server')('mapping');
