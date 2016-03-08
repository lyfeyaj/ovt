# ovt
Object Validation Tool


Normalize => Sanitize => Validate

{
  name: 'Felix Liu',
  age: 18,
  sex: 'male',

  hobbies: [
    { name: 'pingpong', startedAt: '1999-01-01' }
  ],

  job: {
    company: 'Boqii',
    startedAt: '2015-01-15',
    title: 'Senior Dev'
  }
}

{
  name: 'hobbies',
  type: ['object'],
  validates: [],
  sanitizes: [],
  inner: [

  ]
}

{
  name: 'email',
  type: ['any'],
  note: '',
  required: true,
  description: '',
  validates: {},
  sanitizes: {},
  http: function() {},
  inner: [
    {
      name: 'email',
      notes: [],
      required: true,
      descriptions: [],
      validates: {},
      sanitizes: {},
      http: function() {},
      inner: [

      ]
    },
    [
      {
        name: 'email',
        notes: [],
        required: true,
        descriptions: [],
        validates: {},
        sanitizes: {},
        http: function() {},
        inner: [

        ]
      }
    ]
  ]
}

ovt.string.required.isEmail.isMongoId.isIp.http(function(ctx, options) {

});

ovt.string().isRequired().isEmail().isMongoId().isLength().isIP().validate(nameOrFunction, args);

ovt.number.isRequired.isInt().max(5).min(3)

ovt.date().isRequired

ovt.boolean().isRequired.isTrue().isFalse()

ovt.object().isPlainObject().validate(function() {}).sanitize(function() {});

isBetweenYesterdayAndTomorrow(function() {

});

ovt.addMethod('object', 'isBetweenYesterdayAndTomorrow', function() {

});
