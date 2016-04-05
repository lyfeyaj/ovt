'use strict';

/*!
 * Module dependencies
 */

const _ = require('lodash');
const assert = require('assert');
const obj2Str = require('./obj2Str');
const tryCatch = require('./tryCatch');
const getName = require('./getName');
const cloneArray = require('./cloneArray');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
const hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
const excludeNames = /^(?:length|name|arguments|caller)$/;

// Cache `Function` properties
const call  = Function.prototype.call;
const apply = Function.prototype.apply;
const bind  = Function.prototype.bind;

/**
 * ### addChainableMethod (ctx, type, name, method)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(ovt.internals.String, 'validator', 'required', function (str) {
 *       if (!str) return `${str} is required`;
 *     });
 *
 * Can also be accessed directly from `ovt.Schema`.
 *
 *     ovt.Schema.addChainableMethod('validator', 'isEmail', fn);
 *
 * The result can then be used as both a method that can be executing,
 * or as a language chain.
 *
 *     ovt.string.required.isEmail;
 *     ovt.string.required.isEmail();
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} type of method to add
 * @param {String} name of method to add
 * @param {Function} method function to be used for `name`, when called
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

module.exports = function(ctx, name, method, chainableBehaviour, options) {
  assert(_.isObject(ctx), `${obj2Str(ctx)} is not a valid Object`);
  assert(_.isString(name), `${obj2Str(name)} is not a valid String`);
  assert(_.isFunction(method), `${obj2Str(method)} is not a valid Function`);

  options = options || {};

  if (!_.isFunction(chainableBehaviour)) {
    options = chainableBehaviour || options;
    chainableBehaviour = function() { return this; };
  }

  // whether property can be called as a function, default is `true`
  options.callable = options.callable !== false;

  // assign default type, default is `validator`
  options.type = options.type || 'validator';

  // check if only apply chainableBehaviour, default is `false`
  options.onlyChainable = options.onlyChainable === true;

  // avoid call function with no arguments, default is `false`
  options.avoidNoArgCall = options.avoidNoArgCall === true;

  // whether the method can be overwritten, default is `true`
  options.overwriteable = options.overwriteable === false;

  const defaultFn = tryCatch(options.type, name, method);

  Object.defineProperty(ctx, name, {
    get: function () {
      let self;
      let isSpecialType = options.type === 'validator' ||
                          options.type === 'sanitizer';
      if (isSpecialType) {
        self = Object.assign(new this.constructor(), this);
      } else {
        self = method.apply(this, arguments);
      }

      let methodIndex = getName();

      let chainableMethod = function chainableMethod (fn) {
        if (options.avoidNoArgCall && arguments.length === 0) return self;

        let _fn = defaultFn;
        let args = cloneArray(arguments);

        // handle method overwritten for validators
        if (options.overwriteable &&
            options.type === 'validator' &&
            _.isFunction(fn)) {
          _fn = tryCatch(options.type, name, fn);
          args.shift();
        }

        self = chainableBehaviour.apply(self, arguments);

        if (isSpecialType) {
          if (!options.onlyChainable) {
            // Initialize `_methods` property
            if (!self._methods) {
              self._methods = {};
            }
            // Or, clone methods
            else {
              self._methods = _.clone(self._methods);
            }

            // Add chainable method
            self._methods[name] = _.clone(self._methods[name] || {});
            self._methods[name][methodIndex] = {
              name,
              fn: _fn,
              args,
              type: options.type
            };
          }
        } else {
          self = method.apply(self, arguments);
        }

        return self;
      };

      // call chainableMethod in case of only property is called
      chainableMethod();

      if (options.callable) {
        // Use `__proto__` if available
        if (hasProtoSupport) {
          // Inherit all properties from the object by replacing the `Function` prototype
          let prototype = chainableMethod.__proto__ = Object.create(self);
          // Restore the `call` , `apply` and `bind` methods from `Function`
          prototype.call = call;
          prototype.apply = apply;
          prototype.bind = bind;
        }
        // Otherwise, redefine all properties (slow!)
        else {
          let propertyNames = Object.getOwnPropertyNames(ctx);
          propertyNames.forEach(function (propertyName) {
            if (!excludeNames.test(propertyName)) {
              let pd = Object.getOwnPropertyDescriptor(ctx, propertyName);
              Object.defineProperty(chainableMethod, propertyName, pd);
            }
          });
        }

        Object.assign(chainableMethod, self);

        return chainableMethod;
      } else {
        return self;
      }
    },

    configurable: true
  });
};
