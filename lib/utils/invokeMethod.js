'use strict';

const buildState = require('./buildState');
const cloneArray = require('./cloneArray');

module.exports = function invokeMethod(method, val, state) {
  state = state || buildState(state);
  var args = cloneArray(method.args || []);

  args.unshift(val);

  return method.fn.apply(state, args);
};
