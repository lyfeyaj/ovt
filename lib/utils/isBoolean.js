'use strict';

const isObject = require('./isObject');
const obj2Str = require('./obj2Str');
const BooleanTag = '[object Boolean]';

module.exports = function isBoolean(value) {
  return isObject(value) && obj2Str(value) === BooleanTag;
};
