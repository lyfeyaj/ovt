'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const BooleanType = require('../../lib/types/boolean');

describe('BooleanType', function() {
  let schema;

  beforeEach(function() {
    schema = (new BooleanType()).required().isBoolean();
  });

  helpers.inheritsAnyTypeBy(BooleanType);

  describe('convert()', function() {
    it('should convert the value to boolean', function() {
      expect(schema.convert(1)).to.eq(true);
      expect(schema.convert('')).to.eq(false);
      expect(schema.convert(null)).to.eq(false);
      expect(schema.convert({})).to.eq(true);
      expect(schema.convert([1])).to.eq(true);
      expect(schema.convert(undefined)).to.eq(false);
    });
  });

  describe('isBoolean()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
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
