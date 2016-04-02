'use strict';

const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const config = require('./config');
const types = require('./types');

const validTypes = Object.keys(types);

const ovt = {};

_.each(types, function(internalType, name) {
  utils.addChainableMethod(ovt, name, function() {
    return utils.applyType(name, internalType);
  }, { type: 'internal' });
});

ovt.addMethod = function addMethod(type, name, method, chainableBehaviourOrOptions, options) {
  assert(~validTypes.indexOf(type), `${type} is not a valid schema type.`);

  utils.addChainableMethod(
    types[type].prototype,
    name,
    method,
    chainableBehaviourOrOptions,
    options
  );
};

ovt.validate = function validate(obj, schema, options, callback) {
  assert(schema && schema.isOvt, `${utils.obj2Str(schema)} is not a valid Schema`);

  options = Object({}, ovt.config, options);
  let res = schema._validate(obj, options);

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
