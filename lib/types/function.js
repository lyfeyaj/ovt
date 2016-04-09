'use strict';

const AnyType = require('./any');
const utils = require('../utils');
const addChainableMethod = utils.addChainableMethod;

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

addChainableMethod(proto, 'isFunction', function(val) {
  return utils.isFunction(val);
});

addChainableMethod(proto, 'arity', function(length) {
  return length === (arguments.length - 1);
});

addChainableMethod(proto, 'minArity', function(length) {
  return length >= (arguments.length - 1);
});

addChainableMethod(proto, 'maxArity', function(length) {
  return length <= (arguments.length - 1);
});

module.exports = FunctionType;
