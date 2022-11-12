const DataLoader = require('dataloader');
const ingredientsModel = require('./ingredients.model')
const { keyBy } = require('lodash')

const batchInggridients = async function (inggridientsId) {
    const inggridients = await ingredientsModel.find({
        _id: {
            $in: inggridientsId //array
        }
    });
    const inggridientsById = keyBy(inggridients, '_id')
    result = inggridientsId.map(ingredientId => inggridientsById[ingredientId]);
    return result
}

const inggridientsLoader = new DataLoader(batchInggridients);
module.exports = inggridientsLoader