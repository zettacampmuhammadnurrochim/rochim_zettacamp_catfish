const mongoose = require('../../services/services')

CollectionName = "messagingTokens"
const userSchema = new mongoose.Schema({
  userAgent: {
    type: String,
    required: [true, "first name is required"]
  },
  token: {
    type: String,
    required: [true, "token is required"],
    unique : true
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
})
const messagingTokenModel = mongoose.model(CollectionName, userSchema, CollectionName)

module.exports = messagingTokenModel