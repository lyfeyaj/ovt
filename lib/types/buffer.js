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

const proto = BufferType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return hasBufferSupported ?
         (val instanceof Buffer ? val : new Buffer(val)) :
         val;
};

chainable('isBuffer', {
  method: function(val) {
    return hasBufferSupported ? (val instanceof Buffer) : false;
  }
});

module.exports = BufferType;
