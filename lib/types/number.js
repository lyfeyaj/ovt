'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function NumberType() {
  AnyType.call(this);

  this._type = 'number';
}

inherits(NumberType, AnyType);

let proto = NumberType.prototype;

utils.addChainableMethod(proto, 'isNumber', function(val) {
  return _.isNumber(val);
});

module.exports = NumberType;
