'use strict';

/*!
 * Module dependencies
 */

const obj2Str = require('./obj2Str');
const tryCatch = require('./tryCatch');
const cloneArray = require('./cloneArray');
const isString = require('./isString');
const isFunction = require('./isFunction');
const isObject = require('./isObject');
const isLocale = require('./isLocale');
const assert = require('./assert');

/**
 * ### addChainableMethod (ctx, name, method, chainableBehaviour, options)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(StringType.prototype, 'isEmail', function (val) {
 *       if (!val) return `${val} is not a valid email`;
 *     }, null, { type: 'V' });
 *
 * The result can then be used as both a method that can be executing,
 * or as a language chain.
 *
 *     ovt.string().required().isEmail();
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @param {Function} method function to be used as chainable hehaviour for `name`, when called
 * @param {Object} options
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

function addChainableMethod(ctx, name, options) {
  options = options || {};

  assert(isObject(ctx), `${obj2Str(ctx)} is not a valid Object`);
  assert(isString(name), `${obj2Str(name)} is not a valid String`);
  assert(isFunction(options.method), `${options.method} is not a valid method`);


  // Default chainable behaviour
  if (!isFunction(options.chainableBehaviour)) {
    options.chainableBehaviour = function() { return this; };
  }

  // assign default type, default is `validator`
  options.type = options.type || 'validator';

  // whether the method can be overwrite, default is `true`
  options.allowMethodOverwrite = options.allowMethodOverwrite === false;

  // only execute chainable method
  options.onlyChainable = options.onlyChainable === true;

  // Search method
  const method = options.method;

  // Wrap method by catchable function
  const defaultFn = tryCatch(options.type, name, method);

  // TODO: detect name conflict
  // Add cooresponding method
  ctx[name] = function(fn) {
    let _fn = defaultFn;
    let args = cloneArray(arguments);
    let self = this.clone();

    // Apply chainable behaviour
    self = options.chainableBehaviour.apply(self, arguments);
    if (options.onlyChainable) return self;

    // handle method overwritten for validators
    // for example: ovt.string.isEmail(function(val) { /* your custom validator */ });
    if (options.allowMethodOverwrite && options.type === 'validator' && isFunction(fn)) {
      _fn = tryCatch(options.type, name, fn);
      args.shift();
    }

    // handle custom locale
    let locale;
    if (isLocale(args[args.length - 1])) locale = args.pop();

    // Initialize `_methods` property
    if (!self._methods) self._methods = {};
    if (!self._methods[name]) self._methods[name] = [];

    self._methods[name].push({
      name,
      fn: _fn,
      args,
      type: options.type,
      locale
    });

    return self;
  };
}

module.exports = function chainable(proto) {
  return function chainableProxy(name, options) {
    return addChainableMethod(proto, name, options);
  };
};
