'use strict';

const utils = require('../utils');
const AnyType = require('./any');

class NumberType extends AnyType {
  constructor() {
    super();

    this._type = 'number';
    this._defaultValidator = 'isNumber';
  }

  convert(val) {
    return utils.isNumber(val) ? val : Number(val);
  }
}

const chainable = utils.chainable(NumberType.prototype, 'number');

chainable('isNumber', { method: utils.isNumber });

chainable('isInteger', 'integer', {
  method: function(val) {
    return Number.isInteger(val);
  }
});

chainable('isInteger', 'integer', {
  method: function(val) {
    return Number.isInteger(val);
  }
});

chainable('isPositive', 'positive', {
  method: function(val) {
    return val > 0;
  }
});

chainable('isNegative', 'negative', {
  method: function(val) {
    return val < 0;
  }
});

chainable('min', {
  method: function(val, min) {
    return val >= min;
  }
});

chainable('max', {
  method: function(val, max) {
    return val <= max;
  }
});

module.exports = NumberType;
