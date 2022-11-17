const DataLoader = require('dataloader');
const ingredientsModel = require('./ingredients.model')
const { keyBy } = require('lodash')

const batchInggridients = async function (inggridientsIds) {
    const inggridients = await ingredientsModel.find({
        _id: {
            $in: inggridientsIds //array
        },
        status : "active"
    });

    const inggridientsById = keyBy(inggridients, '_id') // convert to object which's key by _id
    result = inggridientsIds.map(ingredientId => inggridientsById[ingredientId]);
    
    return result
}

const ingredientsLoader = new DataLoader(batchInggridients);
module.exports = ingredientsLoader