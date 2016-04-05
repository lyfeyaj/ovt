'use strict';

const _ = require('lodash');

/**
 * ### buildState (state)
 **/
module.exports = function buildState() {
  let args = Array.from(arguments);
  let defaultState = {
    parentPath: '',
    key: '',
    parentType: 'any',
    parentObj: undefined,
    original: undefined,
    hasErrors: false
  };
  args.unshift(defaultState);
  args.unshift({});
  return _.extend.apply(_, args);
};
