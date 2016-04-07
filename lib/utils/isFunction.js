'use strict';

const isObject = require('./isObject');
const obj2Str = require('./obj2Str');

const FunctionTag = '[object Function]';
const GeneratorTag = '[object GeneratorFunction]';

module.exports = function isFunction(value) {
  let tag = isObject(value) ? obj2Str(value) : '';
  return tag === FunctionTag || tag === GeneratorTag;
};
