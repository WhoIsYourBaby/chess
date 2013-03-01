var should = require('should');
var Composer = require('..');

describe('#Composer', function() {

	it('should compose and decompose the package in one byte length', function(done) {
		var src = 'some english and some 中文';
		var comp = new Composer();
		var res = comp.compose(src);

		comp.on('data', function(data) {
			var str = data.toString('utf-8');
			str.should.equal(src);
			done();
		});

		comp.feed(res);
	});

	it('should compose and decompose the package in multi-bytes length', function(done) {
		var base = 'some english and some 中文';
		var src = base;
		for(var i=0; i<127; i++) {
			src += base;
		}

		var comp = new Composer();
		var res = comp.compose(src);

		comp.on('data', function(data) {
			var str = data.toString('utf-8');
			str.should.equal(src);
			done();
		});

		comp.feed(res);
	});

	it('should decompose the package from chunks of data', function(done) {
		var base = 'some english and some 中文';
		var src = base;
		for(var i=0; i<127; i++) {
			src += base;
		}

		var comp = new Composer();
		var res = comp.compose(src);

		comp.on('data', function(data) {
			var str = data.toString('utf-8');
			str.should.equal(src);
			done();
		});

		var p1 = Math.ceil(res.length / 3);
		var p2 = p1 * 2;

		comp.feed(res, 0, p1);
		comp.feed(res, p1, p2);
		comp.feed(res, p2);
	});

	it('should throw an exception if try to compose the data whose length exceed the limit', function() {
		var src = 'aaaaa';
		var comp = new Composer({maxLength: 3});
		try {
			comp.compose(src);
		} catch(err) {
			should.exist(err);
			return;
		}
		// should come here
		should.be.ok(false);
	});

	it('should emit an event if try to decompose the data whose length exceed the limit', function(done) {
		var src = 'aaaaa';
		var comp1 = new Composer();
		var res = comp1.compose(src);

		var comp2 = new Composer({maxLength: 3});
		comp2.on('data', function(data) {
			// should come here
			should.be.ok(false);
		});

		comp2.on('length_limit', function(comp, data, offset) {
			comp.should.equal(comp2);
			done();
		});

		comp2.feed(res);
	});

	it('should fail if try to compose an empty data', function() {
		var src = '';
		var comp = new Composer();
		try {
			comp.compose(src);
		} catch(err) {
			should.exist(err);
			return;
		}
		// should come here
		should.be.ok(false);
	});
});