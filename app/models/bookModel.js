const mongoose = require('../../services/services.js')
CollectionName = "collectionBooks"

const Schema  = mongoose.Schema
const bookSchema = new Schema({
    image: {type : String},
    title: {type : String, required: [true, "you missing it!, title is required"]},
    author: {type : String, required: [true, "you missing it!, author is required"]},
    price: {type : String, required: [true, "you missing it!, price is required"]},
    original_url: {type : String},
    url: {type : String},
    slug: {type : String},
    stock: {type : Number},
    createdAt : Date,
    updatedAt : {type: Date , default : new Date} //notworking
},{ timestamps: true }) //working


bookSchema.pre(['save','updateOne','updateMany','insertOne','insertMany','updateById'], function(next){
    console.log('save is runing');
    let currenDate = new Date()
    this.updatedAt = currenDate
    if (!this.createdAt) {
        this.createdAt = currenDate
    }
    next()
})

// bookSchema.pre('updateOne', function(next){
//     console.log('updateOne is runing');
//     var d = new Date,
//     currenDate = [d.getMonth()+1,
//                d.getDate(),
//                d.getFullYear()].join('/')+' '+
//               [d.getHours(),
//                d.getMinutes(),
//                d.getSeconds()].join(':');
//                console.log(dformat);
//     this.updatedAt = currenDate
//     //auto matic save is createat is null or not set before
//     if (!this.createdAt) {
//         this.createdAt = currenDate
//     }

//     next()
// })

const bookModel = mongoose.model(CollectionName, bookSchema, CollectionName)

module.exports = bookModel