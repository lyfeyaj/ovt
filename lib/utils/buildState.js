'use strict';

const cloneArray = require('./cloneArray');

/**
 * ### buildState (state)
 **/
module.exports = function buildState() {
  let args = cloneArray(arguments);
  let state = {
    parentPath: '',
    key: '',
    parentType: 'any',
    parentObj: undefined,
    original: undefined,
    hasErrors: false
  };
  for (let i = 0; i < args.length; i++) {
    Object.assign(state, args[i]);
  }
  return state;
};
