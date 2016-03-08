// string, number, date, object, boolean, any
function Schema() {
  this._name = null;
  this._required = false;
  this._descriptions = [];
  this._notes = [];
  // { name: 'isEmail', func: function(val, options), message/msg: '不是一个有效的邮箱地址' }
  this._validators = [];
  this._sanitizers = [];
  this._ref = null;
  this._tags = [];
}


// {
//   name: String,
//   gender: String
// }
//
// A ref B
//
// B ref A
//
// A ref B
// B ref C
// C ref A
//
// {  }
//
// {
//   name,
//   gender,
//   friends: [
//     {
//       name, gender,
//       parents: [
//         { name, gender }
//       ]
//     }
//   ]
// }
//
//
// array, object
// var basicUserSchema = ovt.object({
//   name: ovt.string().required(),
//   gender: ovt.string().required(),
//   email: ovt.string().isEmail()
// });
//
//
// var userSchema = basicUserSchema.add('friends', ovt.array([basicUserSchema]));
//
// validate('fdsfs', function(){})

Schema.prototype.validate = function() {

};

Schema.prototype.sanitize = function() {

};

Schema.prototype.toJSON = function() {

};
