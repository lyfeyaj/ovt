'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function BooleanType() {
  AnyType.call(this);

  this._type = 'boolean';
}

inherits(BooleanType, AnyType);

let proto = BooleanType.prototype;

proto.convert = function(val) { return Boolean(val).valueOf(); };

utils.addChainableMethod(proto, 'isBoolean', function(val) {
  return _.isBoolean(val);
});

module.exports = BooleanType;
