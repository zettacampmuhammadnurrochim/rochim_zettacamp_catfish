const DataLoader = require('dataloader');
const bookModel = require('../models/bookModel')
const { keyBy } = require('lodash')

const batchBooks = async function (booksId) {
    const book = await bookModel.find({
        _id: {
            $in: booksId //array
        }
    });

const userByIds = keyBy(book, '_id');  // ["54545sdsd": {}, "3434342334":{}]
    console.log('book by Id:', userByIds)
    result = booksId.map(ownerId => userByIds[ownerId]);
    console.log(result);
    return result

}

const bookLoader = new DataLoader(batchBooks);
module.exports = bookLoader