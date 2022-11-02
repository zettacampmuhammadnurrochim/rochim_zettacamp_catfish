const {Schema, mongoose} = require('../../services/services.js')

CollectionName = "songs"
const bookSchema = new Schema({
    title: String,
    album: String,
    tahun: String,
    singer: String,
    genre: String,
    duration: String,
    deleted_at : Date
},{ timestamps: true })

const songModel = mongoose.model(CollectionName, bookSchema, CollectionName)

module.exports = songModel





