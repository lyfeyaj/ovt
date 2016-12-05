'use strict';

const cloneArray = require('./cloneArray');
const isArray = require('./isArray');

module.exports = function parseArg(args) {
  if (args && args.length) {
    if (args.length === 1 && isArray(args[0])) {
      return args[0];
    } else {
      return cloneArray(args);
    }
  }

  return [];
};
