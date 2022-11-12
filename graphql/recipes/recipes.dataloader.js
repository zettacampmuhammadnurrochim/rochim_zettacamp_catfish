const DataLoader = require('dataloader');
const recipesModel = require('./recipes.model')
const { keyBy } = require('lodash')

const batchRecipes = async function (recipesId) {
    console.log(recipesId);
    const recipes = await recipesModel.find({
        _id: {
            $in: recipesId //array
        }
    });
    const recipesById = keyBy(recipes, '_id')
    result = recipesId.map(recipeId => recipesById[recipeId]);
    return result
}

const recipesLoader = new DataLoader(batchRecipes);
module.exports = recipesLoader