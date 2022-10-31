const mongoose = require('../../services/services.js')

CollectionName = "company" 
const companySchema = {
    name : String,
    email: String,
    telpon : String,
    address  : String,
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    }
}

const companyModel = mongoose.model(CollectionName, companySchema, CollectionName)
module.exports = companyModel