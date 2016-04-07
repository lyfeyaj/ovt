'use strict';

const buildState = require('./buildState');
const cloneArray = require('./cloneArray');
const isRef = require('./isRef');
const magico = require('magico');

module.exports = function invokeMethod(method, val, state) {
  state = state || buildState(state);
  var args = cloneArray(method.args || []);

  args = args.map(function(arg) {
    if (isRef(arg)) {
      return magico.get(state.parentObj, arg.__key);
    } else {
      return arg;
    }
  });

  args.unshift(val);

  return method.fn.apply(state, args);
};
