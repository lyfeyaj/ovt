'use strict';

const utils = require('../utils');
const AnyType = require('./any');

const hasBufferSupported = typeof Buffer !== 'undefined';

function BufferType() {
  AnyType.call(this);

  this._type = 'buffer';
  this._defaultValidator = 'isBuffer';
}

utils.inherits(BufferType, AnyType);

let proto = BufferType.prototype;

proto.convert = function(val) {
  return hasBufferSupported ?
         (val instanceof Buffer ? val : new Buffer(val)) :
         val;
};

utils.addChainableMethod(proto, 'isBuffer', function(val) {
  return hasBufferSupported ? (val instanceof Buffer) : false;
});

module.exports = BufferType;
