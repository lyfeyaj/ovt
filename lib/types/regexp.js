'use strict';

const utils = require('../utils');
const AnyType = require('./any');

class RegExpType extends AnyType {
  constructor() {
    super();

    this._type = 'regexp';
    this._defaultValidator = 'isRegExp';
  }

  convert(val) {
    return utils.isRegExp(val) ? val : new RegExp(val);
  }
}

const chainable = utils.chainable(RegExpType.prototype);

chainable('isRegExp', { method: utils.isRegExp });

module.exports = RegExpType;
