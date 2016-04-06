'use strict';

// Wrapper method with proper error message
module.exports = function tryCatch(type, name, method) {
  return function () {
    let result = null;

    try {
      result = method.apply(this, arguments);
    }
    catch (e) {
      result = e;
    }

    if (type !== 'validator') return result;

    // return Error directly
    if (result instanceof Error) {
      return result;
    }
    // wrap a string with Error
    else if (typeof result === 'string') {
      new Error(result);
    }
    // return Error of default message when validation failed
    else if (result === false) {
      let message = 'validation failed';
      return new Error(message);
    }
  };
};
