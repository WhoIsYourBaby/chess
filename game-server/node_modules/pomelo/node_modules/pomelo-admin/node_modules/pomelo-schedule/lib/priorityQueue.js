/**
 * The PriorityQeueu class
 */
var PriorityQueue = function(comparator){
  this.init(comparator);
}

var pro = PriorityQueue.prototype;

pro.init = function(comparator){
  this._comparator = typeof(comparator)=='function'?comparator:this._defaultComparator;
  
  this._queue = [];
  this._tailPos = 0;
}

/**
 * Return the size of the pirority queue
 * @return PirorityQueue size
 */
pro.size = function(){
  return this._tailPos;
};
  
/**
 * Insert an element to the queue
 * @param element The element to insert
 */
pro.offer = function(element){
  var queue = this._queue;
  var compare = this._comparator;
  
  queue[this._tailPos++] = element;
  
  var pos = this._tailPos-1;
  
  while(pos > 0){
    var parentPos = (pos%2==0)?(pos/2-1):(pos-1)/2;
    if(compare(queue[parentPos], element)){
      queue[pos] = queue[parentPos];
      queue[parentPos] = element;
      
      pos = parentPos;
    }else{
      break;
    }
  }
};
          
/**
 * Get and remove the first element in the queue
 * @return The first element
 */        
pro.pop = function(){
  var queue = this._queue;
  var compare = this._comparator;
  
  if(this._tailPos == 0)
    return null;
  
  
  var headNode = queue[0];
  
  var tail = queue[this._tailPos - 1];

  var pos = 0;
  var left = pos*2 + 1;
  var right = left + 1;
  queue[pos] = tail;
  this._tailPos--;
  
  while(left < this._tailPos){    
    if(right<this._tailPos && compare(queue[left], queue[right]) && compare(queue[pos], queue[right])){
      queue[pos] = queue[right];
      queue[right] = tail;
      
      pos = right;
    }else if(compare(queue[pos],queue[left])){
      queue[pos] = queue[left];
      queue[left] = tail;
      
      pos = left;
    }else{
      break;
    }
    
    left = pos*2 + 1;
    right = left + 1;
  }
  
  return headNode;
};

/**
 * Get but not remove the first element in the queue
 * @return The first element
 */
pro.peek = function(){
  if(this._tailPos == 0)
    return null;
  return this._queue[0];
}

pro._defaultComparator = function(a , b){
  return a > b;
}

module.exports.createPriorityQueue = function(comparator){
  return new PriorityQueue(comparator);
}