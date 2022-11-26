const {Schema,mongoose} = require('../../services/services')

CollectionName = "userTypes"
const userSchema = new Schema({
    role : {type : String, require : [true, "user type required"]},
    permission : [{
        page : {type : String, require : [true, 'page type required']},
        view : {type : String, require : [true, 'view type required']}
    }]
}, {
  timestamps: true
})
const userModel = mongoose.model(CollectionName, userSchema, CollectionName)

module.exports = userModel