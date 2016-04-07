'use strict';

const Helper = require('./helpers');
const RegExpType = require('../lib/types/regexp');

describe('RegExpType', function() {
  let schema;

  beforeEach(function() {
    schema = (new RegExpType()).isRegExp;
  });

  describe('isRegExp()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema, [
        [null, false],
        [0, false],
        [{}, false],
        [[], false],
        [new RegExp(), true],
        [/1/, true]
      ], { convert: false });
    });
  });
});
