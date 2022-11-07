const DataLoader = require('dataloader');
const songModel = require('../../models/songModel')
const { keyBy } = require('lodash')

const batchBooks = async function (booksId) {
    const book = await songModel.find({
        _id: {
            $in: booksId //array
        }
    });

    const userByIds = keyBy(book, '_id')
    result = booksId.map(ownerId => userByIds[ownerId]);
    return result
}

const bookLoader = new DataLoader(batchBooks);
module.exports = bookLoader