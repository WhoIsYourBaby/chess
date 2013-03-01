var util = require('util');
var fs = require('fs');
var path = require('path');

/**
 * Auto-load bundled components with getters.
 *
 * @param {String} mappingPath
 * @return {Object} mapping
 */
 exports.loadMapping = function(mappingPath) {
  var mapping = {};
  var logger = this.log;
  var self = this;
  mappingPath+='/';
  if (!!self.debug) {
    logger.info('[data sync compoment] load mapping file ' + mappingPath);
  }
  fs.readdirSync(mappingPath).forEach(function(filename){
   if (!/\.js$/.test(filename)) {return;}
   var name = path.basename(filename, '.js'),key,pro;
   var fullPath = mappingPath + name;
   if (!!self.debug) {
    logger.log('loading ' + fullPath);
  }
  pro = require(fullPath);
  for (key in pro){
   var fullKey = name+'.'+key;
   if (mapping[fullKey]){
    logger.error('[data sync component] exist duplicated key map function ' + key + ' ignore it now.');
  } else {
    mapping[fullKey] = pro[key];
  }
}
});
  logger.info('[data sync component] load mapping file done.' );
  return mapping;
};


