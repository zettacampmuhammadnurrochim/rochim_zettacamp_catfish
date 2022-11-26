const DataLoader = require('dataloader');
const categoriesModel = require('./categories.model')
const { keyBy } = require('lodash')

const batchCategories = async function (categoriesIds) {
    let result = []
    for(const id of categoriesIds){
        const categories = await categoriesModel.findOne({
            _id: id
        });
        result.push(categories)
    }
    return result
}

const categoriesLoader = new DataLoader(batchCategories);
module.exports = categoriesLoader