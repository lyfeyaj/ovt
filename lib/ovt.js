'use strict';

const magico = require('magico');
const I18n = require('baiji-i18n');
const config = require('./config');
const types = require('./types');
const Errors = require('./errors');
const utils = require('./utils');
const Schema = require('./schema');
const enLocale = require('./locales/en');
const zhCNLocale = require('./locales/zh-CN');
const addChainableMethod = utils.addChainableMethod;

const validTypes = Object.keys(types);

const ovt = {};

for (let name in types) {
  let Type = types[name];
  addChainableMethod(ovt, name, function() {
    return utils.applyType(name, Type);
  }, { type: 'internal' });
}

ovt.addMethod = function addMethod(type, name, method, chainableBehaviourOrOptions, options) {
  utils.assert(~validTypes.indexOf(type), `${type} is not a valid schema type.`);

  let proto = types[type].prototype;
  addChainableMethod(
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
  options.locale = options.locale || config.defaultLocale || 'en';

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

// Create ref object
ovt.ref = function ref(key) {
  return { __key: key, __isRef: true };
};

// Create locale object
ovt.m = function m(msg) {
  if (!msg) return;
  let defaultLocale = config.defaultLocale || 'en';
  if (utils.isString(msg)) {
    msg = { [defaultLocale]: msg };
  }
  return { __msg: msg, __isLocale: true };
};

ovt.registerLocale = function registerLocale(locale, obj) {
  let prefix = `${locale}.ovt`;
  let translations = {};
  validTypes.forEach(function(type) {
    translations[type] = Object.assign(
      magico.get(I18n.translations, `${prefix}.${type}`) || {},
      magico.get(obj, type)
    );
  });
  magico.set(I18n.translations, prefix, translations);
  return this;
};

// Register default locale
ovt.registerLocale('en', enLocale);
ovt.registerLocale('zh-CN', zhCNLocale);

ovt.config = config;

ovt.Schema = Schema;

ovt.I18n = I18n;

module.exports = ovt;
