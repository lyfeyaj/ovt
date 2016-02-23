// string, number, date, object, boolean, any
function Schema() {
  this._name = null;
  this._required = false;
  this._descriptions = [];
  this._notes = [];
  this._validates = [];
  this._sanitizes = [];
  this._ref = null;
  this._tags = [];
}

Schema.prototype.validate = function() {

};

Schema.prototype.sanitize = function() {

};

Schema.prototype.toJSON = function() {

};
