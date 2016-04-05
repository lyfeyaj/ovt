'use strict';

const buildState = require('./buildState');

module.exports = function buildPath() {
  let state = buildState.apply(this, arguments);

  let key = state.key;
  let parentPath = state.parentPath || '';
  if (key === null || key === undefined || Number.isNaN(key)) return parentPath;

  if (state.parentType === 'array' && Number.isInteger(key)) {
    return parentPath + `[${key}]`;
  } else {
    if (key === '') {
      return parentPath;
    } else {
      return parentPath ? `${parentPath}.${key}` : key;
    }
  }
};
