'use strict';

const isObject = require('./isObject');
const isArray = require('./isArray');
const obj2Str = require('./obj2Str');
const stringTag = '[object String]';

module.exports = function isString(value) {
  return typeof value === 'string' ||
         (!isArray(value) && isObject(value) && obj2Str(value) === stringTag);
};
