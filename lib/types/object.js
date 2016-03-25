'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function ObjectType() {
  AnyType.call(this);

  this._type = 'object';
}

inherits(ObjectType, AnyType);

let proto = ObjectType.prototype;

utils.addChainableMethod(proto, 'isObject', function(val) {
  return _.isObject(val);
});

module.exports = ObjectType;
