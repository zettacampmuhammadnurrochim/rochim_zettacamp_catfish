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
const checkIngredientIsUsed = async (parent, arggs, ctx) => {
    const result = await recipesModel.aggregate([{
        $match : {
            "ingredients.ingredient_id": mongoose.Types.ObjectId(parent)
        }
    }])
    if (result.length) return true
    return false
}

const checkMenuUsed = async (parent, arggs, ctx) => {
    const result = await recipesModel.aggregate([{
        $match : {
            "ingredients.ingredient_id" : parent._id
        }
    }])
    menuUsing = []
    if (result.length) {
        for(const menu of result){
            menuUsing.push(menu.recipe_name)
        }
    }
    return menuUsing.toString()
}

module.exports = { checkIngredient, checkIngredientIsUsed, checkMenuUsed }