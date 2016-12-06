'use strict';

const helpers = require('../helpers');
const DateType = require('../../lib/types/date');

describe('DateType', function() {
  let schema;

  beforeEach(function() {
    schema = (new DateType()).isDate();
  });

  helpers.inheritsAnyTypeBy(DateType);

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
