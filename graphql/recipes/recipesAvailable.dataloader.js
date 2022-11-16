const DataLoader = require('dataloader');
const ingredientsModel = require('./../ingredients/ingredients.model')
const {
    keyBy
} = require('lodash')

const batchRecipes = async function (ingredients) {
    
    const availableStock = []
    for (let ingredient of ingredients) {
        let minStock = []
        for (ingredient of ingredient) {
            let recipe_ingredient = await ingredientsModel.findById(ingredient.ingredient_id);
            minStock.push(Math.floor(recipe_ingredient.stock / ingredient.stock_used));
        }
        availableStock.push(Math.min(...minStock))
    }
    return availableStock
}

const recipesAvailable = new DataLoader(batchRecipes);
module.exports = recipesAvailable