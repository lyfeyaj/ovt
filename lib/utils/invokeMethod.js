'use strict';

const _ = require('lodash');
const buildState = require('./buildState');
const cloneArray = require('./cloneArray');
const isRef = require('./isRef');

module.exports = function invokeMethod(method, val, state) {
  state = state || buildState(state);
  var args = cloneArray(method.args || []);

  args = _.map(args, function(arg) {
    if (isRef(arg)) {
      return _.get(state.parentObj, arg.__key);
    } else {
      return arg;
    }
  });

  args.unshift(val);

  return method.fn.apply(state, args);
};
