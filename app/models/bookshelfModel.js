const {Schema, mongoose} = require('../../services/services.js')
CollectionName = "bookshelf"

const bookshelfSchema = new Schema({
    shelf_name : String,
    book : {book_id : [{type : Schema.Types.ObjectId, required : [true, "books id is required"]}]},
    createdAt : Date,
    updatedAt : Date 
},{ timestamps: true })

const bookshelfModel = mongoose.model(CollectionName, bookshelfSchema, CollectionName)

module.exports = bookshelfModel

// export default mongoose.model('bookshelfModel',bookshelfSchema)