'use strict';

const isObject = require('./isObject');
const obj2Str = require('./obj2Str');
const booleanTag = '[object Boolean]';

module.exports = function isBoolean(value) {
  if (typeof value === 'boolean') return true;
  return isObject(value) && obj2Str(value) === booleanTag;
};
