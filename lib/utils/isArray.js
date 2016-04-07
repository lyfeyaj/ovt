'use strict';

const isObject = require('./isObject');
const obj2Str = require('./obj2Str');
const arrayTag = '[object Array]';

const nativeIsArray = Array.isArray;

module.exports = function isArray(value) {
  return nativeIsArray ? nativeIsArray(value) : (isObject() && obj2Str(value) === arrayTag);
};
