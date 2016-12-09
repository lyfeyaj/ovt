'use strict';

const helpers = require('../helpers');
const BufferType = require('../../lib/types/buffer');

describe('BufferType', function() {
  let schema;

  beforeEach(function() {
    schema = (new BufferType()).isBuffer();
  });

  helpers.inheritsAnyTypeBy(BufferType);

  describe('isBuffer()', function() {
    it('should validate valid values', function() {
      helpers.validate(schema, [
        [null, false],
        [0, false],
        [[], false],
        [{}, false],
        [new Buffer(0), true],
        [new Buffer(''), true]
      ], { convert: false });
    });
  });
});
