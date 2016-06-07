'use strict';

module.exports = {
  types: {
    any: {
      convertError: '格式化失败',
      required: '不能为空',
      optional: '可选',
      forbidden: '不允许的值',
      valid: '只能是 "{{flattenedArgs}}" 其中之一',
      only: '只能是 "{{flattenedArgs}}" 其中之一',
      whitelist: '只能是 "{{flattenedArgs}}" 其中之一',
      oneOf: '只能是 "{{flattenedArgs}}" 其中之一',
      equals: '不等于{{1}}',
      eq: '不等于{{1}}',
      equal: '不等于{{1}}',
      invalid: '不能是 "{{flattenedArgs}}" 中任何一个',
      not: '不能是 "{{flattenedArgs}}" 中任何一个',
      disallow: '不能是 "{{flattenedArgs}}" 中任何一个',
      blacklist: '不能是 "{{flattenedArgs}}" 中任何一个'
    },

    array: {
      isArray: '不是一个有效的数组',
      forbidden: '包含不允许的元素',
      inclusions: '没有匹配的元素',
      requireds: '期望个数是{{preferedLength}}, 结果是{{currentLength}}',
      isLength: '长度必须为{{1}}',
      maxLength: '长度必须小于{{1}}',
      minLength: '长度必须大于{{1}}'
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

    function: {
      isFunction: '不是一个有效的函数',
      arity: '参数长度必须为{{1}}',
      minArity: '参数长度必须小于{{1}}',
      maxArity: '参数长度必须大于{{1}}'
    },

    number: {
      isNumber: '不是一个有效的数字'
    },

    object: {
      isObject: '不是一个有效的对象'
    },

    regexp: {
      isRegExp: '不是一个有效的正则表达式'
    },

    string: {
      isString: '不是一个有效的字符串'
    }
  }
};
