var utils = require('../util/utils');

/**
 * route the msg to appropriate service object
 *
 * @param msg msg package {service:serviceString, method:methodString, args:[]}
 * @param services services object collection, such as {service1: serviceObj1, service2: serviceObj2}
 * @param cb(...) callback function that should be invoked as soon as the rpc finished
 */
module.exports.route = function(msg, services, cb) {
  var namespace = services[msg.namespace];
  if(!namespace) {
    utils.invokeCallback(cb, new Error('no such namespace:' + msg.namespace));
    return;
  }

  var service = namespace[msg.service];
  if(!service) {
    utils.invokeCallback(cb, new Error('no such service:' + msg.service));
    return;
  }

  var method = service[msg.method];
  if(!method) {
    utils.invokeCallback(cb, new Error('no such method:' + msg.method));
    return;
  }

  var args = msg.args.slice(0);
  args.push(cb);
  method.apply(service, args);
};
