'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function ArrayType() {
  AnyType.call(this);

  this._type = 'array';
}

inherits(ArrayType, AnyType);

let proto = ArrayType.prototype;

utils.addChainableMethod(proto, 'isArray', function(val) {
  return _.isArray(val);
});

module.exports = ArrayType;
