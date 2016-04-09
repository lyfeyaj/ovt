'use strict';

const AnyType = require('./any');
const utils = require('../utils');

function BooleanType() {
  AnyType.call(this);

  this._type = 'boolean';
  this._defaultValidator = 'isBoolean';
}

utils.inherits(BooleanType, AnyType);

let proto = BooleanType.prototype;

proto.convert = function(val) {
  return utils.isBoolean(val) ? val : Boolean(val).valueOf();
};

utils.addChainableMethod(proto, 'isBoolean', function(val) {
  return utils.isBoolean(val);
});

module.exports = BooleanType;
