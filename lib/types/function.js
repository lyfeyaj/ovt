'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function FunctionType() {
  AnyType.call(this);

  this._type = 'function';
  this._defaultValidator = 'isFunction';
}

utils.inherits(FunctionType, AnyType);

let proto = FunctionType.prototype;

proto.convert = function(val) {
  return utils.isFunction(val) ? val : new Function(val);
};

utils.addChainableMethod(proto, 'isFunction', function(val) {
  return utils.isFunction(val);
});

utils.addChainableMethod(proto, 'arity', function(length) {
  return length === (arguments.length - 1);
});

utils.addChainableMethod(proto, 'minArity', function(length) {
  return length >= (arguments.length - 1);
});

utils.addChainableMethod(proto, 'maxArity', function(length) {
  return length <= (arguments.length - 1);
});

module.exports = FunctionType;
