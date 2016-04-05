'use strict';

const buildState = require('./buildState');

module.exports = function(method, val, state) {
  state = state || buildState(state);
  var args = (method.args || []).slice();

  args.unshift(val);

  return method.fn.apply(state, args);
};
