'use strict';

const _ = require('lodash');
const buildState = require('./buildState');

module.exports = function buildPath() {
  let state = buildState.apply(this, arguments);

  let key = state.key;
  let parentPath = state.parentPath || '';
  if (_.isNil(key)) return parentPath;

  if (state.parentType === 'array' && _.isNumber(key)) {
    return parentPath + `[${key}]`;
  } else {
    if (key === '') {
      return parentPath;
    } else {
      return parentPath ? `${parentPath}.${key}` : key;
    }
  }
};
