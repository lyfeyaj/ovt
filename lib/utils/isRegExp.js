'use strict';

const isObject = require('./isObject');
const obj2Str = require('./obj2Str');
const RegExpTag = '[object RegExp]';

module.exports = function isRegExp(value) {
  return isObject(value) && obj2Str(value) === RegExpTag;
};
