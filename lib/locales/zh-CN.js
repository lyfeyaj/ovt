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
