'use strict';

module.exports = function l(method, options) {
  let currentLocale = options.currentLocale;
  if (method && method.locale) {
    return method.locale.__msg[currentLocale];
  }
};
