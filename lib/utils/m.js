'use strict';

module.exports = function m(method, options) {
  let locale = options.locale;
  if (method && method.locale) {
    return method.locale.__msg[locale];
  }
};
