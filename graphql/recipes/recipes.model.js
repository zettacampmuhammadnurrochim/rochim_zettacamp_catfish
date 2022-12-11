const mongoose = require('../../services/services')

CollectionName = "recipes"
const recipesSchema = new mongoose.Schema({
    recipe_name: {
        type: String,
        required: [true, "recipe is required"]
    },
    categories: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories"
    },
    ingredients: [{
        ingredient_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ingredients"
        },
        stock_used: {
            type: Number,
            required: [true, "stock used is required"]
        }
    }],
    highlight : {
        type : Boolean
    },
    specialOver : {
        type : Boolean
    },
    price : {
        type : Number,
        required: [true, "price is required"]
    },
    disc : {
        type : Number,
    },
    status: {
        type: String,
        enum: ['unpublish','publish', 'deleted'],
        required: [true, "status is required"]
    },
    description: {
        type: String
    },
    image: {
        type: String,
        required: [true, "image is required"],
    },
    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
})
const recipeSchema = mongoose.model(CollectionName, recipesSchema, CollectionName)

module.exports = recipeSchema