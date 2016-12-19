(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

window.Ovt = require('./lib/ovt');

},{"./lib/ovt":8}],2:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var magico = require('magico');
var Errors = require('./errors');
var utils = require('./utils');

var BaseCalculator = function () {
  function BaseCalculator(value, schema, state, options) {
    _classCallCheck(this, BaseCalculator);

    // data source
    this.value = value;
    this.state = state || {};
    this.schema = schema;
    this.type = this.schema._type;
    this.methods = schema._methods;
    this.options = options || {};
    this.errors = new Errors();

    this.path = this.buildPath(this.state.path, this.state.key);
  }

  _createClass(BaseCalculator, [{
    key: 'buildPath',
    value: function buildPath(path, key) {
      path = path || '';
      if (key == null || key !== key || key === '') return path;
      return path ? path + '.' + key : key;
    }

    // create error by priority
    // 1. schema._error
    // 2. name by label or key name

  }, {
    key: 'createError',
    value: function createError(key, e, label) {
      var locale = this.options.locale || 'en';
      var name = label ? label : this.buildPath(this.path, key);
      var errorMsg = magico.get(this.schema._error, locale);
      if (errorMsg) {
        this.errors = this.errors.reset().add(name, errorMsg);
      } else {
        this.errors.add(name, e);
      }
    }
  }, {
    key: 'concatErrors',
    value: function concatErrors(errors) {
      this.errors = this.errors.concat(errors);
    }
  }, {
    key: 'isErrored',
    value: function isErrored() {
      if (this._isErrored) return this._isErrored;
      this._isErrored = this.state.hasErrors || this.errors.any();
      return this._isErrored;
    }
  }, {
    key: 'canAbortEarly',
    value: function canAbortEarly() {
      if (this.isAborted) return this.isAborted;
      this.isAborted = this.options.abortEarly && this.isErrored();
      return this.isAborted;
    }
  }, {
    key: 'result',
    value: function result(value) {

      return {
        value: value,
        errors: this.errors.any() ? this.errors : null
      };
    }
  }, {
    key: 'execute',
    value: function execute() {/* Overwrite */}
  }]);

  return BaseCalculator;
}();

var ArrayInnerCalculator = function (_BaseCalculator) {
  _inherits(ArrayInnerCalculator, _BaseCalculator);

  function ArrayInnerCalculator(value, schema, state, options) {
    _classCallCheck(this, ArrayInnerCalculator);

    return _possibleConstructorReturn(this, (ArrayInnerCalculator.__proto__ || Object.getPrototypeOf(ArrayInnerCalculator)).call(this, value, schema, state, options));
  }

  _createClass(ArrayInnerCalculator, [{
    key: 'stateBuilder',
    value: function stateBuilder() {
      return {
        origin: this.state.origin,
        key: this.state.key,
        value: this.state.value,
        path: this.state.path,
        hasErrors: this.isErrored()
      };
    }
  }, {
    key: 'execute',
    value: function execute() {
      var value = this.value.slice();

      if (this.canAbortEarly()) return this.result(value);

      var exclusions = this.schema._inner.exclusions;
      var requireds = utils.cloneArray(this.schema._inner.requireds);
      var inclusions = utils.cloneArray(this.schema._inner.inclusions).concat(requireds);
      var ordereds = this.schema._inner.ordereds;
      var orderedExclusions = this.schema._inner.orderedExclusions;

      var self = this;

      value = (value || []).map(function (item, vi) {

        if (self.canAbortEarly()) return item;

        var currentPath = self.buildPath(self.path, vi);

        // Validate exclusions
        for (var ei = 0; ei < exclusions.length; ei++) {
          if (self.canAbortEarly()) break;

          var exclusion = exclusions[ei];

          var res = Calculator.execute(item, exclusion, self.stateBuilder(), self.options);

          if (!res.errors) {
            self.createError(self.buildPath(currentPath, 'forbidden'), utils.t('array.forbidden') || new Error('Forbidden value can\'t be included'));
          }
        }

        if (self.canAbortEarly()) return item;

        // Validate ordereds
        var ordered = ordereds[vi];
        if (ordered) {
          var _res2 = Calculator.execute(item, ordered, self.stateBuilder(), self.options);
          item = _res2.value;
          self.concatErrors(_res2.errors);
        }

        if (self.canAbortEarly()) return item;

        // Validate exclusion with orders
        var orderedExclusion = orderedExclusions[vi];
        if (orderedExclusion) {
          var _res3 = Calculator.execute(item, orderedExclusion, self.stateBuilder(), self.options);

          if (!_res3.errors) {
            self.createError(self.buildPath(currentPath, 'forbidden'), utils.t('array.forbidden') || new Error('Forbidden value can\'t be included'));
          }
        }

        if (self.canAbortEarly()) return item;

        // Validate requireds
        var matchRequiredIndex = null;
        for (var ri = 0; ri < requireds.length; ri++) {
          var required = requireds[ri];
          var _res4 = Calculator.execute(item, required, self.stateBuilder(), self.options);
          if (_res4.errors) continue;
          item = _res4.value;
          matchRequiredIndex = ri;
          break;
        }
        if (matchRequiredIndex !== null) requireds.splice(matchRequiredIndex, 1);

        if (self.canAbortEarly()) return item;

        // Validate inclusions
        var isIncluded = null;
        for (var ii = 0; ii < inclusions.length; ii++) {
          if (self.canAbortEarly()) break;
          if (isIncluded) break;

          var inclusion = inclusions[ii];
          var _res5 = Calculator.execute(item, inclusion, self.stateBuilder(), self.options);

          if (!_res5.errors) {
            isIncluded = _res5;
          }
        }

        if (isIncluded) {
          item = isIncluded.value;
        } else {
          if (inclusions.length) {
            self.createError(self.buildPath(self.path, 'inclusions'), utils.t('array.inclusions') || new Error('No valid schema matches'));
          }
        }

        return item;
      });

      if (this.canAbortEarly()) return this.result(value);

      if (requireds.length) {
        var preferedLength = self._inner.requireds.length;
        var currentLength = preferedLength - requireds.length;
        this.createError(this.buildPath(this.path, 'requireds'), utils.t('array.forbidden', { currentLength: currentLength, preferedLength: preferedLength }) || new Error(preferedLength + ' elements are required, now is ' + currentLength));
      }

      if (this.canAbortEarly()) return this.result(value);

      // validate additional ordereds
      if (ordereds.length > value.length) {
        for (var oi = value.length; oi < ordereds.length; oi++) {
          var ordered = ordereds[oi];
          if (ordered) {
            var res = Calculator.execute(undefined, ordered, this.stateBuilder(), self.options);
            this.concatErrors(res.errors);
          }
        }
      }

      return this.result(value);
    }
  }]);

  return ArrayInnerCalculator;
}(BaseCalculator);

var ObjectInnerCalculator = function (_BaseCalculator2) {
  _inherits(ObjectInnerCalculator, _BaseCalculator2);

  function ObjectInnerCalculator(value, schema, state, options) {
    _classCallCheck(this, ObjectInnerCalculator);

    return _possibleConstructorReturn(this, (ObjectInnerCalculator.__proto__ || Object.getPrototypeOf(ObjectInnerCalculator)).call(this, value, schema, state, options));
  }

  _createClass(ObjectInnerCalculator, [{
    key: 'rename',
    value: function rename(name) {
      return this.schema._inner.renames[name] || name;
    }
  }, {
    key: 'execute',
    value: function execute() {
      var value = this.value;

      if (this.canAbortEarly()) return this.result(value);

      var children = this.schema._inner.children;

      // Validate inners
      for (var name in children) {
        if (this.canAbortEarly()) break;

        var schema = children[name];
        name = this.rename(name);

        var res = Calculator.execute(magico.get(value, name), schema, {
          origin: this.state.origin,
          value: value,
          path: this.path,
          key: name,
          hasErrors: this.isErrored()
        }, this.options);

        magico.set(value, name, res.value);

        this.concatErrors(res.errors);
      }

      return this.result(value);
    }
  }]);

  return ObjectInnerCalculator;
}(BaseCalculator);

var Calculator = function (_BaseCalculator3) {
  _inherits(Calculator, _BaseCalculator3);

  _createClass(Calculator, null, [{
    key: 'execute',
    value: function execute(value, schema, state, options) {
      return new Calculator(value, schema, state, options).execute();
    }
  }]);

  function Calculator(value, schema, state, options) {
    _classCallCheck(this, Calculator);

    return _possibleConstructorReturn(this, (Calculator.__proto__ || Object.getPrototypeOf(Calculator)).call(this, value, schema, state, options));
  }

  _createClass(Calculator, [{
    key: 'applyDefault',
    value: function applyDefault() {
      if (!this.options.noDefaults && utils.isUndefined(this.value)) {
        var defaultValue = this.schema._defaultValue;
        if (utils.isUndefined(defaultValue)) return;
        if (utils.isFunction(defaultValue)) {
          this.value = defaultValue(this.state.value);
        } else {
          this.value = defaultValue;
        }
      }
    }
  }, {
    key: 'cannotBeBypassed',
    value: function cannotBeBypassed() {
      // when val is `required` or `forbidden` or not equal to `undefined`
      return this.methods.forbidden || this.methods.required || !utils.isUndefined(this.value);
    }
  }, {
    key: 'applyConvert',
    value: function applyConvert() {
      // convert value to specific type
      if (this.options.convert) {
        var value = this.value;
        try {
          value = utils.isUndefined(value) ? value : this.schema.convert(value);
        } catch (e) {
          value = null;
          this.createError('convertError', e);
        }

        this.value = value;
      }
    }
  }, {
    key: 'execRenames',
    value: function execRenames() {
      // Perform renames
      var value = this.value;
      if (value && this.schema._type === 'object') {
        var renames = this.schema._inner.renames;
        value = utils.cloneObject(value);
        for (var oldName in renames) {
          var newName = renames[oldName];
          if (oldName in value) {
            value[newName] = value[oldName];
            delete value[oldName];
          }
        }
      }
      this.value = value;
    }
  }, {
    key: 'canSkipMethodBy',
    value: function canSkipMethodBy(type) {
      if (type === 'validator' && this.options.skipValidators) return true;
      if (type === 'sanitizer' && this.options.skipSantizers) return true;
      if (type !== 'validator' && type !== 'sanitizer') return true;
      return false;
    }
  }, {
    key: 'execInners',
    value: function execInners(value) {
      var calc = void 0;
      var state = {
        origin: this.state.origin,
        key: '',
        path: this.path,
        value: value,
        hasErrors: this.isErrored()
      };

      if (this.type === 'object') {
        calc = new ObjectInnerCalculator(value, this.schema, state, this.options);
      } else if (this.type === 'array') {
        calc = new ArrayInnerCalculator(value, this.schema, state, this.options);
      }

      if (!calc) return;

      var res = calc.execute();

      this.concatErrors(res.errors);
      return res.value;
    }
  }, {
    key: 'execMethods',
    value: function execMethods() {
      var value = this.value;

      // loop methods and apply one by one
      for (var name in this.methods) {
        // check all validators under `strict` mode
        if (this.canAbortEarly()) break;

        var method = this.methods[name];

        // check if need to validate inners
        if (name === '__inners_flag__' && method) {
          value = this.execInners(value);
        } else {
          if (method.canBeBypassed(this.options)) continue;

          var state = {
            origin: this.state.origin,
            value: value,
            path: this.path,
            key: name,
            hasErrors: this.isErrored(),
            args: []
          };

          var _res = method.invoke(value, state, this.schema, this.options);

          // Result handle policy:
          // Sanitizer: if error returned, handle error, else change value coorespondingly
          // Validator: only handle error
          if (utils.isError(_res)) {
            var msg = method.message(_res, state.args, this.options.locale);
            this.createError(name, msg, this.schema._label);
          } else {
            // if is not
            if (method.type === 'sanitizer') value = _res;
          }
        }
      }

      this.value = value;
    }
  }, {
    key: 'execute',
    value: function execute() {
      if (this.canAbortEarly()) return this.result(this.value);

      this.applyDefault();

      if (!this.cannotBeBypassed()) return this.result(this.value);

      this.applyConvert();
      this.execRenames();
      this.execMethods();

      return this.result(this.value);
    }
  }]);

  return Calculator;
}(BaseCalculator);

Calculator.BaseCalculator = BaseCalculator;
Calculator.ArrayInnerCalculator = ArrayInnerCalculator;
Calculator.ObjectInnerCalculator = ObjectInnerCalculator;

module.exports = Calculator;

},{"./errors":4,"./utils":27,"magico":49}],3:[function(require,module,exports){
'use strict';

module.exports = {
  convert: true,
  noDefaults: false,
  abortEarly: true,
  defaultLocale: 'en'
};

},{}],4:[function(require,module,exports){
'use strict';

/**
 * A wrapper to collect errors
 * @class
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Errors = function (_Error) {
  _inherits(Errors, _Error);

  function Errors() {
    _classCallCheck(this, Errors);

    var _this = _possibleConstructorReturn(this, (Errors.__proto__ || Object.getPrototypeOf(Errors)).call(this));

    _this.isOvt = true;
    _this.hasErrors = false;
    _this.name = 'ValidationError';
    _this._errors = {};
    return _this;
  }

  /**
   * reset errors
   */


  _createClass(Errors, [{
    key: 'reset',
    value: function reset() {
      this.hasErrors = false;
      this._errors = {};
      return this;
    }

    /**
     * add a new error
     * {
     *   isEmail: ['not a valid email']
     * }
     */

  }, {
    key: 'add',
    value: function add(name, msg) {
      this.hasErrors = true;
      msg = msg || this.defaultMessage(name);
      var messages = this._errors[name] || [];
      this._errors[name] = messages.concat(msg);
      return this;
    }
  }, {
    key: 'get',
    value: function get(name) {
      return this._errors[name];
    }
  }, {
    key: 'concat',
    value: function concat(errors) {
      var newErrors = new Errors();

      if (this.any()) newErrors = newErrors.concat(this);

      if (errors && errors.any()) {
        for (var key in errors._errors) {
          newErrors.add(key, errors.get(key));
        }
      }

      return newErrors;
    }

    /**
     * To human readable format
     *   example:  email is not a valid; name is required
     */

  }, {
    key: 'toHuman',
    value: function toHuman(joiner) {
      return this.flatten(joiner).join('; ');
    }

    /**
     * Flatten Error Message
     *   example:  ['email is not a valid', 'name is required']
     */

  }, {
    key: 'flatten',
    value: function flatten(joiner) {
      joiner = joiner || ' ';
      var errors = [];
      for (var name in this._errors) {
        var messages = this._errors[name] || [];
        for (var i = 0; i < messages.length; i++) {
          var msg = messages[i] || this.defaultMessage(name);
          if (msg instanceof Error) msg = msg.message;
          errors.push('' + name + joiner + msg);
        }
      }
      return errors;
    }

    /**
     * To JSON  format
     */

  }, {
    key: 'asJSON',
    value: function asJSON() {
      return this._errors;
    }

    /**
     * Default message format
     */

  }, {
    key: 'defaultMessage',
    value: function defaultMessage(name) {
      return 'Validation ' + name + ' failed';
    }

    /**
     * Check if there exists any error
     */

  }, {
    key: 'any',
    value: function any() {
      return this.hasErrors;
    }
  }]);

  return Errors;
}(Error);

module.exports = Errors;

},{}],5:[function(require,module,exports){
'use strict';

module.exports = {
  any: {
    unknown: 'validation failed',
    convertError: 'convert failed',
    required: 'is required',
    optional: 'is optional',
    forbidden: 'is forbidden',
    valid: 'must be one of "{{args}}"',
    only: 'must be one of "{{args}}"',
    whitelist: 'must be one of "{{args}}"',
    oneOf: 'must be one of "{{args}}"',
    equals: 'not equal to {{0}}',
    eq: 'not equal to {{0}}',
    equal: 'not equal to {{0}}',
    invalid: 'can\'t be one of "{{args}}"',
    not: 'can\'t be one of "{{args}}"',
    disallow: 'can\'t be one of "{{args}}"',
    blacklist: 'can\'t be one of "{{args}}"'
  },

  array: {
    isArray: 'is not a valid array',
    forbidden: 'Forbidden value can\'t be included',
    inclusions: 'No valid schema matches',
    requireds: '{{preferedLength}} elements are required, now is {{currentLength}}',
    isLength: 'length must be {{0}}',
    length: 'length must be {{0}}',
    maxLength: 'length must be less than {{0}}',
    max: 'length must be less than {{0}}',
    minLength: 'length must be longer than {{0}}',
    min: 'length must be longer than {{0}}'
  },

  boolean: {
    isBoolean: 'is not a valid boolean'
  },

  buffer: {
    isBuffer: 'is not a valid buffer'
  },

  date: {
    isDate: 'is not a valid date'
  },

  func: {
    isFunction: 'is not a valid function',
    arity: 'arguments length must be {{0}}',
    minArity: 'arguments length must be less than {{0}}',
    maxArity: 'arguments length must be longer than {{0}}'
  },

  number: {
    isNumber: 'is not a valid number',
    isInteger: 'is not a integer',
    integer: 'is not a integer',
    isPositive: 'is not positive number',
    positive: 'is not positive number',
    isNegative: 'is not negative number',
    negative: 'is not negative number',
    min: 'can not less than {{0}}',
    max: 'can not larger than {{0}}'
  },

  object: {
    isObject: 'is not a valid object'
  },

  regexp: {
    isRegExp: 'is not a valid regular expression'
  },

  string: {
    isString: 'is not a valid string'
  },

  alternatives: {
    try: 'invalid'
  }
};

},{}],6:[function(require,module,exports){
'use strict';

module.exports = {
  any: {
    unknown: '校验失败',
    convertError: '格式化失败',
    required: '不能为空',
    optional: '可选',
    forbidden: '不允许的值',
    valid: '只能是 "{{args}}" 其中之一',
    only: '只能是 "{{args}}" 其中之一',
    whitelist: '只能是 "{{args}}" 其中之一',
    oneOf: '只能是 "{{args}}" 其中之一',
    equals: '不等于{{0}}',
    eq: '不等于{{0}}',
    equal: '不等于{{0}}',
    invalid: '不能是 "{{args}}" 中任何一个',
    not: '不能是 "{{args}}" 中任何一个',
    disallow: '不能是 "{{args}}" 中任何一个',
    blacklist: '不能是 "{{args}}" 中任何一个'
  },

  array: {
    isArray: '不是一个有效的数组',
    forbidden: '包含不允许的元素',
    inclusions: '没有匹配的元素',
    requireds: '期望个数是{{preferedLength}}, 结果是{{currentLength}}',
    isLength: '长度必须为{{0}}',
    length: '长度必须为{{0}}',
    maxLength: '长度必须小于{{0}}',
    max: '长度必须小于{{0}}',
    minLength: '长度必须大于{{0}}',
    min: '长度必须大于{{0}}'
  },

  boolean: {
    isBoolean: '不是一个有效的布尔值'
  },

  buffer: {
    isBuffer: '不是一个有效的Buffer'
  },

  date: {
    isDate: '不是一个有效的日期'
  },

  func: {
    isFunction: '不是一个有效的函数',
    arity: '参数长度必须为{{0}}',
    minArity: '参数长度必须小于{{0}}',
    maxArity: '参数长度必须大于{{0}}'
  },

  number: {
    isNumber: '不是一个有效的数字',
    isInteger: '不是一个有效的整数',
    integer: '不是一个有效的整数',
    isPositive: '必须为正数',
    positive: '必须为正数',
    isNegative: '必须为负数',
    negative: '必须为负数',
    min: '不能小于{{0}}',
    max: '不能大于{{0}}'
  },

  object: {
    isObject: '不是一个有效的对象'
  },

  regexp: {
    isRegExp: '不是一个有效的正则表达式'
  },

  string: {
    isString: '不是一个有效的字符串'
  },

  alternatives: {
    try: '无效'
  }
};

},{}],7:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var magico = require('magico');
var utils = require('./utils');
var ALLOWED_TYPES = ['validator', 'sanitizer'];

var Method = function () {
  function Method(options) {
    _classCallCheck(this, Method);

    options = options || {};

    this.name = options.name;
    this.args = options.args;
    this.refs = options.refs;
    this.type = options.type;
    this.path = options.path;
    this.locale = options.locale;

    // catchable function
    this.fn = utils.tryCatch(this.type, options.fn);
  }

  _createClass(Method, [{
    key: 'canBeBypassed',
    value: function canBeBypassed(options) {
      options = options || {};
      if (this.is('validator') && options.skipValidators) return true;
      if (this.is('sanitizer') && options.skipSantizers) return true;
      if (!~ALLOWED_TYPES.indexOf(this.type)) return true;
      return false;
    }
  }, {
    key: 'invoke',
    value: function invoke(value, state, schema, options) {
      schema = schema || {};
      options = options || {};
      state = state || {
        origin: undefined,
        path: '',
        key: '',
        value: undefined,
        hasErrors: false
      };

      var args = utils.cloneArray(this.args);

      // search for reference value
      // 1. search original value
      // 2. search current value
      for (var key in this.refs) {
        var refValue = magico.get(state.value, this.refs[key].__key);
        if (utils.isUndefined(refValue)) {
          refValue = magico.get(state.origin, this.refs[key].__key);
        }
        args[key] = refValue;
      }

      state.args = args;

      // Method context
      var context = {
        state: state,
        schema: schema,
        options: options
      };

      return this.fn.apply(context, [value].concat(args));
    }
  }, {
    key: 'message',
    value: function message(error, args, locale) {
      locale = locale || 'en';
      args = args || [];
      args.args = args;
      args.locale = locale;

      var msg = void 0;
      if (this.locale) msg = magico.get(this.locale, '__msg.' + locale);

      // generate error message by i18n
      if (!msg) {
        msg = utils.t(this.path, args) || error || '';
      }
      return msg;
    }
  }, {
    key: 'is',
    value: function is(type) {
      return this.type === type;
    }
  }]);

  return Method;
}();

module.exports = Method;

},{"./utils":27,"magico":49}],8:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var magico = require('magico');
var I18n = require('baiji-i18n');
var config = require('./config');
var TYPES = require('./types');
var Errors = require('./errors');
var utils = require('./utils');
var Schema = require('./schema');
var Calculator = require('./calculator');
var EN_LOCALE = require('./locales/en');
var ZH_CN_LOCALE = require('./locales/zh-CN');

var VALID_TYPES = Object.keys(TYPES);

var Ovt = function () {
  function Ovt() {
    _classCallCheck(this, Ovt);

    // Current version.
    this.VERSION = '1.1.0';

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

  _createClass(Ovt, [{
    key: 'addMethod',
    value: function addMethod(type, name, options) {
      utils.assert(~VALID_TYPES.indexOf(type), type + ' is not a valid schema type.');

      // Support old usage: type, name, fn, chainingBehaviour, options
      if (utils.isFunction(options)) {
        var args = utils.parseArg(arguments);
        var opts = args[4] || {};

        if (utils.isObject(args[3])) opts = args[3];

        opts.method = options;

        if (utils.isFunction(args[3])) {
          opts.chainingBehaviour = args[3];
        }
        options = opts;
      }

      var proto = TYPES[type].prototype;
      utils.chainable(proto, type)(name, options);
    }
  }, {
    key: 'plugin',
    value: function plugin(nameOrFn, options) {
      if (utils.isString(nameOrFn)) {
        var name = 'ovt-plugin-' + nameOrFn;
        try {
          var fn = require(name);
          utils.assert(utils.isFunction(fn), name + ' is not a valid plugin');
          fn(this, options);
        } catch (e) {
          if (e.code === 'MODULE_NOT_FOUND') {
            // eslint-disable-next-line no-console
            console.log('\x1B[31m\n            You don\'t have module \'' + name + '\' installed correctly, please run command:\n            `npm install ' + name + ' --save`\n            to install the module.\n            Otherwise \'' + name + '\' will not be activated.\n          \x1B[39m');
          } else {
            throw e;
          }
        }
      } else {
        utils.assert(utils.isFunction(nameOrFn), nameOrFn + ' is not a valid plugin');
        nameOrFn(this, options);
      }
    }
  }, {
    key: 'parseOptions',
    value: function parseOptions(opts) {
      opts = opts || {};
      var _opts = {};

      _opts.skipSantizers = opts.skipSantizers === true;
      _opts.skipValidators = opts.skipValidators === true;
      _opts.abortEarly = opts.abortEarly == null ? this.config.abortEarly : opts.abortEarly;
      _opts.convert = opts.convert == null ? this.config.convert : opts.convert;
      _opts.noDefaults = opts.noDefaults == null ? this.config.noDefaults : opts.noDefaults;
      _opts.locale = opts.locale || this.config.defaultLocale || 'en';

      return _opts;
    }

    // Validates a value using the given schema and options

  }, {
    key: 'validate',
    value: function validate(value, schema, optionsOrCallback, callback) {
      utils.assert(schema && schema.isOvt, utils.obj2Str(schema) + ' is not a valid Schema');

      var options = {};

      if (utils.isFunction(optionsOrCallback)) {
        callback = optionsOrCallback;
      } else {
        options = optionsOrCallback;
      }
      options = this.parseOptions(options);

      var res = Calculator.execute(value, schema, {
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

  }, {
    key: 'assert',
    value: function assert(value, schema, options) {
      var res = this.validate(value, schema, options);
      if (res.errors) throw res.errors;
    }

    // Validates a value against a schema, returns valid object,
    // and throws if validation fails

  }, {
    key: 'attempt',
    value: function attempt(value, schema, options) {
      var res = this.validate(value, schema, options);
      if (res.errors) throw res.errors;
      return res.value;
    }

    // Create ref object

  }, {
    key: 'ref',
    value: function ref(key) {
      return utils.ref(key);
    }
  }, {
    key: 'isRef',
    value: function isRef(obj) {
      return utils.isRef(obj);
    }

    // Create localized message object
    // { __msg: { en: 'custom message' }, __isLocale: true }

  }, {
    key: 'l',
    value: function l(msg) {
      if (!msg) return;
      var locale = config.defaultLocale || 'en';
      if (utils.isString(msg)) {
        msg = _defineProperty({}, locale, msg);
      }
      return { __msg: msg, __isLocale: true };
    }
  }, {
    key: 'm',
    value: function m(msg) {
      return this.l(msg);
    }
  }, {
    key: 'isLocale',
    value: function isLocale(obj) {
      return utils.isLocale(obj);
    }

    // I18n translate

  }, {
    key: 't',
    value: function t(name, options) {
      return utils.t(name, options);
    }

    // Add specific locale
    // Example:
    //   locale: 'en'
    //   obj: { any: { required: 'is required' } }

  }, {
    key: 'registerLocale',
    value: function registerLocale(locale, obj) {
      obj = obj || {};
      var prefix = locale + '.ovt';
      var translations = {};

      // Merge translations
      VALID_TYPES.forEach(function (type) {
        translations[type] = Object.assign(magico.get(I18n.translations, prefix + '.' + type) || {}, magico.get(obj, type));
      });

      magico.set(I18n.translations, prefix, translations);

      return this;
    }
  }]);

  return Ovt;
}();

// Add type methods:
// any, array, boolean, buffer, date, func, number, object, regexp, string


VALID_TYPES.forEach(function (name) {
  var TypeClass = TYPES[name];
  Ovt.prototype[name] = function () {
    var inst = new TypeClass();
    return inst.initialize.apply(inst, arguments);
  };
});

module.exports = new Ovt();

},{"./calculator":2,"./config":3,"./errors":4,"./locales/en":5,"./locales/zh-CN":6,"./schema":9,"./types":17,"./utils":27,"baiji-i18n":47,"magico":49}],9:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var utils = require('./utils');
var Calculator = require('./calculator');
var config = require('./config');

var Schema = function () {
  function Schema() {
    _classCallCheck(this, Schema);

    this._type = undefined;
    this._defaultValidator = undefined;
    this._defaultValue = undefined;
    this._emptySchema = undefined;
    this.isOvt = true;
    this._label = undefined;
    this._description = undefined;
    this._error = undefined;
    this._notes = [];
    this._tags = [];
    this._methods = {};
    this._inner = {
      // array inners
      inclusions: [],
      requireds: [],
      ordereds: [],
      exclusions: [],
      orderedExclusions: [],

      // object inners
      children: {},
      renames: {}
    };

    this._virtuals = {};
  }

  _createClass(Schema, [{
    key: 'initialize',
    value: function initialize() {
      return this._defaultValidator ? this[this._defaultValidator]() : this;
    }
  }, {
    key: 'convert',
    value: function convert(val) {
      return val;
    }
  }, {
    key: 'clone',
    value: function clone() {
      var obj = new this.constructor();

      obj._error = this._error;
      obj._defaultValidator = this._defaultValidator;
      obj._defaultValue = this._defaultValue;
      obj._emptySchema = this._emptySchema;
      obj._methods = utils.merge({}, this._methods);

      obj._label = this._label;
      obj._description = this._description;
      obj._notes = utils.cloneArray(this._notes);
      obj._tags = utils.cloneArray(this._tags);

      obj._inner = {
        inclusions: utils.cloneArray(this._inner.inclusions),
        requireds: utils.cloneArray(this._inner.requireds),
        ordereds: utils.cloneArray(this._inner.ordereds),
        orderedExclusions: utils.cloneArray(this._inner.orderedExclusions),
        exclusions: utils.cloneArray(this._inner.exclusions),
        children: utils.cloneObject(this._inner.children),
        renames: utils.cloneObject(this._inner.renames)
      };

      obj._virtuals = utils.cloneObject(this._virtuals);

      return obj;
    }
  }, {
    key: 'concat',
    value: function concat(schema) {
      utils.assert(schema && schema.isOvt, utils.obj2Str(schema) + ' is not a valid ovt schema');
      utils.assert(this._type === 'any' || schema._type === 'any' || this._type === schema._type, this._type + ' schema is not allowed to concat ' + schema._type + ' schema');
      var source = void 0,
          target = void 0;
      if (this._type === 'any' || this._type === schema._type) {
        source = schema.clone();
        target = this;
      } else if (schema._type === 'any') {
        source = this.clone();
        target = schema;
      }

      source._defaultValidator = target._defaultValidator;
      source._error = target._error;
      source._defaultValue = target._defaultValue;
      source._emptySchema = target._emptySchema;
      source._description = target._description;
      source._label = target._label;
      source._notes = source._notes.concat(target._notes);
      source._tags = source._tags.concat(target._tags);

      utils.merge(source._methods, target._methods);
      utils.merge(source._inner.inclusions, target._inner.inclusions);
      utils.merge(source._inner.requireds, target._inner.requireds);
      utils.merge(source._inner.ordereds, target._inner.ordereds);
      utils.merge(source._inner.orderedExclusions, target._inner.orderedExclusions);
      utils.merge(source._inner.exclusions, target._inner.exclusions);
      utils.merge(source._inner.children, target._inner.children);
      utils.merge(source._inner.renames, target._inner.renames);
      utils.merge(source._virtuals, target._virtuals);

      return source;
    }
  }, {
    key: 'validate',
    value: function validate(value, options, state) {
      state = state || {};
      state = {
        origin: state.origin === undefined ? value : state.origin,
        path: state.path,
        key: state.key,
        value: value,
        hasErrors: state.hasErrors || false
      };
      return Calculator.execute(value, this, state, options);
    }
  }, {
    key: 'error',
    value: function error(msg) {
      var locale = config.defaultLocale || 'en';
      if (utils.isString(msg)) {
        this._error = _defineProperty({}, locale, msg);
      } else if (utils.isObject(msg)) {
        this._error = msg;
      } else {
        throw new Error('invalid custom error');
      }

      return this;
    }
  }]);

  return Schema;
}();

var chainable = utils.chainable(Schema.prototype);

chainable('empty', {
  chainingBehaviour: function addDescription(schema) {
    this._emptySchema = schema;
    return this;
  }
});

chainable('desc', 'description', {
  chainingBehaviour: function addDescription(desc) {
    if (utils.isUndefined(desc)) return this;

    utils.assert(utils.isString(desc), 'Description must be a non-empty string');

    this._description = desc;

    // set label
    if (utils.isUndefined(this._label)) this._label = desc;

    return this;
  }
});

chainable('label', {
  chainingBehaviour: function addLabel(label) {
    if (utils.isUndefined(label)) return this;

    utils.assert(utils.isString(label), 'Label must be a non-empty string');

    this._label = label;

    return this;
  }
});

chainable('note', 'notes', {
  chainingBehaviour: function addNotes(notes) {
    if (utils.isUndefined(notes)) return this;

    utils.assert(notes && (utils.isString(notes) || Array.isArray(notes)), 'Notes must be a non-empty string or array');

    this._notes = this._notes.concat(notes);
    return this;
  }
});

chainable('tag', 'tags', {
  chainingBehaviour: function addTags(tags) {
    if (utils.isUndefined(tags)) return this;

    utils.assert(tags && (utils.isString(tags) || Array.isArray(tags)), 'Tags must be a non-empty string or array');

    this._tags = this._tags.concat(tags);
    return this;
  }
});

chainable('virtual', {
  chainingBehaviour: function addVirtual(name, value) {
    if (utils.isUndefined(name)) return this;

    utils.assert(utils.isString(name), utils.obj2Str(name) + ' is not a valid string');

    this._virtuals[name] = value;
    return this;
  }
});

chainable('default', {
  chainingBehaviour: function addDefault(value) {
    this._defaultValue = value;
    return this;
  }
});

module.exports = Schema;

},{"./calculator":2,"./config":3,"./utils":27}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AnyType = require('./any');
var utils = require('../utils');

var AlternativesType = function (_AnyType) {
  _inherits(AlternativesType, _AnyType);

  function AlternativesType() {
    _classCallCheck(this, AlternativesType);

    var _this = _possibleConstructorReturn(this, (AlternativesType.__proto__ || Object.getPrototypeOf(AlternativesType)).call(this));

    _this._type = 'alternatives';
    return _this;
  }

  _createClass(AlternativesType, [{
    key: 'initialize',
    value: function initialize() {
      var self = _get(AlternativesType.prototype.__proto__ || Object.getPrototypeOf(AlternativesType.prototype), 'initialize', this).call(this);
      return self.try.apply(self, arguments);
    }
  }]);

  return AlternativesType;
}(AnyType);

var chainable = utils.chainable(AnyType.prototype, 'alternatives');

chainable('try', {
  method: function method() {
    var args = utils.cloneArray(arguments);
    var val = args.shift();

    // parse args to support [[schema1, schema2]] syntax
    args = utils.parseArg(args);

    var matched = void 0;

    // Loop all schemas
    // If any one is matched without errors, then return value
    // If no one is matched, then return errors of the first result
    for (var i = 0; i < args.length; i++) {
      var schema = args[i];
      var res = schema.validate(val, this.options);
      if (!res.errors) {
        matched = res.value;
        break;
      }
    }

    return matched || new Error('validation failed');
  },

  // Using chainingBehaviour to check whether schemas are valid
  chainingBehaviour: function chainingBehaviour() {
    var schemas = utils.parseArg(arguments);
    schemas.forEach(function (schema) {
      utils.assert(schema.isOvt, utils.obj2Str(schema) + ' is not a valid ovt schema');
    });
  },
  type: 'sanitizer'
});

module.exports = AlternativesType;

},{"../utils":27,"./any":11}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('../utils');
var Schema = require('../schema');

var AnyType = function (_Schema) {
  _inherits(AnyType, _Schema);

  function AnyType() {
    _classCallCheck(this, AnyType);

    var _this = _possibleConstructorReturn(this, (AnyType.__proto__ || Object.getPrototypeOf(AnyType)).call(this));

    _this._type = 'any';
    return _this;
  }

  _createClass(AnyType, [{
    key: 'convert',
    value: function convert(val) {
      return val;
    }
  }]);

  return AnyType;
}(Schema);

module.exports = AnyType;

var chainable = utils.chainable(AnyType.prototype, 'any');

chainable('required', {
  method: function method(val) {
    var schema = this.schema._emptySchema;
    var isEmpty = utils.isUndefined(val);

    if (isEmpty) return !isEmpty;

    if (schema && schema.isOvt) {
      var res = schema.validate(val, { abortEarly: true });
      isEmpty = isEmpty || !res.errors;
    } else if (!utils.isUndefined(schema)) {
      isEmpty = isEmpty || val === schema;
    }

    return !isEmpty;
  },
  chainingBehaviour: function chainingBehaviour() {
    delete this._methods.optional;
    delete this._methods.forbidden;
    return this;
  }
});

chainable('optional', {
  chainingBehaviour: function chainingBehaviour() {
    delete this._methods.required;
    delete this._methods.forbidden;
    return this;
  }
});

chainable('forbidden', {
  method: function method(val) {
    return utils.isUndefined(val);
  },
  chainingBehaviour: function chainingBehaviour() {
    delete this._methods.required;
    delete this._methods.optional;
    return this;
  }
});

function validateWhitelist() {
  var args = utils.cloneArray(arguments);
  var val = args.shift();
  args = utils.parseArg(args);
  return !!~args.indexOf(val);
}

chainable('valid', 'only', 'whitelist', 'oneOf', { method: validateWhitelist });

chainable('equals', 'eq', 'equal', {
  method: function validateEqual(value, other) {
    return value === other || value !== value && other !== other;
  }
});

chainable('invalid', 'not', 'disallow', 'blacklist', {
  method: function validateInvalid() {
    return !validateWhitelist.apply(this, arguments);
  }
});

var AlternativesType = require('./alternatives');
chainable('when', {
  // Check and parse ref and condition
  parseArgs: function parseArgs(ref, condition) {
    condition = condition || {};

    utils.assert(condition.then || condition.otherwise, 'one of condition.then or condition.otherwise must be existed');
    utils.assert(!condition.then || condition.then && condition.then.isOvt, 'condition.then must be a valid ovt schema');
    utils.assert(!condition.otherwise || condition.otherwise && condition.otherwise.isOvt, 'condition.otherwise must be a valid ovt schema');

    if (utils.isString(ref)) ref = utils.ref(ref);

    utils.assert(utils.isRef(ref), 'ref must be a valid string or ref object');

    return [ref, condition];
  },

  method: function method(val, refValue, condition) {
    condition = condition || {};
    var res = {};
    var is = condition.is;
    var then = condition.then;
    var otherwise = condition.otherwise;

    var matched = false;
    if (is && is.isOvt) {
      matched = is.validate(refValue, this.options, this.state);
      matched = !matched.errors;
    } else {
      matched = is === refValue;
    }

    if (matched) {
      if (then && then.isOvt) res = then.validate(val, this.options, this.state);
    } else {
      if (otherwise && otherwise.isOvt) res = otherwise.validate(val, this.options);
    }

    return res.errors ? new Error('validation failed') : res.value;
  },

  // Convert type into alternatives
  chainingBehaviour: function chainingBehaviour() {
    var self = new AlternativesType().initialize(this);
    return self;
  },

  type: 'sanitizer'
});

},{"../schema":9,"../utils":27,"./alternatives":10}],12:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AnyType = require('./any');
var utils = require('../utils');

var ArrayType = function (_AnyType) {
  _inherits(ArrayType, _AnyType);

  function ArrayType() {
    _classCallCheck(this, ArrayType);

    var _this = _possibleConstructorReturn(this, (ArrayType.__proto__ || Object.getPrototypeOf(ArrayType)).call(this));

    _this._type = 'array';
    _this._defaultValidator = 'isArray';

    _this._inner.inclusions = [];
    _this._inner.requireds = [];
    _this._inner.ordereds = [];
    _this._inner.orderedExclusions = [];
    _this._inner.exclusions = [];
    return _this;
  }

  _createClass(ArrayType, [{
    key: 'initialize',
    value: function initialize() {
      var self = _get(ArrayType.prototype.__proto__ || Object.getPrototypeOf(ArrayType.prototype), 'initialize', this).call(this);
      // Initialize items
      return self._addItems.apply(self, arguments);
    }
  }, {
    key: 'convert',
    value: function convert(val) {
      return utils.castArray(val);
    }
  }, {
    key: '_addItems',
    value: function _addItems() {
      var schemas = utils.parseArg(arguments);
      var self = this;
      if (!schemas.length) return this;
      schemas.forEach(function (schema) {
        utils.assert(schema.isOvt, utils.obj2Str(schema) + ' is invalid');

        if ('required' in schema._methods) {
          self._inner.requireds.push(schema);
        } else if ('forbidden' in schema._methods) {
          self._inner.exclusions.push(schema.optional());
        } else {
          self._inner.inclusions.push(schema);
        }
      });

      this._methods.__inners_flag__ = true;

      return this;
    }
  }]);

  return ArrayType;
}(AnyType);

var chainable = utils.chainable(ArrayType.prototype, 'array');

chainable('isArray', { method: utils.isArray });

chainable('ordered', {
  chainingBehaviour: function chainingBehaviour() {
    var schemas = utils.parseArg(arguments);
    var self = this;
    schemas.forEach(function (schema, i) {
      utils.assert(schema.isOvt, utils.obj2Str(schema) + ' is not a valid ovt schema');
      if ('forbidden' in schema._methods) {
        self._inner.orderedExclusions[i] = schema.optional();
      } else {
        self._inner.ordereds[i] = schema;
      }
    });

    this._methods.__inners_flag__ = true;

    return this;
  }
});

chainable('elements', 'items', {
  chainingBehaviour: function addElements() {
    return this._addItems.apply(this, arguments);
  }
});

chainable('isLength', 'length', {
  method: function method(val, length) {
    return val.length === length;
  }
});

chainable('maxLength', 'max', {
  method: function method(val, maxLength) {
    return val.length <= maxLength;
  }
});

chainable('minLength', 'min', {
  method: function method(val, minLength) {
    return val.length >= minLength;
  }
});

module.exports = ArrayType;

},{"../utils":27,"./any":11}],13:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AnyType = require('./any');
var utils = require('../utils');

var BooleanType = function (_AnyType) {
  _inherits(BooleanType, _AnyType);

  function BooleanType() {
    _classCallCheck(this, BooleanType);

    var _this = _possibleConstructorReturn(this, (BooleanType.__proto__ || Object.getPrototypeOf(BooleanType)).call(this));

    _this._type = 'boolean';
    _this._defaultValidator = 'isBoolean';
    return _this;
  }

  _createClass(BooleanType, [{
    key: 'convert',
    value: function convert(val) {
      return utils.isBoolean(val) ? val : Boolean(val).valueOf();
    }
  }]);

  return BooleanType;
}(AnyType);

var chainable = utils.chainable(BooleanType.prototype, 'boolean');

chainable('isBoolean', { method: utils.isBoolean });

module.exports = BooleanType;

},{"../utils":27,"./any":11}],14:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('../utils');
var AnyType = require('./any');

var supportBuffer = typeof Buffer !== 'undefined';

var BufferType = function (_AnyType) {
  _inherits(BufferType, _AnyType);

  function BufferType() {
    _classCallCheck(this, BufferType);

    var _this = _possibleConstructorReturn(this, (BufferType.__proto__ || Object.getPrototypeOf(BufferType)).call(this));

    _this._type = 'buffer';
    _this._defaultValidator = 'isBuffer';
    return _this;
  }

  _createClass(BufferType, [{
    key: 'convert',
    value: function convert(val) {
      return supportBuffer ? val instanceof Buffer ? val : new Buffer(val) : val;
    }
  }]);

  return BufferType;
}(AnyType);

var chainable = utils.chainable(BufferType.prototype, 'buffer');

chainable('isBuffer', {
  method: function method(val) {
    return supportBuffer ? val instanceof Buffer : false;
  }
});

module.exports = BufferType;

},{"../utils":27,"./any":11}],15:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('../utils');
var AnyType = require('./any');

var DateType = function (_AnyType) {
  _inherits(DateType, _AnyType);

  function DateType() {
    _classCallCheck(this, DateType);

    var _this = _possibleConstructorReturn(this, (DateType.__proto__ || Object.getPrototypeOf(DateType)).call(this));

    _this._type = 'date';
    _this._defaultValidator = 'isDate';
    return _this;
  }

  _createClass(DateType, [{
    key: 'convert',
    value: function convert(val) {
      return utils.isDate(val) ? val : new Date(val);
    }
  }]);

  return DateType;
}(AnyType);

var chainable = utils.chainable(DateType.prototype, 'date');

chainable('isDate', { method: utils.isDate });

module.exports = DateType;

},{"../utils":27,"./any":11}],16:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ObjectType = require('./object');
var utils = require('../utils');

var FuncType = function (_ObjectType) {
  _inherits(FuncType, _ObjectType);

  function FuncType() {
    _classCallCheck(this, FuncType);

    var _this = _possibleConstructorReturn(this, (FuncType.__proto__ || Object.getPrototypeOf(FuncType)).call(this));

    _this._type = 'func';
    _this._defaultValidator = 'isFunction';
    return _this;
  }

  _createClass(FuncType, [{
    key: 'convert',
    value: function convert(val) {
      return utils.isFunction(val) ? val : new Function(val);
    }
  }]);

  return FuncType;
}(ObjectType);

var chainable = utils.chainable(FuncType.prototype, 'func');

chainable('isFunction', { method: utils.isFunction });

chainable('arity', {
  method: function method(fn, limit) {
    return limit === fn.length;
  }
});

chainable('minArity', {
  method: function method(fn, limit) {
    return fn.length >= limit;
  }
});

chainable('maxArity', {
  method: function method(fn, limit) {
    return fn.length <= limit;
  }
});

module.exports = FuncType;

},{"../utils":27,"./object":19}],17:[function(require,module,exports){
'use strict';

module.exports = {
  'any': require('./any'),
  'array': require('./array'),
  'string': require('./string'),
  'boolean': require('./boolean'),
  'buffer': require('./buffer'),
  'date': require('./date'),
  'func': require('./func'),
  'number': require('./number'),
  'object': require('./object'),
  'regexp': require('./regexp'),
  'alternatives': require('./alternatives')
};

},{"./alternatives":10,"./any":11,"./array":12,"./boolean":13,"./buffer":14,"./date":15,"./func":16,"./number":18,"./object":19,"./regexp":20,"./string":21}],18:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('../utils');
var AnyType = require('./any');

var NumberType = function (_AnyType) {
  _inherits(NumberType, _AnyType);

  function NumberType() {
    _classCallCheck(this, NumberType);

    var _this = _possibleConstructorReturn(this, (NumberType.__proto__ || Object.getPrototypeOf(NumberType)).call(this));

    _this._type = 'number';
    _this._defaultValidator = 'isNumber';
    return _this;
  }

  _createClass(NumberType, [{
    key: 'convert',
    value: function convert(val) {
      return utils.isNumber(val) ? val : Number(val);
    }
  }]);

  return NumberType;
}(AnyType);

var chainable = utils.chainable(NumberType.prototype, 'number');

chainable('isNumber', { method: utils.isNumber });

chainable('isInteger', 'integer', {
  method: function method(val) {
    return Number.isInteger(val);
  }
});

chainable('isInteger', 'integer', {
  method: function method(val) {
    return Number.isInteger(val);
  }
});

chainable('isPositive', 'positive', {
  method: function method(val) {
    return val > 0;
  }
});

chainable('isNegative', 'negative', {
  method: function method(val) {
    return val < 0;
  }
});

chainable('min', {
  method: function method(val, min) {
    return val >= min;
  }
});

chainable('max', {
  method: function method(val, max) {
    return val <= max;
  }
});

module.exports = NumberType;

},{"../utils":27,"./any":11}],19:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AnyType = require('./any');
var utils = require('../utils');

var ArrayType = require('./array');

var ObjectType = function (_AnyType) {
  _inherits(ObjectType, _AnyType);

  function ObjectType() {
    _classCallCheck(this, ObjectType);

    var _this = _possibleConstructorReturn(this, (ObjectType.__proto__ || Object.getPrototypeOf(ObjectType)).call(this));

    _this._type = 'object';
    _this._defaultValidator = 'isObject';

    _this._inner.renames = {};
    _this._inner.children = {};
    return _this;
  }

  _createClass(ObjectType, [{
    key: 'initialize',
    value: function initialize(schemas) {
      var self = _get(ObjectType.prototype.__proto__ || Object.getPrototypeOf(ObjectType.prototype), 'initialize', this).call(this);
      return self._addSchemas(schemas);
    }
  }, {
    key: 'convert',
    value: function convert(val) {
      return utils.isObject(val) ? val : new Object(val);
    }
  }, {
    key: '_addSchemas',
    value: function _addSchemas(schemas) {
      schemas = schemas || {};

      utils.assert(utils.isObject(schemas) && !schemas.isOvt, utils.obj2Str(schemas) + ' is invalid');

      for (var name in schemas) {
        var schema = schemas[name] || {};
        this._addSchema(name, schema);
      }

      this._methods.__inners_flag__ = true;

      return this;
    }
  }, {
    key: '_addSchema',
    value: function _addSchema(name, schema) {
      utils.assert(utils.isString(name), utils.obj2Str(name) + ' is not a valid key');

      // check default types
      if (schema.isOvt) {
        this._inner.children[name] = schema;
      }

      // check array type
      else if (utils.isArray(schema)) {
          var arraySchema = new ArrayType();
          arraySchema = arraySchema.initialize.apply(arraySchema, schema);
          this._inner.children[name] = arraySchema;
        }

        // check plain object type
        else if (utils.isObject(schema)) {
            var objectSchema = new ObjectType();
            objectSchema = objectSchema.initialize(schema);
            this._inner.children[name] = objectSchema;
          } else {
            utils.assert(false, utils.obj2Str(schema) + ' is not a valid schema');
          }

      this._methods.__inners_flag__ = true;

      return this;
    }
  }]);

  return ObjectType;
}(AnyType);

var chainable = utils.chainable(ObjectType.prototype, 'object');

chainable('isObject', { method: utils.isObject });

chainable('add', {
  chainingBehaviour: function chainingBehaviour(name, schema) {
    return this._addSchema(name, schema);
  }
});

chainable('remove', {
  chainingBehaviour: function chainingBehaviour(name) {
    utils.assert(utils.isString(name), utils.obj2Str(name) + ' is not a valid key');
    delete this._inner.children[name];
    return this;
  }
});

chainable('keys', {
  chainingBehaviour: function chainingBehaviour(schemas) {
    return this._addSchemas(schemas);
  }
});

chainable('rename', {
  chainingBehaviour: function chainingBehaviour(oldName, newName) {
    if (utils.isString(newName)) {
      utils.assert(utils.isString(oldName), utils.obj2Str(oldName) + ' is not a valid string');
    }
    if (utils.isString(oldName)) {
      this._inner.renames[oldName] = newName;
    } else {
      if (utils.isObject(oldName)) {
        this._inner.renames = Object.assign(this._inner.renames, oldName);
      }
    }
    return this;
  }
});

module.exports = ObjectType;

},{"../utils":27,"./any":11,"./array":12}],20:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('../utils');
var AnyType = require('./any');

var RegExpType = function (_AnyType) {
  _inherits(RegExpType, _AnyType);

  function RegExpType() {
    _classCallCheck(this, RegExpType);

    var _this = _possibleConstructorReturn(this, (RegExpType.__proto__ || Object.getPrototypeOf(RegExpType)).call(this));

    _this._type = 'regexp';
    _this._defaultValidator = 'isRegExp';
    return _this;
  }

  _createClass(RegExpType, [{
    key: 'convert',
    value: function convert(val) {
      return utils.isRegExp(val) ? val : new RegExp(val);
    }
  }]);

  return RegExpType;
}(AnyType);

var chainable = utils.chainable(RegExpType.prototype, 'regexp');

chainable('isRegExp', { method: utils.isRegExp });

module.exports = RegExpType;

},{"../utils":27,"./any":11}],21:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var utils = require('../utils');
var AnyType = require('./any');

var StringType = function (_AnyType) {
  _inherits(StringType, _AnyType);

  function StringType() {
    _classCallCheck(this, StringType);

    var _this = _possibleConstructorReturn(this, (StringType.__proto__ || Object.getPrototypeOf(StringType)).call(this));

    _this._type = 'string';
    _this._defaultValidator = 'isString';
    return _this;
  }

  _createClass(StringType, [{
    key: 'convert',
    value: function convert(val) {
      return utils.isString(val) ? val : String(val);
    }
  }]);

  return StringType;
}(AnyType);

var chainable = utils.chainable(StringType.prototype, 'string');

chainable('isString', { method: utils.isString });

module.exports = StringType;

},{"../utils":27,"./any":11}],22:[function(require,module,exports){
'use strict';

module.exports = function ok(condition, message) {
  if (!condition) {
    var error = new Error(message);
    error.name = 'AssertionError';
    throw error;
  }
};

},{}],23:[function(require,module,exports){
'use strict';

var isArray = require('./isArray');
var isUndefined = require('./isUndefined');

module.exports = function castArray() {
  if (!arguments.length) return [];
  var value = arguments[0];
  return isArray(value) ? value : isUndefined(value) ? [] : [value];
};

},{"./isArray":28,"./isUndefined":39}],24:[function(require,module,exports){
'use strict';

/*!
 * Module dependencies
 */

var obj2Str = require('./obj2Str');
var noop = require('./noop');
var cloneArray = require('./cloneArray');
var parseArg = require('./parseArg');
var isString = require('./isString');
var isFunction = require('./isFunction');
var isObject = require('./isObject');
var isLocale = require('./isLocale');
var assert = require('./assert');
var isRef = require('./isRef');
var Method = require('../method');

/**
 * ### addChainableMethod (ctx, name, options)
 *
 * Adds a method to an object, such that the method can also be chained.
 *
 *     utils.addChainableMethod(StringType.prototype, 'isEmail', function (val) {
 *       if (!val) return `${val} is not a valid email`;
 *     }, null, { type: 'validator' });
 *
 * The result can then be used as both a method that can be executing,
 * or as a language chain.
 *
 *     ovt.string().required().isEmail();
 *
 * @param {Object} ctx object to which the method is added
 * @param {String} type of which method will be added
 * @param {String} name of method to add
 * @param {Object} options
 * @namespace Utils
 * @name addChainableMethod
 * @api public
 */

function addChainableMethod(ctx, type, name, options) {
  options = options || {};

  assert(isObject(ctx), obj2Str(ctx) + ' is not a valid Object');
  assert(isString(name), obj2Str(name) + ' is not a valid String');

  var hasChainingBehaviour = isFunction(options.chainingBehaviour);
  var hasMethod = isFunction(options.method);
  var hasParseArgs = isFunction(options.parseArgs);

  assert(hasMethod || hasChainingBehaviour, 'Invalid chainable method `' + name + '`, options method or chainingBehaviour should be provided!');

  // assign default type, default is `validator`
  options.type = options.type || 'validator';

  // whether the method can be overwrite, default is `true`
  options.allowMethodOverwrite = options.allowMethodOverwrite === false;

  // Default function
  var defaultFn = options.method || noop;

  // Add cooresponding method
  ctx[name] = function (fn) {
    var self = this.clone();
    var args = cloneArray(arguments);

    // Apply parseArgs
    if (hasParseArgs) {
      args = options.parseArgs.apply(null, args);
    }

    // Apply chainable behaviour
    if (hasChainingBehaviour) {
      self = options.chainingBehaviour.apply(self, args) || self;
    }

    // Add method
    if (hasMethod) {
      var _fn = defaultFn;

      // handle method overwritten for validators
      // for example: ovt.string.isEmail(function(val) { /* your custom validator */ });
      if (options.allowMethodOverwrite && options.type === 'validator' && isFunction(fn)) {
        _fn = fn;
        args.shift();
      }

      // handle custom locale
      var locale = void 0;
      if (isLocale(args[args.length - 1])) locale = args.pop();

      // Analyze references
      var refs = Object.create(null);
      for (var i = 0; i < args.length; i++) {
        if (isRef(args[i])) {
          refs[i] = args[i];
        }
      }

      // Initialize `_methods` property
      if (!self._methods) self._methods = {};

      self._methods[name] = new Method({
        name: name,
        fn: _fn,
        args: args,
        refs: refs,
        type: options.type,
        path: type + '.' + name,
        locale: locale
      });
    }

    return self;
  };
}

module.exports = function chainable(proto, type) {
  return function chainableProxy() {
    var args = parseArg(arguments);
    var options = args.pop();
    args.forEach(function (name) {
      addChainableMethod(proto, type, name, options);
    });
  };
};

},{"../method":7,"./assert":22,"./cloneArray":25,"./isFunction":32,"./isLocale":33,"./isObject":35,"./isRef":36,"./isString":38,"./noop":41,"./obj2Str":42,"./parseArg":43}],25:[function(require,module,exports){
'use strict';

module.exports = function cloneArray(array) {
  array = array || [];
  var newArray = new Array(array.length);
  var i = array.length;
  while (i--) {
    newArray[i] = array[i];
  }
  return newArray;
};

},{}],26:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var isArray = require('./isArray');
var cloneArray = require('./cloneArray');

module.exports = function cloneObject(val) {
  if (isObject(val)) {
    var Ctor = val.constructor || Object;
    var obj = new Ctor();
    for (var key in val) {
      if (isArray(val[key])) {
        obj[key] = cloneArray(val[key]);
      } else {
        obj[key] = val[key];
      }
    }
    return obj;
  } else {
    return val;
  }
};

},{"./cloneArray":25,"./isArray":28,"./isObject":35}],27:[function(require,module,exports){
'use strict';

/*!
 * No operation
 */

exports.noop = require('./noop');

/*!
 * Assert
 */

exports.assert = require('./assert');

/*!
 * error check
 */

exports.isError = require('./isError');

/*!
 * undefined check
 */

exports.isUndefined = require('./isUndefined');

/*!
 * array check
 */

exports.isArray = require('./isArray');

/*!
 * boolean check
 */

exports.isBoolean = require('./isBoolean');

/*!
 * date check
 */

exports.isDate = require('./isDate');

/*!
 * function check
 */

exports.isFunction = require('./isFunction');

/*!
 * number check
 */

exports.isNumber = require('./isNumber');

/*!
 * object check
 */

exports.isObject = require('./isObject');

/*!
 * regexp check
 */

exports.isRegExp = require('./isRegExp');

/*!
 * string check
 */

exports.isString = require('./isString');

/*!
 * cast to array
 */

exports.castArray = require('./castArray');

/*!
 * Add a chainable method
 */

exports.chainable = require('./chainable');

/*!
 * Object to string utility
 */

exports.obj2Str = require('./obj2Str');

/*!
 * Wrapper method with proper error message
 */

exports.tryCatch = require('./tryCatch');

/*!
 * Parse arguments
 */

exports.parseArg = require('./parseArg');

/*!
 * Array fast clone
 */

exports.cloneArray = require('./cloneArray');

/*!
 * Object fast clone
 */

exports.cloneObject = require('./cloneObject');

/*!
 * Check if a object is reference
 */

exports.isRef = require('./isRef');

/*!
 * Create a ref object
 */

exports.ref = require('./ref');

/*!
 * Check if a object is locale config
 */

exports.isLocale = require('./isLocale');

/*!
 * Localize
 */

exports.t = require('./t');

/*!
 * Merge objects
 */

exports.merge = require('./merge');

},{"./assert":22,"./castArray":23,"./chainable":24,"./cloneArray":25,"./cloneObject":26,"./isArray":28,"./isBoolean":29,"./isDate":30,"./isError":31,"./isFunction":32,"./isLocale":33,"./isNumber":34,"./isObject":35,"./isRef":36,"./isRegExp":37,"./isString":38,"./isUndefined":39,"./merge":40,"./noop":41,"./obj2Str":42,"./parseArg":43,"./ref":44,"./t":45,"./tryCatch":46}],28:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var arrayTag = '[object Array]';

var nativeIsArray = Array.isArray;

module.exports = function isArray(value) {
  return nativeIsArray ? nativeIsArray(value) : isObject(value) && obj2Str(value) === arrayTag;
};

},{"./isObject":35,"./obj2Str":42}],29:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var booleanTag = '[object Boolean]';

module.exports = function isBoolean(value) {
  if (typeof value === 'boolean') return true;
  return isObject(value) && obj2Str(value) === booleanTag;
};

},{"./isObject":35,"./obj2Str":42}],30:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var DateTag = '[object Date]';

module.exports = function isDate(value) {
  return isObject(value) && obj2Str(value) === DateTag;
};

},{"./isObject":35,"./obj2Str":42}],31:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var obj2Str = require('./obj2Str');
var errorTag = '[object Error]';

module.exports = function isError(value) {
  var isObjectLike = !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object';
  if (!isObjectLike) return false;
  return obj2Str(value) === errorTag || typeof value.message === 'string' && typeof value.name === 'string';
};

},{"./obj2Str":42}],32:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');

var FunctionTag = '[object Function]';
var GeneratorTag = '[object GeneratorFunction]';

module.exports = function isFunction(value) {
  var tag = isObject(value) ? obj2Str(value) : '';
  return tag === FunctionTag || tag === GeneratorTag;
};

},{"./isObject":35,"./obj2Str":42}],33:[function(require,module,exports){
'use strict';

module.exports = function isLocale(obj) {
  if (!obj) return false;
  return obj && obj.__isLocale === true;
};

},{}],34:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var NumberTag = '[object Number]';

module.exports = function isNumber(value) {
  return typeof value === 'number' || isObject(value) && obj2Str(value) === NumberTag;
};

},{"./isObject":35,"./obj2Str":42}],35:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

module.exports = function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return !!value && (type === 'object' || type === 'function');
};

},{}],36:[function(require,module,exports){
'use strict';

module.exports = function isRef(obj) {
  if (!obj) return false;
  return obj && obj.__isRef === true;
};

},{}],37:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var obj2Str = require('./obj2Str');
var RegExpTag = '[object RegExp]';

module.exports = function isRegExp(value) {
  return isObject(value) && obj2Str(value) === RegExpTag;
};

},{"./isObject":35,"./obj2Str":42}],38:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');
var isArray = require('./isArray');
var obj2Str = require('./obj2Str');
var stringTag = '[object String]';

module.exports = function isString(value) {
  return typeof value === 'string' || !isArray(value) && isObject(value) && obj2Str(value) === stringTag;
};

},{"./isArray":28,"./isObject":35,"./obj2Str":42}],39:[function(require,module,exports){
'use strict';

module.exports = function isUndefined(value) {
  return value === undefined;
};

},{}],40:[function(require,module,exports){
'use strict';

module.exports = function merge(source, target) {
  source = source || {};
  target = target || {};

  for (var key in target) {
    source[key] = target[key];
  }

  return source;
};

},{}],41:[function(require,module,exports){
'use strict';

module.exports = function noop() {
  // No operation;
};

},{}],42:[function(require,module,exports){
'use strict';

module.exports = function (obj) {
  return Object.prototype.toString.call(obj);
};

},{}],43:[function(require,module,exports){
'use strict';

var cloneArray = require('./cloneArray');
var isArray = require('./isArray');

module.exports = function parseArg(args) {
  if (args && args.length) {
    if (args.length === 1 && isArray(args[0])) {
      return args[0];
    } else {
      return cloneArray(args);
    }
  }

  return [];
};

},{"./cloneArray":25,"./isArray":28}],44:[function(require,module,exports){
'use strict';

module.exports = function ref(key) {
  return { __key: key, __isRef: true };
};

},{}],45:[function(require,module,exports){
'use strict';

var magico = require('magico');
var I18n = require('baiji-i18n');
var config = require('../config');

module.exports = function t(name, options) {
  options = options || {};
  name = name || '';

  options.locale = options.locale || config.defaultLocale;
  options.scope = 'ovt';

  var fallbackName = String(name).split('.')[1] || 'unknown';
  var fallbackPath = options.locale + '.ovt.any.' + fallbackName;
  options.defaultValue = magico.get(I18n.translations, fallbackPath) || '';

  return I18n.t(name, options);
};

},{"../config":3,"baiji-i18n":47,"magico":49}],46:[function(require,module,exports){
'use strict';

var isError = require('./isError');
var isString = require('./isString');

// Wrapper fn with proper error message
module.exports = function tryCatch(type, fn) {
  return function () {
    var result = null;

    try {
      result = fn.apply(this, arguments);
    } catch (e) {
      result = e;
    }

    if (type !== 'validator') return result;

    // return Error directly
    if (isError(result)) {
      return result;
    }
    // wrap a string with Error
    else if (isString(result)) {
        return new Error(result);
      }
      // return Error of default message when validation failed
      else if (result === false) {
          var message = 'validation failed';
          return new Error(message);
        }
  };
};

},{"./isError":31,"./isString":38}],47:[function(require,module,exports){
'use strict';

var I18n = require('./lib/i18n');
var magico = require('magico');

// Overwrite the original interpolate function
// This function interpolates the all variables in the given message.
// Enhanced with magico support
I18n.interpolate = function(message, options) {
  options = this.prepareOptions(options);
  var matches = message.match(this.placeholder)
    , placeholder
    , value
    , name
    , regex;

  if (!matches) {
    return message;
  }

  while (matches.length) {
    placeholder = matches.shift();
    name = placeholder.replace(this.placeholder, '$1');

    // get value by name: support dot path like -> `person.gender`
    value = magico.get(options, name);
    if (this.isSet(value)) {
      value = value.toString().replace(/\$/gm, '_#$#_');
    } else if (name in options) {
      value = this.nullPlaceholder(placeholder, message, options);
    } else {
      value = this.missingPlaceholder(placeholder, message, options);
    }

    regex = new RegExp(placeholder.replace(/\{/gm, '\\{').replace(/\}/gm, '\\}'));
    message = message.replace(regex, value);
  }

  return message.replace(/_#\$#_/g, '$');
};

module.exports = I18n;

},{"./lib/i18n":48,"magico":49}],48:[function(require,module,exports){
// I18n.js
// =======
//
// This small library provides the Rails I18n API on the Javascript.
// You don't actually have to use Rails (or even Ruby) to use I18n.js.
// Just make sure you export all translations in an object like this:
//
//     I18n.translations.en = {
//       hello: "Hello World"
//     };
//
// See tests for specific formatting like numbers and dates.
//

;(function(factory) {
  if (typeof module !== 'undefined' && module.exports) {
    // Node/CommonJS
    module.exports = factory(this);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    var global=this;
    define('i18n', function(){ return factory(global);});
  } else {
    // Browser globals
    this.I18n = factory(this);
  }
}(function(global) {
  "use strict";

  // Use previously defined object if exists in current scope
  var I18n = global && global.I18n || {};

  // Just cache the Array#slice function.
  var slice = Array.prototype.slice;

  // Apply number padding.
  var padding = function(number) {
    return ("0" + number.toString()).substr(-2);
  };

  // Improved toFixed number rounding function with support for unprecise floating points
  // JavaScript's standard toFixed function does not round certain numbers correctly (for example 0.105 with precision 2).
  var toFixed = function(number, precision) {
    return decimalAdjust('round', number, -precision).toFixed(precision);
  };

  // Is a given variable an object?
  // Borrowed from Underscore.js
  var isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Is a given value an array?
  // Borrowed from Underscore.js
  var isArray = function(val) {
    if (Array.isArray) {
      return Array.isArray(val);
    };
    return Object.prototype.toString.call(val) === '[object Array]';
  };

  var isString = function(val) {
    return typeof value == 'string' || Object.prototype.toString.call(val) === '[object String]';
  };

  var isNumber = function(val) {
    return typeof val == 'number' || Object.prototype.toString.call(val) === '[object Number]';
  };

  var isBoolean = function(val) {
    return val === true || val === false;
  };

  var decimalAdjust = function(type, value, exp) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
      return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
      return NaN;
    }
    // Shift
    value = value.toString().split('e');
    value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
    // Shift back
    value = value.toString().split('e');
    return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
  }

  var merge = function (dest, obj) {
    var key, value;
    for (key in obj) if (obj.hasOwnProperty(key)) {
      value = obj[key];
      if (isString(value) || isNumber(value) || isBoolean(value)) {
        dest[key] = value;
      } else {
        if (dest[key] == null) dest[key] = {};
        merge(dest[key], value);
      }
    }
    return dest;
  };

  // Set default days/months translations.
  var DATE = {
      day_names: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    , abbr_day_names: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    , month_names: [null, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    , abbr_month_names: [null, "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    , meridian: ["AM", "PM"]
  };

  // Set default number format.
  var NUMBER_FORMAT = {
      precision: 3
    , separator: "."
    , delimiter: ","
    , strip_insignificant_zeros: false
  };

  // Set default currency format.
  var CURRENCY_FORMAT = {
      unit: "$"
    , precision: 2
    , format: "%u%n"
    , sign_first: true
    , delimiter: ","
    , separator: "."
  };

  // Set default percentage format.
  var PERCENTAGE_FORMAT = {
      unit: "%"
    , precision: 3
    , format: "%n%u"
    , separator: "."
    , delimiter: ""
  };

  // Set default size units.
  var SIZE_UNITS = [null, "kb", "mb", "gb", "tb"];

  // Other default options
  var DEFAULT_OPTIONS = {
    // Set default locale. This locale will be used when fallback is enabled and
    // the translation doesn't exist in a particular locale.
      defaultLocale: "en"
    // Set the current locale to `en`.
    , locale: "en"
    // Set the translation key separator.
    , defaultSeparator: "."
    // Set the placeholder format. Accepts `{{placeholder}}` and `%{placeholder}`.
    , placeholder: /(?:\{\{|%\{)(.*?)(?:\}\}?)/gm
    // Set if engine should fallback to the default locale when a translation
    // is missing.
    , fallbacks: false
    // Set the default translation object.
    , translations: {}
    // Set missing translation behavior. 'message' will display a message
    // that the translation is missing, 'guess' will try to guess the string
    , missingBehaviour: 'message'
    // if you use missingBehaviour with 'message', but want to know that the
    // string is actually missing for testing purposes, you can prefix the
    // guessed string by setting the value here. By default, no prefix!
    , missingTranslationPrefix: ''
  };

  I18n.reset = function() {
    // Set default locale. This locale will be used when fallback is enabled and
    // the translation doesn't exist in a particular locale.
    this.defaultLocale = DEFAULT_OPTIONS.defaultLocale;

    // Set the current locale to `en`.
    this.locale = DEFAULT_OPTIONS.locale;

    // Set the translation key separator.
    this.defaultSeparator = DEFAULT_OPTIONS.defaultSeparator;

    // Set the placeholder format. Accepts `{{placeholder}}` and `%{placeholder}`.
    this.placeholder = DEFAULT_OPTIONS.placeholder;

    // Set if engine should fallback to the default locale when a translation
    // is missing.
    this.fallbacks = DEFAULT_OPTIONS.fallbacks;

    // Set the default translation object.
    this.translations = DEFAULT_OPTIONS.translations;

    // Set the default missing behaviour
    this.missingBehaviour = DEFAULT_OPTIONS.missingBehaviour;

    // Set the default missing string prefix for guess behaviour
    this.missingTranslationPrefix = DEFAULT_OPTIONS.missingTranslationPrefix;

  };

  // Much like `reset`, but only assign options if not already assigned
  I18n.initializeOptions = function() {
    if (typeof(this.defaultLocale) === "undefined" && this.defaultLocale !== null)
      this.defaultLocale = DEFAULT_OPTIONS.defaultLocale;

    if (typeof(this.locale) === "undefined" && this.locale !== null)
      this.locale = DEFAULT_OPTIONS.locale;

    if (typeof(this.defaultSeparator) === "undefined" && this.defaultSeparator !== null)
      this.defaultSeparator = DEFAULT_OPTIONS.defaultSeparator;

    if (typeof(this.placeholder) === "undefined" && this.placeholder !== null)
      this.placeholder = DEFAULT_OPTIONS.placeholder;

    if (typeof(this.fallbacks) === "undefined" && this.fallbacks !== null)
      this.fallbacks = DEFAULT_OPTIONS.fallbacks;

    if (typeof(this.translations) === "undefined" && this.translations !== null)
      this.translations = DEFAULT_OPTIONS.translations;

    if (typeof(this.missingBehaviour) === "undefined" && this.missingBehaviour !== null)
      this.missingBehaviour = DEFAULT_OPTIONS.missingBehaviour;

    if (typeof(this.missingTranslationPrefix) === "undefined" && this.missingTranslationPrefix !== null)
      this.missingTranslationPrefix = DEFAULT_OPTIONS.missingTranslationPrefix;
  };
  I18n.initializeOptions();

  // Return a list of all locales that must be tried before returning the
  // missing translation message. By default, this will consider the inline option,
  // current locale and fallback locale.
  //
  //     I18n.locales.get("de-DE");
  //     // ["de-DE", "de", "en"]
  //
  // You can define custom rules for any locale. Just make sure you return a array
  // containing all locales.
  //
  //     // Default the Wookie locale to English.
  //     I18n.locales["wk"] = function(locale) {
  //       return ["en"];
  //     };
  //
  I18n.locales = {};

  // Retrieve locales based on inline locale, current locale or default to
  // I18n's detection.
  I18n.locales.get = function(locale) {
    var result = this[locale] || this[I18n.locale] || this["default"];

    if (typeof(result) === "function") {
      result = result(locale);
    }

    if (isArray(result) === false) {
      result = [result];
    }

    return result;
  };

  // The default locale list.
  I18n.locales["default"] = function(locale) {
    var locales = []
      , list = []
      , countryCode
      , count
    ;

    // Handle the inline locale option that can be provided to
    // the `I18n.t` options.
    if (locale) {
      locales.push(locale);
    }

    // Add the current locale to the list.
    if (!locale && I18n.locale) {
      locales.push(I18n.locale);
    }

    // Add the default locale if fallback strategy is enabled.
    if (I18n.fallbacks && I18n.defaultLocale) {
      locales.push(I18n.defaultLocale);
    }

    // Compute each locale with its country code.
    // So this will return an array containing both
    // `de-DE` and `de` locales.
    locales.forEach(function(locale){
      countryCode = locale.split("-")[0];

      if (!~list.indexOf(locale)) {
        list.push(locale);
      }

      if (I18n.fallbacks && countryCode && countryCode !== locale && !~list.indexOf(countryCode)) {
        list.push(countryCode);
      }
    });

    // No locales set? English it is.
    if (!locales.length) {
      locales.push("en");
    }

    return list;
  };

  // Hold pluralization rules.
  I18n.pluralization = {};

  // Return the pluralizer for a specific locale.
  // If no specify locale is found, then I18n's default will be used.
  I18n.pluralization.get = function(locale) {
    return this[locale] || this[I18n.locale] || this["default"];
  };

  // The default pluralizer rule.
  // It detects the `zero`, `one`, and `other` scopes.
  I18n.pluralization["default"] = function(count) {
    switch (count) {
      case 0: return ["zero", "other"];
      case 1: return ["one"];
      default: return ["other"];
    }
  };

  // Return current locale. If no locale has been set, then
  // the current locale will be the default locale.
  I18n.currentLocale = function() {
    return this.locale || this.defaultLocale;
  };

  // Check if value is different than undefined and null;
  I18n.isSet = function(value) {
    return value !== undefined && value !== null;
  };

  // Find and process the translation using the provided scope and options.
  // This is used internally by some functions and should not be used as an
  // public API.
  I18n.lookup = function(scope, options) {
    options = this.prepareOptions(options);

    var locales = this.locales.get(options.locale).slice()
      , requestedLocale = locales[0]
      , locale
      , scopes
      , translations
    ;

    scope = this.getFullScope(scope, options);

    while (locales.length) {
      locale = locales.shift();
      scopes = scope.split(this.defaultSeparator);
      translations = this.translations[locale];

      if (!translations) {
        continue;
      }
      while (scopes.length) {
        translations = translations[scopes.shift()];

        if (translations === undefined || translations === null) {
          break;
        }
      }

      if (translations !== undefined && translations !== null) {
        return translations;
      }
    }

    if (this.isSet(options.defaultValue)) {
      return options.defaultValue;
    }
  };

  // lookup pluralization rule key into translations
  I18n.pluralizationLookupWithoutFallback = function(count, locale, translations) {
    var pluralizer = this.pluralization.get(locale)
      , pluralizerKeys = pluralizer(count)
      , pluralizerKey
      , message;

    if (isObject(translations)) {
      while (pluralizerKeys.length) {
        pluralizerKey = pluralizerKeys.shift();
        if (this.isSet(translations[pluralizerKey])) {
          message = translations[pluralizerKey];
          break;
        }
      }
    }

    return message;
  };

  // Lookup dedicated to pluralization
  I18n.pluralizationLookup = function(count, scope, options) {
    options = this.prepareOptions(options);
    var locales = this.locales.get(options.locale).slice()
      , requestedLocale = locales[0]
      , locale
      , scopes
      , translations
      , message
    ;
    scope = this.getFullScope(scope, options);

    while (locales.length) {
      locale = locales.shift();
      scopes = scope.split(this.defaultSeparator);
      translations = this.translations[locale];

      if (!translations) {
        continue;
      }

      while (scopes.length) {
        translations = translations[scopes.shift()];
        if (!isObject(translations)) {
          break;
        }
        if (scopes.length == 0) {
          message = this.pluralizationLookupWithoutFallback(count, locale, translations);
        }
      }
      if (message != null && message != undefined) {
        break;
      }
    }

    if (message == null || message == undefined) {
      if (this.isSet(options.defaultValue)) {
        if (isObject(options.defaultValue)) {
          message = this.pluralizationLookupWithoutFallback(count, options.locale, options.defaultValue);
        } else {
          message = options.defaultValue;
        }
        translations = options.defaultValue;
      }
    }

    return { message: message, translations: translations };
  };

  // Rails changed the way the meridian is stored.
  // It started with `date.meridian` returning an array,
  // then it switched to `time.am` and `time.pm`.
  // This function abstracts this difference and returns
  // the correct meridian or the default value when none is provided.
  I18n.meridian = function() {
    var time = this.lookup("time");
    var date = this.lookup("date");

    if (time && time.am && time.pm) {
      return [time.am, time.pm];
    } else if (date && date.meridian) {
      return date.meridian;
    } else {
      return DATE.meridian;
    }
  };

  // Merge serveral hash options, checking if value is set before
  // overwriting any value. The precedence is from left to right.
  //
  //     I18n.prepareOptions({name: "John Doe"}, {name: "Mary Doe", role: "user"});
  //     #=> {name: "John Doe", role: "user"}
  //
  I18n.prepareOptions = function() {
    var args = slice.call(arguments)
      , options = {}
      , subject
    ;

    while (args.length) {
      subject = args.shift();

      if (typeof(subject) != "object") {
        continue;
      }

      for (var attr in subject) {
        if (!subject.hasOwnProperty(attr)) {
          continue;
        }

        if (this.isSet(options[attr])) {
          continue;
        }

        options[attr] = subject[attr];
      }
    }

    return options;
  };

  // Generate a list of translation options for default fallbacks.
  // `defaultValue` is also deleted from options as it is returned as part of
  // the translationOptions array.
  I18n.createTranslationOptions = function(scope, options) {
    var translationOptions = [{scope: scope}];

    // Defaults should be an array of hashes containing either
    // fallback scopes or messages
    if (this.isSet(options.defaults)) {
      translationOptions = translationOptions.concat(options.defaults);
    }

    // Maintain support for defaultValue. Since it is always a message
    // insert it in to the translation options as such.
    if (this.isSet(options.defaultValue)) {
      translationOptions.push({ message: options.defaultValue });
      delete options.defaultValue;
    }

    return translationOptions;
  };

  // Translate the given scope with the provided options.
  I18n.translate = function(scope, options) {
    options = this.prepareOptions(options);

    var translationOptions = this.createTranslationOptions(scope, options);

    var translation;
    // Iterate through the translation options until a translation
    // or message is found.
    var translationFound =
      translationOptions.some(function(translationOption) {
        if (this.isSet(translationOption.scope)) {
          translation = this.lookup(translationOption.scope, options);
        } else if (this.isSet(translationOption.message)) {
          translation = translationOption.message;
        }

        if (translation !== undefined && translation !== null) {
          return true;
        }
      }, this);

    if (!translationFound) {
      return this.missingTranslation(scope, options);
    }

    if (typeof(translation) === "string") {
      translation = this.interpolate(translation, options);
    } else if (isObject(translation) && this.isSet(options.count)) {
      translation = this.pluralize(options.count, scope, options);
    }

    return translation;
  };

  // This function interpolates the all variables in the given message.
  I18n.interpolate = function(message, options) {
    options = this.prepareOptions(options);
    var matches = message.match(this.placeholder)
      , placeholder
      , value
      , name
      , regex
    ;

    if (!matches) {
      return message;
    }

    var value;

    while (matches.length) {
      placeholder = matches.shift();
      name = placeholder.replace(this.placeholder, "$1");

      if (this.isSet(options[name])) {
        value = options[name].toString().replace(/\$/gm, "_#$#_");
      } else if (name in options) {
        value = this.nullPlaceholder(placeholder, message, options);
      } else {
        value = this.missingPlaceholder(placeholder, message, options);
      }

      regex = new RegExp(placeholder.replace(/\{/gm, "\\{").replace(/\}/gm, "\\}"));
      message = message.replace(regex, value);
    }

    return message.replace(/_#\$#_/g, "$");
  };

  // Pluralize the given scope using the `count` value.
  // The pluralized translation may have other placeholders,
  // which will be retrieved from `options`.
  I18n.pluralize = function(count, scope, options) {
    options = this.prepareOptions(options);
    var pluralizer, message, result;

    result = this.pluralizationLookup(count, scope, options);
    if (result.translations == undefined || result.translations == null) {
      return this.missingTranslation(scope, options);
    }

    options.count = String(count);

    if (result.message != undefined && result.message != null) {
      return this.interpolate(result.message, options);
    }
    else {
      pluralizer = this.pluralization.get(options.locale);
      return this.missingTranslation(scope + '.' + pluralizer(count)[0], options);
    }
  };

  // Return a missing translation message for the given parameters.
  I18n.missingTranslation = function(scope, options) {
    //guess intended string
    if(this.missingBehaviour == 'guess'){
      //get only the last portion of the scope
      var s = scope.split('.').slice(-1)[0];
      //replace underscore with space && camelcase with space and lowercase letter
      return (this.missingTranslationPrefix.length > 0 ? this.missingTranslationPrefix : '') +
          s.replace('_',' ').replace(/([a-z])([A-Z])/g,
          function(match, p1, p2) {return p1 + ' ' + p2.toLowerCase()} );
    }

    var localeForTranslation = (options != null && options.locale != null) ? options.locale : this.currentLocale();
    var fullScope           = this.getFullScope(scope, options);
    var fullScopeWithLocale = [localeForTranslation, fullScope].join(this.defaultSeparator);

    return '[missing "' + fullScopeWithLocale + '" translation]';
  };

  // Return a missing placeholder message for given parameters
  I18n.missingPlaceholder = function(placeholder, message, options) {
    return "[missing " + placeholder + " value]";
  };

  I18n.nullPlaceholder = function() {
    return I18n.missingPlaceholder.apply(I18n, arguments);
  };

  // Format number using localization rules.
  // The options will be retrieved from the `number.format` scope.
  // If this isn't present, then the following options will be used:
  //
  // - `precision`: `3`
  // - `separator`: `"."`
  // - `delimiter`: `","`
  // - `strip_insignificant_zeros`: `false`
  //
  // You can also override these options by providing the `options` argument.
  //
  I18n.toNumber = function(number, options) {
    options = this.prepareOptions(
        options
      , this.lookup("number.format")
      , NUMBER_FORMAT
    );

    var negative = number < 0
      , string = toFixed(Math.abs(number), options.precision).toString()
      , parts = string.split(".")
      , precision
      , buffer = []
      , formattedNumber
      , format = options.format || "%n"
      , sign = negative ? "-" : ""
    ;

    number = parts[0];
    precision = parts[1];

    while (number.length > 0) {
      buffer.unshift(number.substr(Math.max(0, number.length - 3), 3));
      number = number.substr(0, number.length -3);
    }

    formattedNumber = buffer.join(options.delimiter);

    if (options.strip_insignificant_zeros && precision) {
      precision = precision.replace(/0+$/, "");
    }

    if (options.precision > 0 && precision) {
      formattedNumber += options.separator + precision;
    }

    if (options.sign_first) {
      format = "%s" + format;
    }
    else {
      format = format.replace("%n", "%s%n");
    }

    formattedNumber = format
      .replace("%u", options.unit)
      .replace("%n", formattedNumber)
      .replace("%s", sign)
    ;

    return formattedNumber;
  };

  // Format currency with localization rules.
  // The options will be retrieved from the `number.currency.format` and
  // `number.format` scopes, in that order.
  //
  // Any missing option will be retrieved from the `I18n.toNumber` defaults and
  // the following options:
  //
  // - `unit`: `"$"`
  // - `precision`: `2`
  // - `format`: `"%u%n"`
  // - `delimiter`: `","`
  // - `separator`: `"."`
  //
  // You can also override these options by providing the `options` argument.
  //
  I18n.toCurrency = function(number, options) {
    options = this.prepareOptions(
        options
      , this.lookup("number.currency.format")
      , this.lookup("number.format")
      , CURRENCY_FORMAT
    );

    return this.toNumber(number, options);
  };

  // Localize several values.
  // You can provide the following scopes: `currency`, `number`, or `percentage`.
  // If you provide a scope that matches the `/^(date|time)/` regular expression
  // then the `value` will be converted by using the `I18n.toTime` function.
  //
  // It will default to the value's `toString` function.
  //
  I18n.localize = function(scope, value, options) {
    options || (options = {});

    switch (scope) {
      case "currency":
        return this.toCurrency(value);
      case "number":
        scope = this.lookup("number.format");
        return this.toNumber(value, scope);
      case "percentage":
        return this.toPercentage(value);
      default:
        var localizedValue;

        if (scope.match(/^(date|time)/)) {
          localizedValue = this.toTime(scope, value);
        } else {
          localizedValue = value.toString();
        }

        return this.interpolate(localizedValue, options);
    }
  };

  // Parse a given `date` string into a JavaScript Date object.
  // This function is time zone aware.
  //
  // The following string formats are recognized:
  //
  //    yyyy-mm-dd
  //    yyyy-mm-dd[ T]hh:mm::ss
  //    yyyy-mm-dd[ T]hh:mm::ss
  //    yyyy-mm-dd[ T]hh:mm::ssZ
  //    yyyy-mm-dd[ T]hh:mm::ss+0000
  //    yyyy-mm-dd[ T]hh:mm::ss+00:00
  //    yyyy-mm-dd[ T]hh:mm::ss.123Z
  //
  I18n.parseDate = function(date) {
    var matches, convertedDate, fraction;
    // we have a date, so just return it.
    if (typeof(date) == "object") {
      return date;
    };

    matches = date.toString().match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})([\.,]\d{1,3})?)?(Z|\+00:?00)?/);

    if (matches) {
      for (var i = 1; i <= 6; i++) {
        matches[i] = parseInt(matches[i], 10) || 0;
      }

      // month starts on 0
      matches[2] -= 1;

      fraction = matches[7] ? 1000 * ("0" + matches[7]) : null;

      if (matches[8]) {
        convertedDate = new Date(Date.UTC(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6], fraction));
      } else {
        convertedDate = new Date(matches[1], matches[2], matches[3], matches[4], matches[5], matches[6], fraction);
      }
    } else if (typeof(date) == "number") {
      // UNIX timestamp
      convertedDate = new Date();
      convertedDate.setTime(date);
    } else if (date.match(/([A-Z][a-z]{2}) ([A-Z][a-z]{2}) (\d+) (\d+:\d+:\d+) ([+-]\d+) (\d+)/)) {
      // This format `Wed Jul 20 13:03:39 +0000 2011` is parsed by
      // webkit/firefox, but not by IE, so we must parse it manually.
      convertedDate = new Date();
      convertedDate.setTime(Date.parse([
        RegExp.$1, RegExp.$2, RegExp.$3, RegExp.$6, RegExp.$4, RegExp.$5
      ].join(" ")));
    } else if (date.match(/\d+ \d+:\d+:\d+ [+-]\d+ \d+/)) {
      // a valid javascript format with timezone info
      convertedDate = new Date();
      convertedDate.setTime(Date.parse(date));
    } else {
      // an arbitrary javascript string
      convertedDate = new Date();
      convertedDate.setTime(Date.parse(date));
    }

    return convertedDate;
  };

  // Formats time according to the directives in the given format string.
  // The directives begins with a percent (%) character. Any text not listed as a
  // directive will be passed through to the output string.
  //
  // The accepted formats are:
  //
  //     %a  - The abbreviated weekday name (Sun)
  //     %A  - The full weekday name (Sunday)
  //     %b  - The abbreviated month name (Jan)
  //     %B  - The full month name (January)
  //     %c  - The preferred local date and time representation
  //     %d  - Day of the month (01..31)
  //     %-d - Day of the month (1..31)
  //     %H  - Hour of the day, 24-hour clock (00..23)
  //     %-H - Hour of the day, 24-hour clock (0..23)
  //     %I  - Hour of the day, 12-hour clock (01..12)
  //     %-I - Hour of the day, 12-hour clock (1..12)
  //     %m  - Month of the year (01..12)
  //     %-m - Month of the year (1..12)
  //     %M  - Minute of the hour (00..59)
  //     %-M - Minute of the hour (0..59)
  //     %p  - Meridian indicator (AM  or  PM)
  //     %S  - Second of the minute (00..60)
  //     %-S - Second of the minute (0..60)
  //     %w  - Day of the week (Sunday is 0, 0..6)
  //     %y  - Year without a century (00..99)
  //     %-y - Year without a century (0..99)
  //     %Y  - Year with century
  //     %z  - Timezone offset (+0545)
  //
  I18n.strftime = function(date, format) {
    var options = this.lookup("date")
      , meridianOptions = I18n.meridian()
    ;

    if (!options) {
      options = {};
    }

    options = this.prepareOptions(options, DATE);

    if (isNaN(date.getTime())) {
      throw new Error('I18n.strftime() requires a valid date object, but received an invalid date.');
    }

    var weekDay = date.getDay()
      , day = date.getDate()
      , year = date.getFullYear()
      , month = date.getMonth() + 1
      , hour = date.getHours()
      , hour12 = hour
      , meridian = hour > 11 ? 1 : 0
      , secs = date.getSeconds()
      , mins = date.getMinutes()
      , offset = date.getTimezoneOffset()
      , absOffsetHours = Math.floor(Math.abs(offset / 60))
      , absOffsetMinutes = Math.abs(offset) - (absOffsetHours * 60)
      , timezoneoffset = (offset > 0 ? "-" : "+") +
          (absOffsetHours.toString().length < 2 ? "0" + absOffsetHours : absOffsetHours) +
          (absOffsetMinutes.toString().length < 2 ? "0" + absOffsetMinutes : absOffsetMinutes)
    ;

    if (hour12 > 12) {
      hour12 = hour12 - 12;
    } else if (hour12 === 0) {
      hour12 = 12;
    }

    format = format.replace("%a", options.abbr_day_names[weekDay]);
    format = format.replace("%A", options.day_names[weekDay]);
    format = format.replace("%b", options.abbr_month_names[month]);
    format = format.replace("%B", options.month_names[month]);
    format = format.replace("%d", padding(day));
    format = format.replace("%e", day);
    format = format.replace("%-d", day);
    format = format.replace("%H", padding(hour));
    format = format.replace("%-H", hour);
    format = format.replace("%I", padding(hour12));
    format = format.replace("%-I", hour12);
    format = format.replace("%m", padding(month));
    format = format.replace("%-m", month);
    format = format.replace("%M", padding(mins));
    format = format.replace("%-M", mins);
    format = format.replace("%p", meridianOptions[meridian]);
    format = format.replace("%S", padding(secs));
    format = format.replace("%-S", secs);
    format = format.replace("%w", weekDay);
    format = format.replace("%y", padding(year));
    format = format.replace("%-y", padding(year).replace(/^0+/, ""));
    format = format.replace("%Y", year);
    format = format.replace("%z", timezoneoffset);

    return format;
  };

  // Convert the given dateString into a formatted date.
  I18n.toTime = function(scope, dateString) {
    var date = this.parseDate(dateString)
      , format = this.lookup(scope)
    ;

    if (date.toString().match(/invalid/i)) {
      return date.toString();
    }

    if (!format) {
      return date.toString();
    }

    return this.strftime(date, format);
  };

  // Convert a number into a formatted percentage value.
  I18n.toPercentage = function(number, options) {
    options = this.prepareOptions(
        options
      , this.lookup("number.percentage.format")
      , this.lookup("number.format")
      , PERCENTAGE_FORMAT
    );

    return this.toNumber(number, options);
  };

  // Convert a number into a readable size representation.
  I18n.toHumanSize = function(number, options) {
    var kb = 1024
      , size = number
      , iterations = 0
      , unit
      , precision
    ;

    while (size >= kb && iterations < 4) {
      size = size / kb;
      iterations += 1;
    }

    if (iterations === 0) {
      unit = this.t("number.human.storage_units.units.byte", {count: size});
      precision = 0;
    } else {
      unit = this.t("number.human.storage_units.units." + SIZE_UNITS[iterations]);
      precision = (size - Math.floor(size) === 0) ? 0 : 1;
    }

    options = this.prepareOptions(
        options
      , {unit: unit, precision: precision, format: "%n%u", delimiter: ""}
    );

    return this.toNumber(size, options);
  };

  I18n.getFullScope = function(scope, options) {
    options = this.prepareOptions(options);

    // Deal with the scope as an array.
    if (scope.constructor === Array) {
      scope = scope.join(this.defaultSeparator);
    }

    // Deal with the scope option provided through the second argument.
    //
    //    I18n.t('hello', {scope: 'greetings'});
    //
    if (options.scope) {
      scope = [options.scope, scope].join(this.defaultSeparator);
    }

    return scope;
  };
  /**
   * Merge obj1 with obj2 (shallow merge), without modifying inputs
   * @param {Object} obj1
   * @param {Object} obj2
   * @returns {Object} Merged values of obj1 and obj2
   *
   * In order to support ES3, `Object.prototype.hasOwnProperty.call` is used
   * Idea is from:
   * https://stackoverflow.com/questions/8157700/object-has-no-hasownproperty-method-i-e-its-undefined-ie8
   */
  I18n.extend = function ( obj1, obj2 ) {
    if (typeof(obj1) === "undefined" && typeof(obj2) === "undefined") {
      return {};
    }
    return merge(obj1, obj2);
  };

  // Set aliases, so we can save some typing.
  I18n.t = I18n.translate;
  I18n.l = I18n.localize;
  I18n.p = I18n.pluralize;

  return I18n;
}));

},{}],49:[function(require,module,exports){
'use strict';

/*!
 * Module variables
 */

var SEPERATOR = /\[['"]?|\.|['"]?\]/;
var STRING_DETECTOR = '[object String]';
var ARRAY_DETECTOR = '[object Array]';

/*!
 * Get object string tag
 */
var objToString = Object.prototype.toString;

/*!
 * Check if an object is a string
 */

function isString (str) {
  return objToString.call(str) === STRING_DETECTOR;
}

/*!
 * Check if an object is an array
 */

function isArray (str) {
  return objToString.call(str) === ARRAY_DETECTOR;
}

/*!
 * Check if a string is a positive integer
 */

function isPositiveInteger (obj) {
  if (isString(obj)) {
    return /^(0|[1-9]\d*)$/.test(obj);
  } else {
    return (obj >>> 0) === obj;
  }
}

function isNil (obj) {
  return obj !== obj || obj === undefined || obj === null;
}

/*!
 * Remove falsy values from an array
 */
function compact (array) {
  array = array || [];
  return array.filter(function(el) {
    return el === 0 || Boolean(el).valueOf();
  });
}

/*!
 * Coerce an object for specific action: `get`, `set`, `remove`, `exists`
 */

function coerce (type, obj, path, value) {
  if (isNil(path)) return;

  // Turn positive integer into string
  if (isPositiveInteger(path)) path = String(path);

  // Parse string path into an array
  if (isString(path)) {
    path = compact(path.trim().split(SEPERATOR));
  }

  // Return if path is invalid
  if (!path || !isArray(path) || path.length === 0) return;

  // Copy array for future use
  path = path.slice();

  // Shift the first path value
  var key = path.shift();

  // Return `undefined` if obj is `NaN` or `null` or `undefined`
  if (isNil(obj)) return;

  switch (type) {
    case 'get':
      if (path.length === 0) {
        return obj[key];
      }
      break;
    case 'set':
      if (path.length) {
        if (typeof obj[key] === 'undefined') {
          obj[key] = {};
        }

        if (isNil(obj[key])) return false;
      } else {
        obj[key] = value;
        return true;
      }
      break;
    case 'remove':
      if (path.length === 0) {

        if (isArray(obj) && isPositiveInteger(key)) {
          key = Number(key);

          if (obj.length - 1 < key) return false;

          obj.splice(key, 1);
        } else {
          if (!Object.hasOwnProperty.call(obj, key)) return false;

          delete obj[key];
        }

        return true;
      }
      break;
    case 'exists':
      if (path.length === 0) {
        if (isArray(obj) && isPositiveInteger(key)) {
          key = Number(key);
          return obj.length - 1 >= key;
        } else {
          return Object.hasOwnProperty.call(obj, key);
        }
      }
      break;
    default:
      return;
  }

  return coerce(type, obj[key], path, value);
}

/**
 * ### Magico (object)
 *
 * @param {Object} object to which will be wrapped for later use
 * @name Magico
 * @api public
 */
function Magico(obj) {
  if (!(this instanceof Magico)) return new Magico(obj);

  this._obj = obj;
}

/**
 * ### Magico.wrap (object)
 *
 * @param {Object} object to which will be wrapped for later use
 * @name Magico.wrap
 * @return Magico instance
 * @api public
 */

Magico.wrap = function (obj) {
  return Magico(obj);
};

/**
 * ### Magico.set (object, path, value)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be set
 * @name Magico.set
 * @return {Boolean} whether the value is set or not
 * @api public
 */

Magico.set = function (obj, path, value) {
  return !!coerce('set', obj, path, value);
};

/**
 * ### Magico.get (object, path)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @name Magico.get
 * @return {Object} the value of properties
 * @api public
 */

Magico.get = function (obj, path) {
  return coerce('get', obj, path);
};

/**
 * ### Magico.exists (object, path)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @name Magico.exists
 * @return {Boolean} the value of path exists or not
 * @api public
 */

Magico.exists = function (obj, path) {
  return !!coerce('exists', obj, path);
};

/**
 * ### Magico.remove (object, path, value)
 *
 * @param {Object} object to which will be wrapped for later use
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be remove
 * @name Magico.remove
 * @return {Boolean} whether the value is removed or not
 * @api public
 */

Magico.remove = function (obj, path) {
  return !!coerce('remove', obj, path);
};

/**
 * ### Magico.access
 *
 * @name Magico.access
 * @return {Object} return an instance for specific path
 * @api public
 */
Magico.access = function (obj, path) {
  return Magico(Magico.get(obj, path));
};

/**
 * ### Magico.prototype.set (path, value)
 *
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be set
 * @name Magico.prototype.set
 * @return {Boolean} whether the value is set or not
 * @api public
 */

Magico.prototype.set = function (path, value) {
  return Magico.set(this._obj, path, value);
};

/**
 * ### Magico.prototype.get (path)
 *
 * @param {String | Array} path to which will use to access object
 * @name Magico.prototype.get
 * @return {Object} the value of properties
 * @api public
 */

Magico.prototype.get = function (path) {
  return Magico.get(this._obj, path);
};

/**
 * ### Magico.prototype.exists (path)
 *
 * @param {String | Array} path to which will use to access object
 * @name Magico.prototype.exists
 * @return {Boolean} the value of path exists or not
 * @api public
 */

Magico.prototype.exists = function (path) {
  return Magico.exists(this._obj, path);
};

/**
 * ### Magico.prototype.remove (path, value)
 *
 * @param {String | Array} path to which will use to access object
 * @param {Object} value to which will be remove
 * @name Magico.prototype.remove
 * @return {Boolean} whether the value is removed or not
 * @api public
 */

Magico.prototype.remove = function (path) {
  return Magico.remove(this._obj, path);
};

/**
 * ### Magico.prototype.toObject
 *
 * @name Magico.prototype.toObject
 * @return {Object} the changed object
 * @api public
 */

Magico.prototype.toObject = function () {
  return this._obj;
};

/**
 * ### Magico.prototype.access
 *
 * @name Magico.prototype.access
 * @return {Object} return an instance for specific path
 * @api public
 */

Magico.prototype.access = function (path) {
  return Magico.access(this._obj, path);
};

// Export Magico function
module.exports = Magico;

},{}]},{},[1]);
