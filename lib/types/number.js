'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function NumberType() {
  AnyType.call(this);

  this._type = 'number';
  this._defaultValidator = 'isNumber';
}

utils.inherits(NumberType, AnyType);

const proto = NumberType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return utils.isNumber(val) ? val : Number(val);
};

chainable('isNumber', {
  method: function(val) {
    return utils.isNumber(val);
  }
});

module.exports = NumberType;
