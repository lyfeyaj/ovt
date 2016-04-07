'use strict';

const Helper = require('./helpers');
const DateType = require('../lib/types/date');

describe('DateType', function() {
  let schema;

  beforeEach(function() {
    schema = (new DateType()).isDate;
  });

  describe('isDate()', function() {
    it('should validate valid values', function() {
      Helper.validate(schema, [
        [null, false],
        [0, false],
        [[], false],
        [{}, false],
        [new Date(), true]
      ], { convert: false });
    });
  });
});
