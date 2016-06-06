'use strict';

const isRef = require('./isRef');
const magico = require('magico');

module.exports = function invokeMethod(method, val, state) {
  state = state || {
    parentPath: '',
    key: '',
    parentType: 'any',
    parentObj: undefined,
    original: undefined,
    hasErrors: false
  };

  let args = (method.args || []).map(function(arg) {
    if (isRef(arg)) {
      return magico.get(state.parentObj, arg.__key);
    } else {
      return arg;
    }
  });

  args.unshift(val);

  return method.fn.apply(state, args);
};
