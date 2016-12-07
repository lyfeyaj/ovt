'use strict';

const isRef = require('./isRef');
const cloneArray = require('./cloneArray');
const magico = require('magico');

module.exports = function invokeMethod(method, val, state) {
  state = state || {
    path: '',
    key: '',
    value: undefined,
    origin: undefined,
    hasErrors: false
  };

  let args = (method.args || []).map(function(arg) {
    if (isRef(arg)) {
      return magico.get(state.value, arg.__key);
    } else {
      return arg;
    }
  });

  state.args = cloneArray(args);

  args.unshift(val);

  return method.fn.apply(state, args);
};
