'use strict';

const isError = require('./isError');
const isString = require('./isString');

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
    if (isError(result)) {
      return result;
    }
    // wrap a string with Error
    else if (isString(result)) {
      new Error(result);
    }
    // return Error of default message when validation failed
    else if (result === false) {
      let message = 'validation failed';
      return new Error(message);
    }
  };
};
