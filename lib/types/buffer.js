'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function BufferType() {
  AnyType.call(this);

  this._type = 'buffer';
  this._defaultValidator = 'isBuffer';
}

inherits(BufferType, AnyType);

let proto = BufferType.prototype;

proto.convert = function(val) {
  return _.isBuffer(val) ? val : new Buffer(val);
};

utils.addChainableMethod(proto, 'isBuffer', function(val) {
  return Buffer.isBuffer(val);
});

module.exports = BufferType;
