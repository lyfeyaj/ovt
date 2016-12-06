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

const chainable = utils.chainable(NumberType.prototype);

chainable('isNumber', { method: utils.isNumber });

module.exports = NumberType;
