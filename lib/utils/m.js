'use strict';

module.exports = function m(method, locale) {
  if (method && method.locale) {
    return method.locale.__msg[locale];
  }
};
