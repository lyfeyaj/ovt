'use strict';

/*!
 * Module dependencies
 */

const _ = require('lodash');
const assert = require('assert');
const obj2Str = require('./obj2Str');
const tryCatch = require('./tryCatch');
const getName = require('./getName');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
const hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
const excludeNames = /^(?:length|name|arguments|caller)$/;

// Special types
const specialTypes = /^(?:validator|sanitizer)$/;

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

  // whether property can be called as a function
  options.func = options.func !== false;

  // assign default type
  options.type = options.type || 'validator';

  // check if only apply chainableBehaviour
  options.onlyChainable = options.onlyChainable === true;

  let _fn = tryCatch(options.type, name, method);

  Object.defineProperty(ctx, name, {
    get: function () {
      let isSpecialType = specialTypes.test(options.type);
      let self = isSpecialType ?
                 Object.assign(new this.constructor(), this) :
                 method.apply(this, arguments);

      let methodIndex = `${name}_${getName()}`;

      let chainableMethod = function chainableMethod () {
        self = chainableBehaviour.apply(self, arguments);

        if (isSpecialType) {
          if (!options.onlyChainable) {
            let args = Array.from(arguments);

            // Initialize `_methods` property
            if (!self._methods) {
              self._methods = {};
            }
            // Or, clone methods
            else {
              self._methods = _.clone(self._methods);
            }

            // Add chainable method
            self._methods[name] = self._methods[name] || {};
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

      // call chainableMethod in case of only property is called
      chainableMethod();

      if (options.func) {
        // Assign properties to `chainableMethod`
        Object.assign(chainableMethod, self);

        return chainableMethod;
      } else {
        return self;
      }
    },

    configurable: true
  });
};
