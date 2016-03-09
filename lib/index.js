'use strict';

const bue = require('bue');
const utils = require('./utils');

const internals = {
  any: require('./types/any'),
  string: require('./types/string'),
  binary: require('./types/binary'),
  boolean: require('./types/boolean'),
  buffer: require('./types/buffer'),
  date: require('./types/date'),
  number: require('./types/number'),
  object: require('./types/object'),
  regexp: require('./types/regexp')
};

const ovt = {};

bue.each(internals, function(internalType, name) {
  utils.addChainableMethod(ovt, null, name, function() {
    return new internalType();
  });
});

module.exports = ovt;
