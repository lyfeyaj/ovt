'use strict';

const expect = require('chai').expect;
const helpers = require('../helpers');
const DateType = require('../../lib/types/date');

describe('DateType', function() {
  let schema;

  beforeEach(function() {
    schema = (new DateType()).isDate();
  });

  helpers.inheritsAnyTypeBy(DateType);

  describe('convert()', function() {
    it('should convert the value to date', function() {
      expect(schema.convert(1)).to.deep.eq(new Date(1));
      expect(schema.convert('2016-01-01')).to.deep.eq(new Date('2016-01-01'));
      expect(schema.convert(null)).to.deep.eq(new Date(null));
      expect(schema.convert({})).to.deep.eq(new Date({}));
      expect(schema.convert([1])).to.deep.eq(new Date([1]));
      expect(schema.convert(undefined)).to.deep.eq(new Date(undefined));
      expect(schema.convert(new Date(''))).to.deep.eq(new Date(''));
    });
  });

  describe('isDate()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, false],
        [[], false],
        [{}, false],
        [new Date(), true]
      ], { convert: false });
    });
  });
});
