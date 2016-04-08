'use strict';
module.exports = function ok(condition, message) {
  if (!condition) {
    let error = new Error(message);
    error.name = 'AssertionError';
    throw error;
  }
};
