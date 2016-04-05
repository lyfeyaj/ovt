'use strict';

module.exports = function buildPath(state) {
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
