'use strict';

const Helper = require('./helpers');
const BooleanType = require('../lib/types/boolean');

describe('BooleanType', function() {
  let schema;

  beforeEach(function() {
    schema = (new BooleanType()).required().isBoolean();
  });

  Helper.inheritsAnyTypeBy(BooleanType);

  describe('isBoolean()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema, [
        [undefined, false],
        [null, false],
        [0, false],
        [1, false],
        [true, true],
        [false, true]
      ], { convert: false });
    });
  });
});
