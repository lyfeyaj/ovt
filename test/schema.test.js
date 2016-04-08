'use strict';

const Schema = require('../lib/schema');
const expect = require('chai').expect;

describe('Schema', function() {
  let schema;

  beforeEach(function() {
    schema = new Schema();
  });

  describe('clone()', function() {
    it('should return a new object instead the original one', function() {
      let newSchema = schema.clone();
      newSchema['anotherKey'] = 'anotherValue';
      delete newSchema._inner;
      expect(schema).not.have.property('anotherKey');
      expect(schema).have.property('_inner');
      expect(newSchema).have.property('anotherKey', 'anotherValue');
      expect(newSchema).not.have.property('_inner');
    });
  });

  describe('validate()', function() {
    it('should add custom validators', function() {
      expect(
        schema
          .validate(function() {})
          .validate(function() {})
      ).to.have.deep.property('_methods._customValidators').have.length(2);
    });
  });

  describe('sanitize()', function() {
    it('should add custom validators', function() {
      expect(
        schema
          .sanitize(function() {})
          .sanitize(function() {})
      ).to.have.deep.property('_methods._customSanitizers').have.length(2);
    });
  });

  describe('desc()', function() {
    it('should add cooresponding description', function() {
      let description = 'schema validator';
      expect(schema.desc(description)).have.property('_description', description);
    });

    it('should not throw an error if no description added', function() {
      expect(function() {
        schema.desc;
      }).to.not.throw(Error);
    });
  });

  describe('description()', function() {
    it('should add cooresponding description', function() {
      let description = 'schema validator';
      expect(schema.description(description)).have.property('_description', description);
    });

    it('should not throw an error if no description added', function() {
      expect(function() {
        schema.description;
      }).to.not.throw(Error);
    });
  });

  describe('default()', function() {
    it('should add cooresponding default', function() {
      let defaultValue = 'defaut value';
      expect(schema.default(defaultValue)).have.property('_defaultValue', defaultValue);
    });

    it('should not throw an error if no default value added', function() {
      expect(function() {
        schema.default;
      }).to.not.throw(Error);
    });
  });

  describe('note()', function() {
    it('should add cooresponding note', function() {
      let notes = 'note';
      expect(schema.note(notes)).have.property('_notes').eql([notes]);
      expect(schema.note([notes])).have.property('_notes').eql([notes]);
      expect(schema.note([notes]).note(notes)).have.property('_notes').eql([notes, notes]);
    });

    it('should not throw an error if no note added', function() {
      expect(function() {
        schema.note;
      }).to.not.throw(Error);
    });
  });

  describe('notes()', function() {
    it('should add cooresponding note', function() {
      let notes = 'note';
      expect(schema.notes(notes)).have.property('_notes').eql([notes]);
      expect(schema.notes([notes])).have.property('_notes').eql([notes]);
      expect(schema.notes([notes]).notes(notes)).have.property('_notes').eql([notes, notes]);
    });

    it('should not throw an error if no note added', function() {
      expect(function() {
        schema.notes;
      }).to.not.throw(Error);
    });
  });

  describe('tags()', function() {
    it('should add cooresponding tag', function() {
      let tags = 'tag';
      expect(schema.tags(tags)).have.property('_tags').eql([tags]);
      expect(schema.tags([tags])).have.property('_tags').eql([tags]);
      expect(schema.tags([tags]).tags(tags)).have.property('_tags').eql([tags, tags]);
    });

    it('should not throw an error if no tag added', function() {
      expect(function() {
        schema.tags;
      }).to.not.throw(Error);
    });
  });

  describe('tag()', function() {
    it('should add cooresponding tag', function() {
      let tags = 'tag';
      expect(schema.tag(tags)).have.property('_tags').eql([tags]);
      expect(schema.tag([tags])).have.property('_tags').eql([tags]);
      expect(schema.tag([tags]).tag(tags)).have.property('_tags').eql([tags, tags]);
    });

    it('should not throw an error if no tag added', function() {
      expect(function() {
        schema.tag;
      }).to.not.throw(Error);
    });
  });
});
