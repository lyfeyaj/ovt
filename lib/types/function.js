'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function FunctionType() {
  AnyType.call(this);

  this._type = 'function';
}

inherits(FunctionType, AnyType);

let proto = FunctionType.prototype;

utils.addChainableMethod(proto, 'isFunction', function(val) {
  return _.isFunction(val);
});

module.exports = FunctionType;
