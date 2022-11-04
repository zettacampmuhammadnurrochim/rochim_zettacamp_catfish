const DataLoader = require('dataloader');
const bookModel = require('../models/bookModel')
const { keyBy } = require('lodash')

const batchBooks = async function (booksId) {
    const book = await bookModel.find({
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