const DataLoader = require('dataloader');
const userTypesModel = require('./userType.model')
const { keyBy } = require('lodash')

const batchUserTypes = async function (userTypeIds) {
    const userTypes = await userTypesModel.find({
        _id: {
            $in: userTypeIds //array
        }
    });
    const userTypeId = keyBy(userTypes, '_id')
    result = userTypeIds.map(userId => userTypeId[userId]);
    return result
}

const userTypesLoader = new DataLoader(batchUserTypes);
module.exports = userTypesLoader