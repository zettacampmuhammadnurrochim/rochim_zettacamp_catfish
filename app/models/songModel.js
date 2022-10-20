const mongoose = require('../../services/services.js')

CollectionName = "songs"
const bookSchema = {
    title: String,
    album: String,
    tahun: String,
    singer: String,
    genre: String,
    duration: String
}

const songModel = mongoose.model(CollectionName, bookSchema, CollectionName)

module.exports = songModel





