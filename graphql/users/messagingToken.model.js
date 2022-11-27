const {Schema,mongoose} = require('../../services/services')

CollectionName = "messagingTokens"
const userSchema = new Schema({
  userAgent: {
    type: String,
    required: [true, "first name is required"]
  },
  token: {
    type: String,
    required: [true, "token is required"]
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
})
const messagingTokenModel = mongoose.model(CollectionName, userSchema, CollectionName)

module.exports = messagingTokenModel