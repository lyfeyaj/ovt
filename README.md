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

调用方法
ovt.string.required.isEmail.isMongoId.isIp

根据 Schema 校验 Object
ovt.validate(obj, schema, function(err, modifiedObj) {});

添加自定义方法
ovt.addValidator('object', 'isBetweenYesterdayAndTomorrow', function() {});
ovt.addSanitizer('object', 'isBetweenYesterdayAndTomorrow', function() {});
