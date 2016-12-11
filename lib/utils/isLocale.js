'use strict';

module.exports = function isLocale(obj) {
  if (!obj) return false;
  return obj && obj.__isLocale === true;
};
