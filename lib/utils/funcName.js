var bue = require('bue');
var obj2Str = require('./obj2Str');

module.exports = function(fn) {
  bue.assert(bue.isFunction(fn), `${obj2Str(fn)} is not a valid function`);
  var counter = Date.now() % 1e9;
  if (fn.name) return fn.name;
  return '__ovt' + (Math.random() * 1e9 >>> 0) + (counter++ + '__');
};
