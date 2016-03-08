/*!
 * Module dependencies
 */

var bue = require('bue');
var obj2Str = require('./obj2Str');

/*!
 * Module variables
 */

// Check whether `__proto__` is supported
var hasProtoSupport = '__proto__' in Object;

// Without `__proto__` support, this module will need to add properties to a function.
// However, some Function.prototype methods cannot be overwritten,
var excludeNames = /^(?:length|name|arguments|caller)$/;

// Allowed types
var allowedTypes = /^(?:validator|sanitizer)$/;

// Cache `Function` properties
var call  = Function.prototype.call;
var apply = Function.prototype.apply;
var bind  = Function.prototype.bind;

// Check whether `type` is valid
var checkType = function checkType(type) {
  var result = !allowedTypes.test(type);
  bue.assert(result, `Unknown type ${type} declared!`);
};

// Wrapper method with proper error message
var funcWrapper = function funcWrapper(type, name, method) {
  return function() {
    var message = `${type} '${name} failed'`;
    var result = method.apply(this, arguments);
    return result ? new Error(message) : result;
  };
};

module.exports = function(ctx, type, name, method) {
  bue.assert(bue.isObject(ctx), `${obj2Str(ctx)} is not a valid Object`);
  bue.assert(bue.isString(name), `${obj2Str(name)} is not a valid String`);
  bue.assert(bue.isFunction(method), `${obj2Str(method)} is not a valid Function`);
  checkType();

  var _fn = funcWrapper(type, name, method);

  Object.defineProperty(ctx, name, {
    get: function () {
      var self = Object.assign(new ctx.constructor(), this);

      var magicFunc = function (args, defaultMessage) {
        args = bue.isArray(args) ? args : [args];

        var containerName = `__${type}s`;

        if (!self[containerName]) {
          self[containerName] = {};
        }

        self[containerName][name] = {
          fn: _fn,
          args: args,
          message: defaultMessage || ''
        };

        return self;
      };

      // Use `__proto__` if available
      if (hasProtoSupport) {
        // Inherit all properties from the object by replacing the `Function` prototype
        var prototype = magicFunc.__proto__ = Object.create(self);
        // Restore the `call` , `apply` and `bind` methods from `Function`
        prototype.call = call;
        prototype.apply = apply;
        prototype.bind = bind;
      }
      // Otherwise, redefine all properties (slow!)
      else {
        var propertyNames = Object.getOwnPropertyNames(ctx);
        propertyNames.forEach(function (propertyName) {
          if (!excludeNames.test(propertyName)) {
            var pd = Object.getOwnPropertyDescriptor(ctx, propertyName);
            Object.defineProperty(magicFunc, propertyName, pd);
          }
        });
      }

      // call magicFunc in case of only property is called
      magicFunc();

      // Assign properties to `magicFunc`
      Object.assign(magicFunc, self);

      return magicFunc;
    },

    configurable: true
  });
};
