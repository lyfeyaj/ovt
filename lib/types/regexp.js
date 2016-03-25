'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;
const utils = require('../utils');
const AnyType = require('./any');

function RegExpType() {
  AnyType.call(this);

  this._type = 'regexp';
}

inherits(RegExpType, AnyType);

let proto = RegExpType.prototype;

utils.addChainableMethod(proto, 'isRegExp', function(val) {
  return _.isRegExp(val);
});
