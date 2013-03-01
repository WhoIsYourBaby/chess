var systemMonitor = require('../lib/systemMonitor');

function test() {
	systemMonitor.getSysInfo(function(data) {
		console.log('operating-system information is: ', data);
	});
};

test();
