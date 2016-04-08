'use strict';

const utils = require('./utils');
const config = require('./config');
const types = require('./types');
const Errors = require('./errors');

const validTypes = Object.keys(types);

const ovt = {};

for (let name in types) {
  let Type = types[name];
  utils.addChainableMethod(ovt, name, function() {
    return utils.applyType(name, Type);
  }, { type: 'internal' });
}

ovt.addMethod = function addMethod(type, name, method, chainableBehaviourOrOptions, options) {
  utils.assert(~validTypes.indexOf(type), `${type} is not a valid schema type.`);

  let proto = types[type].prototype;
  utils.addChainableMethod(
    proto,
    name,
    method,
    chainableBehaviourOrOptions,
    options
  );
};

ovt.validate = function validate(obj, schema, optionsOrCallback, callback) {
  utils.assert(schema && schema.isOvt, `${utils.obj2Str(schema)} is not a valid Schema`);

  let options = Object.assign({}, config);

  if (utils.isFunction(optionsOrCallback)) {
    callback = optionsOrCallback;
  } else {
    options = Object.assign(options, optionsOrCallback || {});
  }

  options.skipSantizers = options.skipSantizers === true;
  options.skipValidators = options.skipValidators === true;
  options.abortEarly = options.abortEarly === true;
  options.convert = options.convert === true;
  options.noDefaults = options.noDefaults === true;

  let res = schema._validate(obj, {
    parentPath: '',
    key: '',
    parentType: schema._type,
    parentObj: obj,
    original: obj,
    errors: new Errors()
  }, options);

  if (utils.isFunction(callback)) {
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

ovt.ref = function ref(key) {
  return { __key: key, __isRef: true };
};

ovt.config = config;

module.exports = ovt;
