const ingredientsModel = require('../ingredients/ingredients.model')
const receipesModel = require('../recipes/recipes.model')
const mongoose = require('../../services/services')

const validateStockIngredient = async (Recipes) => {
    let result = []
    let detailIngredient = new Map()
    let detailRecipe = new Map()
    for(const recipe of Recipes){
        
        const recipe_ = await receipesModel.collection.findOne({_id : recipe.recipe_id})
        const amount = recipe.amount
        const ingredients = recipe_.ingredients
        // check ingredients if sufficient
        let ableToMake = []
        for(const recipeIng of ingredients)
        {
            const ingredient = await ingredientsModel.findOne({_id : mongoose.Types.ObjectId(recipeIng.ingredient_id)}).select(['stock','name'])
            if (ingredient.stock >= recipeIng.stock_used * amount) {
                ableToMake.push(true)
                detailIngredient.set(`${ingredient.name}`, true)
            }else{
                ableToMake.push(false)
                detailIngredient.set(`${ingredient.name}`, false)
            }
        }
        detailRecipe.set(recipe_.recipe_name , Object.fromEntries(detailIngredient))
        result.push(ableToMake.includes(false))
    }

    const detailResult = JSON.stringify(Object.fromEntries(detailRecipe))
    return result 
}

const reduceIngredientStock = async (Recipes) => {
    for(const recipe of Recipes){
        const recipe_ = await receipesModel.collection.findOne({_id : recipe.recipe_id})
        const amount = recipe.amount
        const ingredients = recipe_.ingredients
        for(const recipeIng of ingredients)
        {
            let reduce = await ingredientsModel.updateOne({_id : mongoose.Types.ObjectId(recipeIng.ingredient_id),status : 'active'},{
                $inc : {
                    stock : - (amount * recipeIng.stock_used)
                }
            })
        }
    }
    return true 
}

module.exports = {validateStockIngredient,reduceIngredientStock}