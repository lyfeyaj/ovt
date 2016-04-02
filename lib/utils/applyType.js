'use strict';

const _ = require('lodash');

module.exports = function(name, Type) {
  let instance = new Type();
  let defaultValidator = `is${_.capitalize(name)}`;
  return instance[defaultValidator];
};
