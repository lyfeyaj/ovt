'use strict';

const utils = require('../utils');
const AnyType = require('./any');

class StringType extends AnyType {
  constructor() {
    super();

    this._type = 'string';
    this._defaultValidator = 'isString';
  }

  convert(val) {
    return utils.isString(val) ? val : String(val);
  }
}

const chainable = utils.chainable(StringType.prototype, 'string');

chainable('isString', { method: utils.isString });

module.exports = StringType;
