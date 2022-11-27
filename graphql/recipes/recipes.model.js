const {
    Schema,
    mongoose
} = require('../../services/services')

CollectionName = "recipes"
const recipesSchema = new Schema({
    recipe_name: {
        type: String,
        required: [true, "recipe is required"],
        unique : [true, "recipe already added"]
    },
    categories: {
        type: Schema.Types.ObjectId,
        ref: "categories"
    },
    ingredients: [{
        ingredient_id: {
            type: Schema.Types.ObjectId,
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