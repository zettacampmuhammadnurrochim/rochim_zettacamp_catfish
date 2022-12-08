const mongoose = require('../../services/services')

CollectionName = "ingredients"
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: [true, "recipe name already used"],
        required: [true, "name is required"]
    },
    stock: {
        type: Number,
        min : 1,
        required: [true, "stock is required"]
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