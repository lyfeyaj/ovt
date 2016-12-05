'use strict';

const utils = require('../utils');
const AnyType = require('./any');

function RegExpType() {
  AnyType.call(this);

  this._type = 'regexp';
  this._defaultValidator = 'isRegExp';
}

utils.inherits(RegExpType, AnyType);

const proto = RegExpType.prototype;
const chainable = utils.chainable(proto);

proto.convert = function(val) {
  return utils.isRegExp(val) ? val : new RegExp(val);
};

chainable('isRegExp', {
  method: function(val) {
    return utils.isRegExp(val);
  }
});

module.exports = RegExpType;
