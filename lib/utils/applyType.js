'use strict';

module.exports = function(Type, args) {
  let instance = new (Function.prototype.bind.apply(Type, args));
  return instance._defaultValidator ? instance[instance._defaultValidator]() : instance;
};
