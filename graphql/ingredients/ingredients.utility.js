const mongoose = require('../../services/services')
const recipesModel = require('./../recipes/recipes.model')

const checkIngredient = async (id) => {
    const result = await recipesModel.aggregate([{
        $match : {
            "ingredients.ingredient_id" : mongoose.Types.ObjectId(id)
        }
    }])
    return result
}

module.exports = {checkIngredient}