const cloneArray = require('./cloneArray');

module.exports = function(args) {
  if (args.length) {
    if (args.length === 1 && Array.isArray(args[0])) {
      return args[0];
    } else {
      return cloneArray(args);
    }
  } else {
    return [];
  }
};
