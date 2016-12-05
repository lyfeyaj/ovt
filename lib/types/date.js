'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function DateType() {
  AnyType.call(this);

  this._type = 'date';
  this._defaultValidator = 'isDate';
}

utils.inherits(DateType, AnyType);

const proto = DateType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return utils.isDate(val) ? val : new Date(val);
};

chainable('isDate', {
  method: function(val) {
    return utils.isDate(val);
  }
});

module.exports = DateType;
