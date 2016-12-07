'use strict';

const magico = require('magico');
const I18n = require('baiji-i18n');
const config = require('./config');
const TYPES = require('./types');
const Errors = require('./errors');
const utils = require('./utils');
const Schema = require('./schema');
const Calculator = require('./calculator');
const enLocale = require('./locales/en');
const zhCNLocale = require('./locales/zh-CN');

const VALID_TYPES = Object.keys(TYPES);

class Ovt {
  constructor() {
    // Register default locale
    this.registerLocale('en', enLocale);
    this.registerLocale('zh-CN', zhCNLocale);

    // Expose config
    this.config = config;

    // Expose Schema
    this.Schema = Schema;

    // Expose I18n
    this.I18n = I18n;
  }

  addMethod(type, name, options) {

    // Support old usage: type, name, fn, chainingBehaviour, options
    if (utils.isFunction(options)) {
      let args = utils.parseArg(arguments);
      let opts = args[4] || {};

      if (utils.isObject(args[3])) opts = args[3];

      opts.method = options;

      if (utils.isFunction(args[3])) {
        opts.chainingBehaviour = args[3];
      }
      options = opts;
    }

    utils.assert(~VALID_TYPES.indexOf(type), `${type} is not a valid schema type.`);

    let proto = TYPES[type].prototype;
    utils.chainable(proto)(name, options);
  }

  plugin(nameOrFn, options) {
    if (utils.isString(nameOrFn)) {
      let name = `ovt-plugin-${nameOrFn}`;
      try {
        let fn = require(name);
        utils.assert(utils.isFunction(fn), `${name} is not a valid plugin`);
        fn(this, options);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`\u001b[31m
          You don't have module '${name}' installed correctly, please run command:
          \`npm install ${name} --save\`
          to install the module.
          Otherwise '${name}' will not be activated.
        \u001b[39m`);
      }
    } else {
      utils.assert(utils.isFunction(nameOrFn), `${nameOrFn} is not a valid plugin`);
      nameOrFn(this, options);
    }
  }

  validate(obj, schema, optionsOrCallback, callback) {
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

    let res = Calculator.execute(obj, schema, {
      path: '',
      key: '',
      value: obj,
      errors: new Errors()
    }, options);
    // let res = schema._validate(obj, {
    //   path: '',
    //   key: '',
    //   value: obj,
    //   errors: new Errors()
    // }, options);

    if (utils.isFunction(callback)) {
      return callback(res.errors, res.value);
    } else {
      return res;
    }
  }

  assert(obj, schema, options) {
    let res = this.validate(obj, schema, options);
    if (res.errors) {
      throw res.errors;
    }
  }

  // Create ref object
  ref(key) {
    return { __key: key, __isRef: true };
  }

  isRef(obj) {
    return utils.isRef(obj);
  }

  // Create locale object
  m(msg) {
    if (!msg) return;
    let defaultLocale = config.defaultLocale || 'en';
    if (utils.isString(msg)) {
      msg = { [defaultLocale]: msg };
    }
    return { __msg: msg, __isLocale: true };
  }

  registerLocale(locale, obj) {
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
  }
}

// Add type methods:
// any, array, boolean, buffer, date, func, number, object, regexp, string
VALID_TYPES.forEach(function(name) {
  let TypeClass = TYPES[name];
  Ovt.prototype[name] = function() {
    let inst = new TypeClass();
    return inst.initialize.apply(inst, arguments);
  };
});

module.exports = new Ovt;
