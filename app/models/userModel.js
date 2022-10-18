const mongoose = require('../../services/services.js')

CollectionName = "users" 
const userSchema = {
    name : String,
    email: String,
    password : String,
    date : String,
    address  : String,
    token : String,
}
const userModel = mongoose.model(CollectionName, userSchema)

module.exports = userModel