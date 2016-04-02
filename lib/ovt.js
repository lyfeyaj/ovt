'use strict';

const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const config = require('./config');

const internals = {
  'any': require('./types/any'),
  'array': require('./types/array'),
  'string': require('./types/string'),
  'boolean': require('./types/boolean'),
  'buffer': require('./types/buffer'),
  'date': require('./types/date'),
  'function': require('./types/function'),
  'number': require('./types/number'),
  'object': require('./types/object'),
  'regexp': require('./types/regexp')
};

const validTypes = Object.keys(internals);

const ovt = {};

_.each(internals, function(internalType, name) {
  utils.addChainableMethod(ovt, name, function() {
    let instance = new internals[name]();
    let defaultValidator = `is${_.capitalize(name)}`;
    return instance[defaultValidator];
  }, { type: 'internal' });
});

ovt.addMethod = function addMethod(type, name, method, chainableBehaviour, options) {
  assert(~validTypes.indexOf(type), `${type} is not a valid schema type.`);

  utils.addChainableMethod(internals[type].prototype, name, method, chainableBehaviour, options);
};

ovt.validate = function validate(obj, schema, options, callback) {
  assert(schema.isOvt, `${utils.obj2Str(schema)} is not a valid Schema`);

  let config = Object({}, ovt.config, options);
  let res = schema._validate(obj, config);

  if (_.isFunction(callback)) {
    return callback(res.errors, res.value);
  } else {
    return res;
  }
};

ovt.assert = function assert(obj, schema, options) {
  let res = ovt.validate(obj, schema, options);
  if (res.errors) {
    throw res.errors;
  }
};

ovt.config = config;

module.exports = ovt;
