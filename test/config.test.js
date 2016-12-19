'use strict';

const config = require('../lib/config');
const expect = require('chai').expect;

describe('config', function() {
  it('should has specified properties', function() {
    expect(config).to.have.a.property('convert', true);
    expect(config).to.have.a.property('noDefaults', false);
    expect(config).to.have.a.property('abortEarly', true);
    expect(config).to.have.a.property('allowUnknown', false);
    expect(config).to.have.a.property('stripUnknown', false);
    expect(config).to.have.a.property('defaultLocale', 'en');
  });
});
