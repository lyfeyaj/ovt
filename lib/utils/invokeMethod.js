'use strict';

const cloneArray = require('./cloneArray');
const magico = require('magico');

module.exports = function invokeMethod(method, val, state) {
  state = state || {
    path: '',
    key: '',
    value: undefined,
    hasErrors: false
  };

  let args = cloneArray(method.args);

  // replace reference value
  for (let key in method.refs) {
    args[key] = magico.get(state.value, method[key].__key);
  }

  state.args = args;

  return method.fn.apply(state, [val].concat(args));
};
