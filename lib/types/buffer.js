'use strict';

const utils = require('../utils');
const AnyType = require('./any');

const supportBuffer = typeof Buffer !== 'undefined';

class BufferType extends AnyType {
  constructor() {
    super();

    this._type = 'buffer';
    this._defaultValidator = 'isBuffer';
  }

  convert(val) {
    return supportBuffer ? (val instanceof Buffer ? val : new Buffer(val)) : val;
  }
}

const chainable = utils.chainable(BufferType.prototype);

chainable('isBuffer', {
  method: function(val) {
    return supportBuffer ? (val instanceof Buffer) : false;
  }
});

module.exports = BufferType;
