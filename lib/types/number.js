'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function NumberType() {
  AnyType.call(this);

  this._type = 'number';
  this._defaultValidator = 'isNumber';
}

utils.inherits(NumberType, AnyType);

let proto = NumberType.prototype;

proto.convert = function(val) {
  return utils.isNumber(val) ? val : Number(val);
};

utils.addChainableMethod(proto, 'isNumber', function(val) {
  return utils.isNumber(val);
});

module.exports = NumberType;
