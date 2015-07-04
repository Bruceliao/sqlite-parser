(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
/*!
 * sqlite-parser
 * @copyright Code School 2015 {@link http://codeschool.com}
 * @author Nick Wronski <nick@javascript.com>
 */
 ;(function (root) {
  var Promise     = require('promise/lib/es6-extensions'),
      parser      = require('./lib/parser'),
      Tracer      = require('./lib/tracer');

  function sqliteParser(source) {
    var t = Tracer();
    return new Promise(function(resolve, reject) {
      resolve(parser.parse(source, {
        'tracer': t
      }));
    })
    .catch(function (err) {
      t.smartError(err);
    });
  }
  sqliteParser['NAME'] = 'sqlite-parser';
  sqliteParser['VERSION'] = '0.8.0';

  module.exports = root.sqliteParser = sqliteParser;
})(typeof self === 'object' ? self : global);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/parser":3,"./lib/tracer":4,"promise/lib/es6-extensions":9}],2:[function(require,module,exports){
/*!
 * sqlite-parser
 * @copyright Code School 2015 {@link http://codeschool.com}
 * @author Nick Wronski <nick@javascript.com>
 */
var slice = [].slice;

function makeArray(arr) {
  return !isArray(arr) ? (isOkay(arr) ? [arr] : []) : arr;
}

function typed(obj) {
  return Object.prototype.toString.call(obj);
}

function isPlain(obj) {
  return typed(obj) === '[object Object]';
}

function isPattern(obj) {
  return typed(obj) === '[object RegExp]';
}

function isFunc(obj) {
  return typed(obj) === '[object Function]';
}

function isString(obj) {
  return typed(obj) === '[object String]';
}

function isArray(obj) {
  return Array.isArray ? Array.isArray(obj) : (typed(obj) === '[object Array]');
}

function isOkay(obj) {
  return obj != null;
}

function collapse(arr) {
  var i, len, n, obj, ref, v;
  if (isArray(arr) && arr.length) {
    obj = {};
    for (i = 0, len = arr.length; i < len; i++) {
      ref = arr[i], n = ref.name, v = ref.value;
      obj[n] = v;
    }
    return obj;
  } else {
    return {};
  }
}

function compose(args, glue) {
  var conc = isArray(glue), res, start = conc ? [] : '';
  if (!isOkay(glue)) {
    glue = ' ';
  }
  res = args.reduce(function (prev, cur) {
    return conc ? (isOkay(cur) ? prev.concat(cur) : prev) :
                  (prev + (isOkay(cur) ? textNode(cur) + glue : ''));
  }, start);
  return conc ? res : res.trim();
}

function stack(arr) {
  return (isArray(arr) ?
    arr.map(function (elem) {
      return elem[1];
    }) : []);
}

function nodeToString(node) {
  var elem = ((isArray(node) || isString(node)) ? node : []);
  if (isArray(elem)) {
    if (elem.length && isArray(elem[0])) {
      elem = stack(elem);
    }
    elem = elem.join('');
  }
  return elem;
}

function textNode(elem) {
  /*
   * A text node has
   * - no leading or trailing whitespace
   */
  return nodeToString(elem).trim();
}

function unescape(str, quoteChar) {
  var re;
  if (quoteChar == null) {
    quoteChar = '\'';
  }
  re = new RegExp(quoteChar + '{2}', 'g');
  return str.replace(re, quoteChar);
}

function extend() {
  var first = arguments[0],
      rest = slice.call(arguments, 1);

  rest.forEach(function (next) {
    if (isOkay(next) && isPlain(next)) {
      var key;
      for (key in next) {
        if (next.hasOwnProperty(key)) {
          first[key] = next[key];
        }
      }
    }
  });

  return first;
}

function has(thing, item) {
  var k, v, len;
  if (isArray(thing)) {
    if (isString(item)) {
      // thing is an array, find substring item
      return thing.indexOf(item) !== -1;
    } else {
      // thing is an array, find item in array
      return findWhere(thing, item) !== undefined;
    }
  } else if (isPlain(thing)) {
    // thing is an object
    if (isPlain(item)) {
      // item is an object, find each prop key and value in item within thing
      for (k in item) {
        v = item[k];
        if (!(thing.hasOwnProperty(k) && thing[k] === v)) {
          return false;
        }
      }
      return true;
    } else if (isArray(item)) {
      // item is an array, find each string prop within thing
      for (i = 0, len = item.length; i < len; i++) {
        k = item[i];
        if (!thing.hasOwnProperty(k)) {
          return false;
        }
      }
      return true;
    } else {
      // thing is an object, item is a string, find item string in thing
      return thing.hasOwnProperty(item);
    }
  }
  return false;
}

function findWhere(arr, props) {
  var i, len, val;
  for (i = 0, len = arr.length; i < len; i++) {
    val = arr[i];
    if (has(val, props)) {
      return val;
    }
  }
  return null;
}

function key(elem) {
  return textNode(elem).toLowerCase();
}

function findLastIndex(arr, props) {
  return findLast(arr, props, true);
}

function findLast(arr, props, index) {
  var elem, i;
  for (i = arr.length - 1; i >= 0; i += -1) {
    elem = arr[i];
    if (has(elem, props)) {
      return index ? i : elem;
    }
  }
  return index ? -1 : null;
}

function takeRight(arr, count) {
  return 1 <= count ? arr.slice(-1 * count) : null;
}

function pluck(arr, prop) {
  return arr.map(function (elem) {
    return has(elem, prop) ? elem[prop] : null;
  });
}

function takeWhile(arr, func) {
  var elem, i, len;
  for (i = 0, len = arr.length; i < len; i++) {
    elem = arr[i];
    if (!func(elem)) {
      break;
    }
  }
  return arr.slice(0, i);
}

function first(arr) {
  return 1 <= arr.length ? arr[0] : null;
}

function last(arr) {
  return 1 <= arr.length ? arr[arr.length - 1] : null;
}

function rest(arr) {
  return 2 <= arr.length ? slice.call(arr, 1) : [];
}

module.exports = {
  // Array methods
  'stack':                stack,
  'collapse':             collapse,
  'compose':              compose,
  'findWhere':            findWhere,
  'has':                  has,
  'findLastIndex':        findLastIndex,
  'findLast':             findLast,
  'takeRight':            takeRight,
  'pluck':                pluck,
  'takeWhile':            takeWhile,
  'first':                first,
  'last':                 last,
  'rest':                 rest,
  // String methods
  'nodeToString':         nodeToString,
  'textNode':             textNode,
  'unescape':             unescape,
  'key':                  key,
  // Type detection
  'typed':                typed,
  'isPlain':              isPlain,
  'isPattern':            isPattern,
  'isFunc':               isFunc,
  'isString':             isString,
  'isArray':              isArray,
  'isOkay':								isOkay,
  // Misc methods
  'extend':               extend,
  'makeArray':            makeArray
};

},{}],3:[function(require,module,exports){
module.exports = (function() {
  "use strict";

  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.org/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function peg$SyntaxError(message, expected, found, location) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.location = location;

    this.name     = "SyntaxError";
  }

  peg$subclass(peg$SyntaxError, Error);

  function peg$DefaultTracer() {
    this.indentLevel = 0;
  }

  peg$DefaultTracer.prototype.trace = function(event) {
    var that = this;

    function log(event) {
      function repeat(string, n) {
         var result = "", i;

         for (i = 0; i < n; i++) {
           result += string;
         }

         return result;
      }

      function pad(string, length) {
        return string + repeat(" ", length - string.length);
      }

      console.log(
        event.location.start.line + ":" + event.location.start.column + "-"
          + event.location.end.line + ":" + event.location.end.column + " "
          + pad(event.type, 10) + " "
          + repeat("  ", that.indentLevel) + event.rule
      );
    }

    switch (event.type) {
      case "rule.enter":
        log(event);
        this.indentLevel++;
        break;

      case "rule.match":
        this.indentLevel--;
        log(event);
        break;

      case "rule.fail":
        this.indentLevel--;
        log(event);
        break;

      default:
        throw new Error("Invalid event type: " + event.type + ".");
    }
  };

  function peg$parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},
        parser  = this,

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = function(s) {
            return {
              'statement': (util.isOkay(s) ? s : [])
            };
          },
        peg$c1 = function(f, b, c) { return util.compose([f, b], []); },
        peg$c2 = function(s) { return s; },
        peg$c3 = { type: "other", description: "Expression" },
        peg$c4 = function(t) { return t; },
        peg$c5 = { type: "other", description: "Logical Expression Group" },
        peg$c6 = function(l, o, r) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(o),
              'left': l,
              'right': r
            };
          },
        peg$c7 = { type: "other", description: "Wrapped Expression" },
        peg$c8 = function(n) { return n; },
        peg$c9 = { type: "other", description: "Unary Expression" },
        peg$c10 = function(o, e) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'operation',
              'expression': e,
              'operator': util.key(o)
            };
          },
        peg$c11 = { type: "other", description: "CAST Expression" },
        peg$c12 = function(s, e, a) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': util.key(s),
              'expression': e,
              'as': a
            };
          },
        peg$c13 = { type: "other", description: "Type Alias" },
        peg$c14 = function(d) { return d; },
        peg$c15 = { type: "other", description: "EXISTS Expression" },
        peg$c16 = function(n, e) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'exists',
              'expression': e,
              'operator': util.key(n)
            };
          },
        peg$c17 = function(n, x) { return util.compose([n, x]); },
        peg$c18 = { type: "other", description: "CASE Expression" },
        peg$c19 = function(t, e, w, s) {
            // TODO: Not sure about this
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': util.key(t),
              'expression': e,
              'condition': util.compose([w, s], [])
            };
          },
        peg$c20 = { type: "other", description: "WHEN Clause" },
        peg$c21 = function(s, w, t) {
            return {
              'type': 'condition',
              'format': util.key(s),
              'when': w,
              'then': t
            };
          },
        peg$c22 = { type: "other", description: "ELSE Clause" },
        peg$c23 = function(s, e) {
            return {
              'type': 'condition',
              'format': util.key(s),
              'else': e
            };
          },
        peg$c24 = { type: "other", description: "RAISE Expression" },
        peg$c25 = function(s, a) {
            return util.extend({
              'type': 'expression',
              'format': 'unary',
              'variant': util.key(s),
              'expression': a
            }, a);
          },
        peg$c26 = { type: "other", description: "RAISE Expression Arguments" },
        peg$c27 = function(a) {
            return util.extend({
              'type': 'error',
              'action': null,
              'message': null
            }, a);
          },
        peg$c28 = function(f) {
            return {
              'action': util.key(f)
            };
          },
        peg$c29 = function(f, m) {
            return {
              'action': util.key(f),
              'message': m
            };
          },
        peg$c30 = { type: "other", description: "COLLATE Expression" },
        peg$c31 = function(v, s, c) {
            return util.extend(v, {
              'collate': c
            });
          },
        peg$c32 = function(v, n, m, e, x) {
            return util.extend({
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(util.compose([n, m])),
              'left': v,
              'right': e
            }, x);
          },
        peg$c33 = { type: "other", description: "ESCAPE Expression" },
        peg$c34 = function(s, e) {
            return {
              'escape': e
            };
          },
        peg$c35 = { type: "other", description: "NULL Expression" },
        peg$c36 = function(v, n) {
            return {
              'type': 'expression',
              'format': 'unary',
              'variant': 'operation',
              'expression': v,
              'operation': n
            };
          },
        peg$c37 = function(i, n) { return util.key(util.compose([i, n])); },
        peg$c38 = function(t) { return util.key(t); },
        peg$c39 = function(i, n) {
            return util.key(util.compose([i, n]));
          },
        peg$c40 = function(n) { return util.textNode(n); },
        peg$c41 = { type: "other", description: "BETWEEN Expression" },
        peg$c42 = function(v, n, b, e1, s, e2) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(util.compose([n, b])),
              'left': v,
              'right': {
                'type': 'expression',
                'format': 'binary',
                'variant': 'operation',
                'operation': util.key(s),
                'left': e1,
                'right': e2
              }
            };
          },
        peg$c43 = { type: "other", description: "IN Expression" },
        peg$c44 = function(v, n, i, e) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(util.compose([n, i])),
              'left': v,
              'right': e
            };
          },
        peg$c45 = function(e) { return e; },
        peg$c46 = { type: "other", description: "Type Definition" },
        peg$c47 = function(n, a) {
            return util.extend({
              'type': 'datatype',
              'variant': n[0],
              'affinity': n[1],
              'args': [] // datatype definition arguments
            }, a);
          },
        peg$c48 = { type: "other", description: "Type Definition Arguments" },
        peg$c49 = function(a1, a2) {
            return {
              'args': util.compose([a1, a2], [])
            };
          },
        peg$c50 = { type: "other", description: "Null Literal" },
        peg$c51 = function(n) {
            return {
              'type': 'literal',
              'variant': 'null',
              'value': util.key(n)
            };
          },
        peg$c52 = { type: "other", description: "Date Literal" },
        peg$c53 = function(d) {
            return {
              'type': 'literal',
              'variant': 'date',
              'value': util.key(d)
            };
          },
        peg$c54 = { type: "other", description: "String Literal" },
        peg$c55 = function(s) {
            return {
              'type': 'literal',
              'variant': 'string',
              'value': s
            };
          },
        peg$c56 = { type: "other", description: "Single-quoted String Literal" },
        peg$c57 = function(s) {
            /**
              * @note Unescaped the pairs of literal single quotation marks
              * @note Not sure if the BLOB type should be un-escaped
              */
            return util.unescape(util.nodeToString(s), "'");
          },
        peg$c58 = "''",
        peg$c59 = { type: "literal", value: "''", description: "\"''\"" },
        peg$c60 = /^[^']/,
        peg$c61 = { type: "class", value: "[^\\']", description: "[^\\']" },
        peg$c62 = { type: "other", description: "Blob Literal" },
        peg$c63 = /^[x]/i,
        peg$c64 = { type: "class", value: "[x]i", description: "[x]i" },
        peg$c65 = function(b) {
            return {
              'type': 'literal',
              'variant': 'blob',
              'value': b
            };
          },
        peg$c66 = { type: "other", description: "Number Sign" },
        peg$c67 = function(s) { return util.textNode(s); },
        peg$c68 = function(s, n) {
            if (util.isOkay(s)) {
              n['value'] = util.compose([s, n['value']]);
            }
            return n;
          },
        peg$c69 = function(d, e) {
            return {
              'type': 'literal',
              'variant': 'decimal',
              'value': util.compose([d, e], '')
            };
          },
        peg$c70 = { type: "other", description: "Decimal Literal" },
        peg$c71 = function(f, b) { return util.compose([f, b], ''); },
        peg$c72 = function(t, d) { return util.compose([t, d], ''); },
        peg$c73 = "e",
        peg$c74 = { type: "literal", value: "E", description: "\"E\"" },
        peg$c75 = /^[+\-]/,
        peg$c76 = { type: "class", value: "[\\+\\-]", description: "[\\+\\-]" },
        peg$c77 = function(e, s, d) { return util.compose([e, s, d], ''); },
        peg$c78 = { type: "other", description: "Hexidecimal Literal" },
        peg$c79 = "0x",
        peg$c80 = { type: "literal", value: "0x", description: "\"0x\"" },
        peg$c81 = function(f, b) {
            return {
              'type': 'literal',
              'variant': 'hexidecimal',
              'value': util.compose([f, b], '')
            };
          },
        peg$c82 = /^[0-9a-f]/i,
        peg$c83 = { type: "class", value: "[0-9a-f]i", description: "[0-9a-f]i" },
        peg$c84 = /^[0-9]/,
        peg$c85 = { type: "class", value: "[0-9]", description: "[0-9]" },
        peg$c86 = { type: "other", description: "Bind Parameter" },
        peg$c87 = { type: "other", description: "Numbered Bind Parameter" },
        peg$c88 = /^[1-9]/,
        peg$c89 = { type: "class", value: "[1-9]", description: "[1-9]" },
        peg$c90 = function(q, id) {
            return {
              'type': 'variable',
              'format': 'numbered',
              'name': util.compose([q, id], '')
            };
          },
        peg$c91 = { type: "other", description: "Named Bind Parameter" },
        peg$c92 = /^[:@]/,
        peg$c93 = { type: "class", value: "[\\:\\@]", description: "[\\:\\@]" },
        peg$c94 = function(s, name) {
            return {
              'type': 'variable',
              'format': 'named',
              'name': util.compose([s, name], '')
            };
          },
        peg$c95 = { type: "other", description: "TCL Bind Parameter" },
        peg$c96 = "$",
        peg$c97 = { type: "literal", value: "$", description: "\"$\"" },
        peg$c98 = ":",
        peg$c99 = { type: "literal", value: ":", description: "\":\"" },
        peg$c100 = function(d, name, suffix) {
            return {
              'type': 'variable',
              'format': 'tcl',
              'name': util.compose([util.compose([d, name], ''), suffix])
            };
          },
        peg$c101 = { type: "other", description: "TCL Bind Parameter Suffix" },
        peg$c102 = function(q1, n, q2) { return util.compose([q1, n, q2], ''); },
        peg$c103 = { type: "other", description: "Binary Expression" },
        peg$c104 = function(v, o, e) {
            return {
              'type': 'expression',
              'format': 'binary',
              'variant': 'operation',
              'operation': util.key(o),
              'left': v,
              'right': e
            };
          },
        peg$c105 = function(c) { return util.key(c); },
        peg$c106 = { type: "other", description: "Expression List" },
        peg$c107 = function(f, rest) {
            return util.compose([f, rest], []);
          },
        peg$c108 = { type: "other", description: "Function Call" },
        peg$c109 = function(n, a) {
            return util.extend({
              'type': 'function',
              'name': n,
              'distinct': false,
              'args': []
            }, a);
          },
        peg$c110 = { type: "other", description: "Function Call Arguments" },
        peg$c111 = function(s) {
            return {
              'distinct': false,
              'args': [{
                'type': 'identifier',
                'variant': 'star',
                'name': s
              }]
            };
          },
        peg$c112 = function(d, e) {
            return {
              'distinct': util.isOkay(d),
              'args': e
            };
          },
        peg$c113 = { type: "other", description: "Error Message" },
        peg$c114 = function(m) { return m; },
        peg$c115 = { type: "other", description: "Statement" },
        peg$c116 = function(m, s) {
            return util.extend({
              'explain': util.isOkay(m)
            }, m, s);
          },
        peg$c117 = { type: "other", description: "QUERY PLAN" },
        peg$c118 = function(e, q) {
            return util.key(util.compose([e, q]));
          },
        peg$c119 = function(q, p) { return util.compose([q, p]); },
        peg$c120 = { type: "other", description: "Transaction" },
        peg$c121 = function(b, s, e) {
            return {
              'type': 'statement',
              'variant': 'transaction',
              'statement': util.isOkay(s) ? s : [],
              'defer': b
            };
          },
        peg$c122 = { type: "other", description: "END Transaction" },
        peg$c123 = function(s, t) {
            return util.key(util.compose([s, t]));
          },
        peg$c124 = { type: "other", description: "BEGIN Transaction" },
        peg$c125 = function(s, m, t) {
            return util.isOkay(m) ? util.key(m) : null;
          },
        peg$c126 = function(m) { return util.key(m); },
        peg$c127 = { type: "other", description: "ROLLBACK Statement" },
        peg$c128 = function(s, n) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'savepoint': n
            };
          },
        peg$c129 = { type: "other", description: "SAVEPOINT" },
        peg$c130 = function(s) { return util.key(s); },
        peg$c131 = { type: "other", description: "ALTER TABLE Statement" },
        peg$c132 = function(s, n, e) {
            return {
              'type': 'statement',
              'variant': util.key(s)
            };
          },
        peg$c133 = function(a, t) { return util.compose([a, t]); },
        peg$c134 = function(s, n) {
            return {
              'action': util.key(s),
              'name': n
            };
          },
        peg$c135 = function(s, d) {
            return {
              'action': util.key(s),
              'definition': d
            };
          },
        peg$c136 = function(w, s) { return util.extend(s, w); },
        peg$c137 = { type: "other", description: "WITH Clause" },
        peg$c138 = function(s, v, f, r) {
            // TODO: final format
            return {
              'with': {
                'type': util.key(s),
                'recursive': util.isOkay(v),
                'expression': util.compose([f, r], [])
              }
            };
          },
        peg$c139 = { type: "other", description: "Table Expression" },
        peg$c140 = function(n, a, s) {
            return util.extend({
              'type': 'expression',
              'format': 'table',
              'name': util.key(n),
              'expression': s,
              'columns': null
            }, a);
          },
        peg$c141 = { type: "other", description: "SELECT Statement" },
        peg$c142 = function(s, o, l) {
            return util.extend(s, {
              'order': o,
              'limit': l
            });
          },
        peg$c143 = function(s, e, d) {
            return {
              'start': e,
              'offset': d
            };
          },
        peg$c144 = function(o, e) { return e; },
        peg$c145 = function(s, u) {
            if (util.isArray(u) && u.length) {
              // TODO: Not final format
              return {
                'type': 'statement',
                'variant': 'compound',
                'statement': s,
                'compound': u
              };
            } else {
              return s;
            }
          },
        peg$c146 = function(c, s) {
            return {
              'type': 'compound',
              'variant': c,
              'statement': s
            };
          },
        peg$c147 = function(s, f, w, g) {
            return util.extend({
              'type': 'statement',
              'variant': 'select',
              'from': [],
              'where': w,
              'group': g
            }, s, f);
          },
        peg$c148 = function(d, t) {
            return util.extend({
              'result': t,
              'distinct': false,
              'all': false
            }, d);
          },
        peg$c149 = function(s) {
            return {
              'distinct': true
            };
          },
        peg$c150 = function(s) {
            return {
              'all': true
            };
          },
        peg$c151 = function(f, r) { return util.compose([f, r], []); },
        peg$c152 = { type: "other", description: "FROM Clause" },
        peg$c153 = function(s) {
            return {
              'from': s
            };
          },
        peg$c154 = { type: "other", description: "WHERE Clause" },
        peg$c155 = function(s, e) { return util.makeArray(e); },
        peg$c156 = function(s, e, h) {
            // TODO: format
            return {
              'expression': util.makeArray(e),
              'having': h
            };
          },
        peg$c157 = function(s, e) { return e; },
        peg$c158 = function(q, s) {
            return {
              'type': 'identifier',
              'variant': 'star',
              'name': util.compose([q, s], '')
            };
          },
        peg$c159 = function(n, s) { return util.compose([n, s], ''); },
        peg$c160 = function(e, a) {
            // TODO: format
            return util.extend(e, {
              'alias': a
            });
          },
        peg$c161 = function(f, t) { return util.compose([f, t], []); },
        peg$c162 = function(d, i) {
            return util.extend(d, i);
          },
        peg$c163 = function(n, a) {
            return util.extend(n, {
              'alias': a
            });
          },
        peg$c164 = function(i) {
            return {
              'index': i
            };
          },
        peg$c165 = function(s, n) { return n; },
        peg$c166 = function() { return null; },
        peg$c167 = function(l) { return l; },
        peg$c168 = function(s, a) {
            return util.extend({
              'alias': a
            }, s);
          },
        peg$c169 = { type: "other", description: "Alias" },
        peg$c170 = function(a, n) { return n; },
        peg$c171 = function(t, j) {
            // TODO: format
            return {
              'type': 'map',
              'variant': 'join',
              'source': t,
              'map': j
            };
          },
        peg$c172 = function(o, n, c) {
            // TODO: format
            return util.extend({
              'type': 'join',
              'variant': util.key(o),
              'source': n,
              'on': null,
              'using': null
            }, c);
          },
        peg$c173 = { type: "other", description: "JOIN Operator" },
        peg$c174 = function(n, t, j) { return util.compose([n, t, j]); },
        peg$c175 = function(t, o) { return util.compose([t, o]); },
        peg$c176 = function(t) { return util.textNode(t); },
        peg$c177 = { type: "other", description: "JOIN Condition" },
        peg$c178 = function(c) { return c; },
        peg$c179 = function(s, e) {
            return {
              'on': e
            };
          },
        peg$c180 = function(s, f, b) {
            return {
              'using': util.compose([f, b], [])
            };
          },
        peg$c181 = function(s, l) {
            // TODO: format
            return {
              'type': 'statement',
              'variant': 'select',
              'result': l,
              'from': null,
              'where': null,
              'group': null
            };
          },
        peg$c182 = function(f, b) {
            return util.compose([f, b], []);
          },
        peg$c183 = function(i) { return i; },
        peg$c184 = function(e, c, d) {
            // TODO: Not final format
            return {
              'direction': util.textNode(d) /*|| 'ASC'*/,
              'expression': e,
              'collate': c
            };
          },
        peg$c185 = function(k) { return k; },
        peg$c186 = { type: "other", description: "INSERT Statement" },
        peg$c187 = function(k, t, p) {
            // TODO: Not final syntax!
            return util.extend({
              'type': 'statement',
              'variant': 'insert',
              'into': null,
              'action': null,
              'or': null,
              'result': []
            }, k, t, p);
          },
        peg$c188 = function(a, m) {
            return util.extend({
              'action': util.key(a)
            }, m);
          },
        peg$c189 = function(a) {
            return {
              'action': util.key(a)
            };
          },
        peg$c190 = function(s, m) {
            return {
              'or': util.key(m)
            };
          },
        peg$c191 = { type: "other", description: "INTO Clause" },
        peg$c192 = function(s, id, cols) {
            return {
              'into': util.extend({
                'target': id,
                'columns': null
              }, cols)
            };
          },
        peg$c193 = function(f, b) {
            return {
              'columns': util.compose([f, b], [])
            };
          },
        peg$c194 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'column',
              'name': n
            };
          },
        peg$c195 = function(r) {
            return {
              'result': r
            };
          },
        peg$c196 = { type: "other", description: "VALUES Clause" },
        peg$c197 = function(s, r) { return r; },
        peg$c198 = function(f, b) { return util.compose([f, b], []); },
        peg$c199 = function(e) {
            return {
              'type': 'values',
              'variant': 'list',
              'values': e
            };
          },
        peg$c200 = { type: "other", description: "DEFAULT VALUES Clause" },
        peg$c201 = function(d, v) {
            return {
              'type': 'values',
              'variant': 'default',
              'values': null
            };
          },
        peg$c202 = { type: "other", description: "Compound Operator" },
        peg$c203 = function(s, a) { return util.compose([s, a]); },
        peg$c204 = function(a) { return a; },
        peg$c205 = { type: "other", description: "Unary Operator" },
        peg$c206 = { type: "other", description: "Binary Operator" },
        peg$c207 = function(o) { return util.key(o); },
        peg$c208 = { type: "other", description: "Or" },
        peg$c209 = { type: "other", description: "Add" },
        peg$c210 = { type: "other", description: "Subtract" },
        peg$c211 = { type: "other", description: "Multiply" },
        peg$c212 = { type: "other", description: "Modulo" },
        peg$c213 = { type: "other", description: "Shift Left" },
        peg$c214 = { type: "other", description: "Shift Right" },
        peg$c215 = { type: "other", description: "Logical AND" },
        peg$c216 = { type: "other", description: "Logical OR" },
        peg$c217 = { type: "other", description: "Less Than" },
        peg$c218 = { type: "other", description: "Greater Than" },
        peg$c219 = { type: "other", description: "Less Than Or Equal" },
        peg$c220 = { type: "other", description: "Greater Than Or Equal" },
        peg$c221 = { type: "other", description: "Equal" },
        peg$c222 = { type: "other", description: "Not Equal" },
        peg$c223 = { type: "other", description: "IS" },
        peg$c224 = { type: "other", description: "Misc Binary Operator" },
        peg$c225 = { type: "other", description: "Database Identifier" },
        peg$c226 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'database',
              'name': n
            };
          },
        peg$c227 = { type: "other", description: "Table Identifier" },
        peg$c228 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'table',
              'name': util.compose([d, n], '')
            };
          },
        peg$c229 = { type: "other", description: "Qualified Table Identifier" },
        peg$c230 = function(n, d) { return util.compose([n, d], ''); },
        peg$c231 = { type: "other", description: "Column Identifier" },
        peg$c232 = function(d, t, n) {
            return {
              'type': 'identifier',
              'variant': 'column',
              'name': util.compose([d, t, n], '')
            };
          },
        peg$c233 = { type: "other", description: "Qualified Column Identifier" },
        peg$c234 = { type: "other", description: "Collation Identifier" },
        peg$c235 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'collation',
              'name': n
            };
          },
        peg$c236 = { type: "other", description: "Savepoint Indentifier" },
        peg$c237 = function(n) {
            return {
              'type': 'identifier',
              'variant': 'savepoint',
              'name': n
            };
          },
        peg$c238 = { type: "other", description: "Index Identifier" },
        peg$c239 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'index',
              'name': util.compose([d, n], '')
            };
          },
        peg$c240 = { type: "other", description: "Trigger Identifier" },
        peg$c241 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'trigger',
              'name': util.compose([d, n], '')
            };
          },
        peg$c242 = { type: "other", description: "View Identifier" },
        peg$c243 = function(d, n) {
            return {
              'type': 'identifier',
              'variant': 'view',
              'name': util.compose([d, n], '')
            };
          },
        peg$c244 = { type: "other", description: "Datatype Name" },
        peg$c245 = function(t) { return [t, 'text']; },
        peg$c246 = function(t) { return [t, 'real']; },
        peg$c247 = function(t) { return [t, 'numeric']; },
        peg$c248 = function(t) { return [t, 'integer']; },
        peg$c249 = function(t) { return [t, 'none']; },
        peg$c250 = { type: "other", description: "TEXT Datatype Name" },
        peg$c251 = "n",
        peg$c252 = { type: "literal", value: "N", description: "\"N\"" },
        peg$c253 = "var",
        peg$c254 = { type: "literal", value: "VAR", description: "\"VAR\"" },
        peg$c255 = "char",
        peg$c256 = { type: "literal", value: "CHAR", description: "\"CHAR\"" },
        peg$c257 = "tiny",
        peg$c258 = { type: "literal", value: "TINY", description: "\"TINY\"" },
        peg$c259 = "medium",
        peg$c260 = { type: "literal", value: "MEDIUM", description: "\"MEDIUM\"" },
        peg$c261 = "long",
        peg$c262 = { type: "literal", value: "LONG", description: "\"LONG\"" },
        peg$c263 = "text",
        peg$c264 = { type: "literal", value: "TEXT", description: "\"TEXT\"" },
        peg$c265 = "clob",
        peg$c266 = { type: "literal", value: "CLOB", description: "\"CLOB\"" },
        peg$c267 = { type: "other", description: "REAL Datatype Name" },
        peg$c268 = "float",
        peg$c269 = { type: "literal", value: "FLOAT", description: "\"FLOAT\"" },
        peg$c270 = "real",
        peg$c271 = { type: "literal", value: "REAL", description: "\"REAL\"" },
        peg$c272 = "double",
        peg$c273 = { type: "literal", value: "DOUBLE", description: "\"DOUBLE\"" },
        peg$c274 = function(d, p) { return util.compose([d, p]); },
        peg$c275 = "precision",
        peg$c276 = { type: "literal", value: "PRECISION", description: "\"PRECISION\"" },
        peg$c277 = function(p) { return p; },
        peg$c278 = { type: "other", description: "NUMERIC Datatype Name" },
        peg$c279 = "numeric",
        peg$c280 = { type: "literal", value: "NUMERIC", description: "\"NUMERIC\"" },
        peg$c281 = "decimal",
        peg$c282 = { type: "literal", value: "DECIMAL", description: "\"DECIMAL\"" },
        peg$c283 = "boolean",
        peg$c284 = { type: "literal", value: "BOOLEAN", description: "\"BOOLEAN\"" },
        peg$c285 = "date",
        peg$c286 = { type: "literal", value: "DATE", description: "\"DATE\"" },
        peg$c287 = "time",
        peg$c288 = { type: "literal", value: "TIME", description: "\"TIME\"" },
        peg$c289 = "stamp",
        peg$c290 = { type: "literal", value: "STAMP", description: "\"STAMP\"" },
        peg$c291 = { type: "other", description: "INTEGER Datatype Name" },
        peg$c292 = "int",
        peg$c293 = { type: "literal", value: "INT", description: "\"INT\"" },
        peg$c294 = "2",
        peg$c295 = { type: "literal", value: "2", description: "\"2\"" },
        peg$c296 = "4",
        peg$c297 = { type: "literal", value: "4", description: "\"4\"" },
        peg$c298 = "8",
        peg$c299 = { type: "literal", value: "8", description: "\"8\"" },
        peg$c300 = "eger",
        peg$c301 = { type: "literal", value: "EGER", description: "\"EGER\"" },
        peg$c302 = "big",
        peg$c303 = { type: "literal", value: "BIG", description: "\"BIG\"" },
        peg$c304 = "small",
        peg$c305 = { type: "literal", value: "SMALL", description: "\"SMALL\"" },
        peg$c306 = { type: "other", description: "BLOB Datatype Name" },
        peg$c307 = "blob",
        peg$c308 = { type: "literal", value: "BLOB", description: "\"BLOB\"" },
        peg$c309 = { type: "other", description: "UPDATE Statement" },
        peg$c310 = function(u, s, f, t, w, o, l) {
            // TODO: Not final syntax!
            return util.extend({
              'type': 'statement',
              'variant': s,
              'into': t,
              'where': w,
              'set': [],
              'order': o,
              'limit': l
            }, u, f);
          },
        peg$c311 = { type: "other", description: "UPDATE" },
        peg$c312 = { type: "other", description: "Update Fallback" },
        peg$c313 = function(t) {
            return {
              'or': util.key(t)
            };
          },
        peg$c314 = { type: "other", description: "Update SET" },
        peg$c315 = function(c) {
            return {
              'set': c
            };
          },
        peg$c316 = function(f, e) {
            return {
              'type': 'assignment',
              'target': f,
              'value': e
            };
          },
        peg$c317 = { type: "other", description: "DELETE Statement" },
        peg$c318 = function(u, s, t, w, o, l) {
            // TODO: Not final syntax!
            return util.extend({
              'type': 'statement',
              'variant': s,
              'from': t,
              'where': w,
              'order': o,
              'limit': l
            }, u);
          },
        peg$c319 = { type: "other", description: "CREATE Statement" },
        peg$c320 = { type: "other", description: "CREATE Table" },
        peg$c321 = function(s, tmp, t, ne, id, r) {
            return util.extend({
              'type': 'statement',
              'variant': util.key(s),
              'format': util.key(t),
              'temporary': util.isOkay(tmp),
              'target': id,
              'condition': util.makeArray(ne),
              'optimization': null,
              'definition': []
            }, r);
          },
        peg$c322 = function(i, n, e) {
            return {
              'type': 'condition',
              'condition': util.key(util.compose([i, n, e]))
            };
          },
        peg$c323 = { type: "other", description: "Table Definition" },
        peg$c324 = function(s, t, r) {
            return {
              'definition': util.compose([s, t], []),
              'optimization': util.makeArray(r)
            };
          },
        peg$c325 = function(r, w) {
            return {
              'type': 'optimization',
              'value': util.key(util.compose([r, w]))
            };
          },
        peg$c326 = function(f) { return f; },
        peg$c327 = { type: "other", description: "Column Definition" },
        peg$c328 = function(n, t, c) {
            return util.extend({
              'type': 'definition',
              'variant': 'column',
              'name': n,
              'definition': (util.isOkay(c) ? c : []),
              'datatype': null
            }, t);
          },
        peg$c329 = { type: "other", description: "Column Datatype" },
        peg$c330 = function(t) {
            return {
              'datatype': t
            };
          },
        peg$c331 = { type: "other", description: "Column Constraint" },
        peg$c332 = function(n, c) {
            return util.extend({
              'name': n
            }, c);
          },
        peg$c333 = function(f) {
            return util.extend({
              'variant': 'foreign key'
            }, f);
          },
        peg$c334 = function(p, d, c, a) {
            return util.extend(p, c, d, a);
          },
        peg$c335 = function(s, k) {
            return {
              'type': 'constraint',
              'variant': util.key(util.compose([s, k])),
              'conflict': null,
              'direction': null,
              'modififer': null,
              'autoIncrement': false
            };
          },
        peg$c336 = function(d) {
            return {
              'direction': util.key(d)
            };
          },
        peg$c337 = function(a) {
            return {
              'autoIncrement': true
            };
          },
        peg$c338 = function(s, c) {
            return util.extend({
              'type': 'constraint',
              'variant': s,
              'conflict': null
            }, c);
          },
        peg$c339 = function(n, l) { return util.compose([n, l]); },
        peg$c340 = function(s, v) {
            return {
              'type': 'constraint',
              'variant': util.key(s),
              'value': v
            };
          },
        peg$c341 = function(v) { return v; },
        peg$c342 = function(c) {
            return {
              'type': 'constraint',
              'variant': 'collate',
              'collate': c
            };
          },
        peg$c343 = { type: "other", description: "Table Constraint" },
        peg$c344 = function(n, c) {
            return util.extend({
              'type': 'definition',
              'variant': 'constraint',
              'name': n,
              'definition': null
            }, c);
          },
        peg$c345 = function(c) {
            return {
              'definition': util.makeArray(c)
            };
          },
        peg$c346 = function(k, c, t) {
            return {
              'definition': util.makeArray(util.extend(k, t)),
              'columns': c
            };
          },
        peg$c347 = function(s) {
            return {
              'type': 'constraint',
              'variant': util.key(s),
              'conflict': null
            };
          },
        peg$c348 = function(p, k) { return util.compose([p, k]); },
        peg$c349 = function(u) { return util.textNode(u); },
        peg$c350 = { type: "other", description: "Indexed Column" },
        peg$c351 = function(e, c, d) {
            // TODO: Not final format
            return {
              'type': 'identifier',
              'variant': 'column',
              'format': 'indexed',
              'direction': d,
              'name': e,
              'collate': c
            };
          },
        peg$c352 = function(o, c, t) {
            return {
              'conflict': util.key(t)
            };
          },
        peg$c353 = function(k, c) {
            return {
              'type': 'constraint',
              'variant': util.key(k),
              'expression': c
            };
          },
        peg$c354 = function(k, l, c) {
            return util.extend({
              'definition': util.makeArray(util.extend(k, c)),
              'columns': null
            }, l);
          },
        peg$c355 = function(f, k) {
            return {
              'type': 'constraint',
              'variant': util.key(util.compose([f, k])),
              'target': null,
              'columns': null,
              'action': null,
              'defer': null
            };
          },
        peg$c356 = function(r, a, d) {
            return util.extend({
              'type': 'constraint',
              'action': a,
              'defer': d
            }, r);
          },
        peg$c357 = function(t, c) {
            // TODO: FORMAT?
            return util.extend({
              'target': t,
              'columns': null
            }, c);
          },
        peg$c358 = function(f, b) { return util.collect([f, b], []); },
        peg$c359 = function(m, a, n) {
            return {
              'type': 'action',
              'variant': util.key(m),
              'action': n
            };
          },
        peg$c360 = function(s, v) { return util.compose([s, v]); },
        peg$c361 = function(c) { return util.textNode(c); },
        peg$c362 = function(n, a) { return util.compose([n, a]); },
        peg$c363 = function(m, n) {
            return {
              'type': 'action',
              'variant': util.key(m),
              'action': n
            };
          },
        peg$c364 = function(n, d, i) { return util.key(util.compose([n, d, i])); },
        peg$c365 = function(i, d) { return util.compose([i, d]); },
        peg$c366 = function(s) {
            return {
              'definition': util.makeArray(s)
            };
          },
        peg$c367 = { type: "other", description: "CREATE Index" },
        peg$c368 = function(s, u, i, ne, n, o, w) {
            return util.extend({
              'type': 'statement',
              'variant': util.key(s),
              'format': util.key(i),
              'target': n,
              'where': w,
              'on': o,
              'condition': util.makeArray(ne),
              'unique': false
            }, u);
          },
        peg$c369 = function(u) {
            return {
              'unique': true
            };
          },
        peg$c370 = function(o, t, c) {
            return {
              'target': t,
              'columns': c
            };
          },
        peg$c371 = { type: "other", description: "CREATE Trigger" },
        peg$c372 = function(s, p, t, ne, n, cd, o, me, wh, a) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'format': util.key(t),
              'when': wh,
              'target': n,
              'on': o,
              'condition': util.makeArray(ne),
              'event': cd,
              'temporary': util.isOkay(p),
              'by': (util.isOkay(me) ? me : 'row'),
              'action': util.makeArray(a)
            };
          },
        peg$c373 = function(m, d) {
            return util.extend({
              'type': 'event',
              'occurs': null
            }, m, d);
          },
        peg$c374 = function(m) {
            return {
              'occurs': util.key(m)
            };
          },
        peg$c375 = function(i, o) { return util.compose([i, o]); },
        peg$c376 = function(o) {
            return {
              'event': util.key(o)
            };
          },
        peg$c377 = function(s, f) {
            return {
              'event': util.key(s),
              'of': f
            };
          },
        peg$c378 = function(s, c) { return c; },
        peg$c379 = "statement",
        peg$c380 = { type: "literal", value: "STATEMENT", description: "\"STATEMENT\"" },
        peg$c381 = function(f, e, r) { return util.key(r); },
        peg$c382 = function(w, e) { return e; },
        peg$c383 = function(s, a, e) { return a; },
        peg$c384 = function(s, c) { return s; },
        peg$c385 = { type: "other", description: "CREATE View" },
        peg$c386 = function(s, p, v, ne, n, r) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'format': util.key(v),
              'condition': util.makeArray(ne),
              'temporary': util.isOkay(p),
              'target': n,
              'result': r
            };
          },
        peg$c387 = { type: "other", description: "CREATE Virtual Table" },
        peg$c388 = function(s, v, t, ne, n, m, a) {
            return {
              'type': 'statement',
              'variant': util.key(s),
              'format': util.key(v),
              'condition': util.makeArray(ne),
              'target': n,
              'result': {
                'type': 'module',
                'name': m,
                'args': (util.isOkay(a) ? a : [])
              }
            };
          },
        peg$c389 = { type: "other", description: "DROP Statement" },
        peg$c390 = function(s, t, i, q) {
            return {
              'type': 'statement',
              'variant': s,
              'format': t,
              'target': q,
              'condition': (util.isOkay(i) ? [i] : [])
            };
          },
        peg$c391 = function(i, e) {
            return {
              'type': 'condition',
              'condition': util.key(util.compose([i, e]))
            };
          },
        peg$c392 = /^[a-z0-9\-_]/i,
        peg$c393 = { type: "class", value: "[a-z0-9\\-\\_]i", description: "[a-z0-9\\-\\_]i" },
        peg$c394 = function(r) { return util.textNode(r); },
        peg$c395 = "]",
        peg$c396 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c397 = /^[^\]]/,
        peg$c398 = { type: "class", value: "[^\\]]", description: "[^\\]]" },
        peg$c399 = "\"",
        peg$c400 = { type: "literal", value: "\"", description: "\"\\\"\"" },
        peg$c401 = function(n) { return util.unescape(util.nodeToString(n), '"'); },
        peg$c402 = "\"\"",
        peg$c403 = { type: "literal", value: "\"\"", description: "\"\\\"\\\"\"" },
        peg$c404 = /^[^"]/,
        peg$c405 = { type: "class", value: "[^\\\"]", description: "[^\\\"]" },
        peg$c406 = "`",
        peg$c407 = { type: "literal", value: "`", description: "\"`\"" },
        peg$c408 = function(n) { return util.unescape(util.nodeToString(n), '`'); },
        peg$c409 = "``",
        peg$c410 = { type: "literal", value: "``", description: "\"``\"" },
        peg$c411 = /^[^`]/,
        peg$c412 = { type: "class", value: "[^\\`]", description: "[^\\`]" },
        peg$c413 = { type: "other", description: "Open Bracket" },
        peg$c414 = "[",
        peg$c415 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c416 = { type: "other", description: "Close Bracket" },
        peg$c417 = { type: "other", description: "Open Parenthesis" },
        peg$c418 = "(",
        peg$c419 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c420 = { type: "other", description: "Close Parenthesis" },
        peg$c421 = ")",
        peg$c422 = { type: "literal", value: ")", description: "\")\"" },
        peg$c423 = { type: "other", description: "Comma" },
        peg$c424 = ",",
        peg$c425 = { type: "literal", value: ",", description: "\",\"" },
        peg$c426 = { type: "other", description: "Period" },
        peg$c427 = ".",
        peg$c428 = { type: "literal", value: ".", description: "\".\"" },
        peg$c429 = { type: "other", description: "Asterisk" },
        peg$c430 = "*",
        peg$c431 = { type: "literal", value: "*", description: "\"*\"" },
        peg$c432 = { type: "other", description: "Question Mark" },
        peg$c433 = "?",
        peg$c434 = { type: "literal", value: "?", description: "\"?\"" },
        peg$c435 = { type: "other", description: "Single Quote" },
        peg$c436 = "'",
        peg$c437 = { type: "literal", value: "'", description: "\"'\"" },
        peg$c438 = { type: "other", description: "Double Quote" },
        peg$c439 = { type: "other", description: "Backtick" },
        peg$c440 = { type: "other", description: "Tilde" },
        peg$c441 = "~",
        peg$c442 = { type: "literal", value: "~", description: "\"~\"" },
        peg$c443 = { type: "other", description: "Plus" },
        peg$c444 = "+",
        peg$c445 = { type: "literal", value: "+", description: "\"+\"" },
        peg$c446 = { type: "other", description: "Minus" },
        peg$c447 = "-",
        peg$c448 = { type: "literal", value: "-", description: "\"-\"" },
        peg$c449 = "=",
        peg$c450 = { type: "literal", value: "=", description: "\"=\"" },
        peg$c451 = { type: "other", description: "Ampersand" },
        peg$c452 = "&",
        peg$c453 = { type: "literal", value: "&", description: "\"&\"" },
        peg$c454 = { type: "other", description: "Pipe" },
        peg$c455 = "|",
        peg$c456 = { type: "literal", value: "|", description: "\"|\"" },
        peg$c457 = "%",
        peg$c458 = { type: "literal", value: "%", description: "\"%\"" },
        peg$c459 = "<",
        peg$c460 = { type: "literal", value: "<", description: "\"<\"" },
        peg$c461 = ">",
        peg$c462 = { type: "literal", value: ">", description: "\">\"" },
        peg$c463 = { type: "other", description: "Exclamation" },
        peg$c464 = "!",
        peg$c465 = { type: "literal", value: "!", description: "\"!\"" },
        peg$c466 = { type: "other", description: "Semicolon" },
        peg$c467 = ";",
        peg$c468 = { type: "literal", value: ";", description: "\";\"" },
        peg$c469 = { type: "other", description: "Colon" },
        peg$c470 = { type: "other", description: "Forward Slash" },
        peg$c471 = "/",
        peg$c472 = { type: "literal", value: "/", description: "\"/\"" },
        peg$c473 = { type: "other", description: "Backslash" },
        peg$c474 = "\\",
        peg$c475 = { type: "literal", value: "\\", description: "\"\\\\\"" },
        peg$c476 = "abort",
        peg$c477 = { type: "literal", value: "ABORT", description: "\"ABORT\"" },
        peg$c478 = "action",
        peg$c479 = { type: "literal", value: "ACTION", description: "\"ACTION\"" },
        peg$c480 = "add",
        peg$c481 = { type: "literal", value: "ADD", description: "\"ADD\"" },
        peg$c482 = "after",
        peg$c483 = { type: "literal", value: "AFTER", description: "\"AFTER\"" },
        peg$c484 = "all",
        peg$c485 = { type: "literal", value: "ALL", description: "\"ALL\"" },
        peg$c486 = "alter",
        peg$c487 = { type: "literal", value: "ALTER", description: "\"ALTER\"" },
        peg$c488 = "analyze",
        peg$c489 = { type: "literal", value: "ANALYZE", description: "\"ANALYZE\"" },
        peg$c490 = "and",
        peg$c491 = { type: "literal", value: "AND", description: "\"AND\"" },
        peg$c492 = "as",
        peg$c493 = { type: "literal", value: "AS", description: "\"AS\"" },
        peg$c494 = "asc",
        peg$c495 = { type: "literal", value: "ASC", description: "\"ASC\"" },
        peg$c496 = "attach",
        peg$c497 = { type: "literal", value: "ATTACH", description: "\"ATTACH\"" },
        peg$c498 = "autoincrement",
        peg$c499 = { type: "literal", value: "AUTOINCREMENT", description: "\"AUTOINCREMENT\"" },
        peg$c500 = "before",
        peg$c501 = { type: "literal", value: "BEFORE", description: "\"BEFORE\"" },
        peg$c502 = "begin",
        peg$c503 = { type: "literal", value: "BEGIN", description: "\"BEGIN\"" },
        peg$c504 = "between",
        peg$c505 = { type: "literal", value: "BETWEEN", description: "\"BETWEEN\"" },
        peg$c506 = "by",
        peg$c507 = { type: "literal", value: "BY", description: "\"BY\"" },
        peg$c508 = "cascade",
        peg$c509 = { type: "literal", value: "CASCADE", description: "\"CASCADE\"" },
        peg$c510 = "case",
        peg$c511 = { type: "literal", value: "CASE", description: "\"CASE\"" },
        peg$c512 = "cast",
        peg$c513 = { type: "literal", value: "CAST", description: "\"CAST\"" },
        peg$c514 = "check",
        peg$c515 = { type: "literal", value: "CHECK", description: "\"CHECK\"" },
        peg$c516 = "collate",
        peg$c517 = { type: "literal", value: "COLLATE", description: "\"COLLATE\"" },
        peg$c518 = "column",
        peg$c519 = { type: "literal", value: "COLUMN", description: "\"COLUMN\"" },
        peg$c520 = "commit",
        peg$c521 = { type: "literal", value: "COMMIT", description: "\"COMMIT\"" },
        peg$c522 = "conflict",
        peg$c523 = { type: "literal", value: "CONFLICT", description: "\"CONFLICT\"" },
        peg$c524 = "constraint",
        peg$c525 = { type: "literal", value: "CONSTRAINT", description: "\"CONSTRAINT\"" },
        peg$c526 = "create",
        peg$c527 = { type: "literal", value: "CREATE", description: "\"CREATE\"" },
        peg$c528 = "cross",
        peg$c529 = { type: "literal", value: "CROSS", description: "\"CROSS\"" },
        peg$c530 = "current_date",
        peg$c531 = { type: "literal", value: "CURRENT_DATE", description: "\"CURRENT_DATE\"" },
        peg$c532 = "current_time",
        peg$c533 = { type: "literal", value: "CURRENT_TIME", description: "\"CURRENT_TIME\"" },
        peg$c534 = "current_timestamp",
        peg$c535 = { type: "literal", value: "CURRENT_TIMESTAMP", description: "\"CURRENT_TIMESTAMP\"" },
        peg$c536 = "database",
        peg$c537 = { type: "literal", value: "DATABASE", description: "\"DATABASE\"" },
        peg$c538 = "default",
        peg$c539 = { type: "literal", value: "DEFAULT", description: "\"DEFAULT\"" },
        peg$c540 = "deferrable",
        peg$c541 = { type: "literal", value: "DEFERRABLE", description: "\"DEFERRABLE\"" },
        peg$c542 = "deferred",
        peg$c543 = { type: "literal", value: "DEFERRED", description: "\"DEFERRED\"" },
        peg$c544 = "delete",
        peg$c545 = { type: "literal", value: "DELETE", description: "\"DELETE\"" },
        peg$c546 = "desc",
        peg$c547 = { type: "literal", value: "DESC", description: "\"DESC\"" },
        peg$c548 = "detach",
        peg$c549 = { type: "literal", value: "DETACH", description: "\"DETACH\"" },
        peg$c550 = "distinct",
        peg$c551 = { type: "literal", value: "DISTINCT", description: "\"DISTINCT\"" },
        peg$c552 = "drop",
        peg$c553 = { type: "literal", value: "DROP", description: "\"DROP\"" },
        peg$c554 = "each",
        peg$c555 = { type: "literal", value: "EACH", description: "\"EACH\"" },
        peg$c556 = "else",
        peg$c557 = { type: "literal", value: "ELSE", description: "\"ELSE\"" },
        peg$c558 = "end",
        peg$c559 = { type: "literal", value: "END", description: "\"END\"" },
        peg$c560 = "escape",
        peg$c561 = { type: "literal", value: "ESCAPE", description: "\"ESCAPE\"" },
        peg$c562 = "except",
        peg$c563 = { type: "literal", value: "EXCEPT", description: "\"EXCEPT\"" },
        peg$c564 = "exclusive",
        peg$c565 = { type: "literal", value: "EXCLUSIVE", description: "\"EXCLUSIVE\"" },
        peg$c566 = "exists",
        peg$c567 = { type: "literal", value: "EXISTS", description: "\"EXISTS\"" },
        peg$c568 = "explain",
        peg$c569 = { type: "literal", value: "EXPLAIN", description: "\"EXPLAIN\"" },
        peg$c570 = "fail",
        peg$c571 = { type: "literal", value: "FAIL", description: "\"FAIL\"" },
        peg$c572 = "for",
        peg$c573 = { type: "literal", value: "FOR", description: "\"FOR\"" },
        peg$c574 = "foreign",
        peg$c575 = { type: "literal", value: "FOREIGN", description: "\"FOREIGN\"" },
        peg$c576 = "from",
        peg$c577 = { type: "literal", value: "FROM", description: "\"FROM\"" },
        peg$c578 = "full",
        peg$c579 = { type: "literal", value: "FULL", description: "\"FULL\"" },
        peg$c580 = "glob",
        peg$c581 = { type: "literal", value: "GLOB", description: "\"GLOB\"" },
        peg$c582 = "group",
        peg$c583 = { type: "literal", value: "GROUP", description: "\"GROUP\"" },
        peg$c584 = "having",
        peg$c585 = { type: "literal", value: "HAVING", description: "\"HAVING\"" },
        peg$c586 = "if",
        peg$c587 = { type: "literal", value: "IF", description: "\"IF\"" },
        peg$c588 = "ignore",
        peg$c589 = { type: "literal", value: "IGNORE", description: "\"IGNORE\"" },
        peg$c590 = "immediate",
        peg$c591 = { type: "literal", value: "IMMEDIATE", description: "\"IMMEDIATE\"" },
        peg$c592 = "in",
        peg$c593 = { type: "literal", value: "IN", description: "\"IN\"" },
        peg$c594 = "index",
        peg$c595 = { type: "literal", value: "INDEX", description: "\"INDEX\"" },
        peg$c596 = "indexed",
        peg$c597 = { type: "literal", value: "INDEXED", description: "\"INDEXED\"" },
        peg$c598 = "initially",
        peg$c599 = { type: "literal", value: "INITIALLY", description: "\"INITIALLY\"" },
        peg$c600 = "inner",
        peg$c601 = { type: "literal", value: "INNER", description: "\"INNER\"" },
        peg$c602 = "insert",
        peg$c603 = { type: "literal", value: "INSERT", description: "\"INSERT\"" },
        peg$c604 = "instead",
        peg$c605 = { type: "literal", value: "INSTEAD", description: "\"INSTEAD\"" },
        peg$c606 = "intersect",
        peg$c607 = { type: "literal", value: "INTERSECT", description: "\"INTERSECT\"" },
        peg$c608 = "into",
        peg$c609 = { type: "literal", value: "INTO", description: "\"INTO\"" },
        peg$c610 = "is",
        peg$c611 = { type: "literal", value: "IS", description: "\"IS\"" },
        peg$c612 = "isnull",
        peg$c613 = { type: "literal", value: "ISNULL", description: "\"ISNULL\"" },
        peg$c614 = "join",
        peg$c615 = { type: "literal", value: "JOIN", description: "\"JOIN\"" },
        peg$c616 = "key",
        peg$c617 = { type: "literal", value: "KEY", description: "\"KEY\"" },
        peg$c618 = "left",
        peg$c619 = { type: "literal", value: "LEFT", description: "\"LEFT\"" },
        peg$c620 = "like",
        peg$c621 = { type: "literal", value: "LIKE", description: "\"LIKE\"" },
        peg$c622 = "limit",
        peg$c623 = { type: "literal", value: "LIMIT", description: "\"LIMIT\"" },
        peg$c624 = "match",
        peg$c625 = { type: "literal", value: "MATCH", description: "\"MATCH\"" },
        peg$c626 = "natural",
        peg$c627 = { type: "literal", value: "NATURAL", description: "\"NATURAL\"" },
        peg$c628 = "no",
        peg$c629 = { type: "literal", value: "NO", description: "\"NO\"" },
        peg$c630 = "not",
        peg$c631 = { type: "literal", value: "NOT", description: "\"NOT\"" },
        peg$c632 = "notnull",
        peg$c633 = { type: "literal", value: "NOTNULL", description: "\"NOTNULL\"" },
        peg$c634 = "null",
        peg$c635 = { type: "literal", value: "NULL", description: "\"NULL\"" },
        peg$c636 = "of",
        peg$c637 = { type: "literal", value: "OF", description: "\"OF\"" },
        peg$c638 = "offset",
        peg$c639 = { type: "literal", value: "OFFSET", description: "\"OFFSET\"" },
        peg$c640 = "on",
        peg$c641 = { type: "literal", value: "ON", description: "\"ON\"" },
        peg$c642 = "or",
        peg$c643 = { type: "literal", value: "OR", description: "\"OR\"" },
        peg$c644 = "order",
        peg$c645 = { type: "literal", value: "ORDER", description: "\"ORDER\"" },
        peg$c646 = "outer",
        peg$c647 = { type: "literal", value: "OUTER", description: "\"OUTER\"" },
        peg$c648 = "plan",
        peg$c649 = { type: "literal", value: "PLAN", description: "\"PLAN\"" },
        peg$c650 = "pragma",
        peg$c651 = { type: "literal", value: "PRAGMA", description: "\"PRAGMA\"" },
        peg$c652 = "primary",
        peg$c653 = { type: "literal", value: "PRIMARY", description: "\"PRIMARY\"" },
        peg$c654 = "query",
        peg$c655 = { type: "literal", value: "QUERY", description: "\"QUERY\"" },
        peg$c656 = "raise",
        peg$c657 = { type: "literal", value: "RAISE", description: "\"RAISE\"" },
        peg$c658 = "recursive",
        peg$c659 = { type: "literal", value: "RECURSIVE", description: "\"RECURSIVE\"" },
        peg$c660 = "references",
        peg$c661 = { type: "literal", value: "REFERENCES", description: "\"REFERENCES\"" },
        peg$c662 = "regexp",
        peg$c663 = { type: "literal", value: "REGEXP", description: "\"REGEXP\"" },
        peg$c664 = "reindex",
        peg$c665 = { type: "literal", value: "REINDEX", description: "\"REINDEX\"" },
        peg$c666 = "release",
        peg$c667 = { type: "literal", value: "RELEASE", description: "\"RELEASE\"" },
        peg$c668 = "rename",
        peg$c669 = { type: "literal", value: "RENAME", description: "\"RENAME\"" },
        peg$c670 = "replace",
        peg$c671 = { type: "literal", value: "REPLACE", description: "\"REPLACE\"" },
        peg$c672 = "restrict",
        peg$c673 = { type: "literal", value: "RESTRICT", description: "\"RESTRICT\"" },
        peg$c674 = "right",
        peg$c675 = { type: "literal", value: "RIGHT", description: "\"RIGHT\"" },
        peg$c676 = "rollback",
        peg$c677 = { type: "literal", value: "ROLLBACK", description: "\"ROLLBACK\"" },
        peg$c678 = "row",
        peg$c679 = { type: "literal", value: "ROW", description: "\"ROW\"" },
        peg$c680 = "rowid",
        peg$c681 = { type: "literal", value: "ROWID", description: "\"ROWID\"" },
        peg$c682 = "savepoint",
        peg$c683 = { type: "literal", value: "SAVEPOINT", description: "\"SAVEPOINT\"" },
        peg$c684 = "select",
        peg$c685 = { type: "literal", value: "SELECT", description: "\"SELECT\"" },
        peg$c686 = "set",
        peg$c687 = { type: "literal", value: "SET", description: "\"SET\"" },
        peg$c688 = "table",
        peg$c689 = { type: "literal", value: "TABLE", description: "\"TABLE\"" },
        peg$c690 = "temp",
        peg$c691 = { type: "literal", value: "TEMP", description: "\"TEMP\"" },
        peg$c692 = "temporary",
        peg$c693 = { type: "literal", value: "TEMPORARY", description: "\"TEMPORARY\"" },
        peg$c694 = "then",
        peg$c695 = { type: "literal", value: "THEN", description: "\"THEN\"" },
        peg$c696 = "to",
        peg$c697 = { type: "literal", value: "TO", description: "\"TO\"" },
        peg$c698 = "transaction",
        peg$c699 = { type: "literal", value: "TRANSACTION", description: "\"TRANSACTION\"" },
        peg$c700 = "trigger",
        peg$c701 = { type: "literal", value: "TRIGGER", description: "\"TRIGGER\"" },
        peg$c702 = "union",
        peg$c703 = { type: "literal", value: "UNION", description: "\"UNION\"" },
        peg$c704 = "unique",
        peg$c705 = { type: "literal", value: "UNIQUE", description: "\"UNIQUE\"" },
        peg$c706 = "update",
        peg$c707 = { type: "literal", value: "UPDATE", description: "\"UPDATE\"" },
        peg$c708 = "using",
        peg$c709 = { type: "literal", value: "USING", description: "\"USING\"" },
        peg$c710 = "vacuum",
        peg$c711 = { type: "literal", value: "VACUUM", description: "\"VACUUM\"" },
        peg$c712 = "values",
        peg$c713 = { type: "literal", value: "VALUES", description: "\"VALUES\"" },
        peg$c714 = "view",
        peg$c715 = { type: "literal", value: "VIEW", description: "\"VIEW\"" },
        peg$c716 = "virtual",
        peg$c717 = { type: "literal", value: "VIRTUAL", description: "\"VIRTUAL\"" },
        peg$c718 = "when",
        peg$c719 = { type: "literal", value: "WHEN", description: "\"WHEN\"" },
        peg$c720 = "where",
        peg$c721 = { type: "literal", value: "WHERE", description: "\"WHERE\"" },
        peg$c722 = "with",
        peg$c723 = { type: "literal", value: "WITH", description: "\"WITH\"" },
        peg$c724 = "without",
        peg$c725 = { type: "literal", value: "WITHOUT", description: "\"WITHOUT\"" },
        peg$c726 = function(r) { return util.key(r); },
        peg$c727 = { type: "other", description: "SQL Line Comment" },
        peg$c728 = { type: "other", description: "SQL Block Comment" },
        peg$c729 = { type: "other", description: "Anything" },
        peg$c730 = { type: "any", description: "any character" },
        peg$c731 = { type: "other", description: "Whitespace" },
        peg$c732 = /^[ \t]/,
        peg$c733 = { type: "class", value: "[ \\t]", description: "[ \\t]" },
        peg$c734 = { type: "other", description: "New Line" },
        peg$c735 = /^[\n\x0B\f\r]/,
        peg$c736 = { type: "class", value: "[\\n\\v\\f\\r]", description: "[\\n\\v\\f\\r]" },
        peg$c737 = "__TODO__",
        peg$c738 = { type: "literal", value: "__TODO__", description: "\"__TODO__\"" },

        peg$currPos          = 0,
        peg$savedPos         = 0,
        peg$posDetailsCache  = [{ line: 1, column: 1, seenCR: false }],
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$descNames = {"start": "", "stmt_list": "", "stmt_list_tail": "", "expression": "Expression", "expression_types": "", "expression_concat": "Logical Expression Group", "expression_wrapped": "Wrapped Expression", "expression_value": "", "expression_unary": "Unary Expression", "expression_cast": "CAST Expression", "type_alias": "Type Alias", "expression_exists": "EXISTS Expression", "expression_exists_ne": "", "expression_case": "CASE Expression", "expression_case_when": "WHEN Clause", "expression_case_else": "ELSE Clause", "expression_raise": "RAISE Expression", "expression_raise_args": "RAISE Expression Arguments", "raise_args_ignore": "", "raise_args_message": "", "expression_node": "", "expression_collate": "COLLATE Expression", "expression_compare": "", "expression_escape": "ESCAPE Expression", "expression_null": "NULL Expression", "expression_null_nodes": "", "null_nodes_types": "", "expression_isnt": "", "expression_is_not": "", "expression_between": "BETWEEN Expression", "expression_in": "IN Expression", "expression_in_target": "", "expression_list_or_select": "", "type_definition": "Type Definition", "type_definition_args": "Type Definition Arguments", "definition_args_loop": "", "literal_value": "", "literal_null": "Null Literal", "literal_date": "Date Literal", "literal_string": "String Literal", "literal_string_single": "Single-quoted String Literal", "literal_string_schar": "", "literal_blob": "Blob Literal", "number_sign": "Number Sign", "literal_number_signed": "", "literal_number": "", "literal_number_decimal": "", "number_decimal_node": "Decimal Literal", "number_decimal_full": "", "number_decimal_fraction": "", "number_decimal_exponent": "", "literal_number_hex": "Hexidecimal Literal", "number_hex": "", "number_digit": "", "bind_parameter": "Bind Parameter", "bind_parameter_numbered": "Numbered Bind Parameter", "bind_parameter_named": "Named Bind Parameter", "bind_parameter_tcl": "TCL Bind Parameter", "bind_parameter_named_suffix": "TCL Bind Parameter Suffix", "operation_binary": "Binary Expression", "binary_loop_concat": "", "expression_list": "Expression List", "expression_list_rest": "", "function_call": "Function Call", "function_call_args": "Function Call Arguments", "call_args_star": "", "call_args_list": "", "error_message": "Error Message", "stmt": "Statement", "stmt_modifier": "QUERY PLAN", "modifier_query": "", "stmt_nodes": "", "stmt_transaction": "Transaction", "stmt_commit": "END Transaction", "stmt_begin": "BEGIN Transaction", "commit_transaction": "", "begin_transaction": "", "stmt_begin_modifier": "", "stmt_rollback": "ROLLBACK Statement", "rollback_savepoint": "SAVEPOINT", "savepoint_alt": "", "stmt_alter": "ALTER TABLE Statement", "alter_start": "", "alter_action": "", "alter_action_rename": "", "alter_action_add": "", "action_add_modifier": "", "stmt_crud": "", "clause_with": "WITH Clause", "clause_with_recursive": "", "clause_with_loop": "", "expression_table": "Table Expression", "select_alias": "", "select_wrapped": "", "stmt_crud_types": "", "stmt_select": "SELECT Statement", "stmt_core_order": "", "stmt_core_limit": "", "stmt_core_limit_offset": "", "limit_offset_variant": "", "limit_offset_variant_name": "", "select_loop": "", "select_loop_union": "", "select_parts": "", "select_parts_core": "", "select_core_select": "", "select_modifier": "", "select_modifier_distinct": "", "select_modifier_all": "", "select_target": "", "select_target_loop": "", "select_core_from": "FROM Clause", "stmt_core_where": "WHERE Clause", "select_core_group": "", "select_core_having": "", "select_node": "", "select_node_star": "", "select_node_star_qualified": "", "select_node_aliased": "", "select_source": "", "select_source_loop": "", "source_loop_tail": "", "table_or_sub": "", "table_qualified": "", "table_qualified_id": "", "table_or_sub_index_node": "", "index_node_indexed": "", "index_node_none": "", "table_or_sub_sub": "", "table_or_sub_select": "", "alias": "Alias", "select_join_loop": "", "select_join_clause": "", "join_operator": "JOIN Operator", "join_operator_natural": "", "join_operator_types": "", "operator_types_hand": "", "types_hand_outer": "", "operator_types_misc": "", "join_condition": "JOIN Condition", "join_condition_on": "", "join_condition_using": "", "join_condition_using_loop": "", "select_parts_values": "", "stmt_core_order_list": "", "stmt_core_order_list_loop": "", "stmt_core_order_list_item": "", "stmt_fallback_types": "", "stmt_insert": "INSERT Statement", "insert_keyword": "", "insert_keyword_ins": "", "insert_keyword_repl": "", "insert_keyword_mod": "", "insert_target": "INTO Clause", "loop_columns": "", "loop_column_tail": "", "loop_name_column": "", "insert_parts": "", "insert_value": "VALUES Clause", "insert_values_list": "", "insert_values_loop": "", "insert_values": "", "insert_default": "DEFAULT VALUES Clause", "operator_compound": "Compound Operator", "compound_union": "", "compound_union_all": "", "operator_unary": "Unary Operator", "operator_binary": "Binary Operator", "binary_concat": "Or", "binary_plus": "Add", "binary_minus": "Subtract", "binary_multiply": "Multiply", "binary_mod": "Modulo", "binary_left": "Shift Left", "binary_right": "Shift Right", "binary_and": "Logical AND", "binary_or": "Logical OR", "binary_lt": "Less Than", "binary_gt": "Greater Than", "binary_lte": "Less Than Or Equal", "binary_gte": "Greater Than Or Equal", "binary_equal": "Equal", "binary_notequal": "Not Equal", "binary_lang": "", "binary_lang_isnt": "IS", "binary_lang_misc": "Misc Binary Operator", "id_database": "Database Identifier", "id_table": "Table Identifier", "id_table_qualified": "Qualified Table Identifier", "id_column": "Column Identifier", "id_column_qualified": "Qualified Column Identifier", "id_collation": "Collation Identifier", "id_savepoint": "Savepoint Indentifier", "id_index": "Index Identifier", "id_trigger": "Trigger Identifier", "id_view": "View Identifier", "datatype_types": "Datatype Name", "datatype_text": "TEXT Datatype Name", "datatype_real": "REAL Datatype Name", "datatype_real_double": "", "real_double_precision": "", "datatype_numeric": "NUMERIC Datatype Name", "datatype_integer": "INTEGER Datatype Name", "datatype_none": "BLOB Datatype Name", "stmt_update": "UPDATE Statement", "update_start": "UPDATE", "update_fallback": "Update Fallback", "update_set": "Update SET", "update_columns": "", "update_columns_tail": "", "update_column": "", "stmt_delete": "DELETE Statement", "delete_start": "", "stmt_create": "CREATE Statement", "create_table": "CREATE Table", "create_core_tmp": "", "create_core_ine": "", "create_table_source": "", "table_source_def": "Table Definition", "source_def_rowid": "", "source_def_loop": "", "source_def_tail": "", "source_tbl_loop": "", "source_def_column": "Column Definition", "column_type": "Column Datatype", "column_constraints": "", "column_constraint_tail": "", "column_constraint": "Column Constraint", "column_constraint_name": "", "column_constraint_types": "", "column_constraint_foreign": "", "column_constraint_primary": "", "col_primary_start": "", "col_primary_dir": "", "col_primary_auto": "", "column_constraint_null": "", "constraint_null_types": "", "constraint_null_value": "", "column_constraint_default": "", "col_default_val": "", "column_constraint_collate": "", "table_constraint": "Table Constraint", "table_constraint_name": "", "table_constraint_types": "", "table_constraint_check": "", "table_constraint_primary": "", "primary_start": "", "primary_start_normal": "", "primary_start_unique": "", "primary_columns": "", "primary_column": "Indexed Column", "column_collate": "", "primary_column_dir": "", "primary_column_tail": "", "primary_conflict": "", "constraint_check": "", "table_constraint_foreign": "", "foreign_start": "", "foreign_clause": "", "foreign_references": "", "foreign_actions": "", "foreign_actions_tail": "", "foreign_action": "", "foreign_action_on": "", "action_on_action": "", "on_action_set": "", "on_action_cascade": "", "on_action_none": "", "foreign_action_match": "", "foreign_deferrable": "", "deferrable_initially": "", "table_source_select": "", "create_index": "CREATE Index", "index_unique": "", "index_on": "", "create_trigger": "CREATE Trigger", "trigger_conditions": "", "trigger_apply_mods": "", "trigger_apply_instead": "", "trigger_do": "", "trigger_do_on": "", "trigger_do_update": "", "do_update_of": "", "do_update_columns": "", "trigger_foreach": "", "trigger_when": "", "trigger_action": "", "action_loop": "", "action_loop_stmt": "", "create_view": "CREATE View", "create_as_select": "", "create_virtual": "CREATE Virtual Table", "virtual_args": "", "virtual_arg_types": "", "stmt_drop": "DROP Statement", "drop_start": "", "drop_types": "", "drop_ie": "", "name_char": "", "name": "", "reserved_nodes": "", "name_unquoted": "", "name_bracketed": "", "name_bracketed_schar": "", "name_dblquoted": "", "name_dblquoted_schar": "", "name_backticked": "", "name_backticked_schar": "", "sym_bopen": "Open Bracket", "sym_bclose": "Close Bracket", "sym_popen": "Open Parenthesis", "sym_pclose": "Close Parenthesis", "sym_comma": "Comma", "sym_dot": "Period", "sym_star": "Asterisk", "sym_quest": "Question Mark", "sym_sglquote": "Single Quote", "sym_dblquote": "Double Quote", "sym_backtick": "Backtick", "sym_tilde": "Tilde", "sym_plus": "Plus", "sym_minus": "Minus", "sym_equal": "Equal", "sym_amp": "Ampersand", "sym_pipe": "Pipe", "sym_mod": "Modulo", "sym_lt": "Less Than", "sym_gt": "Greater Than", "sym_excl": "Exclamation", "sym_semi": "Semicolon", "sym_colon": "Colon", "sym_fslash": "Forward Slash", "sym_bslash": "Backslash", "ABORT": "", "ACTION": "", "ADD": "", "AFTER": "", "ALL": "", "ALTER": "", "ANALYZE": "", "AND": "", "AS": "", "ASC": "", "ATTACH": "", "AUTOINCREMENT": "", "BEFORE": "", "BEGIN": "", "BETWEEN": "", "BY": "", "CASCADE": "", "CASE": "", "CAST": "", "CHECK": "", "COLLATE": "", "COLUMN": "", "COMMIT": "", "CONFLICT": "", "CONSTRAINT": "", "CREATE": "", "CROSS": "", "CURRENT_DATE": "", "CURRENT_TIME": "", "CURRENT_TIMESTAMP": "", "DATABASE": "", "DEFAULT": "", "DEFERRABLE": "", "DEFERRED": "", "DELETE": "", "DESC": "", "DETACH": "", "DISTINCT": "", "DROP": "", "EACH": "", "ELSE": "", "END": "", "ESCAPE": "", "EXCEPT": "", "EXCLUSIVE": "", "EXISTS": "", "EXPLAIN": "", "FAIL": "", "FOR": "", "FOREIGN": "", "FROM": "", "FULL": "", "GLOB": "", "GROUP": "", "HAVING": "", "IF": "", "IGNORE": "", "IMMEDIATE": "", "IN": "", "INDEX": "", "INDEXED": "", "INITIALLY": "", "INNER": "", "INSERT": "", "INSTEAD": "", "INTERSECT": "", "INTO": "", "IS": "", "ISNULL": "", "JOIN": "", "KEY": "", "LEFT": "", "LIKE": "", "LIMIT": "", "MATCH": "", "NATURAL": "", "NO": "", "NOT": "", "NOTNULL": "", "NULL": "", "OF": "", "OFFSET": "", "ON": "", "OR": "", "ORDER": "", "OUTER": "", "PLAN": "", "PRAGMA": "", "PRIMARY": "", "QUERY": "", "RAISE": "", "RECURSIVE": "", "REFERENCES": "", "REGEXP": "", "REINDEX": "", "RELEASE": "", "RENAME": "", "REPLACE": "", "RESTRICT": "", "RIGHT": "", "ROLLBACK": "", "ROW": "", "ROWID": "", "SAVEPOINT": "", "SELECT": "", "SET": "", "TABLE": "", "TEMP": "", "TEMPORARY": "", "THEN": "", "TO": "", "TRANSACTION": "", "TRIGGER": "", "UNION": "", "UNIQUE": "", "UPDATE": "", "USING": "", "VACUUM": "", "VALUES": "", "VIEW": "", "VIRTUAL": "", "WHEN": "", "WHERE": "", "WITH": "", "WITHOUT": "", "reserved_words": "", "reserved_word_list": "", "comment": "", "comment_line": "SQL Line Comment", "comment_block": "SQL Block Comment", "comment_block_start": "", "comment_block_end": "", "comment_block_body": "", "block_body_nodes": "", "comment_block_feed": "", "match_all": "Anything", "o": "", "e": "", "whitespace_nodes": "", "whitespace": "", "whitespace_space": "Whitespace", "whitespace_line": "New Line", "_TODO_": ""},

        peg$tracer = "tracer" in options ? options.tracer : new peg$DefaultTracer(),

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }

    function location() {
      return peg$computeLocation(peg$savedPos, peg$currPos);
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function error(message) {
      throw peg$buildException(
        message,
        null,
        input.substring(peg$savedPos, peg$currPos),
        peg$computeLocation(peg$savedPos, peg$currPos)
      );
    }

    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos],
          p, ch;

      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }

        details = peg$posDetailsCache[p];
        details = {
          line:   details.line,
          column: details.column,
          seenCR: details.seenCR
        };

        while (p < pos) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }

          p++;
        }

        peg$posDetailsCache[pos] = details;
        return details;
      }
    }

    function peg$computeLocation(startPos, endPos) {
      var startPosDetails = peg$computePosDetails(startPos),
          endPosDetails   = peg$computePosDetails(endPos);

      return {
        start: {
          offset: startPos,
          line:   startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line:   endPosDetails.line,
          column: endPosDetails.column
        }
      };
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, found, location) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0100-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1000-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new peg$SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        location
      );
    }

    function peg$parsestart() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "start",
        description: peg$descNames["start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_list();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c0(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "start",
        description: peg$descNames["start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "start",
        description: peg$descNames["start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_list() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_list",
        description: peg$descNames["stmt_list"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsestmt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsestmt_list_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsestmt_list_tail();
          }
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parsesym_semi();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parsesym_semi();
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c1(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_list",
        description: peg$descNames["stmt_list"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_list",
        description: peg$descNames["stmt_list"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_list_tail() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_list_tail",
        description: peg$descNames["stmt_list_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsesym_semi();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsesym_semi();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_list_tail",
        description: peg$descNames["stmt_list_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_list_tail",
        description: peg$descNames["stmt_list_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression",
        description: peg$descNames["expression"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_concat();
      if (s1 === peg$FAILED) {
        s1 = peg$parseexpression_types();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c3); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression",
        description: peg$descNames["expression"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression",
        description: peg$descNames["expression"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_types() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_types",
        description: peg$descNames["expression_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseexpression_wrapped();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_unary();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_node();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_value();
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_types",
        description: peg$descNames["expression_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_types",
        description: peg$descNames["expression_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_concat() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_concat",
        description: peg$descNames["expression_concat"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsebinary_loop_concat();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c6(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c5); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_concat",
        description: peg$descNames["expression_concat"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_concat",
        description: peg$descNames["expression_concat"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_wrapped() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_wrapped",
        description: peg$descNames["expression_wrapped"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c7); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_wrapped",
        description: peg$descNames["expression_wrapped"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_wrapped",
        description: peg$descNames["expression_wrapped"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_value() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_value",
        description: peg$descNames["expression_value"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseexpression_cast();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_exists();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_case();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_raise();
            if (s0 === peg$FAILED) {
              s0 = peg$parsebind_parameter();
              if (s0 === peg$FAILED) {
                s0 = peg$parsefunction_call();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseliteral_value();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseid_column();
                  }
                }
              }
            }
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_value",
        description: peg$descNames["expression_value"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_value",
        description: peg$descNames["expression_value"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_unary() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_unary",
        description: peg$descNames["expression_unary"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseoperator_unary();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c10(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c9); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_unary",
        description: peg$descNames["expression_unary"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_unary",
        description: peg$descNames["expression_unary"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_cast() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_cast",
        description: peg$descNames["expression_cast"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCAST();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_popen();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexpression();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsetype_alias();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsesym_pclose();
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c12(s1, s4, s6);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c11); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_cast",
        description: peg$descNames["expression_cast"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_cast",
        description: peg$descNames["expression_cast"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetype_alias() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "type_alias",
        description: peg$descNames["type_alias"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetype_definition();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c14(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c13); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "type_alias",
        description: peg$descNames["type_alias"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "type_alias",
        description: peg$descNames["type_alias"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_exists() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_exists",
        description: peg$descNames["expression_exists"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_exists_ne();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c16(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c15); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_exists",
        description: peg$descNames["expression_exists"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_exists",
        description: peg$descNames["expression_exists"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_exists_ne() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_exists_ne",
        description: peg$descNames["expression_exists_ne"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseEXISTS();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c17(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_exists_ne",
        description: peg$descNames["expression_exists_ne"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_exists_ne",
        description: peg$descNames["expression_exists_ne"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_case() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_case",
        description: peg$descNames["expression_case"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCASE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parseexpression_case_when();
              if (s6 !== peg$FAILED) {
                while (s6 !== peg$FAILED) {
                  s5.push(s6);
                  s6 = peg$parseexpression_case_when();
                }
              } else {
                s5 = peg$FAILED;
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseexpression_case_else();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseEND();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseo();
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c19(s1, s3, s5, s7);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c18); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_case",
        description: peg$descNames["expression_case"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_case",
        description: peg$descNames["expression_case"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_case_when() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_case_when",
        description: peg$descNames["expression_case_when"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHEN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseTHEN();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsee();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseexpression();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c21(s1, s3, s7);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c20); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_case_when",
        description: peg$descNames["expression_case_when"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_case_when",
        description: peg$descNames["expression_case_when"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_case_else() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_case_else",
        description: peg$descNames["expression_case_else"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseELSE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c23(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c22); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_case_else",
        description: peg$descNames["expression_case_else"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_case_else",
        description: peg$descNames["expression_case_else"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_raise() {
      var s0, s1, s2, s3, s4, s5, s6, s7,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_raise",
        description: peg$descNames["expression_raise"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseRAISE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_popen();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_raise_args();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsesym_pclose();
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c25(s1, s5);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c24); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_raise",
        description: peg$descNames["expression_raise"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_raise",
        description: peg$descNames["expression_raise"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_raise_args() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_raise_args",
        description: peg$descNames["expression_raise_args"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseraise_args_ignore();
      if (s1 === peg$FAILED) {
        s1 = peg$parseraise_args_message();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c27(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c26); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_raise_args",
        description: peg$descNames["expression_raise_args"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_raise_args",
        description: peg$descNames["expression_raise_args"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseraise_args_ignore() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "raise_args_ignore",
        description: peg$descNames["raise_args_ignore"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseIGNORE();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c28(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "raise_args_ignore",
        description: peg$descNames["raise_args_ignore"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "raise_args_ignore",
        description: peg$descNames["raise_args_ignore"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseraise_args_message() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "raise_args_message",
        description: peg$descNames["raise_args_message"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseROLLBACK();
      if (s1 === peg$FAILED) {
        s1 = peg$parseABORT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseFAIL();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_comma();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseerror_message();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c29(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "raise_args_message",
        description: peg$descNames["raise_args_message"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "raise_args_message",
        description: peg$descNames["raise_args_message"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_node() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_node",
        description: peg$descNames["expression_node"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseexpression_collate();
      if (s0 === peg$FAILED) {
        s0 = peg$parseexpression_compare();
        if (s0 === peg$FAILED) {
          s0 = peg$parseexpression_null();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_between();
            if (s0 === peg$FAILED) {
              s0 = peg$parseexpression_in();
              if (s0 === peg$FAILED) {
                s0 = peg$parsestmt_select();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseoperation_binary();
                }
              }
            }
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_node",
        description: peg$descNames["expression_node"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_node",
        description: peg$descNames["expression_node"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_collate() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_collate",
        description: peg$descNames["expression_collate"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCOLLATE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsename_unquoted();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c31(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c30); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_collate",
        description: peg$descNames["expression_collate"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_collate",
        description: peg$descNames["expression_collate"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_compare() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_compare",
        description: peg$descNames["expression_compare"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseLIKE();
            if (s4 === peg$FAILED) {
              s4 = peg$parseGLOB();
              if (s4 === peg$FAILED) {
                s4 = peg$parseREGEXP();
                if (s4 === peg$FAILED) {
                  s4 = peg$parseMATCH();
                }
              }
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseexpression_escape();
                    if (s8 === peg$FAILED) {
                      s8 = null;
                    }
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c32(s1, s3, s4, s6, s8);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_compare",
        description: peg$descNames["expression_compare"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_compare",
        description: peg$descNames["expression_compare"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_escape() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_escape",
        description: peg$descNames["expression_escape"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseESCAPE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c34(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c33); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_escape",
        description: peg$descNames["expression_escape"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_escape",
        description: peg$descNames["expression_escape"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_null() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_null",
        description: peg$descNames["expression_null"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_null_nodes();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c36(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c35); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_null",
        description: peg$descNames["expression_null"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_null",
        description: peg$descNames["expression_null"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_null_nodes() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_null_nodes",
        description: peg$descNames["expression_null_nodes"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsenull_nodes_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseNULL();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsee();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c37(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_null_nodes",
        description: peg$descNames["expression_null_nodes"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_null_nodes",
        description: peg$descNames["expression_null_nodes"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenull_nodes_types() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "null_nodes_types",
        description: peg$descNames["null_nodes_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        s2 = peg$parseNOT();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c38(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "null_nodes_types",
        description: peg$descNames["null_nodes_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "null_nodes_types",
        description: peg$descNames["null_nodes_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_isnt() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_isnt",
        description: peg$descNames["expression_isnt"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c39(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_isnt",
        description: peg$descNames["expression_isnt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_isnt",
        description: peg$descNames["expression_isnt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_is_not() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_is_not",
        description: peg$descNames["expression_is_not"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseNOT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c40(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_is_not",
        description: peg$descNames["expression_is_not"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_is_not",
        description: peg$descNames["expression_is_not"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_between() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_between",
        description: peg$descNames["expression_between"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseBETWEEN();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseo();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseAND();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsee();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseexpression();
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c42(s1, s3, s4, s6, s8, s10);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c41); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_between",
        description: peg$descNames["expression_between"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_between",
        description: peg$descNames["expression_between"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_in() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_in",
        description: peg$descNames["expression_in"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseIN();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseexpression_in_target();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c44(s1, s3, s4, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c43); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_in",
        description: peg$descNames["expression_in"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_in",
        description: peg$descNames["expression_in"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_in_target() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_in_target",
        description: peg$descNames["expression_in_target"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseexpression_list_or_select();
      if (s0 === peg$FAILED) {
        s0 = peg$parseid_table();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_in_target",
        description: peg$descNames["expression_in_target"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_in_target",
        description: peg$descNames["expression_in_target"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_list_or_select() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_list_or_select",
        description: peg$descNames["expression_list_or_select"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_select();
        if (s2 === peg$FAILED) {
          s2 = peg$parseexpression_list();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c45(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_list_or_select",
        description: peg$descNames["expression_list_or_select"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_list_or_select",
        description: peg$descNames["expression_list_or_select"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetype_definition() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "type_definition",
        description: peg$descNames["type_definition"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetype_definition_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c47(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c46); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "type_definition",
        description: peg$descNames["type_definition"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "type_definition",
        description: peg$descNames["type_definition"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetype_definition_args() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "type_definition_args",
        description: peg$descNames["type_definition_args"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_number_signed();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsedefinition_args_loop();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c49(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c48); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "type_definition_args",
        description: peg$descNames["type_definition_args"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "type_definition_args",
        description: peg$descNames["type_definition_args"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedefinition_args_loop() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "definition_args_loop",
        description: peg$descNames["definition_args_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseliteral_number_signed();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "definition_args_loop",
        description: peg$descNames["definition_args_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "definition_args_loop",
        description: peg$descNames["definition_args_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_value() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_value",
        description: peg$descNames["literal_value"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseliteral_number();
      if (s0 === peg$FAILED) {
        s0 = peg$parseliteral_string();
        if (s0 === peg$FAILED) {
          s0 = peg$parseliteral_blob();
          if (s0 === peg$FAILED) {
            s0 = peg$parseliteral_null();
            if (s0 === peg$FAILED) {
              s0 = peg$parseliteral_date();
            }
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_value",
        description: peg$descNames["literal_value"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_value",
        description: peg$descNames["literal_value"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_null() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_null",
        description: peg$descNames["literal_null"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseNULL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c51(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c50); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_null",
        description: peg$descNames["literal_null"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_null",
        description: peg$descNames["literal_null"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_date() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_date",
        description: peg$descNames["literal_date"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCURRENT_DATE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseCURRENT_TIMESTAMP();
        if (s1 === peg$FAILED) {
          s1 = peg$parseCURRENT_TIME();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c53(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c52); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_date",
        description: peg$descNames["literal_date"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_date",
        description: peg$descNames["literal_date"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_string() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_string",
        description: peg$descNames["literal_string"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseliteral_string_single();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c55(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c54); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_string",
        description: peg$descNames["literal_string"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_string",
        description: peg$descNames["literal_string"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_string_single() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_string_single",
        description: peg$descNames["literal_string_single"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_sglquote();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseliteral_string_schar();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseliteral_string_schar();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_sglquote();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c57(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c56); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_string_single",
        description: peg$descNames["literal_string_single"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_string_single",
        description: peg$descNames["literal_string_single"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_string_schar() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_string_schar",
        description: peg$descNames["literal_string_schar"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2) === peg$c58) {
        s0 = peg$c58;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c59); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c60.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c61); }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_string_schar",
        description: peg$descNames["literal_string_schar"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_string_schar",
        description: peg$descNames["literal_string_schar"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_blob() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_blob",
        description: peg$descNames["literal_blob"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c63.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c64); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_string_single();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c65(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c62); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_blob",
        description: peg$descNames["literal_blob"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_blob",
        description: peg$descNames["literal_blob"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenumber_sign() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "number_sign",
        description: peg$descNames["number_sign"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_plus();
      if (s1 === peg$FAILED) {
        s1 = peg$parsesym_minus();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c67(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c66); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "number_sign",
        description: peg$descNames["number_sign"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "number_sign",
        description: peg$descNames["number_sign"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_number_signed() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_number_signed",
        description: peg$descNames["literal_number_signed"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsenumber_sign();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseliteral_number();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c68(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_number_signed",
        description: peg$descNames["literal_number_signed"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_number_signed",
        description: peg$descNames["literal_number_signed"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_number() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_number",
        description: peg$descNames["literal_number"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseliteral_number_decimal();
      if (s0 === peg$FAILED) {
        s0 = peg$parseliteral_number_hex();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_number",
        description: peg$descNames["literal_number"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_number",
        description: peg$descNames["literal_number"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_number_decimal() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_number_decimal",
        description: peg$descNames["literal_number_decimal"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsenumber_decimal_node();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenumber_decimal_exponent();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c69(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_number_decimal",
        description: peg$descNames["literal_number_decimal"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_number_decimal",
        description: peg$descNames["literal_number_decimal"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenumber_decimal_node() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "number_decimal_node",
        description: peg$descNames["number_decimal_node"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsenumber_decimal_full();
      if (s0 === peg$FAILED) {
        s0 = peg$parsenumber_decimal_fraction();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c70); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "number_decimal_node",
        description: peg$descNames["number_decimal_node"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "number_decimal_node",
        description: peg$descNames["number_decimal_node"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenumber_decimal_full() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "number_decimal_full",
        description: peg$descNames["number_decimal_full"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsenumber_digit();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsenumber_digit();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsenumber_decimal_fraction();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c71(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "number_decimal_full",
        description: peg$descNames["number_decimal_full"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "number_decimal_full",
        description: peg$descNames["number_decimal_full"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenumber_decimal_fraction() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "number_decimal_fraction",
        description: peg$descNames["number_decimal_fraction"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_dot();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenumber_digit();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsenumber_digit();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c72(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "number_decimal_fraction",
        description: peg$descNames["number_decimal_fraction"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "number_decimal_fraction",
        description: peg$descNames["number_decimal_fraction"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenumber_decimal_exponent() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "number_decimal_exponent",
        description: peg$descNames["number_decimal_exponent"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 1).toLowerCase() === peg$c73) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c74); }
      }
      if (s1 !== peg$FAILED) {
        if (peg$c75.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c76); }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsenumber_digit();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parsenumber_digit();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c77(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "number_decimal_exponent",
        description: peg$descNames["number_decimal_exponent"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "number_decimal_exponent",
        description: peg$descNames["number_decimal_exponent"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseliteral_number_hex() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "literal_number_hex",
        description: peg$descNames["literal_number_hex"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c79) {
        s1 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c80); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsenumber_hex();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsenumber_hex();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c81(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c78); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "literal_number_hex",
        description: peg$descNames["literal_number_hex"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "literal_number_hex",
        description: peg$descNames["literal_number_hex"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenumber_hex() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "number_hex",
        description: peg$descNames["number_hex"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (peg$c82.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c83); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "number_hex",
        description: peg$descNames["number_hex"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "number_hex",
        description: peg$descNames["number_hex"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsenumber_digit() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "number_digit",
        description: peg$descNames["number_digit"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (peg$c84.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c85); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "number_digit",
        description: peg$descNames["number_digit"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "number_digit",
        description: peg$descNames["number_digit"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebind_parameter() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "bind_parameter",
        description: peg$descNames["bind_parameter"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsebind_parameter_numbered();
      if (s0 === peg$FAILED) {
        s0 = peg$parsebind_parameter_named();
        if (s0 === peg$FAILED) {
          s0 = peg$parsebind_parameter_tcl();
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c86); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "bind_parameter",
        description: peg$descNames["bind_parameter"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "bind_parameter",
        description: peg$descNames["bind_parameter"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebind_parameter_numbered() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "bind_parameter_numbered",
        description: peg$descNames["bind_parameter_numbered"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_quest();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        if (peg$c88.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c89); }
        }
        if (s3 !== peg$FAILED) {
          s4 = [];
          if (peg$c84.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c85); }
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            if (peg$c84.test(input.charAt(peg$currPos))) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c85); }
            }
          }
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c90(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c87); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "bind_parameter_numbered",
        description: peg$descNames["bind_parameter_numbered"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "bind_parameter_numbered",
        description: peg$descNames["bind_parameter_numbered"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebind_parameter_named() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "bind_parameter_named",
        description: peg$descNames["bind_parameter_named"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (peg$c92.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c93); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c94(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c91); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "bind_parameter_named",
        description: peg$descNames["bind_parameter_named"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "bind_parameter_named",
        description: peg$descNames["bind_parameter_named"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebind_parameter_tcl() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "bind_parameter_tcl",
        description: peg$descNames["bind_parameter_tcl"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 36) {
        s1 = peg$c96;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c97); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s3 = peg$c98;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c99); }
          }
        }
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
            if (s3 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 58) {
                s3 = peg$c98;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c99); }
              }
            }
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsebind_parameter_named_suffix();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c100(s1, s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c95); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "bind_parameter_tcl",
        description: peg$descNames["bind_parameter_tcl"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "bind_parameter_tcl",
        description: peg$descNames["bind_parameter_tcl"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebind_parameter_named_suffix() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "bind_parameter_named_suffix",
        description: peg$descNames["bind_parameter_named_suffix"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_dblquote();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parsesym_dblquote();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = void 0;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parsematch_all();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parsesym_dblquote();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = void 0;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            s5 = peg$parsematch_all();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_dblquote();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c102(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c101); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "bind_parameter_named_suffix",
        description: peg$descNames["bind_parameter_named_suffix"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "bind_parameter_named_suffix",
        description: peg$descNames["bind_parameter_named_suffix"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseoperation_binary() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "operation_binary",
        description: peg$descNames["operation_binary"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression_value();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseoperator_binary();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_types();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c104(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c103); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "operation_binary",
        description: peg$descNames["operation_binary"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "operation_binary",
        description: peg$descNames["operation_binary"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_loop_concat() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_loop_concat",
        description: peg$descNames["binary_loop_concat"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseAND();
      if (s1 === peg$FAILED) {
        s1 = peg$parseOR();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c105(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_loop_concat",
        description: peg$descNames["binary_loop_concat"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_loop_concat",
        description: peg$descNames["binary_loop_concat"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_list() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_list",
        description: peg$descNames["expression_list"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseexpression_list_rest();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseexpression_list_rest();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c107(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c106); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_list",
        description: peg$descNames["expression_list"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_list",
        description: peg$descNames["expression_list"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_list_rest() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_list_rest",
        description: peg$descNames["expression_list_rest"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c45(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_list_rest",
        description: peg$descNames["expression_list_rest"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_list_rest",
        description: peg$descNames["expression_list_rest"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsefunction_call() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "function_call",
        description: peg$descNames["function_call"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_popen();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefunction_call_args();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c109(s1, s3);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c108); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "function_call",
        description: peg$descNames["function_call"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "function_call",
        description: peg$descNames["function_call"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsefunction_call_args() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "function_call_args",
        description: peg$descNames["function_call_args"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsecall_args_star();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecall_args_list();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c110); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "function_call_args",
        description: peg$descNames["function_call_args"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "function_call_args",
        description: peg$descNames["function_call_args"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecall_args_star() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "call_args_star",
        description: peg$descNames["call_args_star"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_star();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c111(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "call_args_star",
        description: peg$descNames["call_args_star"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "call_args_star",
        description: peg$descNames["call_args_star"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecall_args_list() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "call_args_list",
        description: peg$descNames["call_args_list"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseDISTINCT();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsee();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_list();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c112(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "call_args_list",
        description: peg$descNames["call_args_list"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "call_args_list",
        description: peg$descNames["call_args_list"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseerror_message() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "error_message",
        description: peg$descNames["error_message"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseliteral_string();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c114(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c113); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "error_message",
        description: peg$descNames["error_message"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "error_message",
        description: peg$descNames["error_message"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt",
        description: peg$descNames["stmt"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsestmt_modifier();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_nodes();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c116(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c115); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt",
        description: peg$descNames["stmt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt",
        description: peg$descNames["stmt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_modifier() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_modifier",
        description: peg$descNames["stmt_modifier"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseEXPLAIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsemodifier_query();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c118(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c117); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_modifier",
        description: peg$descNames["stmt_modifier"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_modifier",
        description: peg$descNames["stmt_modifier"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsemodifier_query() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "modifier_query",
        description: peg$descNames["modifier_query"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseQUERY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsePLAN();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c119(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "modifier_query",
        description: peg$descNames["modifier_query"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "modifier_query",
        description: peg$descNames["modifier_query"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_nodes() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_nodes",
        description: peg$descNames["stmt_nodes"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsestmt_crud();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_create();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_drop();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_transaction();
            if (s0 === peg$FAILED) {
              s0 = peg$parsestmt_alter();
              if (s0 === peg$FAILED) {
                s0 = peg$parsestmt_rollback();
              }
            }
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_nodes",
        description: peg$descNames["stmt_nodes"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_nodes",
        description: peg$descNames["stmt_nodes"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_transaction() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_transaction",
        description: peg$descNames["stmt_transaction"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsestmt_begin();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_list();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_commit();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c121(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c120); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_transaction",
        description: peg$descNames["stmt_transaction"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_transaction",
        description: peg$descNames["stmt_transaction"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_commit() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_commit",
        description: peg$descNames["stmt_commit"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCOMMIT();
      if (s1 === peg$FAILED) {
        s1 = peg$parseEND();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecommit_transaction();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c123(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c122); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_commit",
        description: peg$descNames["stmt_commit"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_commit",
        description: peg$descNames["stmt_commit"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_begin() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_begin",
        description: peg$descNames["stmt_begin"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseBEGIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_begin_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsebegin_transaction();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c125(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c124); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_begin",
        description: peg$descNames["stmt_begin"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_begin",
        description: peg$descNames["stmt_begin"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecommit_transaction() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "commit_transaction",
        description: peg$descNames["commit_transaction"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseTRANSACTION();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "commit_transaction",
        description: peg$descNames["commit_transaction"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "commit_transaction",
        description: peg$descNames["commit_transaction"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebegin_transaction() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "begin_transaction",
        description: peg$descNames["begin_transaction"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseTRANSACTION();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c4(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "begin_transaction",
        description: peg$descNames["begin_transaction"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "begin_transaction",
        description: peg$descNames["begin_transaction"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_begin_modifier() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_begin_modifier",
        description: peg$descNames["stmt_begin_modifier"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseDEFERRED();
      if (s1 === peg$FAILED) {
        s1 = peg$parseIMMEDIATE();
        if (s1 === peg$FAILED) {
          s1 = peg$parseEXCLUSIVE();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c126(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_begin_modifier",
        description: peg$descNames["stmt_begin_modifier"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_begin_modifier",
        description: peg$descNames["stmt_begin_modifier"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_rollback() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_rollback",
        description: peg$descNames["stmt_rollback"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseROLLBACK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsebegin_transaction();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parserollback_savepoint();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c128(s1, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c127); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_rollback",
        description: peg$descNames["stmt_rollback"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_rollback",
        description: peg$descNames["stmt_rollback"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parserollback_savepoint() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "rollback_savepoint",
        description: peg$descNames["rollback_savepoint"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseTO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesavepoint_alt();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_savepoint();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c8(s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c129); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "rollback_savepoint",
        description: peg$descNames["rollback_savepoint"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "rollback_savepoint",
        description: peg$descNames["rollback_savepoint"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesavepoint_alt() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "savepoint_alt",
        description: peg$descNames["savepoint_alt"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseSAVEPOINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c130(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "savepoint_alt",
        description: peg$descNames["savepoint_alt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "savepoint_alt",
        description: peg$descNames["savepoint_alt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_alter() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_alter",
        description: peg$descNames["stmt_alter"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsealter_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_table();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsealter_action();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c132(s1, s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c131); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_alter",
        description: peg$descNames["stmt_alter"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_alter",
        description: peg$descNames["stmt_alter"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsealter_start() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "alter_start",
        description: peg$descNames["alter_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseALTER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTABLE();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c133(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "alter_start",
        description: peg$descNames["alter_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "alter_start",
        description: peg$descNames["alter_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsealter_action() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "alter_action",
        description: peg$descNames["alter_action"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsealter_action_rename();
      if (s0 === peg$FAILED) {
        s0 = peg$parsealter_action_add();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "alter_action",
        description: peg$descNames["alter_action"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "alter_action",
        description: peg$descNames["alter_action"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsealter_action_rename() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "alter_action_rename",
        description: peg$descNames["alter_action_rename"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseRENAME();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseTO();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseid_table();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c134(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "alter_action_rename",
        description: peg$descNames["alter_action_rename"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "alter_action_rename",
        description: peg$descNames["alter_action_rename"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsealter_action_add() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "alter_action_add",
        description: peg$descNames["alter_action_add"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseADD();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseaction_add_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesource_def_column();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c135(s1, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "alter_action_add",
        description: peg$descNames["alter_action_add"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "alter_action_add",
        description: peg$descNames["alter_action_add"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseaction_add_modifier() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "action_add_modifier",
        description: peg$descNames["action_add_modifier"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseCOLUMN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c130(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "action_add_modifier",
        description: peg$descNames["action_add_modifier"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "action_add_modifier",
        description: peg$descNames["action_add_modifier"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_crud() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_crud",
        description: peg$descNames["stmt_crud"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseclause_with();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_crud_types();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c136(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_crud",
        description: peg$descNames["stmt_crud"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_crud",
        description: peg$descNames["stmt_crud"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseclause_with() {
      var s0, s1, s2, s3, s4, s5, s6, s7,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "clause_with",
        description: peg$descNames["clause_with"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWITH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseclause_with_recursive();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexpression_table();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = [];
                s7 = peg$parseclause_with_loop();
                while (s7 !== peg$FAILED) {
                  s6.push(s7);
                  s7 = peg$parseclause_with_loop();
                }
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c138(s1, s3, s4, s6);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c137); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "clause_with",
        description: peg$descNames["clause_with"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "clause_with",
        description: peg$descNames["clause_with"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseclause_with_recursive() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "clause_with_recursive",
        description: peg$descNames["clause_with_recursive"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseRECURSIVE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c130(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "clause_with_recursive",
        description: peg$descNames["clause_with_recursive"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "clause_with_recursive",
        description: peg$descNames["clause_with_recursive"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseclause_with_loop() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "clause_with_loop",
        description: peg$descNames["clause_with_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_table();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c45(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "clause_with_loop",
        description: peg$descNames["clause_with_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "clause_with_loop",
        description: peg$descNames["clause_with_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseexpression_table() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "expression_table",
        description: peg$descNames["expression_table"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseloop_columns();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseselect_alias();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c140(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c139); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "expression_table",
        description: peg$descNames["expression_table"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "expression_table",
        description: peg$descNames["expression_table"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_alias() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_alias",
        description: peg$descNames["select_alias"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c2(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_alias",
        description: peg$descNames["select_alias"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_alias",
        description: peg$descNames["select_alias"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_wrapped() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_wrapped",
        description: peg$descNames["select_wrapped"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_select();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c2(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_wrapped",
        description: peg$descNames["select_wrapped"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_wrapped",
        description: peg$descNames["select_wrapped"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_crud_types() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_crud_types",
        description: peg$descNames["stmt_crud_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsestmt_select();
      if (s0 === peg$FAILED) {
        s0 = peg$parsestmt_insert();
        if (s0 === peg$FAILED) {
          s0 = peg$parsestmt_update();
          if (s0 === peg$FAILED) {
            s0 = peg$parsestmt_delete();
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_crud_types",
        description: peg$descNames["stmt_crud_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_crud_types",
        description: peg$descNames["stmt_crud_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_select() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_select",
        description: peg$descNames["stmt_select"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseselect_loop();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_order();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_limit();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c142(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c141); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_select",
        description: peg$descNames["stmt_select"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_select",
        description: peg$descNames["stmt_select"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_core_order() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_core_order",
        description: peg$descNames["stmt_core_order"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseORDER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_order_list();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c14(s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_core_order",
        description: peg$descNames["stmt_core_order"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_core_order",
        description: peg$descNames["stmt_core_order"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_core_limit() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_core_limit",
        description: peg$descNames["stmt_core_limit"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseLIMIT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_core_limit_offset();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c143(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_core_limit",
        description: peg$descNames["stmt_core_limit"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_core_limit",
        description: peg$descNames["stmt_core_limit"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_core_limit_offset() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_core_limit_offset",
        description: peg$descNames["stmt_core_limit_offset"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parselimit_offset_variant();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c144(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_core_limit_offset",
        description: peg$descNames["stmt_core_limit_offset"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_core_limit_offset",
        description: peg$descNames["stmt_core_limit_offset"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parselimit_offset_variant() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "limit_offset_variant",
        description: peg$descNames["limit_offset_variant"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parselimit_offset_variant_name();
      if (s0 === peg$FAILED) {
        s0 = peg$parsesym_comma();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "limit_offset_variant",
        description: peg$descNames["limit_offset_variant"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "limit_offset_variant",
        description: peg$descNames["limit_offset_variant"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parselimit_offset_variant_name() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "limit_offset_variant_name",
        description: peg$descNames["limit_offset_variant_name"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseOFFSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c130(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "limit_offset_variant_name",
        description: peg$descNames["limit_offset_variant_name"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "limit_offset_variant_name",
        description: peg$descNames["limit_offset_variant_name"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_loop() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_loop",
        description: peg$descNames["select_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseselect_parts();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_loop_union();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseselect_loop_union();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c145(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_loop",
        description: peg$descNames["select_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_loop",
        description: peg$descNames["select_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_loop_union() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_loop_union",
        description: peg$descNames["select_loop_union"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseoperator_compound();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_parts();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c146(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_loop_union",
        description: peg$descNames["select_loop_union"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_loop_union",
        description: peg$descNames["select_loop_union"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_parts() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_parts",
        description: peg$descNames["select_parts"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseselect_parts_core();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_parts_values();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_parts",
        description: peg$descNames["select_parts"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_parts",
        description: peg$descNames["select_parts"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_parts_core() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_parts_core",
        description: peg$descNames["select_parts_core"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseselect_core_select();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_core_from();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_where();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseselect_core_group();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c147(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_parts_core",
        description: peg$descNames["select_parts_core"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_parts_core",
        description: peg$descNames["select_parts_core"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_core_select() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_core_select",
        description: peg$descNames["select_core_select"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseSELECT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_modifier();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseselect_target();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c148(s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_core_select",
        description: peg$descNames["select_core_select"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_core_select",
        description: peg$descNames["select_core_select"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_modifier() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_modifier",
        description: peg$descNames["select_modifier"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseselect_modifier_distinct();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_modifier_all();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_modifier",
        description: peg$descNames["select_modifier"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_modifier",
        description: peg$descNames["select_modifier"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_modifier_distinct() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_modifier_distinct",
        description: peg$descNames["select_modifier_distinct"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseDISTINCT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c149(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_modifier_distinct",
        description: peg$descNames["select_modifier_distinct"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_modifier_distinct",
        description: peg$descNames["select_modifier_distinct"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_modifier_all() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_modifier_all",
        description: peg$descNames["select_modifier_all"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseALL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c150(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_modifier_all",
        description: peg$descNames["select_modifier_all"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_modifier_all",
        description: peg$descNames["select_modifier_all"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_target() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_target",
        description: peg$descNames["select_target"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseselect_node();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_target_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseselect_target_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c151(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_target",
        description: peg$descNames["select_target"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_target",
        description: peg$descNames["select_target"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_target_loop() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_target_loop",
        description: peg$descNames["select_target_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_node();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c8(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_target_loop",
        description: peg$descNames["select_target_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_target_loop",
        description: peg$descNames["select_target_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_core_from() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_core_from",
        description: peg$descNames["select_core_from"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseFROM();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseselect_source();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c153(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c152); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_core_from",
        description: peg$descNames["select_core_from"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_core_from",
        description: peg$descNames["select_core_from"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_core_where() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_core_where",
        description: peg$descNames["stmt_core_where"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseWHERE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c155(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c154); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_core_where",
        description: peg$descNames["stmt_core_where"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_core_where",
        description: peg$descNames["stmt_core_where"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_core_group() {
      var s0, s1, s2, s3, s4, s5, s6, s7,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_core_group",
        description: peg$descNames["select_core_group"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseGROUP();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseexpression_list();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseselect_core_having();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c156(s1, s5, s7);
                    s0 = s1;
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_core_group",
        description: peg$descNames["select_core_group"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_core_group",
        description: peg$descNames["select_core_group"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_core_having() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_core_having",
        description: peg$descNames["select_core_having"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseHAVING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c157(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_core_having",
        description: peg$descNames["select_core_having"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_core_having",
        description: peg$descNames["select_core_having"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_node() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_node",
        description: peg$descNames["select_node"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseselect_node_star();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_node_aliased();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_node",
        description: peg$descNames["select_node"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_node",
        description: peg$descNames["select_node"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_node_star() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_node_star",
        description: peg$descNames["select_node_star"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseselect_node_star_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_star();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c158(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_node_star",
        description: peg$descNames["select_node_star"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_node_star",
        description: peg$descNames["select_node_star"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_node_star_qualified() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_node_star_qualified",
        description: peg$descNames["select_node_star_qualified"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c159(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_node_star_qualified",
        description: peg$descNames["select_node_star_qualified"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_node_star_qualified",
        description: peg$descNames["select_node_star_qualified"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_node_aliased() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_node_aliased",
        description: peg$descNames["select_node_aliased"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsealias();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c160(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_node_aliased",
        description: peg$descNames["select_node_aliased"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_node_aliased",
        description: peg$descNames["select_node_aliased"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_source() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_source",
        description: peg$descNames["select_source"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseselect_join_loop();
      if (s0 === peg$FAILED) {
        s0 = peg$parseselect_source_loop();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_source",
        description: peg$descNames["select_source"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_source",
        description: peg$descNames["select_source"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_source_loop() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_source_loop",
        description: peg$descNames["select_source_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsetable_or_sub();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_loop_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_loop_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c161(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_source_loop",
        description: peg$descNames["select_source_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_source_loop",
        description: peg$descNames["select_source_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesource_loop_tail() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "source_loop_tail",
        description: peg$descNames["source_loop_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_or_sub();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c4(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "source_loop_tail",
        description: peg$descNames["source_loop_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "source_loop_tail",
        description: peg$descNames["source_loop_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_or_sub() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_or_sub",
        description: peg$descNames["table_or_sub"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsetable_or_sub_sub();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_qualified();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetable_or_sub_select();
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_or_sub",
        description: peg$descNames["table_or_sub"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_or_sub",
        description: peg$descNames["table_or_sub"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_qualified() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_qualified",
        description: peg$descNames["table_qualified"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsetable_qualified_id();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_or_sub_index_node();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c162(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_qualified",
        description: peg$descNames["table_qualified"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_qualified",
        description: peg$descNames["table_qualified"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_qualified_id() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_qualified_id",
        description: peg$descNames["table_qualified_id"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseid_table();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsealias();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c163(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_qualified_id",
        description: peg$descNames["table_qualified_id"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_qualified_id",
        description: peg$descNames["table_qualified_id"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_or_sub_index_node() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_or_sub_index_node",
        description: peg$descNames["table_or_sub_index_node"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseindex_node_indexed();
      if (s1 === peg$FAILED) {
        s1 = peg$parseindex_node_none();
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c164(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_or_sub_index_node",
        description: peg$descNames["table_or_sub_index_node"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_or_sub_index_node",
        description: peg$descNames["table_or_sub_index_node"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseindex_node_indexed() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "index_node_indexed",
        description: peg$descNames["index_node_indexed"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseINDEXED();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseBY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsename();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c165(s1, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "index_node_indexed",
        description: peg$descNames["index_node_indexed"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "index_node_indexed",
        description: peg$descNames["index_node_indexed"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseindex_node_none() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "index_node_none",
        description: peg$descNames["index_node_none"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseINDEXED();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c166();
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "index_node_none",
        description: peg$descNames["index_node_none"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "index_node_none",
        description: peg$descNames["index_node_none"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_or_sub_sub() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_or_sub_sub",
        description: peg$descNames["table_or_sub_sub"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseselect_source();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c167(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_or_sub_sub",
        description: peg$descNames["table_or_sub_sub"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_or_sub_sub",
        description: peg$descNames["table_or_sub_sub"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_or_sub_select() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_or_sub_select",
        description: peg$descNames["table_or_sub_select"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseselect_wrapped();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsealias();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c168(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_or_sub_select",
        description: peg$descNames["table_or_sub_select"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_or_sub_select",
        description: peg$descNames["table_or_sub_select"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsealias() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "alias",
        description: peg$descNames["alias"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      s2 = peg$parseAS();
      if (s2 !== peg$FAILED) {
        s3 = peg$parsee();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c170(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c169); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "alias",
        description: peg$descNames["alias"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "alias",
        description: peg$descNames["alias"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_join_loop() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_join_loop",
        description: peg$descNames["select_join_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsetable_or_sub();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseselect_join_clause();
          if (s4 !== peg$FAILED) {
            while (s4 !== peg$FAILED) {
              s3.push(s4);
              s4 = peg$parseselect_join_clause();
            }
          } else {
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c171(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_join_loop",
        description: peg$descNames["select_join_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_join_loop",
        description: peg$descNames["select_join_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_join_clause() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_join_clause",
        description: peg$descNames["select_join_clause"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsejoin_operator();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_or_sub();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsejoin_condition();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c172(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_join_clause",
        description: peg$descNames["select_join_clause"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_join_clause",
        description: peg$descNames["select_join_clause"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsejoin_operator() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "join_operator",
        description: peg$descNames["join_operator"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_operator_natural();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsejoin_operator_types();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseJOIN();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c174(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c173); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "join_operator",
        description: peg$descNames["join_operator"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "join_operator",
        description: peg$descNames["join_operator"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsejoin_operator_natural() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "join_operator_natural",
        description: peg$descNames["join_operator_natural"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseNATURAL();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c40(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "join_operator_natural",
        description: peg$descNames["join_operator_natural"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "join_operator_natural",
        description: peg$descNames["join_operator_natural"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsejoin_operator_types() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "join_operator_types",
        description: peg$descNames["join_operator_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseoperator_types_hand();
      if (s0 === peg$FAILED) {
        s0 = peg$parseoperator_types_misc();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "join_operator_types",
        description: peg$descNames["join_operator_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "join_operator_types",
        description: peg$descNames["join_operator_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseoperator_types_hand() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "operator_types_hand",
        description: peg$descNames["operator_types_hand"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseLEFT();
      if (s1 === peg$FAILED) {
        s1 = peg$parseRIGHT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseFULL();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetypes_hand_outer();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c175(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "operator_types_hand",
        description: peg$descNames["operator_types_hand"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "operator_types_hand",
        description: peg$descNames["operator_types_hand"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetypes_hand_outer() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "types_hand_outer",
        description: peg$descNames["types_hand_outer"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseOUTER();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c176(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "types_hand_outer",
        description: peg$descNames["types_hand_outer"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "types_hand_outer",
        description: peg$descNames["types_hand_outer"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseoperator_types_misc() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "operator_types_misc",
        description: peg$descNames["operator_types_misc"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseINNER();
      if (s1 === peg$FAILED) {
        s1 = peg$parseCROSS();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c176(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "operator_types_misc",
        description: peg$descNames["operator_types_misc"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "operator_types_misc",
        description: peg$descNames["operator_types_misc"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsejoin_condition() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "join_condition",
        description: peg$descNames["join_condition"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsejoin_condition_on();
      if (s1 === peg$FAILED) {
        s1 = peg$parsejoin_condition_using();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c178(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c177); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "join_condition",
        description: peg$descNames["join_condition"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "join_condition",
        description: peg$descNames["join_condition"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsejoin_condition_on() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "join_condition_on",
        description: peg$descNames["join_condition_on"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c179(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "join_condition_on",
        description: peg$descNames["join_condition_on"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "join_condition_on",
        description: peg$descNames["join_condition_on"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsejoin_condition_using() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "join_condition_using",
        description: peg$descNames["join_condition_using"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseUSING();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_column();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = [];
              s6 = peg$parsejoin_condition_using_loop();
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$parsejoin_condition_using_loop();
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c180(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "join_condition_using",
        description: peg$descNames["join_condition_using"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "join_condition_using",
        description: peg$descNames["join_condition_using"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsejoin_condition_using_loop() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "join_condition_using_loop",
        description: peg$descNames["join_condition_using_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c8(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "join_condition_using_loop",
        description: peg$descNames["join_condition_using_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "join_condition_using_loop",
        description: peg$descNames["join_condition_using_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseselect_parts_values() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "select_parts_values",
        description: peg$descNames["select_parts_values"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseVALUES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_values_list();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c181(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "select_parts_values",
        description: peg$descNames["select_parts_values"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "select_parts_values",
        description: peg$descNames["select_parts_values"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_core_order_list() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_core_order_list",
        description: peg$descNames["stmt_core_order_list"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsestmt_core_order_list_item();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_core_order_list_loop();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c182(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_core_order_list",
        description: peg$descNames["stmt_core_order_list"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_core_order_list",
        description: peg$descNames["stmt_core_order_list"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_core_order_list_loop() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_core_order_list_loop",
        description: peg$descNames["stmt_core_order_list_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsestmt_core_order_list_item();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c183(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_core_order_list_loop",
        description: peg$descNames["stmt_core_order_list_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_core_order_list_loop",
        description: peg$descNames["stmt_core_order_list_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_core_order_list_item() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_core_order_list_item",
        description: peg$descNames["stmt_core_order_list_item"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseexpression();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_collate();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseprimary_column_dir();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c184(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_core_order_list_item",
        description: peg$descNames["stmt_core_order_list_item"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_core_order_list_item",
        description: peg$descNames["stmt_core_order_list_item"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_fallback_types() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_fallback_types",
        description: peg$descNames["stmt_fallback_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseREPLACE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseROLLBACK();
        if (s1 === peg$FAILED) {
          s1 = peg$parseABORT();
          if (s1 === peg$FAILED) {
            s1 = peg$parseFAIL();
            if (s1 === peg$FAILED) {
              s1 = peg$parseIGNORE();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c185(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_fallback_types",
        description: peg$descNames["stmt_fallback_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_fallback_types",
        description: peg$descNames["stmt_fallback_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_insert() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_insert",
        description: peg$descNames["stmt_insert"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseinsert_keyword();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_target();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseinsert_parts();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c187(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c186); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_insert",
        description: peg$descNames["stmt_insert"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_insert",
        description: peg$descNames["stmt_insert"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_keyword() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_keyword",
        description: peg$descNames["insert_keyword"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseinsert_keyword_ins();
      if (s0 === peg$FAILED) {
        s0 = peg$parseinsert_keyword_repl();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_keyword",
        description: peg$descNames["insert_keyword"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_keyword",
        description: peg$descNames["insert_keyword"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_keyword_ins() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_keyword_ins",
        description: peg$descNames["insert_keyword_ins"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseINSERT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_keyword_mod();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c188(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_keyword_ins",
        description: peg$descNames["insert_keyword_ins"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_keyword_ins",
        description: peg$descNames["insert_keyword_ins"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_keyword_repl() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_keyword_repl",
        description: peg$descNames["insert_keyword_repl"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseREPLACE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c189(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_keyword_repl",
        description: peg$descNames["insert_keyword_repl"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_keyword_repl",
        description: peg$descNames["insert_keyword_repl"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_keyword_mod() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_keyword_mod",
        description: peg$descNames["insert_keyword_mod"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c190(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_keyword_mod",
        description: peg$descNames["insert_keyword_mod"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_keyword_mod",
        description: peg$descNames["insert_keyword_mod"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_target() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_target",
        description: peg$descNames["insert_target"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseINTO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_table();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseloop_columns();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c192(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c191); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_target",
        description: peg$descNames["insert_target"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_target",
        description: peg$descNames["insert_target"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseloop_columns() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "loop_columns",
        description: peg$descNames["loop_columns"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_name_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseloop_column_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseloop_column_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c193(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "loop_columns",
        description: peg$descNames["loop_columns"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "loop_columns",
        description: peg$descNames["loop_columns"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseloop_column_tail() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "loop_column_tail",
        description: peg$descNames["loop_column_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseloop_name_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c178(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "loop_column_tail",
        description: peg$descNames["loop_column_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "loop_column_tail",
        description: peg$descNames["loop_column_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseloop_name_column() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "loop_name_column",
        description: peg$descNames["loop_name_column"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c194(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "loop_name_column",
        description: peg$descNames["loop_name_column"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "loop_name_column",
        description: peg$descNames["loop_name_column"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_parts() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_parts",
        description: peg$descNames["insert_parts"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseinsert_value();
      if (s1 === peg$FAILED) {
        s1 = peg$parsestmt_select();
        if (s1 === peg$FAILED) {
          s1 = peg$parseinsert_default();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c195(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_parts",
        description: peg$descNames["insert_parts"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_parts",
        description: peg$descNames["insert_parts"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_value() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_value",
        description: peg$descNames["insert_value"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseVALUES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseinsert_values_list();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c197(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c196); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_value",
        description: peg$descNames["insert_value"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_value",
        description: peg$descNames["insert_value"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_values_list() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_values_list",
        description: peg$descNames["insert_values_list"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseinsert_values();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseinsert_values_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseinsert_values_loop();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c198(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_values_list",
        description: peg$descNames["insert_values_list"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_values_list",
        description: peg$descNames["insert_values_list"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_values_loop() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_values_loop",
        description: peg$descNames["insert_values_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseinsert_values();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c45(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_values_loop",
        description: peg$descNames["insert_values_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_values_loop",
        description: peg$descNames["insert_values_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_values() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_values",
        description: peg$descNames["insert_values"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_list();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c199(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_values",
        description: peg$descNames["insert_values"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_values",
        description: peg$descNames["insert_values"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseinsert_default() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "insert_default",
        description: peg$descNames["insert_default"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVALUES();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c201(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c200); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "insert_default",
        description: peg$descNames["insert_default"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "insert_default",
        description: peg$descNames["insert_default"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseoperator_compound() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "operator_compound",
        description: peg$descNames["operator_compound"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecompound_union();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINTERSECT();
        if (s1 === peg$FAILED) {
          s1 = peg$parseEXCEPT();
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c130(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c202); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "operator_compound",
        description: peg$descNames["operator_compound"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "operator_compound",
        description: peg$descNames["operator_compound"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecompound_union() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "compound_union",
        description: peg$descNames["compound_union"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseUNION();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecompound_union_all();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c203(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "compound_union",
        description: peg$descNames["compound_union"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "compound_union",
        description: peg$descNames["compound_union"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecompound_union_all() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "compound_union_all",
        description: peg$descNames["compound_union_all"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseALL();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c204(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "compound_union_all",
        description: peg$descNames["compound_union_all"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "compound_union_all",
        description: peg$descNames["compound_union_all"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseoperator_unary() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "operator_unary",
        description: peg$descNames["operator_unary"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_tilde();
      if (s0 === peg$FAILED) {
        s0 = peg$parsesym_minus();
        if (s0 === peg$FAILED) {
          s0 = peg$parsesym_plus();
          if (s0 === peg$FAILED) {
            s0 = peg$parseexpression_is_not();
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c205); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "operator_unary",
        description: peg$descNames["operator_unary"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "operator_unary",
        description: peg$descNames["operator_unary"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseoperator_binary() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "operator_binary",
        description: peg$descNames["operator_binary"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsebinary_concat();
      if (s1 === peg$FAILED) {
        s1 = peg$parseexpression_isnt();
        if (s1 === peg$FAILED) {
          s1 = peg$parsebinary_multiply();
          if (s1 === peg$FAILED) {
            s1 = peg$parsebinary_mod();
            if (s1 === peg$FAILED) {
              s1 = peg$parsebinary_plus();
              if (s1 === peg$FAILED) {
                s1 = peg$parsebinary_minus();
                if (s1 === peg$FAILED) {
                  s1 = peg$parsebinary_left();
                  if (s1 === peg$FAILED) {
                    s1 = peg$parsebinary_right();
                    if (s1 === peg$FAILED) {
                      s1 = peg$parsebinary_and();
                      if (s1 === peg$FAILED) {
                        s1 = peg$parsebinary_or();
                        if (s1 === peg$FAILED) {
                          s1 = peg$parsebinary_lte();
                          if (s1 === peg$FAILED) {
                            s1 = peg$parsebinary_lt();
                            if (s1 === peg$FAILED) {
                              s1 = peg$parsebinary_gte();
                              if (s1 === peg$FAILED) {
                                s1 = peg$parsebinary_gt();
                                if (s1 === peg$FAILED) {
                                  s1 = peg$parsebinary_lang();
                                  if (s1 === peg$FAILED) {
                                    s1 = peg$parsebinary_notequal();
                                    if (s1 === peg$FAILED) {
                                      s1 = peg$parsebinary_equal();
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c207(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c206); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "operator_binary",
        description: peg$descNames["operator_binary"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "operator_binary",
        description: peg$descNames["operator_binary"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_concat() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_concat",
        description: peg$descNames["binary_concat"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_pipe();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_pipe();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c208); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_concat",
        description: peg$descNames["binary_concat"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_concat",
        description: peg$descNames["binary_concat"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_plus() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_plus",
        description: peg$descNames["binary_plus"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_plus();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c209); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_plus",
        description: peg$descNames["binary_plus"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_plus",
        description: peg$descNames["binary_plus"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_minus() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_minus",
        description: peg$descNames["binary_minus"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_minus();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c210); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_minus",
        description: peg$descNames["binary_minus"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_minus",
        description: peg$descNames["binary_minus"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_multiply() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_multiply",
        description: peg$descNames["binary_multiply"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_star();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c211); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_multiply",
        description: peg$descNames["binary_multiply"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_multiply",
        description: peg$descNames["binary_multiply"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_mod() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_mod",
        description: peg$descNames["binary_mod"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_mod();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c212); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_mod",
        description: peg$descNames["binary_mod"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_mod",
        description: peg$descNames["binary_mod"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_left() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_left",
        description: peg$descNames["binary_left"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_lt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_lt();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c213); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_left",
        description: peg$descNames["binary_left"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_left",
        description: peg$descNames["binary_left"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_right() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_right",
        description: peg$descNames["binary_right"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_gt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_gt();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c214); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_right",
        description: peg$descNames["binary_right"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_right",
        description: peg$descNames["binary_right"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_and() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_and",
        description: peg$descNames["binary_and"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_amp();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c215); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_and",
        description: peg$descNames["binary_and"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_and",
        description: peg$descNames["binary_and"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_or() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_or",
        description: peg$descNames["binary_or"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_pipe();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c216); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_or",
        description: peg$descNames["binary_or"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_or",
        description: peg$descNames["binary_or"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_lt() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_lt",
        description: peg$descNames["binary_lt"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_lt();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c217); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_lt",
        description: peg$descNames["binary_lt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_lt",
        description: peg$descNames["binary_lt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_gt() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_gt",
        description: peg$descNames["binary_gt"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsesym_gt();
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c218); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_gt",
        description: peg$descNames["binary_gt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_gt",
        description: peg$descNames["binary_gt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_lte() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_lte",
        description: peg$descNames["binary_lte"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_lt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c219); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_lte",
        description: peg$descNames["binary_lte"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_lte",
        description: peg$descNames["binary_lte"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_gte() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_gte",
        description: peg$descNames["binary_gte"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_gt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c220); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_gte",
        description: peg$descNames["binary_gte"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_gte",
        description: peg$descNames["binary_gte"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_equal() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_equal",
        description: peg$descNames["binary_equal"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_equal();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c221); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_equal",
        description: peg$descNames["binary_equal"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_equal",
        description: peg$descNames["binary_equal"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_notequal() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_notequal",
        description: peg$descNames["binary_notequal"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_excl();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_equal();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesym_lt();
        if (s1 !== peg$FAILED) {
          s2 = peg$parsesym_gt();
          if (s2 !== peg$FAILED) {
            s1 = [s1, s2];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c222); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_notequal",
        description: peg$descNames["binary_notequal"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_notequal",
        description: peg$descNames["binary_notequal"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_lang() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_lang",
        description: peg$descNames["binary_lang"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsebinary_lang_isnt();
      if (s0 === peg$FAILED) {
        s0 = peg$parsebinary_lang_misc();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_lang",
        description: peg$descNames["binary_lang"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_lang",
        description: peg$descNames["binary_lang"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_lang_isnt() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_lang_isnt",
        description: peg$descNames["binary_lang_isnt"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c37(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c223); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_lang_isnt",
        description: peg$descNames["binary_lang_isnt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_lang_isnt",
        description: peg$descNames["binary_lang_isnt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsebinary_lang_misc() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "binary_lang_misc",
        description: peg$descNames["binary_lang_misc"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseIN();
      if (s1 === peg$FAILED) {
        s1 = peg$parseLIKE();
        if (s1 === peg$FAILED) {
          s1 = peg$parseGLOB();
          if (s1 === peg$FAILED) {
            s1 = peg$parseMATCH();
            if (s1 === peg$FAILED) {
              s1 = peg$parseREGEXP();
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c126(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c224); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "binary_lang_misc",
        description: peg$descNames["binary_lang_misc"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "binary_lang_misc",
        description: peg$descNames["binary_lang_misc"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_database() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_database",
        description: peg$descNames["id_database"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c226(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c225); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_database",
        description: peg$descNames["id_database"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_database",
        description: peg$descNames["id_database"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_table() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_table",
        description: peg$descNames["id_table"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c228(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c227); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_table",
        description: peg$descNames["id_table"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_table",
        description: peg$descNames["id_table"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_table_qualified() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_table_qualified",
        description: peg$descNames["id_table_qualified"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c230(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c229); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_table_qualified",
        description: peg$descNames["id_table_qualified"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_table_qualified",
        description: peg$descNames["id_table_qualified"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_column() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_column",
        description: peg$descNames["id_column"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseid_column_qualified();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c232(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c231); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_column",
        description: peg$descNames["id_column"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_column",
        description: peg$descNames["id_column"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_column_qualified() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_column_qualified",
        description: peg$descNames["id_column_qualified"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_dot();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c72(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c233); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_column_qualified",
        description: peg$descNames["id_column_qualified"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_column_qualified",
        description: peg$descNames["id_column_qualified"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_collation() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_collation",
        description: peg$descNames["id_collation"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename_unquoted();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c235(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c234); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_collation",
        description: peg$descNames["id_collation"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_collation",
        description: peg$descNames["id_collation"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_savepoint() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_savepoint",
        description: peg$descNames["id_savepoint"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c237(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c236); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_savepoint",
        description: peg$descNames["id_savepoint"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_savepoint",
        description: peg$descNames["id_savepoint"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_index() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_index",
        description: peg$descNames["id_index"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c239(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c238); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_index",
        description: peg$descNames["id_index"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_index",
        description: peg$descNames["id_index"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_trigger() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_trigger",
        description: peg$descNames["id_trigger"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c241(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c240); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_trigger",
        description: peg$descNames["id_trigger"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_trigger",
        description: peg$descNames["id_trigger"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseid_view() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "id_view",
        description: peg$descNames["id_view"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseid_table_qualified();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsename();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c243(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c242); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "id_view",
        description: peg$descNames["id_view"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "id_view",
        description: peg$descNames["id_view"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedatatype_types() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "datatype_types",
        description: peg$descNames["datatype_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_text();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c245(s1);
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsedatatype_real();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c246(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsedatatype_numeric();
          if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c247(s1);
          }
          s0 = s1;
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsedatatype_integer();
            if (s1 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c248(s1);
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
              s0 = peg$currPos;
              s1 = peg$parsedatatype_none();
              if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c249(s1);
              }
              s0 = s1;
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c244); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "datatype_types",
        description: peg$descNames["datatype_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "datatype_types",
        description: peg$descNames["datatype_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedatatype_text() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "datatype_text",
        description: peg$descNames["datatype_text"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 1).toLowerCase() === peg$c251) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c252); }
      }
      if (s2 === peg$FAILED) {
        s2 = null;
      }
      if (s2 !== peg$FAILED) {
        if (input.substr(peg$currPos, 3).toLowerCase() === peg$c253) {
          s3 = input.substr(peg$currPos, 3);
          peg$currPos += 3;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c254); }
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        if (s3 !== peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c255) {
            s4 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s4 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c256); }
          }
          if (s4 !== peg$FAILED) {
            s2 = [s2, s3, s4];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 4).toLowerCase() === peg$c257) {
          s2 = input.substr(peg$currPos, 4);
          peg$currPos += 4;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c258); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 6).toLowerCase() === peg$c259) {
            s2 = input.substr(peg$currPos, 6);
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c260); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 4).toLowerCase() === peg$c261) {
              s2 = input.substr(peg$currPos, 4);
              peg$currPos += 4;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c262); }
            }
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c263) {
            s3 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c264); }
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c265) {
            s1 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c266); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c38(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c250); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "datatype_text",
        description: peg$descNames["datatype_text"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "datatype_text",
        description: peg$descNames["datatype_text"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedatatype_real() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "datatype_real",
        description: peg$descNames["datatype_real"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedatatype_real_double();
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 5).toLowerCase() === peg$c268) {
          s1 = input.substr(peg$currPos, 5);
          peg$currPos += 5;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c269); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 4).toLowerCase() === peg$c270) {
            s1 = input.substr(peg$currPos, 4);
            peg$currPos += 4;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c271); }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c38(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c267); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "datatype_real",
        description: peg$descNames["datatype_real"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "datatype_real",
        description: peg$descNames["datatype_real"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedatatype_real_double() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "datatype_real_double",
        description: peg$descNames["datatype_real_double"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c272) {
        s1 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c273); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsereal_double_precision();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c274(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "datatype_real_double",
        description: peg$descNames["datatype_real_double"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "datatype_real_double",
        description: peg$descNames["datatype_real_double"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsereal_double_precision() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "real_double_precision",
        description: peg$descNames["real_double_precision"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        if (input.substr(peg$currPos, 9).toLowerCase() === peg$c275) {
          s2 = input.substr(peg$currPos, 9);
          peg$currPos += 9;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c276); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c277(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "real_double_precision",
        description: peg$descNames["real_double_precision"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "real_double_precision",
        description: peg$descNames["real_double_precision"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedatatype_numeric() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "datatype_numeric",
        description: peg$descNames["datatype_numeric"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c279) {
        s1 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c280); }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 7).toLowerCase() === peg$c281) {
          s1 = input.substr(peg$currPos, 7);
          peg$currPos += 7;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c282); }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 7).toLowerCase() === peg$c283) {
            s1 = input.substr(peg$currPos, 7);
            peg$currPos += 7;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c284); }
          }
          if (s1 === peg$FAILED) {
            s1 = peg$currPos;
            if (input.substr(peg$currPos, 4).toLowerCase() === peg$c285) {
              s2 = input.substr(peg$currPos, 4);
              peg$currPos += 4;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c286); }
            }
            if (s2 !== peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c287) {
                s3 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c288); }
              }
              if (s3 === peg$FAILED) {
                s3 = null;
              }
              if (s3 !== peg$FAILED) {
                s2 = [s2, s3];
                s1 = s2;
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
              s1 = peg$currPos;
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c287) {
                s2 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c288); }
              }
              if (s2 !== peg$FAILED) {
                if (input.substr(peg$currPos, 5).toLowerCase() === peg$c289) {
                  s3 = input.substr(peg$currPos, 5);
                  peg$currPos += 5;
                } else {
                  s3 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c290); }
                }
                if (s3 === peg$FAILED) {
                  s3 = null;
                }
                if (s3 !== peg$FAILED) {
                  s2 = [s2, s3];
                  s1 = s2;
                } else {
                  peg$currPos = s1;
                  s1 = peg$FAILED;
                }
              } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c38(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c278); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "datatype_numeric",
        description: peg$descNames["datatype_numeric"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "datatype_numeric",
        description: peg$descNames["datatype_numeric"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedatatype_integer() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "datatype_integer",
        description: peg$descNames["datatype_integer"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$currPos;
      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c292) {
        s2 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c293); }
      }
      if (s2 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 50) {
          s3 = peg$c294;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c295); }
        }
        if (s3 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 52) {
            s3 = peg$c296;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c297); }
          }
          if (s3 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 56) {
              s3 = peg$c298;
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c299); }
            }
            if (s3 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c300) {
                s3 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c301); }
              }
            }
          }
        }
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 === peg$FAILED) {
        s1 = peg$currPos;
        if (input.substr(peg$currPos, 3).toLowerCase() === peg$c302) {
          s2 = input.substr(peg$currPos, 3);
          peg$currPos += 3;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c303); }
        }
        if (s2 === peg$FAILED) {
          if (input.substr(peg$currPos, 6).toLowerCase() === peg$c259) {
            s2 = input.substr(peg$currPos, 6);
            peg$currPos += 6;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c260); }
          }
          if (s2 === peg$FAILED) {
            if (input.substr(peg$currPos, 5).toLowerCase() === peg$c304) {
              s2 = input.substr(peg$currPos, 5);
              peg$currPos += 5;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c305); }
            }
            if (s2 === peg$FAILED) {
              if (input.substr(peg$currPos, 4).toLowerCase() === peg$c257) {
                s2 = input.substr(peg$currPos, 4);
                peg$currPos += 4;
              } else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c258); }
              }
            }
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          if (input.substr(peg$currPos, 3).toLowerCase() === peg$c292) {
            s3 = input.substr(peg$currPos, 3);
            peg$currPos += 3;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c293); }
          }
          if (s3 !== peg$FAILED) {
            s2 = [s2, s3];
            s1 = s2;
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c38(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c291); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "datatype_integer",
        description: peg$descNames["datatype_integer"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "datatype_integer",
        description: peg$descNames["datatype_integer"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedatatype_none() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "datatype_none",
        description: peg$descNames["datatype_none"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c307) {
        s1 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c308); }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c38(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c306); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "datatype_none",
        description: peg$descNames["datatype_none"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "datatype_none",
        description: peg$descNames["datatype_none"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_update() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_update",
        description: peg$descNames["stmt_update"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseclause_with();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseupdate_start();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseupdate_fallback();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsetable_qualified();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseupdate_set();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsestmt_core_where();
                    if (s8 === peg$FAILED) {
                      s8 = null;
                    }
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsestmt_core_order();
                      if (s9 === peg$FAILED) {
                        s9 = null;
                      }
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseo();
                        if (s10 !== peg$FAILED) {
                          s11 = peg$parsestmt_core_limit();
                          if (s11 === peg$FAILED) {
                            s11 = null;
                          }
                          if (s11 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c310(s7, s3, s4, s5, s8, s9, s11);
                            s0 = s1;
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c309); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_update",
        description: peg$descNames["stmt_update"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_update",
        description: peg$descNames["stmt_update"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseupdate_start() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "update_start",
        description: peg$descNames["update_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseUPDATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c130(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c311); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "update_start",
        description: peg$descNames["update_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "update_start",
        description: peg$descNames["update_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseupdate_fallback() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "update_fallback",
        description: peg$descNames["update_fallback"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_fallback_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c313(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c312); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "update_fallback",
        description: peg$descNames["update_fallback"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "update_fallback",
        description: peg$descNames["update_fallback"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseupdate_set() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "update_set",
        description: peg$descNames["update_set"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseupdate_columns();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c315(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c314); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "update_set",
        description: peg$descNames["update_set"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "update_set",
        description: peg$descNames["update_set"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseupdate_columns() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "update_columns",
        description: peg$descNames["update_columns"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseupdate_column();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseupdate_columns_tail();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseupdate_columns_tail();
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c198(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "update_columns",
        description: peg$descNames["update_columns"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "update_columns",
        description: peg$descNames["update_columns"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseupdate_columns_tail() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "update_columns_tail",
        description: peg$descNames["update_columns_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_comma();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseupdate_column();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c178(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "update_columns_tail",
        description: peg$descNames["update_columns_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "update_columns_tail",
        description: peg$descNames["update_columns_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseupdate_column() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "update_column",
        description: peg$descNames["update_column"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseid_column();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_equal();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseexpression_types();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c316(s1, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "update_column",
        description: peg$descNames["update_column"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "update_column",
        description: peg$descNames["update_column"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_delete() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_delete",
        description: peg$descNames["stmt_delete"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseclause_with();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedelete_start();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsetable_qualified();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsestmt_core_where();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsestmt_core_order();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsestmt_core_limit();
                    if (s8 === peg$FAILED) {
                      s8 = null;
                    }
                    if (s8 !== peg$FAILED) {
                      peg$savedPos = s0;
                      s1 = peg$c318(s1, s3, s4, s6, s7, s8);
                      s0 = s1;
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c317); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_delete",
        description: peg$descNames["stmt_delete"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_delete",
        description: peg$descNames["stmt_delete"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedelete_start() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "delete_start",
        description: peg$descNames["delete_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseDELETE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseFROM();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c130(s1);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "delete_start",
        description: peg$descNames["delete_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "delete_start",
        description: peg$descNames["delete_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_create() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_create",
        description: peg$descNames["stmt_create"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$parsecreate_table();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecreate_index();
        if (s0 === peg$FAILED) {
          s0 = peg$parsecreate_trigger();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecreate_view();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecreate_virtual();
            }
          }
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c319); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_create",
        description: peg$descNames["stmt_create"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_create",
        description: peg$descNames["stmt_create"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_table() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_table",
        description: peg$descNames["create_table"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCREATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecreate_core_tmp();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseTABLE();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsecreate_core_ine();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseid_table();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsecreate_table_source();
                      if (s9 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c321(s1, s3, s4, s6, s7, s9);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c320); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_table",
        description: peg$descNames["create_table"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_table",
        description: peg$descNames["create_table"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_core_tmp() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_core_tmp",
        description: peg$descNames["create_core_tmp"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseTEMP();
      if (s1 === peg$FAILED) {
        s1 = peg$parseTEMPORARY();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c38(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_core_tmp",
        description: peg$descNames["create_core_tmp"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_core_tmp",
        description: peg$descNames["create_core_tmp"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_core_ine() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_core_ine",
        description: peg$descNames["create_core_ine"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseIF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_is_not();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseEXISTS();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c322(s1, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_core_ine",
        description: peg$descNames["create_core_ine"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_core_ine",
        description: peg$descNames["create_core_ine"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_table_source() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_table_source",
        description: peg$descNames["create_table_source"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsetable_source_def();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_source_select();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_table_source",
        description: peg$descNames["create_table_source"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_table_source",
        description: peg$descNames["create_table_source"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_source_def() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_source_def",
        description: peg$descNames["table_source_def"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesource_def_loop();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_tbl_loop();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_tbl_loop();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesource_def_rowid();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c324(s2, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c323); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_source_def",
        description: peg$descNames["table_source_def"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_source_def",
        description: peg$descNames["table_source_def"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesource_def_rowid() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "source_def_rowid",
        description: peg$descNames["source_def_rowid"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseWITHOUT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseROWID();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c325(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "source_def_rowid",
        description: peg$descNames["source_def_rowid"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "source_def_rowid",
        description: peg$descNames["source_def_rowid"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesource_def_loop() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "source_def_loop",
        description: peg$descNames["source_def_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesource_def_column();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parsesource_def_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parsesource_def_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c198(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "source_def_loop",
        description: peg$descNames["source_def_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "source_def_loop",
        description: peg$descNames["source_def_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesource_def_tail() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "source_def_tail",
        description: peg$descNames["source_def_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesource_def_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c4(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "source_def_tail",
        description: peg$descNames["source_def_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "source_def_tail",
        description: peg$descNames["source_def_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesource_tbl_loop() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "source_tbl_loop",
        description: peg$descNames["source_tbl_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetable_constraint();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c326(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "source_tbl_loop",
        description: peg$descNames["source_tbl_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "source_tbl_loop",
        description: peg$descNames["source_tbl_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesource_def_column() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "source_def_column",
        description: peg$descNames["source_def_column"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        s3 = peg$currPos;
        peg$silentFails++;
        s4 = peg$parsename_char();
        peg$silentFails--;
        if (s4 === peg$FAILED) {
          s3 = void 0;
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 !== peg$FAILED) {
          s4 = peg$parseo();
          if (s4 !== peg$FAILED) {
            s3 = [s3, s4];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_type();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsecolumn_constraints();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c328(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c327); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "source_def_column",
        description: peg$descNames["source_def_column"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "source_def_column",
        description: peg$descNames["source_def_column"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_type() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_type",
        description: peg$descNames["column_type"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetype_definition();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c330(s1);
      }
      s0 = s1;
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c329); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_type",
        description: peg$descNames["column_type"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_type",
        description: peg$descNames["column_type"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraints() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraints",
        description: peg$descNames["column_constraints"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsecolumn_constraint();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsecolumn_constraint_tail();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parsecolumn_constraint_tail();
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c198(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraints",
        description: peg$descNames["column_constraints"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraints",
        description: peg$descNames["column_constraints"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_tail() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_tail",
        description: peg$descNames["column_constraint_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecolumn_constraint();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c178(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_tail",
        description: peg$descNames["column_constraint_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_tail",
        description: peg$descNames["column_constraint_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint",
        description: peg$descNames["column_constraint"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecolumn_constraint_name();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecolumn_constraint_types();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c332(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c331); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint",
        description: peg$descNames["column_constraint"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint",
        description: peg$descNames["column_constraint"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_name() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_name",
        description: peg$descNames["column_constraint_name"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseCONSTRAINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_name",
        description: peg$descNames["column_constraint_name"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_name",
        description: peg$descNames["column_constraint_name"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_types() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_types",
        description: peg$descNames["column_constraint_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsecolumn_constraint_primary();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecolumn_constraint_null();
        if (s0 === peg$FAILED) {
          s0 = peg$parseconstraint_check();
          if (s0 === peg$FAILED) {
            s0 = peg$parsecolumn_constraint_default();
            if (s0 === peg$FAILED) {
              s0 = peg$parsecolumn_constraint_collate();
              if (s0 === peg$FAILED) {
                s0 = peg$parsecolumn_constraint_foreign();
              }
            }
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_types",
        description: peg$descNames["column_constraint_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_types",
        description: peg$descNames["column_constraint_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_foreign() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_foreign",
        description: peg$descNames["column_constraint_foreign"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseforeign_clause();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c333(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_foreign",
        description: peg$descNames["column_constraint_foreign"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_foreign",
        description: peg$descNames["column_constraint_foreign"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_primary() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_primary",
        description: peg$descNames["column_constraint_primary"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsecol_primary_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecol_primary_dir();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseprimary_conflict();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsecol_primary_auto();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c334(s1, s2, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_primary",
        description: peg$descNames["column_constraint_primary"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_primary",
        description: peg$descNames["column_constraint_primary"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecol_primary_start() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "col_primary_start",
        description: peg$descNames["col_primary_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsePRIMARY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c335(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "col_primary_start",
        description: peg$descNames["col_primary_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "col_primary_start",
        description: peg$descNames["col_primary_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecol_primary_dir() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "col_primary_dir",
        description: peg$descNames["col_primary_dir"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseprimary_column_dir();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c336(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "col_primary_dir",
        description: peg$descNames["col_primary_dir"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "col_primary_dir",
        description: peg$descNames["col_primary_dir"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecol_primary_auto() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "col_primary_auto",
        description: peg$descNames["col_primary_auto"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseAUTOINCREMENT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c337(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "col_primary_auto",
        description: peg$descNames["col_primary_auto"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "col_primary_auto",
        description: peg$descNames["col_primary_auto"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_null() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_null",
        description: peg$descNames["column_constraint_null"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseconstraint_null_types();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_conflict();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c338(s1, s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_null",
        description: peg$descNames["column_constraint_null"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_null",
        description: peg$descNames["column_constraint_null"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseconstraint_null_types() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "constraint_null_types",
        description: peg$descNames["constraint_null_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseconstraint_null_value();
      if (s1 === peg$FAILED) {
        s1 = peg$parseUNIQUE();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c38(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "constraint_null_types",
        description: peg$descNames["constraint_null_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "constraint_null_types",
        description: peg$descNames["constraint_null_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseconstraint_null_value() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "constraint_null_value",
        description: peg$descNames["constraint_null_value"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseNULL();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c339(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "constraint_null_value",
        description: peg$descNames["constraint_null_value"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "constraint_null_value",
        description: peg$descNames["constraint_null_value"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_default() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_default",
        description: peg$descNames["column_constraint_default"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseDEFAULT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecol_default_val();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c340(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_default",
        description: peg$descNames["column_constraint_default"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_default",
        description: peg$descNames["column_constraint_default"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecol_default_val() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "col_default_val",
        description: peg$descNames["col_default_val"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseo();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_wrapped();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c341(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsee();
        if (s1 !== peg$FAILED) {
          s2 = peg$parseliteral_number_signed();
          if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c341(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          s1 = peg$parsee();
          if (s1 !== peg$FAILED) {
            s2 = peg$parseliteral_value();
            if (s2 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c341(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "col_default_val",
        description: peg$descNames["col_default_val"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "col_default_val",
        description: peg$descNames["col_default_val"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_constraint_collate() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_constraint_collate",
        description: peg$descNames["column_constraint_collate"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsecolumn_collate();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c342(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_constraint_collate",
        description: peg$descNames["column_constraint_collate"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_constraint_collate",
        description: peg$descNames["column_constraint_collate"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_constraint() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_constraint",
        description: peg$descNames["table_constraint"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsetable_constraint_name();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsetable_constraint_types();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c344(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c343); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_constraint",
        description: peg$descNames["table_constraint"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_constraint",
        description: peg$descNames["table_constraint"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_constraint_name() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_constraint_name",
        description: peg$descNames["table_constraint_name"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseCONSTRAINT();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c8(s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_constraint_name",
        description: peg$descNames["table_constraint_name"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_constraint_name",
        description: peg$descNames["table_constraint_name"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_constraint_types() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_constraint_types",
        description: peg$descNames["table_constraint_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsetable_constraint_foreign();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetable_constraint_primary();
        if (s0 === peg$FAILED) {
          s0 = peg$parsetable_constraint_check();
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_constraint_types",
        description: peg$descNames["table_constraint_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_constraint_types",
        description: peg$descNames["table_constraint_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_constraint_check() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_constraint_check",
        description: peg$descNames["table_constraint_check"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseconstraint_check();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c345(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_constraint_check",
        description: peg$descNames["table_constraint_check"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_constraint_check",
        description: peg$descNames["table_constraint_check"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_constraint_primary() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_constraint_primary",
        description: peg$descNames["table_constraint_primary"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseprimary_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseprimary_columns();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseprimary_conflict();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c346(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_constraint_primary",
        description: peg$descNames["table_constraint_primary"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_constraint_primary",
        description: peg$descNames["table_constraint_primary"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_start() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_start",
        description: peg$descNames["primary_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseprimary_start_normal();
      if (s1 === peg$FAILED) {
        s1 = peg$parseprimary_start_unique();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c347(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_start",
        description: peg$descNames["primary_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_start",
        description: peg$descNames["primary_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_start_normal() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_start_normal",
        description: peg$descNames["primary_start_normal"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsePRIMARY();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c348(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_start_normal",
        description: peg$descNames["primary_start_normal"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_start_normal",
        description: peg$descNames["primary_start_normal"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_start_unique() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_start_unique",
        description: peg$descNames["primary_start_unique"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseUNIQUE();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c349(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_start_unique",
        description: peg$descNames["primary_start_unique"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_start_unique",
        description: peg$descNames["primary_start_unique"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_columns() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_columns",
        description: peg$descNames["primary_columns"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = [];
            s5 = peg$parseprimary_column_tail();
            while (s5 !== peg$FAILED) {
              s4.push(s5);
              s5 = peg$parseprimary_column_tail();
            }
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesym_pclose();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c198(s2, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_columns",
        description: peg$descNames["primary_columns"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_columns",
        description: peg$descNames["primary_columns"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_column() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_column",
        description: peg$descNames["primary_column"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsename();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecolumn_collate();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseprimary_column_dir();
            if (s4 === peg$FAILED) {
              s4 = null;
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c351(s1, s3, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c350); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_column",
        description: peg$descNames["primary_column"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_column",
        description: peg$descNames["primary_column"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecolumn_collate() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "column_collate",
        description: peg$descNames["column_collate"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseCOLLATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_collation();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c8(s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "column_collate",
        description: peg$descNames["column_collate"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "column_collate",
        description: peg$descNames["column_collate"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_column_dir() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_column_dir",
        description: peg$descNames["primary_column_dir"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseASC();
      if (s1 === peg$FAILED) {
        s1 = peg$parseDESC();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c38(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_column_dir",
        description: peg$descNames["primary_column_dir"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_column_dir",
        description: peg$descNames["primary_column_dir"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_column_tail() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_column_tail",
        description: peg$descNames["primary_column_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_comma();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseprimary_column();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c178(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_column_tail",
        description: peg$descNames["primary_column_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_column_tail",
        description: peg$descNames["primary_column_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseprimary_conflict() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "primary_conflict",
        description: peg$descNames["primary_conflict"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseCONFLICT();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsestmt_fallback_types();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c352(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "primary_conflict",
        description: peg$descNames["primary_conflict"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "primary_conflict",
        description: peg$descNames["primary_conflict"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseconstraint_check() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "constraint_check",
        description: peg$descNames["constraint_check"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseCHECK();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression_wrapped();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c353(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "constraint_check",
        description: peg$descNames["constraint_check"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "constraint_check",
        description: peg$descNames["constraint_check"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_constraint_foreign() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_constraint_foreign",
        description: peg$descNames["table_constraint_foreign"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseforeign_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseloop_columns();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseforeign_clause();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c354(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_constraint_foreign",
        description: peg$descNames["table_constraint_foreign"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_constraint_foreign",
        description: peg$descNames["table_constraint_foreign"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_start() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_start",
        description: peg$descNames["foreign_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseFOREIGN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseKEY();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c355(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_start",
        description: peg$descNames["foreign_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_start",
        description: peg$descNames["foreign_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_clause() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_clause",
        description: peg$descNames["foreign_clause"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseforeign_references();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseforeign_actions();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseforeign_deferrable();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c356(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_clause",
        description: peg$descNames["foreign_clause"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_clause",
        description: peg$descNames["foreign_clause"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_references() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_references",
        description: peg$descNames["foreign_references"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseREFERENCES();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseid_table();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseloop_columns();
              if (s5 === peg$FAILED) {
                s5 = null;
              }
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c357(s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_references",
        description: peg$descNames["foreign_references"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_references",
        description: peg$descNames["foreign_references"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_actions() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_actions",
        description: peg$descNames["foreign_actions"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseforeign_action();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseforeign_actions_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseforeign_actions_tail();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c358(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_actions",
        description: peg$descNames["foreign_actions"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_actions",
        description: peg$descNames["foreign_actions"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_actions_tail() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_actions_tail",
        description: peg$descNames["foreign_actions_tail"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseforeign_action();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c204(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_actions_tail",
        description: peg$descNames["foreign_actions_tail"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_actions_tail",
        description: peg$descNames["foreign_actions_tail"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_action() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_action",
        description: peg$descNames["foreign_action"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseforeign_action_on();
      if (s0 === peg$FAILED) {
        s0 = peg$parseforeign_action_match();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_action",
        description: peg$descNames["foreign_action"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_action",
        description: peg$descNames["foreign_action"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_action_on() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_action_on",
        description: peg$descNames["foreign_action_on"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseDELETE();
          if (s3 === peg$FAILED) {
            s3 = peg$parseUPDATE();
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseaction_on_action();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c359(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_action_on",
        description: peg$descNames["foreign_action_on"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_action_on",
        description: peg$descNames["foreign_action_on"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseaction_on_action() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "action_on_action",
        description: peg$descNames["action_on_action"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseon_action_set();
      if (s0 === peg$FAILED) {
        s0 = peg$parseon_action_cascade();
        if (s0 === peg$FAILED) {
          s0 = peg$parseon_action_none();
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "action_on_action",
        description: peg$descNames["action_on_action"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "action_on_action",
        description: peg$descNames["action_on_action"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseon_action_set() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "on_action_set",
        description: peg$descNames["on_action_set"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseSET();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseNULL();
          if (s3 === peg$FAILED) {
            s3 = peg$parseDEFAULT();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c360(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "on_action_set",
        description: peg$descNames["on_action_set"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "on_action_set",
        description: peg$descNames["on_action_set"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseon_action_cascade() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "on_action_cascade",
        description: peg$descNames["on_action_cascade"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseCASCADE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseRESTRICT();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c361(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "on_action_cascade",
        description: peg$descNames["on_action_cascade"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "on_action_cascade",
        description: peg$descNames["on_action_cascade"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseon_action_none() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "on_action_none",
        description: peg$descNames["on_action_none"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseNO();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseACTION();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c362(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "on_action_none",
        description: peg$descNames["on_action_none"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "on_action_none",
        description: peg$descNames["on_action_none"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_action_match() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_action_match",
        description: peg$descNames["foreign_action_match"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseMATCH();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c363(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_action_match",
        description: peg$descNames["foreign_action_match"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_action_match",
        description: peg$descNames["foreign_action_match"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseforeign_deferrable() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "foreign_deferrable",
        description: peg$descNames["foreign_deferrable"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseexpression_is_not();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseDEFERRABLE();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedeferrable_initially();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c364(s1, s2, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "foreign_deferrable",
        description: peg$descNames["foreign_deferrable"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "foreign_deferrable",
        description: peg$descNames["foreign_deferrable"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedeferrable_initially() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "deferrable_initially",
        description: peg$descNames["deferrable_initially"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsee();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseINITIALLY();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsee();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseDEFERRED();
            if (s4 === peg$FAILED) {
              s4 = peg$parseIMMEDIATE();
            }
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c365(s2, s4);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "deferrable_initially",
        description: peg$descNames["deferrable_initially"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "deferrable_initially",
        description: peg$descNames["deferrable_initially"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetable_source_select() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "table_source_select",
        description: peg$descNames["table_source_select"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsecreate_as_select();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c366(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "table_source_select",
        description: peg$descNames["table_source_select"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "table_source_select",
        description: peg$descNames["table_source_select"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_index() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_index",
        description: peg$descNames["create_index"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCREATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseindex_unique();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseINDEX();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsecreate_core_ine();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseid_index();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parseindex_on();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parsestmt_core_where();
                        if (s10 === peg$FAILED) {
                          s10 = null;
                        }
                        if (s10 !== peg$FAILED) {
                          peg$savedPos = s0;
                          s1 = peg$c368(s1, s3, s4, s6, s7, s9, s10);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c367); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_index",
        description: peg$descNames["create_index"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_index",
        description: peg$descNames["create_index"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseindex_unique() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "index_unique",
        description: peg$descNames["index_unique"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseUNIQUE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c369(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "index_unique",
        description: peg$descNames["index_unique"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "index_unique",
        description: peg$descNames["index_unique"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseindex_on() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "index_on",
        description: peg$descNames["index_on"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseON();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsename();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseprimary_columns();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c370(s1, s3, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "index_on",
        description: peg$descNames["index_on"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "index_on",
        description: peg$descNames["index_on"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_trigger() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_trigger",
        description: peg$descNames["create_trigger"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCREATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecreate_core_tmp();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseTRIGGER();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsecreate_core_ine();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseid_trigger();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsetrigger_conditions();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseON();
                        if (s10 !== peg$FAILED) {
                          s11 = peg$parsee();
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parsename();
                            if (s12 !== peg$FAILED) {
                              s13 = peg$parseo();
                              if (s13 !== peg$FAILED) {
                                s14 = peg$parsetrigger_foreach();
                                if (s14 === peg$FAILED) {
                                  s14 = null;
                                }
                                if (s14 !== peg$FAILED) {
                                  s15 = peg$parsetrigger_when();
                                  if (s15 === peg$FAILED) {
                                    s15 = null;
                                  }
                                  if (s15 !== peg$FAILED) {
                                    s16 = peg$parsetrigger_action();
                                    if (s16 !== peg$FAILED) {
                                      peg$savedPos = s0;
                                      s1 = peg$c372(s1, s3, s4, s6, s7, s9, s12, s14, s15, s16);
                                      s0 = s1;
                                    } else {
                                      peg$currPos = s0;
                                      s0 = peg$FAILED;
                                    }
                                  } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                  }
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c371); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_trigger",
        description: peg$descNames["create_trigger"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_trigger",
        description: peg$descNames["create_trigger"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_conditions() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_conditions",
        description: peg$descNames["trigger_conditions"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsetrigger_apply_mods();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsetrigger_do();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c373(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_conditions",
        description: peg$descNames["trigger_conditions"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_conditions",
        description: peg$descNames["trigger_conditions"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_apply_mods() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_apply_mods",
        description: peg$descNames["trigger_apply_mods"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseBEFORE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseAFTER();
        if (s1 === peg$FAILED) {
          s1 = peg$parsetrigger_apply_instead();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c374(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_apply_mods",
        description: peg$descNames["trigger_apply_mods"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_apply_mods",
        description: peg$descNames["trigger_apply_mods"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_apply_instead() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_apply_instead",
        description: peg$descNames["trigger_apply_instead"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseINSTEAD();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseOF();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c375(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_apply_instead",
        description: peg$descNames["trigger_apply_instead"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_apply_instead",
        description: peg$descNames["trigger_apply_instead"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_do() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_do",
        description: peg$descNames["trigger_do"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsetrigger_do_on();
      if (s0 === peg$FAILED) {
        s0 = peg$parsetrigger_do_update();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_do",
        description: peg$descNames["trigger_do"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_do",
        description: peg$descNames["trigger_do"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_do_on() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_do_on",
        description: peg$descNames["trigger_do_on"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseDELETE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINSERT();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c376(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_do_on",
        description: peg$descNames["trigger_do_on"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_do_on",
        description: peg$descNames["trigger_do_on"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_do_update() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_do_update",
        description: peg$descNames["trigger_do_update"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseUPDATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedo_update_of();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c377(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_do_update",
        description: peg$descNames["trigger_do_update"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_do_update",
        description: peg$descNames["trigger_do_update"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedo_update_of() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "do_update_of",
        description: peg$descNames["do_update_of"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseOF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedo_update_columns();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c378(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "do_update_of",
        description: peg$descNames["do_update_of"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "do_update_of",
        description: peg$descNames["do_update_of"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedo_update_columns() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "do_update_columns",
        description: peg$descNames["do_update_columns"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseloop_name_column();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$parseloop_column_tail();
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$parseloop_column_tail();
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c198(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "do_update_columns",
        description: peg$descNames["do_update_columns"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "do_update_columns",
        description: peg$descNames["do_update_columns"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_foreach() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_foreach",
        description: peg$descNames["trigger_foreach"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseFOR();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEACH();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseROW();
              if (s5 === peg$FAILED) {
                if (input.substr(peg$currPos, 9).toLowerCase() === peg$c379) {
                  s5 = input.substr(peg$currPos, 9);
                  peg$currPos += 9;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c380); }
                }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parsee();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c381(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_foreach",
        description: peg$descNames["trigger_foreach"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_foreach",
        description: peg$descNames["trigger_foreach"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_when() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_when",
        description: peg$descNames["trigger_when"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseWHEN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseexpression();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c382(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_when",
        description: peg$descNames["trigger_when"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_when",
        description: peg$descNames["trigger_when"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsetrigger_action() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "trigger_action",
        description: peg$descNames["trigger_action"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseBEGIN();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseaction_loop();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseEND();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseo();
                if (s6 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s1 = peg$c383(s1, s3, s5);
                  s0 = s1;
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "trigger_action",
        description: peg$descNames["trigger_action"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "trigger_action",
        description: peg$descNames["trigger_action"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseaction_loop() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "action_loop",
        description: peg$descNames["action_loop"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parseaction_loop_stmt();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parseaction_loop_stmt();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c167(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "action_loop",
        description: peg$descNames["action_loop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "action_loop",
        description: peg$descNames["action_loop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseaction_loop_stmt() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "action_loop_stmt",
        description: peg$descNames["action_loop_stmt"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsestmt();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsesym_semi();
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c384(s1, s3);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "action_loop_stmt",
        description: peg$descNames["action_loop_stmt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "action_loop_stmt",
        description: peg$descNames["action_loop_stmt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_view() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_view",
        description: peg$descNames["create_view"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCREATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecreate_core_tmp();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseVIEW();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsee();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsecreate_core_ine();
                if (s6 === peg$FAILED) {
                  s6 = null;
                }
                if (s6 !== peg$FAILED) {
                  s7 = peg$parseid_view();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseo();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsecreate_as_select();
                      if (s9 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c386(s1, s3, s4, s6, s7, s9);
                        s0 = s1;
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c385); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_view",
        description: peg$descNames["create_view"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_view",
        description: peg$descNames["create_view"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_as_select() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_as_select",
        description: peg$descNames["create_as_select"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseAS();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsestmt_select();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c197(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_as_select",
        description: peg$descNames["create_as_select"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_as_select",
        description: peg$descNames["create_as_select"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecreate_virtual() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "create_virtual",
        description: peg$descNames["create_virtual"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parseCREATE();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseVIRTUAL();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseTABLE();
              if (s5 !== peg$FAILED) {
                s6 = peg$parsee();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsecreate_core_ine();
                  if (s7 === peg$FAILED) {
                    s7 = null;
                  }
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parseid_table();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsee();
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parseUSING();
                        if (s10 !== peg$FAILED) {
                          s11 = peg$parsee();
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parsename_unquoted();
                            if (s12 !== peg$FAILED) {
                              s13 = peg$parseo();
                              if (s13 !== peg$FAILED) {
                                s14 = peg$parsevirtual_args();
                                if (s14 === peg$FAILED) {
                                  s14 = null;
                                }
                                if (s14 !== peg$FAILED) {
                                  peg$savedPos = s0;
                                  s1 = peg$c388(s1, s3, s5, s7, s8, s12, s14);
                                  s0 = s1;
                                } else {
                                  peg$currPos = s0;
                                  s0 = peg$FAILED;
                                }
                              } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$FAILED;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$FAILED;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$FAILED;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c387); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "create_virtual",
        description: peg$descNames["create_virtual"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "create_virtual",
        description: peg$descNames["create_virtual"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsevirtual_args() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "virtual_args",
        description: peg$descNames["virtual_args"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_popen();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsevirtual_arg_types();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_pclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c326(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "virtual_args",
        description: peg$descNames["virtual_args"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "virtual_args",
        description: peg$descNames["virtual_args"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsevirtual_arg_types() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "virtual_arg_types",
        description: peg$descNames["virtual_arg_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = peg$parsename();
      if (s3 !== peg$FAILED) {
        s4 = peg$parseo();
        if (s4 !== peg$FAILED) {
          s5 = peg$parsetype_definition();
          if (s5 === peg$FAILED) {
            s5 = peg$parsecolumn_constraint();
          }
          if (s5 !== peg$FAILED) {
            s3 = [s3, s4, s5];
            s2 = s3;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseexpression_list();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c167(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsesource_def_loop();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c167(s1);
        }
        s0 = s1;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "virtual_arg_types",
        description: peg$descNames["virtual_arg_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "virtual_arg_types",
        description: peg$descNames["virtual_arg_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsestmt_drop() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "stmt_drop",
        description: peg$descNames["stmt_drop"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsedrop_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsedrop_types();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsedrop_ie();
          if (s3 === peg$FAILED) {
            s3 = null;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parseid_table();
            if (s4 !== peg$FAILED) {
              s5 = peg$parseo();
              if (s5 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c390(s1, s2, s3, s4);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c389); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "stmt_drop",
        description: peg$descNames["stmt_drop"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "stmt_drop",
        description: peg$descNames["stmt_drop"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedrop_start() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "drop_start",
        description: peg$descNames["drop_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseDROP();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c130(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "drop_start",
        description: peg$descNames["drop_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "drop_start",
        description: peg$descNames["drop_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedrop_types() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "drop_types",
        description: peg$descNames["drop_types"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseTABLE();
      if (s1 === peg$FAILED) {
        s1 = peg$parseINDEX();
        if (s1 === peg$FAILED) {
          s1 = peg$parseTRIGGER();
          if (s1 === peg$FAILED) {
            s1 = peg$parseVIEW();
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c38(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "drop_types",
        description: peg$descNames["drop_types"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "drop_types",
        description: peg$descNames["drop_types"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsedrop_ie() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "drop_ie",
        description: peg$descNames["drop_ie"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseIF();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsee();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseEXISTS();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsee();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c391(s1, s3);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "drop_ie",
        description: peg$descNames["drop_ie"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "drop_ie",
        description: peg$descNames["drop_ie"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_char() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_char",
        description: peg$descNames["name_char"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (peg$c392.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c393); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_char",
        description: peg$descNames["name_char"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_char",
        description: peg$descNames["name_char"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name",
        description: peg$descNames["name"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsename_bracketed();
      if (s0 === peg$FAILED) {
        s0 = peg$parsename_backticked();
        if (s0 === peg$FAILED) {
          s0 = peg$parsename_dblquoted();
          if (s0 === peg$FAILED) {
            s0 = peg$parsename_unquoted();
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name",
        description: peg$descNames["name"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name",
        description: peg$descNames["name"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsereserved_nodes() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "reserved_nodes",
        description: peg$descNames["reserved_nodes"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsedatatype_types();
      if (s1 === peg$FAILED) {
        s1 = peg$parsereserved_words();
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$currPos;
        peg$silentFails++;
        s3 = peg$parsename_char();
        peg$silentFails--;
        if (s3 === peg$FAILED) {
          s2 = void 0;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c394(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "reserved_nodes",
        description: peg$descNames["reserved_nodes"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "reserved_nodes",
        description: peg$descNames["reserved_nodes"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_unquoted() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_unquoted",
        description: peg$descNames["name_unquoted"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$parsereserved_nodes();
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_char();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_char();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c40(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_unquoted",
        description: peg$descNames["name_unquoted"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_unquoted",
        description: peg$descNames["name_unquoted"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_bracketed() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_bracketed",
        description: peg$descNames["name_bracketed"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_bopen();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_bracketed_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_bracketed_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          s3 = peg$parseo();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesym_bclose();
            if (s4 !== peg$FAILED) {
              peg$savedPos = s0;
              s1 = peg$c40(s2);
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_bracketed",
        description: peg$descNames["name_bracketed"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_bracketed",
        description: peg$descNames["name_bracketed"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_bracketed_schar() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_bracketed_schar",
        description: peg$descNames["name_bracketed_schar"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$currPos;
      peg$silentFails++;
      s2 = peg$currPos;
      s3 = [];
      s4 = peg$parsewhitespace_space();
      while (s4 !== peg$FAILED) {
        s3.push(s4);
        s4 = peg$parsewhitespace_space();
      }
      if (s3 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 93) {
          s4 = peg$c395;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c396); }
        }
        if (s4 !== peg$FAILED) {
          s3 = [s3, s4];
          s2 = s3;
        } else {
          peg$currPos = s2;
          s2 = peg$FAILED;
        }
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      peg$silentFails--;
      if (s2 === peg$FAILED) {
        s1 = void 0;
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        if (peg$c397.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c398); }
        }
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c8(s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_bracketed_schar",
        description: peg$descNames["name_bracketed_schar"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_bracketed_schar",
        description: peg$descNames["name_bracketed_schar"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_dblquoted() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_dblquoted",
        description: peg$descNames["name_dblquoted"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c399;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c400); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_dblquoted_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_dblquoted_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 34) {
            s3 = peg$c399;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c400); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c401(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_dblquoted",
        description: peg$descNames["name_dblquoted"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_dblquoted",
        description: peg$descNames["name_dblquoted"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_dblquoted_schar() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_dblquoted_schar",
        description: peg$descNames["name_dblquoted_schar"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2) === peg$c402) {
        s0 = peg$c402;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c403); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c404.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c405); }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_dblquoted_schar",
        description: peg$descNames["name_dblquoted_schar"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_dblquoted_schar",
        description: peg$descNames["name_dblquoted_schar"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_backticked() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_backticked",
        description: peg$descNames["name_backticked"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 96) {
        s1 = peg$c406;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c407); }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsename_backticked_schar();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsename_backticked_schar();
          }
        } else {
          s2 = peg$FAILED;
        }
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 96) {
            s3 = peg$c406;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c407); }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$c408(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_backticked",
        description: peg$descNames["name_backticked"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_backticked",
        description: peg$descNames["name_backticked"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsename_backticked_schar() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "name_backticked_schar",
        description: peg$descNames["name_backticked_schar"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2) === peg$c409) {
        s0 = peg$c409;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c410); }
      }
      if (s0 === peg$FAILED) {
        if (peg$c411.test(input.charAt(peg$currPos))) {
          s0 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c412); }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "name_backticked_schar",
        description: peg$descNames["name_backticked_schar"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "name_backticked_schar",
        description: peg$descNames["name_backticked_schar"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_bopen() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_bopen",
        description: peg$descNames["sym_bopen"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c414;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c415); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c413); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_bopen",
        description: peg$descNames["sym_bopen"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_bopen",
        description: peg$descNames["sym_bopen"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_bclose() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_bclose",
        description: peg$descNames["sym_bclose"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 93) {
        s1 = peg$c395;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c396); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c416); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_bclose",
        description: peg$descNames["sym_bclose"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_bclose",
        description: peg$descNames["sym_bclose"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_popen() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_popen",
        description: peg$descNames["sym_popen"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 40) {
        s1 = peg$c418;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c419); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c417); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_popen",
        description: peg$descNames["sym_popen"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_popen",
        description: peg$descNames["sym_popen"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_pclose() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_pclose",
        description: peg$descNames["sym_pclose"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 41) {
        s1 = peg$c421;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c422); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c420); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_pclose",
        description: peg$descNames["sym_pclose"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_pclose",
        description: peg$descNames["sym_pclose"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_comma() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_comma",
        description: peg$descNames["sym_comma"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 44) {
        s1 = peg$c424;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c425); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c423); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_comma",
        description: peg$descNames["sym_comma"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_comma",
        description: peg$descNames["sym_comma"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_dot() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_dot",
        description: peg$descNames["sym_dot"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s1 = peg$c427;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c428); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c426); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_dot",
        description: peg$descNames["sym_dot"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_dot",
        description: peg$descNames["sym_dot"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_star() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_star",
        description: peg$descNames["sym_star"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 42) {
        s1 = peg$c430;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c431); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c429); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_star",
        description: peg$descNames["sym_star"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_star",
        description: peg$descNames["sym_star"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_quest() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_quest",
        description: peg$descNames["sym_quest"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 63) {
        s1 = peg$c433;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c434); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c432); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_quest",
        description: peg$descNames["sym_quest"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_quest",
        description: peg$descNames["sym_quest"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_sglquote() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_sglquote",
        description: peg$descNames["sym_sglquote"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 39) {
        s1 = peg$c436;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c437); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c435); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_sglquote",
        description: peg$descNames["sym_sglquote"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_sglquote",
        description: peg$descNames["sym_sglquote"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_dblquote() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_dblquote",
        description: peg$descNames["sym_dblquote"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 34) {
        s1 = peg$c399;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c400); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c438); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_dblquote",
        description: peg$descNames["sym_dblquote"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_dblquote",
        description: peg$descNames["sym_dblquote"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_backtick() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_backtick",
        description: peg$descNames["sym_backtick"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 96) {
        s1 = peg$c406;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c407); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c439); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_backtick",
        description: peg$descNames["sym_backtick"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_backtick",
        description: peg$descNames["sym_backtick"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_tilde() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_tilde",
        description: peg$descNames["sym_tilde"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 126) {
        s1 = peg$c441;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c442); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c440); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_tilde",
        description: peg$descNames["sym_tilde"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_tilde",
        description: peg$descNames["sym_tilde"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_plus() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_plus",
        description: peg$descNames["sym_plus"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 43) {
        s1 = peg$c444;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c445); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c443); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_plus",
        description: peg$descNames["sym_plus"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_plus",
        description: peg$descNames["sym_plus"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_minus() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_minus",
        description: peg$descNames["sym_minus"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        s1 = peg$c447;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c448); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c446); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_minus",
        description: peg$descNames["sym_minus"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_minus",
        description: peg$descNames["sym_minus"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_equal() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_equal",
        description: peg$descNames["sym_equal"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 61) {
        s1 = peg$c449;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c450); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c221); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_equal",
        description: peg$descNames["sym_equal"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_equal",
        description: peg$descNames["sym_equal"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_amp() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_amp",
        description: peg$descNames["sym_amp"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 38) {
        s1 = peg$c452;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c453); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c451); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_amp",
        description: peg$descNames["sym_amp"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_amp",
        description: peg$descNames["sym_amp"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_pipe() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_pipe",
        description: peg$descNames["sym_pipe"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 124) {
        s1 = peg$c455;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c456); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c454); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_pipe",
        description: peg$descNames["sym_pipe"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_pipe",
        description: peg$descNames["sym_pipe"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_mod() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_mod",
        description: peg$descNames["sym_mod"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 37) {
        s1 = peg$c457;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c458); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c212); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_mod",
        description: peg$descNames["sym_mod"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_mod",
        description: peg$descNames["sym_mod"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_lt() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_lt",
        description: peg$descNames["sym_lt"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 60) {
        s1 = peg$c459;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c460); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c217); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_lt",
        description: peg$descNames["sym_lt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_lt",
        description: peg$descNames["sym_lt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_gt() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_gt",
        description: peg$descNames["sym_gt"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 62) {
        s1 = peg$c461;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c462); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c218); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_gt",
        description: peg$descNames["sym_gt"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_gt",
        description: peg$descNames["sym_gt"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_excl() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_excl",
        description: peg$descNames["sym_excl"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s1 = peg$c464;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c465); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c463); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_excl",
        description: peg$descNames["sym_excl"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_excl",
        description: peg$descNames["sym_excl"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_semi() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_semi",
        description: peg$descNames["sym_semi"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 59) {
        s1 = peg$c467;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c468); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c466); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_semi",
        description: peg$descNames["sym_semi"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_semi",
        description: peg$descNames["sym_semi"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_colon() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_colon",
        description: peg$descNames["sym_colon"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 58) {
        s1 = peg$c98;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c99); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c469); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_colon",
        description: peg$descNames["sym_colon"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_colon",
        description: peg$descNames["sym_colon"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_fslash() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_fslash",
        description: peg$descNames["sym_fslash"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 47) {
        s1 = peg$c471;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c472); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c470); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_fslash",
        description: peg$descNames["sym_fslash"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_fslash",
        description: peg$descNames["sym_fslash"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsesym_bslash() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "sym_bslash",
        description: peg$descNames["sym_bslash"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 92) {
        s1 = peg$c474;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c475); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseo();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c67(s1);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c473); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "sym_bslash",
        description: peg$descNames["sym_bslash"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "sym_bslash",
        description: peg$descNames["sym_bslash"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseABORT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ABORT",
        description: peg$descNames["ABORT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c476) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c477); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ABORT",
        description: peg$descNames["ABORT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ABORT",
        description: peg$descNames["ABORT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseACTION() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ACTION",
        description: peg$descNames["ACTION"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c478) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c479); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ACTION",
        description: peg$descNames["ACTION"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ACTION",
        description: peg$descNames["ACTION"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseADD() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ADD",
        description: peg$descNames["ADD"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c480) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c481); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ADD",
        description: peg$descNames["ADD"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ADD",
        description: peg$descNames["ADD"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseAFTER() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "AFTER",
        description: peg$descNames["AFTER"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c482) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c483); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "AFTER",
        description: peg$descNames["AFTER"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "AFTER",
        description: peg$descNames["AFTER"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseALL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ALL",
        description: peg$descNames["ALL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c484) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c485); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ALL",
        description: peg$descNames["ALL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ALL",
        description: peg$descNames["ALL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseALTER() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ALTER",
        description: peg$descNames["ALTER"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c486) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c487); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ALTER",
        description: peg$descNames["ALTER"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ALTER",
        description: peg$descNames["ALTER"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseANALYZE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ANALYZE",
        description: peg$descNames["ANALYZE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c488) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c489); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ANALYZE",
        description: peg$descNames["ANALYZE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ANALYZE",
        description: peg$descNames["ANALYZE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseAND() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "AND",
        description: peg$descNames["AND"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c490) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c491); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "AND",
        description: peg$descNames["AND"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "AND",
        description: peg$descNames["AND"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseAS() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "AS",
        description: peg$descNames["AS"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c492) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c493); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "AS",
        description: peg$descNames["AS"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "AS",
        description: peg$descNames["AS"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseASC() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ASC",
        description: peg$descNames["ASC"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c494) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c495); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ASC",
        description: peg$descNames["ASC"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ASC",
        description: peg$descNames["ASC"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseATTACH() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ATTACH",
        description: peg$descNames["ATTACH"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c496) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c497); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ATTACH",
        description: peg$descNames["ATTACH"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ATTACH",
        description: peg$descNames["ATTACH"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseAUTOINCREMENT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "AUTOINCREMENT",
        description: peg$descNames["AUTOINCREMENT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 13).toLowerCase() === peg$c498) {
        s0 = input.substr(peg$currPos, 13);
        peg$currPos += 13;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c499); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "AUTOINCREMENT",
        description: peg$descNames["AUTOINCREMENT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "AUTOINCREMENT",
        description: peg$descNames["AUTOINCREMENT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseBEFORE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "BEFORE",
        description: peg$descNames["BEFORE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c500) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c501); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "BEFORE",
        description: peg$descNames["BEFORE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "BEFORE",
        description: peg$descNames["BEFORE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseBEGIN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "BEGIN",
        description: peg$descNames["BEGIN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c502) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c503); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "BEGIN",
        description: peg$descNames["BEGIN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "BEGIN",
        description: peg$descNames["BEGIN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseBETWEEN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "BETWEEN",
        description: peg$descNames["BETWEEN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c504) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c505); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "BETWEEN",
        description: peg$descNames["BETWEEN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "BETWEEN",
        description: peg$descNames["BETWEEN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseBY() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "BY",
        description: peg$descNames["BY"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c506) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c507); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "BY",
        description: peg$descNames["BY"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "BY",
        description: peg$descNames["BY"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCASCADE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CASCADE",
        description: peg$descNames["CASCADE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c508) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c509); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CASCADE",
        description: peg$descNames["CASCADE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CASCADE",
        description: peg$descNames["CASCADE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCASE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CASE",
        description: peg$descNames["CASE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c510) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c511); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CASE",
        description: peg$descNames["CASE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CASE",
        description: peg$descNames["CASE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCAST() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CAST",
        description: peg$descNames["CAST"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c512) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c513); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CAST",
        description: peg$descNames["CAST"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CAST",
        description: peg$descNames["CAST"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCHECK() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CHECK",
        description: peg$descNames["CHECK"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c514) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c515); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CHECK",
        description: peg$descNames["CHECK"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CHECK",
        description: peg$descNames["CHECK"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCOLLATE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "COLLATE",
        description: peg$descNames["COLLATE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c516) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c517); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "COLLATE",
        description: peg$descNames["COLLATE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "COLLATE",
        description: peg$descNames["COLLATE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCOLUMN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "COLUMN",
        description: peg$descNames["COLUMN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c518) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c519); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "COLUMN",
        description: peg$descNames["COLUMN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "COLUMN",
        description: peg$descNames["COLUMN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCOMMIT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "COMMIT",
        description: peg$descNames["COMMIT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c520) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c521); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "COMMIT",
        description: peg$descNames["COMMIT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "COMMIT",
        description: peg$descNames["COMMIT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCONFLICT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CONFLICT",
        description: peg$descNames["CONFLICT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c522) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c523); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CONFLICT",
        description: peg$descNames["CONFLICT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CONFLICT",
        description: peg$descNames["CONFLICT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCONSTRAINT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CONSTRAINT",
        description: peg$descNames["CONSTRAINT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c524) {
        s0 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c525); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CONSTRAINT",
        description: peg$descNames["CONSTRAINT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CONSTRAINT",
        description: peg$descNames["CONSTRAINT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCREATE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CREATE",
        description: peg$descNames["CREATE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c526) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c527); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CREATE",
        description: peg$descNames["CREATE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CREATE",
        description: peg$descNames["CREATE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCROSS() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CROSS",
        description: peg$descNames["CROSS"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c528) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c529); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CROSS",
        description: peg$descNames["CROSS"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CROSS",
        description: peg$descNames["CROSS"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCURRENT_DATE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CURRENT_DATE",
        description: peg$descNames["CURRENT_DATE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 12).toLowerCase() === peg$c530) {
        s0 = input.substr(peg$currPos, 12);
        peg$currPos += 12;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c531); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CURRENT_DATE",
        description: peg$descNames["CURRENT_DATE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CURRENT_DATE",
        description: peg$descNames["CURRENT_DATE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCURRENT_TIME() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CURRENT_TIME",
        description: peg$descNames["CURRENT_TIME"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 12).toLowerCase() === peg$c532) {
        s0 = input.substr(peg$currPos, 12);
        peg$currPos += 12;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c533); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CURRENT_TIME",
        description: peg$descNames["CURRENT_TIME"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CURRENT_TIME",
        description: peg$descNames["CURRENT_TIME"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseCURRENT_TIMESTAMP() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "CURRENT_TIMESTAMP",
        description: peg$descNames["CURRENT_TIMESTAMP"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 17).toLowerCase() === peg$c534) {
        s0 = input.substr(peg$currPos, 17);
        peg$currPos += 17;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c535); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "CURRENT_TIMESTAMP",
        description: peg$descNames["CURRENT_TIMESTAMP"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "CURRENT_TIMESTAMP",
        description: peg$descNames["CURRENT_TIMESTAMP"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDATABASE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DATABASE",
        description: peg$descNames["DATABASE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c536) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c537); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DATABASE",
        description: peg$descNames["DATABASE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DATABASE",
        description: peg$descNames["DATABASE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDEFAULT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DEFAULT",
        description: peg$descNames["DEFAULT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c538) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c539); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DEFAULT",
        description: peg$descNames["DEFAULT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DEFAULT",
        description: peg$descNames["DEFAULT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDEFERRABLE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DEFERRABLE",
        description: peg$descNames["DEFERRABLE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c540) {
        s0 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c541); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DEFERRABLE",
        description: peg$descNames["DEFERRABLE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DEFERRABLE",
        description: peg$descNames["DEFERRABLE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDEFERRED() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DEFERRED",
        description: peg$descNames["DEFERRED"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c542) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c543); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DEFERRED",
        description: peg$descNames["DEFERRED"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DEFERRED",
        description: peg$descNames["DEFERRED"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDELETE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DELETE",
        description: peg$descNames["DELETE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c544) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c545); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DELETE",
        description: peg$descNames["DELETE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DELETE",
        description: peg$descNames["DELETE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDESC() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DESC",
        description: peg$descNames["DESC"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c546) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c547); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DESC",
        description: peg$descNames["DESC"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DESC",
        description: peg$descNames["DESC"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDETACH() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DETACH",
        description: peg$descNames["DETACH"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c548) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c549); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DETACH",
        description: peg$descNames["DETACH"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DETACH",
        description: peg$descNames["DETACH"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDISTINCT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DISTINCT",
        description: peg$descNames["DISTINCT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c550) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c551); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DISTINCT",
        description: peg$descNames["DISTINCT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DISTINCT",
        description: peg$descNames["DISTINCT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseDROP() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "DROP",
        description: peg$descNames["DROP"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c552) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c553); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "DROP",
        description: peg$descNames["DROP"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "DROP",
        description: peg$descNames["DROP"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseEACH() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "EACH",
        description: peg$descNames["EACH"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c554) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c555); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "EACH",
        description: peg$descNames["EACH"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "EACH",
        description: peg$descNames["EACH"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseELSE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ELSE",
        description: peg$descNames["ELSE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c556) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c557); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ELSE",
        description: peg$descNames["ELSE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ELSE",
        description: peg$descNames["ELSE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseEND() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "END",
        description: peg$descNames["END"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c558) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c559); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "END",
        description: peg$descNames["END"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "END",
        description: peg$descNames["END"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseESCAPE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ESCAPE",
        description: peg$descNames["ESCAPE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c560) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c561); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ESCAPE",
        description: peg$descNames["ESCAPE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ESCAPE",
        description: peg$descNames["ESCAPE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseEXCEPT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "EXCEPT",
        description: peg$descNames["EXCEPT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c562) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c563); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "EXCEPT",
        description: peg$descNames["EXCEPT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "EXCEPT",
        description: peg$descNames["EXCEPT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseEXCLUSIVE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "EXCLUSIVE",
        description: peg$descNames["EXCLUSIVE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c564) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c565); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "EXCLUSIVE",
        description: peg$descNames["EXCLUSIVE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "EXCLUSIVE",
        description: peg$descNames["EXCLUSIVE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseEXISTS() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "EXISTS",
        description: peg$descNames["EXISTS"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c566) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c567); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "EXISTS",
        description: peg$descNames["EXISTS"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "EXISTS",
        description: peg$descNames["EXISTS"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseEXPLAIN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "EXPLAIN",
        description: peg$descNames["EXPLAIN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c568) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c569); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "EXPLAIN",
        description: peg$descNames["EXPLAIN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "EXPLAIN",
        description: peg$descNames["EXPLAIN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseFAIL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "FAIL",
        description: peg$descNames["FAIL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c570) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c571); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "FAIL",
        description: peg$descNames["FAIL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "FAIL",
        description: peg$descNames["FAIL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseFOR() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "FOR",
        description: peg$descNames["FOR"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c572) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c573); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "FOR",
        description: peg$descNames["FOR"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "FOR",
        description: peg$descNames["FOR"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseFOREIGN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "FOREIGN",
        description: peg$descNames["FOREIGN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c574) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c575); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "FOREIGN",
        description: peg$descNames["FOREIGN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "FOREIGN",
        description: peg$descNames["FOREIGN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseFROM() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "FROM",
        description: peg$descNames["FROM"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c576) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c577); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "FROM",
        description: peg$descNames["FROM"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "FROM",
        description: peg$descNames["FROM"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseFULL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "FULL",
        description: peg$descNames["FULL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c578) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c579); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "FULL",
        description: peg$descNames["FULL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "FULL",
        description: peg$descNames["FULL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseGLOB() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "GLOB",
        description: peg$descNames["GLOB"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c580) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c581); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "GLOB",
        description: peg$descNames["GLOB"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "GLOB",
        description: peg$descNames["GLOB"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseGROUP() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "GROUP",
        description: peg$descNames["GROUP"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c582) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c583); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "GROUP",
        description: peg$descNames["GROUP"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "GROUP",
        description: peg$descNames["GROUP"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseHAVING() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "HAVING",
        description: peg$descNames["HAVING"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c584) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c585); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "HAVING",
        description: peg$descNames["HAVING"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "HAVING",
        description: peg$descNames["HAVING"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseIF() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "IF",
        description: peg$descNames["IF"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c586) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c587); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "IF",
        description: peg$descNames["IF"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "IF",
        description: peg$descNames["IF"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseIGNORE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "IGNORE",
        description: peg$descNames["IGNORE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c588) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c589); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "IGNORE",
        description: peg$descNames["IGNORE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "IGNORE",
        description: peg$descNames["IGNORE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseIMMEDIATE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "IMMEDIATE",
        description: peg$descNames["IMMEDIATE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c590) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c591); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "IMMEDIATE",
        description: peg$descNames["IMMEDIATE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "IMMEDIATE",
        description: peg$descNames["IMMEDIATE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseIN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "IN",
        description: peg$descNames["IN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c592) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c593); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "IN",
        description: peg$descNames["IN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "IN",
        description: peg$descNames["IN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINDEX() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INDEX",
        description: peg$descNames["INDEX"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c594) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c595); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INDEX",
        description: peg$descNames["INDEX"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INDEX",
        description: peg$descNames["INDEX"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINDEXED() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INDEXED",
        description: peg$descNames["INDEXED"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c596) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c597); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INDEXED",
        description: peg$descNames["INDEXED"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INDEXED",
        description: peg$descNames["INDEXED"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINITIALLY() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INITIALLY",
        description: peg$descNames["INITIALLY"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c598) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c599); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INITIALLY",
        description: peg$descNames["INITIALLY"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INITIALLY",
        description: peg$descNames["INITIALLY"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINNER() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INNER",
        description: peg$descNames["INNER"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c600) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c601); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INNER",
        description: peg$descNames["INNER"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INNER",
        description: peg$descNames["INNER"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINSERT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INSERT",
        description: peg$descNames["INSERT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c602) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c603); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INSERT",
        description: peg$descNames["INSERT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INSERT",
        description: peg$descNames["INSERT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINSTEAD() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INSTEAD",
        description: peg$descNames["INSTEAD"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c604) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c605); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INSTEAD",
        description: peg$descNames["INSTEAD"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INSTEAD",
        description: peg$descNames["INSTEAD"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINTERSECT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INTERSECT",
        description: peg$descNames["INTERSECT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c606) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c607); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INTERSECT",
        description: peg$descNames["INTERSECT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INTERSECT",
        description: peg$descNames["INTERSECT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseINTO() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "INTO",
        description: peg$descNames["INTO"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c608) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c609); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "INTO",
        description: peg$descNames["INTO"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "INTO",
        description: peg$descNames["INTO"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseIS() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "IS",
        description: peg$descNames["IS"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c610) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c611); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "IS",
        description: peg$descNames["IS"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "IS",
        description: peg$descNames["IS"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseISNULL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ISNULL",
        description: peg$descNames["ISNULL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c612) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c613); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ISNULL",
        description: peg$descNames["ISNULL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ISNULL",
        description: peg$descNames["ISNULL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseJOIN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "JOIN",
        description: peg$descNames["JOIN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c614) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c615); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "JOIN",
        description: peg$descNames["JOIN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "JOIN",
        description: peg$descNames["JOIN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseKEY() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "KEY",
        description: peg$descNames["KEY"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c616) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c617); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "KEY",
        description: peg$descNames["KEY"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "KEY",
        description: peg$descNames["KEY"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseLEFT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "LEFT",
        description: peg$descNames["LEFT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c618) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c619); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "LEFT",
        description: peg$descNames["LEFT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "LEFT",
        description: peg$descNames["LEFT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseLIKE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "LIKE",
        description: peg$descNames["LIKE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c620) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c621); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "LIKE",
        description: peg$descNames["LIKE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "LIKE",
        description: peg$descNames["LIKE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseLIMIT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "LIMIT",
        description: peg$descNames["LIMIT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c622) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c623); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "LIMIT",
        description: peg$descNames["LIMIT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "LIMIT",
        description: peg$descNames["LIMIT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseMATCH() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "MATCH",
        description: peg$descNames["MATCH"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c624) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c625); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "MATCH",
        description: peg$descNames["MATCH"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "MATCH",
        description: peg$descNames["MATCH"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseNATURAL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "NATURAL",
        description: peg$descNames["NATURAL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c626) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c627); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "NATURAL",
        description: peg$descNames["NATURAL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "NATURAL",
        description: peg$descNames["NATURAL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseNO() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "NO",
        description: peg$descNames["NO"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c628) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c629); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "NO",
        description: peg$descNames["NO"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "NO",
        description: peg$descNames["NO"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseNOT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "NOT",
        description: peg$descNames["NOT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c630) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c631); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "NOT",
        description: peg$descNames["NOT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "NOT",
        description: peg$descNames["NOT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseNOTNULL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "NOTNULL",
        description: peg$descNames["NOTNULL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c632) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c633); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "NOTNULL",
        description: peg$descNames["NOTNULL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "NOTNULL",
        description: peg$descNames["NOTNULL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseNULL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "NULL",
        description: peg$descNames["NULL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c634) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c635); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "NULL",
        description: peg$descNames["NULL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "NULL",
        description: peg$descNames["NULL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseOF() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "OF",
        description: peg$descNames["OF"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c636) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c637); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "OF",
        description: peg$descNames["OF"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "OF",
        description: peg$descNames["OF"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseOFFSET() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "OFFSET",
        description: peg$descNames["OFFSET"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c638) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c639); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "OFFSET",
        description: peg$descNames["OFFSET"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "OFFSET",
        description: peg$descNames["OFFSET"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseON() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ON",
        description: peg$descNames["ON"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c640) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c641); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ON",
        description: peg$descNames["ON"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ON",
        description: peg$descNames["ON"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseOR() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "OR",
        description: peg$descNames["OR"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c642) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c643); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "OR",
        description: peg$descNames["OR"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "OR",
        description: peg$descNames["OR"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseORDER() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ORDER",
        description: peg$descNames["ORDER"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c644) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c645); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ORDER",
        description: peg$descNames["ORDER"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ORDER",
        description: peg$descNames["ORDER"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseOUTER() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "OUTER",
        description: peg$descNames["OUTER"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c646) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c647); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "OUTER",
        description: peg$descNames["OUTER"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "OUTER",
        description: peg$descNames["OUTER"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsePLAN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "PLAN",
        description: peg$descNames["PLAN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c648) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c649); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "PLAN",
        description: peg$descNames["PLAN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "PLAN",
        description: peg$descNames["PLAN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsePRAGMA() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "PRAGMA",
        description: peg$descNames["PRAGMA"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c650) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c651); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "PRAGMA",
        description: peg$descNames["PRAGMA"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "PRAGMA",
        description: peg$descNames["PRAGMA"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsePRIMARY() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "PRIMARY",
        description: peg$descNames["PRIMARY"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c652) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c653); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "PRIMARY",
        description: peg$descNames["PRIMARY"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "PRIMARY",
        description: peg$descNames["PRIMARY"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseQUERY() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "QUERY",
        description: peg$descNames["QUERY"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c654) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c655); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "QUERY",
        description: peg$descNames["QUERY"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "QUERY",
        description: peg$descNames["QUERY"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseRAISE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "RAISE",
        description: peg$descNames["RAISE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c656) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c657); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "RAISE",
        description: peg$descNames["RAISE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "RAISE",
        description: peg$descNames["RAISE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseRECURSIVE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "RECURSIVE",
        description: peg$descNames["RECURSIVE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c658) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c659); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "RECURSIVE",
        description: peg$descNames["RECURSIVE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "RECURSIVE",
        description: peg$descNames["RECURSIVE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseREFERENCES() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "REFERENCES",
        description: peg$descNames["REFERENCES"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 10).toLowerCase() === peg$c660) {
        s0 = input.substr(peg$currPos, 10);
        peg$currPos += 10;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c661); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "REFERENCES",
        description: peg$descNames["REFERENCES"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "REFERENCES",
        description: peg$descNames["REFERENCES"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseREGEXP() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "REGEXP",
        description: peg$descNames["REGEXP"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c662) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c663); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "REGEXP",
        description: peg$descNames["REGEXP"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "REGEXP",
        description: peg$descNames["REGEXP"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseREINDEX() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "REINDEX",
        description: peg$descNames["REINDEX"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c664) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c665); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "REINDEX",
        description: peg$descNames["REINDEX"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "REINDEX",
        description: peg$descNames["REINDEX"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseRELEASE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "RELEASE",
        description: peg$descNames["RELEASE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c666) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c667); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "RELEASE",
        description: peg$descNames["RELEASE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "RELEASE",
        description: peg$descNames["RELEASE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseRENAME() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "RENAME",
        description: peg$descNames["RENAME"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c668) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c669); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "RENAME",
        description: peg$descNames["RENAME"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "RENAME",
        description: peg$descNames["RENAME"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseREPLACE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "REPLACE",
        description: peg$descNames["REPLACE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c670) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c671); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "REPLACE",
        description: peg$descNames["REPLACE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "REPLACE",
        description: peg$descNames["REPLACE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseRESTRICT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "RESTRICT",
        description: peg$descNames["RESTRICT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c672) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c673); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "RESTRICT",
        description: peg$descNames["RESTRICT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "RESTRICT",
        description: peg$descNames["RESTRICT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseRIGHT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "RIGHT",
        description: peg$descNames["RIGHT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c674) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c675); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "RIGHT",
        description: peg$descNames["RIGHT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "RIGHT",
        description: peg$descNames["RIGHT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseROLLBACK() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ROLLBACK",
        description: peg$descNames["ROLLBACK"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 8).toLowerCase() === peg$c676) {
        s0 = input.substr(peg$currPos, 8);
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c677); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ROLLBACK",
        description: peg$descNames["ROLLBACK"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ROLLBACK",
        description: peg$descNames["ROLLBACK"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseROW() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ROW",
        description: peg$descNames["ROW"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c678) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c679); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ROW",
        description: peg$descNames["ROW"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ROW",
        description: peg$descNames["ROW"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseROWID() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "ROWID",
        description: peg$descNames["ROWID"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c680) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c681); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "ROWID",
        description: peg$descNames["ROWID"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "ROWID",
        description: peg$descNames["ROWID"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseSAVEPOINT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "SAVEPOINT",
        description: peg$descNames["SAVEPOINT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c682) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c683); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "SAVEPOINT",
        description: peg$descNames["SAVEPOINT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "SAVEPOINT",
        description: peg$descNames["SAVEPOINT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseSELECT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "SELECT",
        description: peg$descNames["SELECT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c684) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c685); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "SELECT",
        description: peg$descNames["SELECT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "SELECT",
        description: peg$descNames["SELECT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseSET() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "SET",
        description: peg$descNames["SET"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 3).toLowerCase() === peg$c686) {
        s0 = input.substr(peg$currPos, 3);
        peg$currPos += 3;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c687); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "SET",
        description: peg$descNames["SET"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "SET",
        description: peg$descNames["SET"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseTABLE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "TABLE",
        description: peg$descNames["TABLE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c688) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c689); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "TABLE",
        description: peg$descNames["TABLE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "TABLE",
        description: peg$descNames["TABLE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseTEMP() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "TEMP",
        description: peg$descNames["TEMP"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c690) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c691); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "TEMP",
        description: peg$descNames["TEMP"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "TEMP",
        description: peg$descNames["TEMP"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseTEMPORARY() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "TEMPORARY",
        description: peg$descNames["TEMPORARY"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 9).toLowerCase() === peg$c692) {
        s0 = input.substr(peg$currPos, 9);
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c693); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "TEMPORARY",
        description: peg$descNames["TEMPORARY"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "TEMPORARY",
        description: peg$descNames["TEMPORARY"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseTHEN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "THEN",
        description: peg$descNames["THEN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c694) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c695); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "THEN",
        description: peg$descNames["THEN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "THEN",
        description: peg$descNames["THEN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseTO() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "TO",
        description: peg$descNames["TO"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 2).toLowerCase() === peg$c696) {
        s0 = input.substr(peg$currPos, 2);
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c697); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "TO",
        description: peg$descNames["TO"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "TO",
        description: peg$descNames["TO"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseTRANSACTION() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "TRANSACTION",
        description: peg$descNames["TRANSACTION"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 11).toLowerCase() === peg$c698) {
        s0 = input.substr(peg$currPos, 11);
        peg$currPos += 11;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c699); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "TRANSACTION",
        description: peg$descNames["TRANSACTION"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "TRANSACTION",
        description: peg$descNames["TRANSACTION"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseTRIGGER() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "TRIGGER",
        description: peg$descNames["TRIGGER"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c700) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c701); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "TRIGGER",
        description: peg$descNames["TRIGGER"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "TRIGGER",
        description: peg$descNames["TRIGGER"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseUNION() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "UNION",
        description: peg$descNames["UNION"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c702) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c703); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "UNION",
        description: peg$descNames["UNION"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "UNION",
        description: peg$descNames["UNION"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseUNIQUE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "UNIQUE",
        description: peg$descNames["UNIQUE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c704) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c705); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "UNIQUE",
        description: peg$descNames["UNIQUE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "UNIQUE",
        description: peg$descNames["UNIQUE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseUPDATE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "UPDATE",
        description: peg$descNames["UPDATE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c706) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c707); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "UPDATE",
        description: peg$descNames["UPDATE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "UPDATE",
        description: peg$descNames["UPDATE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseUSING() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "USING",
        description: peg$descNames["USING"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c708) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c709); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "USING",
        description: peg$descNames["USING"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "USING",
        description: peg$descNames["USING"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseVACUUM() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "VACUUM",
        description: peg$descNames["VACUUM"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c710) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c711); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "VACUUM",
        description: peg$descNames["VACUUM"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "VACUUM",
        description: peg$descNames["VACUUM"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseVALUES() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "VALUES",
        description: peg$descNames["VALUES"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 6).toLowerCase() === peg$c712) {
        s0 = input.substr(peg$currPos, 6);
        peg$currPos += 6;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c713); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "VALUES",
        description: peg$descNames["VALUES"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "VALUES",
        description: peg$descNames["VALUES"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseVIEW() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "VIEW",
        description: peg$descNames["VIEW"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c714) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c715); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "VIEW",
        description: peg$descNames["VIEW"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "VIEW",
        description: peg$descNames["VIEW"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseVIRTUAL() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "VIRTUAL",
        description: peg$descNames["VIRTUAL"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c716) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c717); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "VIRTUAL",
        description: peg$descNames["VIRTUAL"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "VIRTUAL",
        description: peg$descNames["VIRTUAL"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseWHEN() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "WHEN",
        description: peg$descNames["WHEN"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c718) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c719); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "WHEN",
        description: peg$descNames["WHEN"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "WHEN",
        description: peg$descNames["WHEN"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseWHERE() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "WHERE",
        description: peg$descNames["WHERE"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 5).toLowerCase() === peg$c720) {
        s0 = input.substr(peg$currPos, 5);
        peg$currPos += 5;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c721); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "WHERE",
        description: peg$descNames["WHERE"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "WHERE",
        description: peg$descNames["WHERE"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseWITH() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "WITH",
        description: peg$descNames["WITH"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 4).toLowerCase() === peg$c722) {
        s0 = input.substr(peg$currPos, 4);
        peg$currPos += 4;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c723); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "WITH",
        description: peg$descNames["WITH"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "WITH",
        description: peg$descNames["WITH"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseWITHOUT() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "WITHOUT",
        description: peg$descNames["WITHOUT"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 7).toLowerCase() === peg$c724) {
        s0 = input.substr(peg$currPos, 7);
        peg$currPos += 7;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c725); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "WITHOUT",
        description: peg$descNames["WITHOUT"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "WITHOUT",
        description: peg$descNames["WITHOUT"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsereserved_words() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "reserved_words",
        description: peg$descNames["reserved_words"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsereserved_word_list();
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c726(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "reserved_words",
        description: peg$descNames["reserved_words"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "reserved_words",
        description: peg$descNames["reserved_words"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsereserved_word_list() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "reserved_word_list",
        description: peg$descNames["reserved_word_list"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parseABORT();
      if (s0 === peg$FAILED) {
        s0 = peg$parseACTION();
        if (s0 === peg$FAILED) {
          s0 = peg$parseADD();
          if (s0 === peg$FAILED) {
            s0 = peg$parseAFTER();
            if (s0 === peg$FAILED) {
              s0 = peg$parseALL();
              if (s0 === peg$FAILED) {
                s0 = peg$parseALTER();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseANALYZE();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseAND();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseASC();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseATTACH();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseAUTOINCREMENT();
                          if (s0 === peg$FAILED) {
                            s0 = peg$parseBEFORE();
                            if (s0 === peg$FAILED) {
                              s0 = peg$parseBEGIN();
                              if (s0 === peg$FAILED) {
                                s0 = peg$parseBETWEEN();
                                if (s0 === peg$FAILED) {
                                  s0 = peg$parseBY();
                                  if (s0 === peg$FAILED) {
                                    s0 = peg$parseCASCADE();
                                    if (s0 === peg$FAILED) {
                                      s0 = peg$parseCASE();
                                      if (s0 === peg$FAILED) {
                                        s0 = peg$parseCAST();
                                        if (s0 === peg$FAILED) {
                                          s0 = peg$parseCHECK();
                                          if (s0 === peg$FAILED) {
                                            s0 = peg$parseCOLLATE();
                                            if (s0 === peg$FAILED) {
                                              s0 = peg$parseCOLUMN();
                                              if (s0 === peg$FAILED) {
                                                s0 = peg$parseCOMMIT();
                                                if (s0 === peg$FAILED) {
                                                  s0 = peg$parseCONFLICT();
                                                  if (s0 === peg$FAILED) {
                                                    s0 = peg$parseCONSTRAINT();
                                                    if (s0 === peg$FAILED) {
                                                      s0 = peg$parseCREATE();
                                                      if (s0 === peg$FAILED) {
                                                        s0 = peg$parseCROSS();
                                                        if (s0 === peg$FAILED) {
                                                          s0 = peg$parseCURRENT_DATE();
                                                          if (s0 === peg$FAILED) {
                                                            s0 = peg$parseCURRENT_TIME();
                                                            if (s0 === peg$FAILED) {
                                                              s0 = peg$parseCURRENT_TIMESTAMP();
                                                              if (s0 === peg$FAILED) {
                                                                s0 = peg$parseDATABASE();
                                                                if (s0 === peg$FAILED) {
                                                                  s0 = peg$parseDEFAULT();
                                                                  if (s0 === peg$FAILED) {
                                                                    s0 = peg$parseDEFERRABLE();
                                                                    if (s0 === peg$FAILED) {
                                                                      s0 = peg$parseDEFERRED();
                                                                      if (s0 === peg$FAILED) {
                                                                        s0 = peg$parseDELETE();
                                                                        if (s0 === peg$FAILED) {
                                                                          s0 = peg$parseDESC();
                                                                          if (s0 === peg$FAILED) {
                                                                            s0 = peg$parseDETACH();
                                                                            if (s0 === peg$FAILED) {
                                                                              s0 = peg$parseDISTINCT();
                                                                              if (s0 === peg$FAILED) {
                                                                                s0 = peg$parseDROP();
                                                                                if (s0 === peg$FAILED) {
                                                                                  s0 = peg$parseEACH();
                                                                                  if (s0 === peg$FAILED) {
                                                                                    s0 = peg$parseELSE();
                                                                                    if (s0 === peg$FAILED) {
                                                                                      s0 = peg$parseEND();
                                                                                      if (s0 === peg$FAILED) {
                                                                                        s0 = peg$parseESCAPE();
                                                                                        if (s0 === peg$FAILED) {
                                                                                          s0 = peg$parseEXCEPT();
                                                                                          if (s0 === peg$FAILED) {
                                                                                            s0 = peg$parseEXCLUSIVE();
                                                                                            if (s0 === peg$FAILED) {
                                                                                              s0 = peg$parseEXISTS();
                                                                                              if (s0 === peg$FAILED) {
                                                                                                s0 = peg$parseEXPLAIN();
                                                                                                if (s0 === peg$FAILED) {
                                                                                                  s0 = peg$parseFAIL();
                                                                                                  if (s0 === peg$FAILED) {
                                                                                                    s0 = peg$parseFOREIGN();
                                                                                                    if (s0 === peg$FAILED) {
                                                                                                      s0 = peg$parseFOR();
                                                                                                      if (s0 === peg$FAILED) {
                                                                                                        s0 = peg$parseFROM();
                                                                                                        if (s0 === peg$FAILED) {
                                                                                                          s0 = peg$parseFULL();
                                                                                                          if (s0 === peg$FAILED) {
                                                                                                            s0 = peg$parseGLOB();
                                                                                                            if (s0 === peg$FAILED) {
                                                                                                              s0 = peg$parseGROUP();
                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                s0 = peg$parseHAVING();
                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                  s0 = peg$parseIGNORE();
                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                    s0 = peg$parseIMMEDIATE();
                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                      s0 = peg$parseINDEXED();
                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                        s0 = peg$parseINDEX();
                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                          s0 = peg$parseINITIALLY();
                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                            s0 = peg$parseINNER();
                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                              s0 = peg$parseINSERT();
                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                s0 = peg$parseINSTEAD();
                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                  s0 = peg$parseINTERSECT();
                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                    s0 = peg$parseINTO();
                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                      s0 = peg$parseISNULL();
                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                        s0 = peg$parseJOIN();
                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                          s0 = peg$parseKEY();
                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                            s0 = peg$parseLEFT();
                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                              s0 = peg$parseLIKE();
                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                s0 = peg$parseLIMIT();
                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                  s0 = peg$parseMATCH();
                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                    s0 = peg$parseNATURAL();
                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                      s0 = peg$parseNOTNULL();
                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                        s0 = peg$parseOFFSET();
                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                          s0 = peg$parseORDER();
                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                            s0 = peg$parseOUTER();
                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                              s0 = peg$parsePLAN();
                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                s0 = peg$parsePRAGMA();
                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                  s0 = peg$parsePRIMARY();
                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                    s0 = peg$parseQUERY();
                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                      s0 = peg$parseRAISE();
                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                        s0 = peg$parseRECURSIVE();
                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                          s0 = peg$parseREFERENCES();
                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                            s0 = peg$parseREGEXP();
                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                              s0 = peg$parseREINDEX();
                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                s0 = peg$parseRELEASE();
                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                  s0 = peg$parseRENAME();
                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                    s0 = peg$parseREPLACE();
                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                      s0 = peg$parseRESTRICT();
                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                        s0 = peg$parseRIGHT();
                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                          s0 = peg$parseROLLBACK();
                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                            s0 = peg$parseROW();
                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                              s0 = peg$parseSAVEPOINT();
                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                s0 = peg$parseSELECT();
                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                  s0 = peg$parseSET();
                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                    s0 = peg$parseTABLE();
                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                      s0 = peg$parseTEMPORARY();
                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                        s0 = peg$parseTEMP();
                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                          s0 = peg$parseTHEN();
                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                            s0 = peg$parseTO();
                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                              s0 = peg$parseTRANSACTION();
                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                s0 = peg$parseTRIGGER();
                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                  s0 = peg$parseUNION();
                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                    s0 = peg$parseUNIQUE();
                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                      s0 = peg$parseUPDATE();
                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                        s0 = peg$parseUSING();
                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                          s0 = peg$parseVACUUM();
                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                            s0 = peg$parseVALUES();
                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                              s0 = peg$parseVIEW();
                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                s0 = peg$parseVIRTUAL();
                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                  s0 = peg$parseWHEN();
                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                    s0 = peg$parseWHERE();
                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                      s0 = peg$parseWITHOUT();
                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                        s0 = peg$parseWITH();
                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                          s0 = peg$parseNULL();
                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                            s0 = peg$parseNOT();
                                                                                                                                                                                                                                            if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                              s0 = peg$parseIN();
                                                                                                                                                                                                                                              if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                s0 = peg$parseIF();
                                                                                                                                                                                                                                                if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                  s0 = peg$parseIS();
                                                                                                                                                                                                                                                  if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                    s0 = peg$parseOF();
                                                                                                                                                                                                                                                    if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                      s0 = peg$parseON();
                                                                                                                                                                                                                                                      if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                        s0 = peg$parseOR();
                                                                                                                                                                                                                                                        if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                          s0 = peg$parseNO();
                                                                                                                                                                                                                                                          if (s0 === peg$FAILED) {
                                                                                                                                                                                                                                                            s0 = peg$parseAS();
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "reserved_word_list",
        description: peg$descNames["reserved_word_list"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "reserved_word_list",
        description: peg$descNames["reserved_word_list"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecomment() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "comment",
        description: peg$descNames["comment"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsecomment_line();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsecomment_block();
        if (s1 !== peg$FAILED) {
          peg$savedPos = s0;
          s1 = peg$c166();
        }
        s0 = s1;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "comment",
        description: peg$descNames["comment"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "comment",
        description: peg$descNames["comment"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecomment_line() {
      var s0, s1, s2, s3, s4, s5, s6,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "comment_line",
        description: peg$descNames["comment_line"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsesym_minus();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_minus();
        if (s2 !== peg$FAILED) {
          s3 = [];
          s4 = peg$currPos;
          s5 = peg$currPos;
          peg$silentFails++;
          s6 = peg$parsewhitespace_line();
          peg$silentFails--;
          if (s6 === peg$FAILED) {
            s5 = void 0;
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
          if (s5 !== peg$FAILED) {
            s6 = peg$parsematch_all();
            if (s6 !== peg$FAILED) {
              s5 = [s5, s6];
              s4 = s5;
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          while (s4 !== peg$FAILED) {
            s3.push(s4);
            s4 = peg$currPos;
            s5 = peg$currPos;
            peg$silentFails++;
            s6 = peg$parsewhitespace_line();
            peg$silentFails--;
            if (s6 === peg$FAILED) {
              s5 = void 0;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
            if (s5 !== peg$FAILED) {
              s6 = peg$parsematch_all();
              if (s6 !== peg$FAILED) {
                s5 = [s5, s6];
                s4 = s5;
              } else {
                peg$currPos = s4;
                s4 = peg$FAILED;
              }
            } else {
              peg$currPos = s4;
              s4 = peg$FAILED;
            }
          }
          if (s3 !== peg$FAILED) {
            s1 = [s1, s2, s3];
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c727); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "comment_line",
        description: peg$descNames["comment_line"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "comment_line",
        description: peg$descNames["comment_line"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecomment_block() {
      var s0, s1, s2, s3, s4,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "comment_block",
        description: peg$descNames["comment_block"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      s0 = peg$currPos;
      s1 = peg$parsecomment_block_start();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsecomment_block_feed();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsecomment_block_end();
          if (s3 !== peg$FAILED) {
            s4 = peg$parseo();
            if (s4 !== peg$FAILED) {
              s1 = [s1, s2, s3, s4];
              s0 = s1;
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c728); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "comment_block",
        description: peg$descNames["comment_block"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "comment_block",
        description: peg$descNames["comment_block"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecomment_block_start() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "comment_block_start",
        description: peg$descNames["comment_block_start"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_fslash();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_star();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "comment_block_start",
        description: peg$descNames["comment_block_start"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "comment_block_start",
        description: peg$descNames["comment_block_start"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecomment_block_end() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "comment_block_end",
        description: peg$descNames["comment_block_end"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parsesym_star();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesym_fslash();
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "comment_block_end",
        description: peg$descNames["comment_block_end"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "comment_block_end",
        description: peg$descNames["comment_block_end"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecomment_block_body() {
      var s0, s1, s2, s3,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "comment_block_body",
        description: peg$descNames["comment_block_body"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = [];
      s1 = peg$currPos;
      s2 = peg$currPos;
      peg$silentFails++;
      s3 = peg$parsecomment_block_end();
      peg$silentFails--;
      if (s3 === peg$FAILED) {
        s2 = void 0;
      } else {
        peg$currPos = s2;
        s2 = peg$FAILED;
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parsematch_all();
        if (s3 !== peg$FAILED) {
          s2 = [s2, s3];
          s1 = s2;
        } else {
          peg$currPos = s1;
          s1 = peg$FAILED;
        }
      } else {
        peg$currPos = s1;
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        while (s1 !== peg$FAILED) {
          s0.push(s1);
          s1 = peg$currPos;
          s2 = peg$currPos;
          peg$silentFails++;
          s3 = peg$parsecomment_block_end();
          peg$silentFails--;
          if (s3 === peg$FAILED) {
            s2 = void 0;
          } else {
            peg$currPos = s2;
            s2 = peg$FAILED;
          }
          if (s2 !== peg$FAILED) {
            s3 = peg$parsematch_all();
            if (s3 !== peg$FAILED) {
              s2 = [s2, s3];
              s1 = s2;
            } else {
              peg$currPos = s1;
              s1 = peg$FAILED;
            }
          } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
          }
        }
      } else {
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "comment_block_body",
        description: peg$descNames["comment_block_body"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "comment_block_body",
        description: peg$descNames["comment_block_body"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseblock_body_nodes() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "block_body_nodes",
        description: peg$descNames["block_body_nodes"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsecomment_block_body();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment_block();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "block_body_nodes",
        description: peg$descNames["block_body_nodes"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "block_body_nodes",
        description: peg$descNames["block_body_nodes"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsecomment_block_feed() {
      var s0, s1, s2, s3, s4, s5,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "comment_block_feed",
        description: peg$descNames["comment_block_feed"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = peg$parseblock_body_nodes();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parseo();
        if (s4 !== peg$FAILED) {
          s5 = peg$parseblock_body_nodes();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parseo();
          if (s4 !== peg$FAILED) {
            s5 = peg$parseblock_body_nodes();
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (s2 !== peg$FAILED) {
          s1 = [s1, s2];
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "comment_block_feed",
        description: peg$descNames["comment_block_feed"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "comment_block_feed",
        description: peg$descNames["comment_block_feed"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsematch_all() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "match_all",
        description: peg$descNames["match_all"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      if (input.length > peg$currPos) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c730); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c729); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "match_all",
        description: peg$descNames["match_all"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "match_all",
        description: peg$descNames["match_all"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parseo() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "o",
        description: peg$descNames["o"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsewhitespace_nodes();
      while (s2 !== peg$FAILED) {
        s1.push(s2);
        s2 = peg$parsewhitespace_nodes();
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c8(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "o",
        description: peg$descNames["o"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "o",
        description: peg$descNames["o"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsee() {
      var s0, s1, s2,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "e",
        description: peg$descNames["e"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$currPos;
      s1 = [];
      s2 = peg$parsewhitespace_nodes();
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          s2 = peg$parsewhitespace_nodes();
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$c8(s1);
      }
      s0 = s1;

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "e",
        description: peg$descNames["e"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "e",
        description: peg$descNames["e"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsewhitespace_nodes() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "whitespace_nodes",
        description: peg$descNames["whitespace_nodes"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsewhitespace();
      if (s0 === peg$FAILED) {
        s0 = peg$parsecomment();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "whitespace_nodes",
        description: peg$descNames["whitespace_nodes"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "whitespace_nodes",
        description: peg$descNames["whitespace_nodes"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsewhitespace() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "whitespace",
        description: peg$descNames["whitespace"],
        location: peg$computeLocation(startPos, startPos)
      });

      s0 = peg$parsewhitespace_space();
      if (s0 === peg$FAILED) {
        s0 = peg$parsewhitespace_line();
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "whitespace",
        description: peg$descNames["whitespace"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "whitespace",
        description: peg$descNames["whitespace"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsewhitespace_space() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "whitespace_space",
        description: peg$descNames["whitespace_space"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      if (peg$c732.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c733); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c731); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "whitespace_space",
        description: peg$descNames["whitespace_space"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "whitespace_space",
        description: peg$descNames["whitespace_space"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parsewhitespace_line() {
      var s0, s1,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "whitespace_line",
        description: peg$descNames["whitespace_line"],
        location: peg$computeLocation(startPos, startPos)
      });

      peg$silentFails++;
      if (peg$c735.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c736); }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c734); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "whitespace_line",
        description: peg$descNames["whitespace_line"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "whitespace_line",
        description: peg$descNames["whitespace_line"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }

    function peg$parse_TODO_() {
      var s0,
          startPos = peg$currPos;

      peg$tracer.trace({
        type:     "rule.enter",
        rule:     "_TODO_",
        description: peg$descNames["_TODO_"],
        location: peg$computeLocation(startPos, startPos)
      });

      if (input.substr(peg$currPos, 8) === peg$c737) {
        s0 = peg$c737;
        peg$currPos += 8;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c738); }
      }

      if (s0 !== peg$FAILED) {
        peg$tracer.trace({
          type:   "rule.match",
          rule:   "_TODO_",
        description: peg$descNames["_TODO_"],
          result: s0,
          location: peg$computeLocation(startPos, peg$currPos)
        });
      } else {
        peg$tracer.trace({
          type: "rule.fail",
          rule: "_TODO_",
        description: peg$descNames["_TODO_"],
          location: peg$computeLocation(startPos, startPos)
        });
      }

      return s0;
    }


      var util = require('./parser-util');


    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(
        null,
        peg$maxFailExpected,
        peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null,
        peg$maxFailPos < input.length
          ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
          : peg$computeLocation(peg$maxFailPos, peg$maxFailPos)
      );
    }
  }

  return {
    SyntaxError:   peg$SyntaxError,
    DefaultTracer: peg$DefaultTracer,
    parse:         peg$parse
  };
})();

},{"./parser-util":2}],4:[function(require,module,exports){
/*!
 * sqlite-parser
 * @copyright Code School 2015 {@link http://codeschool.com}
 * @author Nick Wronski <nick@javascript.com>
 */
var parserUtils = require('./parser-util');

module.exports = (function (util) {
  Tracer = function Tracer() {
    if (!(this instanceof Tracer)) {
      return new Tracer();
    }
    this.events = [];
    this.indentation = 0;
  };

  Tracer.prototype.trace = function trace(event) {
    var that = this;
    event.indentation = this.indentation;
    switch (event.type) {
      case 'rule.enter':
        // add entered leaf
        this.events.push(event);
        this.indentation += 1;
        break;
      case 'rule.match':
        /*
         * TODO: need to remove entire statement from events once fully
         *       matched as right now the last location from the previous
         *       statement is reported when there is an error within a
         *       statement that follows it
         */
        this.indentation -= 1;
        break;
      case 'rule.fail':
        // remove failed leaf
        this.events.splice(util.findLastIndex(this.events, {rule: event.rule}), 1);
        this.indentation -= 1;
        break;
    }
  };

  Tracer.prototype.smartError = function smartError(err) {
    var message, location, chain, chainDetail,
        lastIndent = 10000,
        bestDescriptor = false;

    chain = this.events.filter(function (e) {
      // Only use nodes with a set description
      return e.description !== '' && !/whitespace|(semi$)|(^[oe]$)/i.test(e.rule);
    })
    .reverse()
    .filter(function (e) {
      if (e.indentation < lastIndent) {
        // Keep this node and update last indentation
        lastIndent = e.indentation;
        return true;
      } else {
        // Prune this node from a previous match sequence
        return false;
      }
    });

    if (chain.length) {
      // Get best location data
      location = util.first(chain).location;
      // Collect descriptions
      chain = util.takeWhile(util.pluck(chain, 'description'), function (d) {
        if (!bestDescriptor && /(Statement|Clause)$/i.test(d)) {
          bestDescriptor = true;
          return true;
        }
        return !bestDescriptor;
      })
      .reverse();
      // Don't accidentally repeat the first description in the output
      chainDetail = util.takeRight(util.rest(chain), 2);
      message = 'Syntax error found near ' + util.first(chain) +
                (chainDetail.length > 0 ? ' (' + chainDetail.join(', ') + ')' : '');
      //location = this.events.findLast({description: chain.last()}).location;
      util.extend(err, {
        'message': message,
        'location': location
      });
    }
    throw err;
  }

  return Tracer;
})(parserUtils);

},{"./parser-util":2}],5:[function(require,module,exports){
/*global define:false require:false */
module.exports = (function(){
	// Import Events
	var events = require('events')

	// Export Domain
	var domain = {}
	domain.createDomain = domain.create = function(){
		var d = new events.EventEmitter()

		function emitError(e) {
			d.emit('error', e)
		}

		d.add = function(emitter){
			emitter.on('error', emitError)
		}
		d.remove = function(emitter){
			emitter.removeListener('error', emitError)
		}
		d.bind = function(fn){
			return function(){
				var args = Array.prototype.slice.call(arguments)
				try {
					fn.apply(null, args)
				}
				catch (err){
					emitError(err)
				}
			}
		}
		d.intercept = function(fn){
			return function(err){
				if ( err ) {
					emitError(err)
				}
				else {
					var args = Array.prototype.slice.call(arguments, 1)
					try {
						fn.apply(null, args)
					}
					catch (err){
						emitError(err)
					}
				}
			}
		}
		d.run = function(fn){
			try {
				fn()
			}
			catch (err) {
				emitError(err)
			}
			return this
		};
		d.dispose = function(){
			this.removeAllListeners()
			return this
		};
		d.enter = d.exit = function(){
			return this
		}
		return d
	};
	return domain
}).call(this)
},{"events":6}],6:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
'use strict';

var asap = require('asap/raw');

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('not a function');
  }
  this._41 = 0;
  this._86 = null;
  this._17 = [];
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._1 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
};
function handle(self, deferred) {
  while (self._41 === 3) {
    self = self._86;
  }
  if (self._41 === 0) {
    self._17.push(deferred);
    return;
  }
  asap(function() {
    var cb = self._41 === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._41 === 1) {
        resolve(deferred.promise, self._86);
      } else {
        reject(deferred.promise, self._86);
      }
      return;
    }
    var ret = tryCallOne(cb, self._86);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._41 = 3;
      self._86 = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._41 = 1;
  self._86 = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._41 = 2;
  self._86 = newValue;
  finale(self);
}
function finale(self) {
  for (var i = 0; i < self._17.length; i++) {
    handle(self, self._17[i]);
  }
  self._17 = null;
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  })
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}

},{"asap/raw":10}],9:[function(require,module,exports){
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js');
var asap = require('asap/raw');

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new Promise(Promise._1);
  p._41 = 1;
  p._86 = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._41 === 3) {
            val = val._86;
          }
          if (val._41 === 1) return res(i, val._86);
          if (val._41 === 2) reject(val._86);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};

},{"./core.js":8,"asap/raw":10}],10:[function(require,module,exports){
(function (process){
"use strict";

var domain; // The domain module is executed on demand
var hasSetImmediate = typeof setImmediate === "function";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including network IO events in Node.js.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Avoids a function call
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory excaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

rawAsap.requestFlush = requestFlush;
function requestFlush() {
    // Ensure flushing is not bound to any domain.
    // It is not sufficient to exit the domain, because domains exist on a stack.
    // To execute code outside of any domain, the following dance is necessary.
    var parentDomain = process.domain;
    if (parentDomain) {
        if (!domain) {
            // Lazy execute the domain module.
            // Only employed if the user elects to use domains.
            domain = require("domain");
        }
        domain.active = process.domain = null;
    }

    // `setImmediate` is slower that `process.nextTick`, but `process.nextTick`
    // cannot handle recursion.
    // `requestFlush` will only be called recursively from `asap.js`, to resume
    // flushing after an error is thrown into a domain.
    // Conveniently, `setImmediate` was introduced in the same version
    // `process.nextTick` started throwing recursion errors.
    if (flushing && hasSetImmediate) {
        setImmediate(flush);
    } else {
        process.nextTick(flush);
    }

    if (parentDomain) {
        domain.active = process.domain = parentDomain;
    }
}

}).call(this,require('_process'))
},{"_process":7,"domain":5}]},{},[1]);
