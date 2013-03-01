/**
 * @description
 * this file is based on : piuccio/node-coverage
 * folliwing MIT license
 * the project : https://github.com/piuccio/node-coverage
 * the origin file : lib/instrument.js
 */
var parser = require("uglify-js").parser;
var uglify = require("uglify-js").uglify;

/**
 * instrument code
 * @public
 * @param  {String} file    instrument file name
 * @param  {String} content instrument file content, string type
 * @return {Object}  instrObj{
 *                     file {String} the filename,
 *                     code {String} the instrument code,
 *                     lines {Array} the marked lines, each Array item is a line num
 *                     conditions {Array} the marked conditions, each Array item is a line num
 *                     src {Array} the src codes ,split by \n
 *                   }
 */
function instrument(file, content) {
  var tree;
  try {
    tree = parser.parse(content, false, true);
  } catch (ex) {
    throw new Error("Error instrumentig file:" + file + ' ' + ex.message);
  }

  var walker = uglify.ast_walker();
  // this is the list of nodes being analyzed by the walker
  // without this, w.walk(this) would re-enter the newly generated code with infinite recursion
  var analyzing = [];
  // list of all lines' id encounterd in this file
  var lines = [];
  // list of all conditions' id encounterd in this file
  var conditions = [];

  /**
   * A statement was found in the file, remember its id.
   */
  function rememberStatement(id) {
    lines.push(id);
  }
  /**
   * Generic function for counting a line.
   * It generates a lineId from the line number and the block name (in minified files there
   * are more logical lines on the same file line) and adds a function call before the actual
   * line of code.
   *
   * 'this' is any node in the AST
   */
  function countLine() {
    var ret;
    if (this[0].start && analyzing.indexOf(this) < 0) {
      var lineId = this[0].start.line + 1;
      rememberStatement(lineId);
      analyzing.push(this);
      ret = [ "splice",
        [
          [ "stat",
            [ "call",
              [ "name", "_$jscoverage_done" ],
              [["string", file], ["num", lineId]]
            ]
          ],
          walker.walk(this)
        ]
      ];
      analyzing.pop(this);
    }
    return ret;
  }

  /**
   * Walker for 'if' nodes. It overrides countLine because we want to instrument conditions.
   *
   * 'this' is an if node, so
   *    'this[0]' is the node descriptor
   *    'this[1]' is the decision block
   *    'this[2]' is the 'then' code block
   *    'this[3]' is the 'else' code block
   *
   * Note that if/else if/else in AST are represented as nested if/else
   */
  function countIf() {
    var self = this, ret;
    var decision, lineId;
    if (self[0].start && analyzing.indexOf(self) < 0) {
      decision = self[1];
      lineId = self[0].start.line + 1;

      self[1] = wrapCondition(decision, lineId);

      // We are adding new lines, make sure code blocks are actual blocks
      if (self[2] && self[2][0].start && self[2][0].start.value != "{") {
        self[2] = [ "block", [self[2]]];
      }

      if (self[3] && self[3][0].start && self[3][0].start.value != "{") {
        self[3] = [ "block", [self[3]]];
      }
    }

    ret = countLine.call(self);

    if (decision) {
      analyzing.pop(decision);
    }

    return ret;
  }

  /**
   * This is the key function for condition coverage as it wraps every condition in
   * a function call.
   * The condition id is generated fron the lineId (@see countLine) plus the character
   * position of the condition.
   */
  function wrapCondition(decision, lineId) {
    if (isSingleCondition(decision)) {
      var condId = lineId;

      analyzing.push(decision);
      conditions.push(condId);
      return ["call",
        ["name", "_$jscoverage_done"],
        [[ "string", file ], [ "num", condId], decision]
      ];
    } else {
      decision[2] = wrapCondition(decision[2], lineId);
      decision[3] = wrapCondition(decision[3], lineId);
      return decision;
    }
  }

  /**
   * Wheter or not the if decision has only one boolean condition
   */
  function isSingleCondition(decision) {
    if (decision[0].start && decision[0].name != "binary") {
      return true;
    } else if (decision[1] == "&&" || decision[1] == "||") {
      return false;
    } else {
      return true;
    }
  }
  /**
   * Generic function for every node that needs to be wrapped in a block.
   * For instance, the following code
   *
   *    for (a in b) doSomething(a)
   *
   * once converted in AST does not have a block but only a function call.
   * Instrumentig this code would return
   *
   *    for (a in b) instrumentation()
   *    doSomething(a)
   *
   * which clearly does not have the same behavior as the non instrumented code.
   *
   * This function generates a function that can be used by the walker to add
   * blocks when they are missing depending on where the block is supposed to be
   */
  function wrapBlock(position) {
    return function countFor() {
      var self = this;

      if (self[0].start && analyzing.indexOf(self) < 0) {
        if (self[0].start && analyzing.indexOf(self) < 0) {
          if (self[position] && self[position][0].name != "block") {
            self[position] = [ "block", [self[position]]];
          }
        }
      }

      return countLine.call(self);
    };
  }

  /**
   * Label nodes need special treatment as well.
   *
   *    myLabel : for (;;) {
   *       //whateveer code here
   *       continue myLabel
   *    }
   *
   * Label can be wrapped by countLine, hovewer the subsequent for shouldn't be wrapped.
   *
   *    instrumentation("label");
   *    mylabel : instrumentation("for")
   *       for (;;) {}
   *
   * The above code would be wrong.
   *
   * This function makes sure that the 'for' after a label is not instrumented and that
   * the 'for' content is wrapped in a block.
   *
   * I'm don't think it's reasonable to use labels with something that is not a 'for' block.
   * In that case the instrumented code might easily break.
   */
  function countLabel() {
    var ret;
    var content;
    if (this[0].start && analyzing.indexOf(this) < 0) {
      content = this[2];
      if (content[0].name == "for" && content[4] && content[4].name != "block") {
        content[4] = [ "block", [content[4]]];
      }
      analyzing.push(content);
      ret = countLine.call(this);
      analyzing.pop(content);
    }
    return ret;
  }

  var instrumentedTree = walker.with_walkers({
    "stat"     : countLine,
    "label"    : countLabel,
    "break"    : countLine,
    "continue" : countLine,
    "debugger" : countLine,
    "var"      : countLine,
    "const"    : countLine,
    "return"   : countLine,
    "throw"    : countLine,
    "try"      : countLine,
    "if"       : countIf,
    "while"    : wrapBlock(2),
    "do"       : wrapBlock(2),
    "for"      : wrapBlock(4),
    "for-in"   : wrapBlock(4),
    "switch"   : countLine,
    "with"     : countLine
  }, function () {
    return walker.walk(tree);
  });

  var code = uglify.gen_code(instrumentedTree, {beautify : true});
  return {
    file : file,
    code : code,
    lines : lines,
    conditions : conditions,
    src : content.split(/\r?\n/)
  };
}

exports = module.exports = instrument;