const mongoose = require('../../services/services')

CollectionName = "categories"
const categoriesSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: [true, "name is required"]
    },
    description: {
        type: String
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
})
const categoriesModel = mongoose.model(CollectionName, categoriesSchema, CollectionName)

module.exports = categoriesModel