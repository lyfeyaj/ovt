'use strict';

const _ = require('lodash');
const assert = require('assert');
const utils = require('./utils');
const config = require('./config');
const types = require('./types');
const Errors = require('./errors');

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

ovt.validate = function validate(obj, schema, optionsOrCallback, callback) {
  assert(schema && schema.isOvt, `${utils.obj2Str(schema)} is not a valid Schema`);

  let options = {};

  if (_.isFunction(optionsOrCallback)) {
    callback = optionsOrCallback;
  } else {
    options = optionsOrCallback || {};
  }

  options = Object.assign(options, ovt.config);

  options.skipSantizers = options.skipSantizers === true;
  options.skipValidators = options.skipValidators === true;
  options.abortEarly = options.abortEarly === true;
  options.convert = options.convert === true;
  options.noDefaults = options.noDefaults === true;

  let res = schema._validate(
    obj, {
      parentPath: '',
      key: '',
      parentType: schema._type,
      parentObj: obj,
      original: obj,
      errors: new Errors()
    }, options
  );

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
