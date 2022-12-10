const { ApolloError } = require('apollo-server-express');
const ingredientsModel = require('./../ingredients/ingredients.model')

const getAvailable = async function (ingredients) {
    try {
        const minStock = []
        for (let ingredient of ingredients) {
            const ingredientData = await ingredientsModel.findById(ingredient.ingredient_id)
            minStock.push(Math.floor(ingredientData.stock / ingredient.stock_used))
        }
        return Math.min(...minStock)   
    } catch (error) {
        throw new ApolloError('contain errors')
    }
}

const cekDuplicateIngredients = async function (ingredients) {
    let ingredient_id = []
    for (const ingredient of ingredients) {
        ingredient_id.push(ingredient.ingredient_id)
    }

    uniqueIngredients = new Set(ingredient_id)
    if (ingredient_id.length !== uniqueIngredients.size) {
        let duplicates = ingredient_id.filter((e, i, a) => a.indexOf(e) !== i)
        throw new ApolloError('contain duplicate ingredients', duplicates)
    }
    return true
}

module.exports = { getAvailable, cekDuplicateIngredients }