'use strict';

module.exports = function buildPath(path, key) {
  path = path || '';
  if (key == null || key !== key || key === '') return path;
  return path ? path + '.' + key : key;
};
