const mongoose = require('../../services/services.js')

CollectionName = "collectionBooks"
const bookSchema = {
    image: String,
    title: String,
    author: String,
    price: String,
    original_url: String,
    url: String,
    slug: String,
    stock: Number,
}

const bookModel = mongoose.model(CollectionName, bookSchema, CollectionName)

module.exports = bookModel