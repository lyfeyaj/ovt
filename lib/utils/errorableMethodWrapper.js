'use strict';

// Wrapper method with proper error message
module.exports = function errorableMethodWrapper(type, name, method) {
  return function() {
    let message = `${type} '${name}' failed`;
    let result = method.apply(this, arguments);
    if (type === 'sanitizer') return result;
    if (result instanceof Error) {
      return result;
    } else if (typeof result === 'string') {
      new Error(result);
    } else if (result === false) {
      return new Error(message);
    }
  };
};
