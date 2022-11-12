const DataLoader = require('dataloader');
const usersModel = require('./users.model')
const { keyBy } = require('lodash')

const batchUsers = async function (usersId) {
    const users = await usersModel.find({
        _id: {
            $in: usersId //array
        }
    });
    const usersById = keyBy(users, '_id')
    result = usersId.map(userId => usersById[userId]);
    return result
}

const usersLoader = new DataLoader(batchUsers);
module.exports = usersLoader