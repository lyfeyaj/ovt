'use strict';

module.exports = function merge(source, target) {
  source = source || {};
  target = target || {};

  for (let key in target) {
    source[key] = target[key];
  }

  return source;
};
