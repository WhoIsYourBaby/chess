var fs = require('fs');
var consoleService = require('./lib/consoleService');

module.exports.createMasterConsole = consoleService.createMasterConsole;
module.exports.createMonitorConsole = consoleService.createMonitorConsole;
module.exports.adminClient = require('./lib/client/client');

exports.modules = {};
fs.readdirSync(__dirname + '/lib/modules').forEach(function(filename){
  if (/\.js$/.test(filename)) {
    var name = filename.substr(0, filename.lastIndexOf('.'));
    exports.modules.__defineGetter__(name, function(){
      return require('./lib/modules/' + name);
    });
  }
});