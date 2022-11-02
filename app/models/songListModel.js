const {Schema, mongoose} = require('../../services/services.js')

CollectionName = "songPlayList"
const songSchema = new Schema({
    name : {type : String},
    songs : [{type : mongoose.Types.ObjectId, required : true, ref : "songs"}],
    total_duration : {type : String},
    deleted_at : {Type : Date}
},{ timestamps: true })

const songModel = mongoose.model(CollectionName, songSchema, CollectionName)

module.exports = songModel





