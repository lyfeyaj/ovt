const _ = require('lodash');

module.exports = function(args) {
  if (args.length) {
    if (args.length === 1 && _.isArray(args[0])) {
      return args[0];
    } else {
      return Array.from(args);
    }
  } else {
    return [];
  }
};
