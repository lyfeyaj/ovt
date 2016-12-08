'use strict';

const isArray = require('./isArray');
const isUndefined = require('./isUndefined');

module.exports = function castArray() {
  if (!arguments.length) return [];
  let value = arguments[0];
  return isArray(value) ? value : (isUndefined(value) ? [] : [value]);
};
