'use strict';

const isObject = require('./isObject');
const obj2Str = require('./obj2Str');
const DateTag = '[object Date]';

module.exports = function isDate(value) {
  return isObject(value) && obj2Str(value) === DateTag;
};
