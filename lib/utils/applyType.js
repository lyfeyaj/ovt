'use strict';

module.exports = function(name, Type) {
  let instance = new Type();
  return instance._defaultValidator ? instance[instance._defaultValidator] : instance;
};
