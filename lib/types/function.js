'use strict';

const AnyType = require('./any');
const utils = require('../utils');

function FunctionType() {
  AnyType.call(this);

  this._type = 'function';
  this._defaultValidator = 'isFunction';
}

utils.inherits(FunctionType, AnyType);

const proto = FunctionType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return utils.isFunction(val) ? val : new Function(val);
};

chainable('isFunction', {
  method: function(val) {
    return utils.isFunction(val);
  }
});

chainable('arity', {
  method: function(length) {
    return length === (arguments.length - 1);
  }
});

chainable('minArity', {
  method: function(length) {
    return length >= (arguments.length - 1);
  }
});

chainable('maxArity', {
  method: function(length) {
    return length <= (arguments.length - 1);
  }
});

module.exports = FunctionType;
