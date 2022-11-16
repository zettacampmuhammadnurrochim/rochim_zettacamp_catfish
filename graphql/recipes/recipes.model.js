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
    price : {
        type : Number,
        required: [true, "price is required"]
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
const recipeSchema = mongoose.model(CollectionName, recipesSchema, CollectionName)

module.exports = recipeSchema