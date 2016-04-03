'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function BufferType() {
  AnyType.call(this);

  this._type = 'buffer';
}

inherits(BufferType, AnyType);

let proto = BufferType.prototype;

proto.convert = function(val) { return new Buffer(val); };

utils.addChainableMethod(proto, 'isBuffer', function(val) {
  return _.isBuffer(val);
});

module.exports = BufferType;
