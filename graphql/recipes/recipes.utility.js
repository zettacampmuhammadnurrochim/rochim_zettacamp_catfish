const ingredientsModel = require('./../ingredients/ingredients.model')

const getAvailable = async function (ingredients) {
    const minStock = []
    for (let ingredient of ingredients) {
        const ingredientData = await ingredientsModel.findById(ingredient.ingredient_id);
        minStock.push(Math.floor(ingredientData.stock / ingredient.stock_used));
    }
    return Math.min(...minStock);
}

module.exports = {getAvailable}