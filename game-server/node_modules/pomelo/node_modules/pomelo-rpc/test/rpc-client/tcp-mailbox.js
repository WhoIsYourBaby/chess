var lib = process.env.POMELO_RPC_COV ? 'lib-cov' : 'lib';
var should = require('should');
var Mailbox = require('../../' + lib + '/rpc-client/mailboxes/tcp-mailbox');
var Server = require('../../').server;

var WAIT_TIME = 100;

var paths = [
  {namespace: 'user', serverType: 'area', path: __dirname + '../../mock-remote/area'},
  {namespace: 'sys', serverType: 'connector', path: __dirname + '../../mock-remote/connector'}
];

var port = 3333;

var server = {
  id: 'area-server-1',
  host: '127.0.0.1',
  port: port
};

var msg = {
  namespace: 'user',
  serverType: 'area',
  service: 'addOneRemote',
  method: 'doService',
  args: [1]
};

describe('tcp mailbox test', function() {
  var gateway;

  before(function(done) {
    //start remote server
    var opts = {
      acceptorFactory: Server.TcpAcceptor,
      paths: paths,
      port: port,
      cacheMsg: true,
      interval: 30
    };

    gateway = Server.create(opts);
    gateway.start();
    done();
  });

  after(function(done) {
    //stop remote server
    gateway.stop();
    done();
  });

  describe('#create', function() {
    it('should be ok for creating a mailbox and connect to the right remote server', function(done) {
      var mailbox = Mailbox.create(server);
      should.exist(mailbox);
      mailbox.connect(function(err) {
        should.not.exist(err);
        mailbox.close();
        done();
      });
    });

    it('should return an error if connect fail', function(done) {
      var server = {
        id: "area-server-1",
        host: "127.0.0.1",
        port: -1000  //invalid port
      };

      var mailbox = Mailbox.create(server);
      should.exist(mailbox);
      mailbox.connect(function(err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('#send', function() {
    it('should send request to remote server and get the response from callback function', function(done) {
      var mailbox = Mailbox.create(server);
      mailbox.connect(function(err) {
        should.not.exist(err);

        mailbox.send(msg, null, function(err, res) {
          should.exist(res);
          res.should.equal(msg.args[0] + 1);
          mailbox.close();
          done();
        });
      });
    });

    it('should distinguish different services and keep the right request/response relationship', function(done) {
      var value = 1;
      var msg1 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doService',
        args: [value]
      };
      var msg2 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doAddTwo',
        args: [value]
      };
      var msg3 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addThreeRemote',
        method: 'doService',
        args: [value]
      };
      var callbackCount = 0;

      var mailbox = Mailbox.create(server);
      mailbox.connect(function(err) {
        should.not.exist(err);

        mailbox.send(msg1, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 1);
          callbackCount++;
        });

        mailbox.send(msg2, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 2);
          callbackCount++;
        });

        mailbox.send(msg3, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 3);
          callbackCount++;
        });
      });

      setTimeout(function() {
        callbackCount.should.equal(3);
        if(!!mailbox) {
          mailbox.close();
        }
        done();
      }, WAIT_TIME);
    });

    it('should distinguish different services and keep the right request/response relationship when use message cache mode', function(done) {
      var value = 1;
      var msg1 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doService',
        args: [value]
      };
      var msg2 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doAddTwo',
        args: [value]
      };
      var msg3 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addThreeRemote',
        method: 'doService',
        args: [value]
      };
      var callbackCount = 0;

      var mailbox = Mailbox.create(server, {cacheMsg: true});
      mailbox.connect(function(err) {
        should.not.exist(err);

        mailbox.send(msg1, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 1);
          callbackCount++;
        });

        mailbox.send(msg2, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 2);
          callbackCount++;
        });

        mailbox.send(msg3, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 3);
          callbackCount++;
        });
      });

      setTimeout(function() {
        callbackCount.should.equal(3);
        if(!!mailbox) {
          mailbox.close();
        }
        done();
      }, WAIT_TIME);
    });

    it('should distinguish different services and keep the right request/response relationship if the client uses message cache mode but server not', function(done) {
      //start a new remote server without message cache mode
      var opts = {
        paths: paths,
        port: 3051
      };

      var gateway = Server.create(opts);
      gateway.start();

      var value = 1;
      var msg1 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doService',
        args: [value]
      };
      var msg2 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addOneRemote',
        method: 'doAddTwo',
        args: [value]
      };
      var msg3 = {
        namespace: 'user',
        serverType: 'area',
        service: 'addThreeRemote',
        method: 'doService',
        args: [value]
      };
      var callbackCount = 0;

      var mailbox = Mailbox.create(server, {cacheMsg: true});
      mailbox.connect(function(err) {
        should.not.exist(err);

        mailbox.send(msg1, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 1);
          callbackCount++;
        });

        mailbox.send(msg2, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 2);
          callbackCount++;
        });

        mailbox.send(msg3, null, function(err, res) {
          should.exist(res);
          res.should.equal(value + 3);
          callbackCount++;
        });
      });

      setTimeout(function() {
        callbackCount.should.equal(3);
        if(!!mailbox) {
          mailbox.close();
        }
        gateway.stop();
        done();
      }, WAIT_TIME);
    });
  });

  describe('#close', function() {
    it('should emit a close event when mailbox close', function(done) {
      var closeEventCount = 0;
      var mailbox = Mailbox.create(server);
      mailbox.connect(function(err) {
        should.not.exist(err);
        mailbox.on('close', function() {
          closeEventCount++;
        });
        mailbox.close();
      });

      setTimeout(function() {
        closeEventCount.should.equal(1);
        done();
      }, WAIT_TIME);
    });

    it('should return an error when try to send message by a closed mailbox', function(done) {
      var mailbox = Mailbox.create(server);
      mailbox.connect(function(err) {
        should.not.exist(err);
        mailbox.close();
        mailbox.send(msg, null, function(err, res) {
          should.exist(err);
          done();
        });
      });
    });
  });

});