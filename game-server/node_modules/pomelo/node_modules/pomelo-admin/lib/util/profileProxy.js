var fs = require('fs');

var HeapProfileType = 'HEAP';
var CPUProfileType = 'CPU';

var Proxy = function(){
	this.profiles = {
		HEAP: {},
		CPU: {}
	};

	this.isProfilingCPU = false;
};

module.exports = Proxy;

var pro = Proxy.prototype;

pro.enable = function(id, params, clientId, agent) {
	this.sendResult(id,{
		result : true
	}, clientId, agent);
};

pro.causesRecompilation = function(id, params, clientId, agent) {
	this.sendResult(id,{
		result: false
	}, clientId, agent);
};

pro.isSampling = function(id, params, clientId, agent) {
	this.sendResult(id,{
		result: true
	}, clientId, agent);
};

pro.hasHeapProfiler = function(id, params, clientId, agent) {
	this.sendResult(id,{
		result: true
	}, clientId, agent);
};

pro.getProfileHeaders = function(id, params, clientId, agent) {
	var headers = [];
	for (var type in this.profiles) {
		for (var profileId in this.profiles[type]) {
			var profile = this.profiles[type][profileId];
			headers.push({
				title: profile.title,
				uid: profile.uid,
				typeId: type
			});
		}
	}
	this.sendResult(id, {
		headers: headers
	}, clientId, agent);
};

pro.takeHeapSnapshot = function(id, params, clientId, agent) {
	var uid = params.uid;

	agent.notifyById(uid, 'profiler', {type: 'heap', action: 'start', uid: uid, clientId: clientId});

	this.sendEvent({
		method: 'Profiler.addProfileHeader', 
		params: {header: {title: uid, uid: uid, typeId: HeapProfileType}}
	}, clientId, agent);
	this.sendResult(id, {}, clientId, agent);
};

pro.takeSnapCallBack = function (data) {
	var uid = data.params.uid || 0;
	var snapShot = this.profiles[HeapProfileType][uid];
	if (!snapShot || snapShot.finish) {
		snapShot = {};
		snapShot.data = [];
		snapShot.finish = false;
		snapShot.uid = uid;
		snapShot.title = uid;
	}
	if (data.method === 'Profiler.addHeapSnapshotChunk') {
		var chunk = data.params.chunk;
		snapShot.data.push(chunk);
	} else {
		snapShot.finish = true;
	}
	this.profiles[HeapProfileType][uid] = snapShot;
};

pro.getProfile = function(id, params, clientId, agent) {
	var profile = this.profiles[params.type][params.uid];
	var self = this;
	if (!profile || !profile.finish) {
		var timerId = setInterval(function() {
			profile = self.profiles[params.type][params.uid];
			if (!!profile) {
				clearInterval(timerId);
				self.asyncGet(id, params, profile, clientId, agent);
			}
		}, 5000);
	} else {
		this.asyncGet(id,params, profile, clientId, agent);
	}
};

pro.asyncGet = function(id, params, snapshot, clientId, agent) {
	var uid = params.uid;
	if (params.type === HeapProfileType) {
		for (var index in snapshot.data) {
			var chunk = snapshot.data[index];
			this.sendEvent({method: 'Profiler.addHeapSnapshotChunk', params: {uid: uid, chunk: chunk}}, clientId, agent);
		}
		this.sendEvent({method: 'Profiler.finishHeapSnapshot', params: {uid: uid}}, clientId, agent);
		this.sendResult(id, {profile: {title: snapshot.title, uid: uid, typeId: HeapProfileType}}, clientId, agent);
	} else if (params.type === CPUProfileType) {
		this.sendResult(id,{
			profile: {
				title: snapshot.title,
				uid: uid,
				typeId: CPUProfileType,
				head: snapshot.data.head,
				bottomUpHead: snapshot.data.bottomUpHead
			}
		}, clientId, agent);
	}
};

pro.clearProfiles = function(id, params) {
	this.profiles.HEAP = {};
	this.profiles.CPU = {};
	//profiler.deleteAllSnapshots();
	//profiler.deleteAllProfiles();
};

pro.sendResult = function(id, res, clientId, agent){
	agent.notifyClient(clientId, 'profiler', JSON.stringify({id: id, result: res}));
};

pro.sendEvent = function(res, clientId, agent){
	agent.notifyClient(clientId, 'profiler', JSON.stringify(res));
};

pro.start = function(id, params, clientId, agent) {
	var uid = params.uid;

	agent.notifyById(uid, 'profiler', {type: 'CPU', action: 'start', uid: uid, clientId: clientId});
	this.sendEvent({method: 'Profiler.setRecordingProfile', params: {isProfiling: true}}, clientId, agent);
	this.sendResult(id, {}, clientId, agent);
};

pro.stop = function(id, params, clientId, agent) {
	var uid = params.uid;
	agent.notifyById(uid, 'profiler', {type: 'CPU', action: 'stop', uid: uid, clientId: clientId});
	this.sendResult(id, {}, clientId, agent);
};

pro.stopCallBack = function(res, clientId, agent) {
	var uid = res.msg.uid;
	var profiler = this.profiles[CPUProfileType][uid];
	if (!profiler || profiler.finish){
		profiler = {};
		profiler.data = null;
		profiler.finish = true;
		profiler.typeId = CPUProfileType;
		profiler.uid = uid;
		profiler.title = uid;
	}
	profiler.data = res;
	this.profiles[CPUProfileType][uid] = profiler;
	this.sendEvent({
		method: 'Profiler.addProfileHeader', 
		params: {header: {title: profiler.title, uid: uid, typeId: CPUProfileType}}
	}, clientId, agent);
};