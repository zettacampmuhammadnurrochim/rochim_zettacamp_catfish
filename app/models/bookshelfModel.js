const {Schema, mongoose} = require('../../services/services.js')
CollectionName = "bookshelf"

const bookshelfSchema = new Schema({
        shelf_name : String,
        books : [{
            book_id : {type : Schema.Types.ObjectId}, 
            added : {
                full_date : {Type : String}, date : {Type : String},day : {Type : String}, month : {Type : String}, year : {Type : String}, hours : {Type : String},minutes : {Type : String}, seconds : {Type : String}
                },
            stock : {Type : Number}
        }],
        date : [{date : {type : String}, time : {Type : String}}],
        theme : [{type : String}],
        type : 
        {
            price : {Type : String, enum: ['expensive', 'middle', 'cheap']},
            level : {Type : Array, enum: ['rare', 'medium', 'ordinary']}
        }
    },
    { timestamps: true })

const bookshelfModel = mongoose.model(CollectionName, bookshelfSchema, CollectionName)

module.exports = bookshelfModel

// export default mongoose.model('bookshelfModel',bookshelfSchema)