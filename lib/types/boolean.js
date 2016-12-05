'use strict';

const AnyType = require('./any');
const utils = require('../utils');

function BooleanType() {
  AnyType.call(this);

  this._type = 'boolean';
  this._defaultValidator = 'isBoolean';
}

utils.inherits(BooleanType, AnyType);

const proto = BooleanType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return utils.isBoolean(val) ? val : Boolean(val).valueOf();
};

chainable('isBoolean', {
  method: function(val) {
    return utils.isBoolean(val);
  }
});

module.exports = BooleanType;
