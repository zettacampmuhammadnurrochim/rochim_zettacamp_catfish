const {Schema,mongoose} = require('../../services/services')

CollectionName = "users"
const userSchema = new Schema({
  first_name: {
    type: String,
    required: [true, "first name is required"],
    minLength : [3, "min length is 3"],
    trim : true
  },
  last_name: {
    type: String,
    required: [true, "last name is required"],
    minLength : [3, "min length is 3"],
    trim : true
  },
  email: {
    type: String,
    required: [true, "email is required"],
    validate: {
      validator: function (v) {
        return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(v)
      },
      message: props => `${props.value} is not a valid email!`
    },
    unique: [true, "email already used"]
  },
  credit : {
    type : Number
  },
  password: {
    type: String,
    required: [true, "password is required"],
    minLength : [8, "min length is 3"],
    trim : true
  },
  type: {
    type: Schema.Types.ObjectId,
    required: [true, "type is required"]
  },
  remember_me: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    required: [true, "status is required"]
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
})
const userModel = mongoose.model(CollectionName, userSchema, CollectionName)

module.exports = userModel