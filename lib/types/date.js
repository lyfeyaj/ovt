'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function DateType() {
  AnyType.call(this);

  this._type = 'date';
  this._defaultValidator = 'isDate';
}

utils.inherits(DateType, AnyType);

let proto = DateType.prototype;

proto.convert = function(val) {
  return utils.isDate(val) ? val : new Date(val);
};

utils.addChainableMethod(proto, 'isDate', function(val) {
  return utils.isDate(val);
});

module.exports = DateType;
