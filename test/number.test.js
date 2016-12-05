'use strict';

const Helper = require('./helpers');
const NumberType = require('../lib/types/number');

describe('NumberType', function() {
  let schema;

  beforeEach(function() {
    schema = (new NumberType()).isNumber();
  });

  describe('isNumber()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema, [
        [null, false],
        [0, true],
        [-1, true],
        [1.5, true],
        [NaN, true],
        [new Number(), true]
      ], { convert: false });
    });
  });
});
