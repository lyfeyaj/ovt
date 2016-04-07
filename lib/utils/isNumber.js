'use strict';

const isObject = require('./isObject');
const obj2Str = require('./obj2Str');
const NumberTag = '[object Number]';

module.exports = function isNumber(value) {
  return typeof value === 'number' ||
         (isObject(value) && obj2Str(value) === NumberTag);
};
