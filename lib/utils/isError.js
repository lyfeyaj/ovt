'use strict';

const obj2Str = require('./obj2Str');
const errorTag = '[object Error]';

module.exports = function isError(value) {
  let isObjectLike = !!value && (typeof value === 'object');
  if (!isObjectLike) return false;
  return (obj2Str(value) === errorTag) ||
         (typeof value.message === 'string' && typeof value.name === 'string');
};
