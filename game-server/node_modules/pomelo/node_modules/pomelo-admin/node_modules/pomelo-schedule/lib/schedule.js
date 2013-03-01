/**
 * The main class and interface of the schedule module
 */
var PriorityQueue = require('./priorityQueue');
var Job = require('./job.js');
var timerCount = 0;

var logger = require('log4js').getLogger(__filename);

var map = {};
var queue = PriorityQueue.createPriorityQueue(comparator);

var jobId = 0;
var timer;

//The accuracy of the scheduler, it will affect the performance when the schedule tasks are 
//crowded together
var accuracy = 10;

/**
 * Schedule a new Job
 */
function scheduleJob(trigger, jobFunc, jobData){
  var job = Job.createJob(trigger, jobFunc, jobData); 
  var excuteTime = job.excuteTime();
  var id = job.id;
  
  map[id] = job;
  var element = {
    id : id,
    time : excuteTime
  }
  
  var curJob = queue.peek();
  if(!curJob || excuteTime < curJob.time){
    queue.offer(element);
    setTimer(job);

    return job.id;
  }
  
  queue.offer(element);
  return job.id;
}

/**
 * Cancel Job
 */
function cancelJob(id){
  if(id == queue.peek().id){
    queue.pop();
    delete map[id];
    
    var job = getNextJob();
    if(!job)
      return true;
    
    setTimer(job);  
  }
  delete map[id];
  return true;
}

/**
 * Clear last timeout and schedule the next job, it will automaticly run the job that 
 * need to run now
 * @param job The job need to schedule
 * @return void
 */
function setTimer(job){
  clearTimeout(timer);
  
  while((job.time-Date.now()) < accuracy){
    job.run();
    job = nextJob();
    if(!job)
      return;
  }
  
  timer = setTimeout(excuteJob, job.excuteTime()-Date.now());
//  logger.debug("setTimer count : " + ++timerCount);
}

/**
 * The function used to ran the schedule job, and setTimeout for next running job
 */
function excuteJob(){
  var job = peekNextJob();
  var nextJob;
        
  while(!!job && (job.excuteTime()-Date.now())<accuracy){
    job.run();
    queue.pop();
    
    var nextTime = job.nextTime();
    
    if(nextTime === null){
      delete map[job.id];
    }else{
      queue.offer({id:job.id, time: nextTime});
    }
    job = peekNextJob();
  }
    
  //If all the job have been canceled
  if(!job)
    return; 
  
  //Run next schedule
  setTimer(job);
}

/**
 * Return, but not remove the next valid job
 * @return Next valid job
 */
function peekNextJob(){
  if(queue.size() <= 0)
    return null;
    
  var job = null;
 
  do{
    job = map[queue.peek().id];
    if(!job)
      queue.pop();
  }while(!job && queue.size() > 0);
  
  return (!!job)?job:null;
}

/**
 * Return and remove the next valid job
 * @return Next valid job
 */
function getNextJob(){
  var job = null;
  
  while(!job && queue.size() > 0){
    var id = queue.pop().id;
    job = map[id];
  }

  return (!!job)?job:null;
}

function comparator(e1, e2){
  return e1.time > e2.time;
}

module.exports.scheduleJob = scheduleJob;
module.exports.cancelJob = cancelJob;