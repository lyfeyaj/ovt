'use strict';

const _ = require('lodash');
const inherits = require('util').inherits;

/**
 * A wrapper to collect errors
 * @class
 */
function Errors() {
  Error.call(this);
  this.isOvt = true;
  this.name = 'ValidationError';
  this._errors = {};
}

inherits(Errors, Error);

/**
 * add a new error
 * {
 *   isEmail: ['not a valid email']
 * }
 */
Errors.prototype.add = function(name, msg) {
  msg = msg || this.defaultMessage(name);
  let messages = this._errors[name] || [];
  messages = messages.concat(msg);
  this._errors[name] = messages;
};

Errors.prototype.concat = function(errors) {
  let self = this;
  let newErrors = new Errors();
  errors = errors || new Errors();

  if (self.any()) {
    newErrors = newErrors.concat(self);
  }

  _.each(errors._errors, function(messages, key) {
    if (key in newErrors._errors) {
      newErrors._errors[key] = newErrors._errors[key].concat(messages);
    } else {
      newErrors._errors[key] = messages.slice();
    }
  });

  return newErrors;
};

/**
 * To human readable format
 *   example:  email is not a valid; name is required
 */
Errors.prototype.toHuman = function() {
  return this.flatten().join('; ');
};

/**
 * Flatten Error Message
 *   example:  ['email is not a valid', 'name is required']
 */

Errors.prototype.flatten = function() {
  let self = this;
  let errors;
  errors = _.map(self._errors, function(messages, name) {
    let result = _.map(messages, function(message) {
      return message.toString() || self.defaultMessage(name);
    });
    return _.flatten(result);
  });
  return _.flatten(errors);
};

/**
 * To JSON  format
 */
Errors.prototype.asJSON = function() {
  return this._errors;
};

/**
 * Default message format
 */
Errors.prototype.defaultMessage = function(name) {
  return `Validation ${name} failed`;
};

/**
 * Check if there exists any error
 */
Errors.prototype.any = function() {
  return !_.isEmpty(this._errors);
};

module.exports = Errors;
