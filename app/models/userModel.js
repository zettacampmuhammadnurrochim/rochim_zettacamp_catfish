const mongoose = require('../../services/services.js')

CollectionName = "users" 
const userSchema = {
    name : String,
    email: String,
    password : String,
    date : String,
    address  : String,
    token : String,
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
const userModel = mongoose.model(CollectionName, userSchema)

module.exports = userModel