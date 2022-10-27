const {Schema, mongoose} = require('../../services/services.js')
CollectionName = "bookshelf"

const bookshelfSchema = new Schema({
        admin : {type : Schema.Types.ObjectId, ref : "admin"},
        books : [{
            book_id : {type : Schema.Types.ObjectId, ref : "collectionBooks"}, 
            added : {
                full_date : {Type : String}, date : {Type : String},day : {Type : String}, month : {Type : String}, year : {Type : String}, hours : {Type : String},minutes : {Type : String}, seconds : {Type : String}
                },
            quantity : {Type : Number},
            total_disc: {Type : String},
            price_AfterDisc: {Type : String},
            total_tax: {Type : String},
            price_afterTax: {Type : String},
            total_price : {Type : String}
        }],
        date : [{date : {type : String}, time : {Type : String}}],
        total : {Type : String},
        paid : {Type : String},
        change : {Type : String},
        paid_off : {Type : Boolean},
        description : {Type : String}
    },
    { timestamps: true })

const bookshelfModel = mongoose.model(CollectionName, bookshelfSchema, CollectionName)

module.exports = bookshelfModel

// export default mongoose.model('bookshelfModel',bookshelfSchema)