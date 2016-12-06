'use strict';

const AnyType = require('./any');
const utils = require('../utils');

class BooleanType extends AnyType {
  constructor() {
    super();

    this._type = 'boolean';
    this._defaultValidator = 'isBoolean';
  }

  convert(val) {
    return utils.isBoolean(val) ? val : Boolean(val).valueOf();
  }
}

const chainable = utils.chainable(BooleanType.prototype);

chainable('isBoolean', { method: utils.isBoolean });

module.exports = BooleanType;
