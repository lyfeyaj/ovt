'use strict';

const magico = require('magico');
const I18n = require('baiji-i18n');
const config = require('./config');
const TYPES = require('./types');
const Errors = require('./errors');
const utils = require('./utils');
const Schema = require('./schema');
const Processor = require('./processor');
const EN_LOCALE = require('./locales/en');
const ZH_CN_LOCALE = require('./locales/zh-CN');
const packageInfo = require('../package.json');

const VALID_TYPES = Object.keys(TYPES);

class Ovt {
  constructor() {
    // Current version.
    this.VERSION = packageInfo.version;

    // Register default locale
    this.registerLocale('en', EN_LOCALE);
    this.registerLocale('zh-CN', ZH_CN_LOCALE);

    // Expose config
    this.config = config;

    // Expose Schema
    this.Schema = Schema;

    // Expose I18n
    this.I18n = I18n;

    // Support Types
    this.TYPES = TYPES;
  }

  addMethod(type, name, options) {
    utils.assert(~VALID_TYPES.indexOf(type), `${type} is not a valid schema type.`);

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

    let proto = TYPES[type].prototype;
    utils.chainable(proto, type)(name, options);
  }

  plugin(nameOrFn, options) {
    if (utils.isString(nameOrFn)) {
      let name = `ovt-plugin-${nameOrFn}`;
      try {
        let fn = require(name);
        utils.assert(utils.isFunction(fn), `${name} is not a valid plugin`);
        fn(this, options);
      } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
          // eslint-disable-next-line no-console
          console.log(`\u001b[31m
            You don't have module '${name}' installed correctly, please run command:
            \`npm install ${name} --save\`
            to install the module.
            Otherwise '${name}' will not be activated.
          \u001b[39m`);
        } else {
          throw e;
        }
      }
    } else {
      utils.assert(utils.isFunction(nameOrFn), `${nameOrFn} is not a valid plugin`);
      nameOrFn(this, options);
    }
  }

  parseOptions(opts) {
    opts = opts || {};
    let _opts = {};

    _opts.skipSantizers = opts.skipSantizers === true;
    _opts.skipValidators = opts.skipValidators === true;
    _opts.abortEarly = opts.abortEarly == null ? this.config.abortEarly : opts.abortEarly;
    _opts.convert = opts.convert == null ? this.config.convert : opts.convert;
    _opts.noDefaults = opts.noDefaults == null ? this.config.noDefaults : opts.noDefaults;
    _opts.allowUnknown = opts.allowUnknown == null ? this.config.allowUnknown : opts.allowUnknown;
    _opts.stripUnknown = opts.stripUnknown == null ? this.config.stripUnknown : opts.stripUnknown;
    _opts.locale = opts.locale || this.config.defaultLocale || 'en';

    return _opts;
  }

  // Validates a value using the given schema and options
  validate(value, schema, optionsOrCallback, callback) {
    utils.assert(schema && schema.isOvt, `${utils.obj2Str(schema)} is not a valid Schema`);

    let options = {};

    if (utils.isFunction(optionsOrCallback)) {
      callback = optionsOrCallback;
    } else {
      options = optionsOrCallback;
    }
    options = this.parseOptions(options);

    let res = Processor.execute(value, schema, {
      origin: value,
      path: '',
      key: '',
      value: value,
      errors: new Errors()
    }, options);

    if (utils.isFunction(callback)) {
      return callback(res.errors, res.value);
    } else {
      return res;
    }
  }

  // Validates a value against a schema and throws if validation fails
  assert(value, schema, options) {
    let res = this.validate(value, schema, options);
    if (res.errors) throw res.errors;
  }

  // Validates a value against a schema, returns valid object,
  // and throws if validation fails
  attempt(value, schema, options) {
    let res = this.validate(value, schema, options);
    if (res.errors) throw res.errors;
    return res.value;
  }

  // Create ref object
  ref(key) {
    return utils.ref(key);
  }

  isRef(obj) {
    return utils.isRef(obj);
  }

  // Create localized message object
  // { __msg: { en: 'custom message' }, __isLocale: true }
  l(msg) {
    if (!msg) return;
    let locale = config.defaultLocale || 'en';
    if (utils.isString(msg)) {
      msg = { [locale]: msg };
    }
    return { __msg: msg, __isLocale: true };
  }

  m(msg) {
    return this.l(msg);
  }

  isLocale(obj) {
    return utils.isLocale(obj);
  }

  // I18n translate
  t(name, options) {
    return utils.t(name, options);
  }

  // Add specific locale
  // Example:
  //   locale: 'en'
  //   obj: { any: { required: 'is required' } }
  registerLocale(locale, obj) {
    obj = obj || {};
    let prefix = `${locale}.ovt`;
    let translations = {};

    // Merge translations
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
