'use strict';

module.exports = function isRef(obj) {
  if (!obj) return false;
  return obj && obj.__isRef === true;
};
