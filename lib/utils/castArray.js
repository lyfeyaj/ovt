'use strict';

const isArray = require('./isArray');

module.exports = function castArray() {
  if (!arguments.length) return [];
  let value = arguments[0];
  return isArray(value) ? value : [value];
};
