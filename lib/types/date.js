'use strict';

const utils = require('../utils');
const AnyType = require('./any');

class DateType extends AnyType {
  constructor() {
    super();

    this._type = 'date';
    this._defaultValidator = 'isDate';
  }

  convert(val) {
    return utils.isDate(val) ? val : new Date(val);
  }
}

const chainable = utils.chainable(DateType.prototype, 'date');

chainable('isDate', { method: utils.isDate });

module.exports = DateType;
