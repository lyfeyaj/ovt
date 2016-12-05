'use strict';

const magico = require('magico');
const I18n = require('baiji-i18n');
const config = require('./config');
const TYPES = require('./TYPES');
const Errors = require('./errors');
const utils = require('./utils');
const Schema = require('./schema');
const enLocale = require('./locales/en');
const zhCNLocale = require('./locales/zh-CN');

const VALID_TYPES = Object.keys(TYPES);

const ovt = {};

// Add type methods
for (let name in TYPES) {
  let Type = TYPES[name];
  ovt[name] = function() {
    let instance = new Type();
    return instance._defaultValidator ? instance[instance._defaultValidator]() : instance;
  };
}

// Add method api
ovt.addMethod = function addMethod(type, name, options) {

  // Support old usage: type, name, fn, chainableBehaviour, options
  if (utils.isFunction(options)) {
    let args = utils.parseArg(arguments);
    let opts = args[4] || {};

    if (utils.isObject(args[3])) opts = args[3];

    opts.method = options;

    if (utils.isFunction(args[3])) {
      opts.chainableBehaviour = args[3];
    }
    options = opts;
  }

  utils.assert(~VALID_TYPES.indexOf(type), `${type} is not a valid schema type.`);

  let proto = TYPES[type].prototype;
  utils.chainable(proto)(name, options);
};

ovt.plugin = function plugin(nameOrFn, options) {
  if (utils.isString(nameOrFn)) {
    let name = `ovt-plugin-${nameOrFn}`;
    try {
      require(name)(ovt, options);

    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(`\u001b[31m
        You don't have module 'ovt' installed, please run command:
        \`npm install ovt --save\`
        to install the missing module.
        Otherwise 'ovt-plugin-validator' will not be activated.
      \u001b[39m`);
    }
  } else {
    utils.assert(utils.isFunction(nameOrFn), `${nameOrFn} is not a valid plugin`);
    nameOrFn(ovt, options);
  }
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
  VALID_TYPES.forEach(function(type) {
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

ovt.registerSource = function registerSource(name, source) {
  utils.sources[name] = source || {};
};

// Expose config
ovt.config = config;

// Expose Schema
ovt.Schema = Schema;

// Expose I18n
ovt.I18n = I18n;

module.exports = ovt;
