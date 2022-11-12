const {
   Schema,
   mongoose
} = require('../../services/services')

CollectionName = "transactions"
const userSchema = new Schema({
   user_id: {
      type: Schema.Types.ObjectId,
      ref: "users"
   },
   admin_id: {
      type: Schema.Types.ObjectId,
      ref: "users"
   },
   menu: [{
      recipe_id: {
         type: Schema.Types.ObjectId,
         ref: "recipes"
      },
      amount: {
         type: Number,
         required: [true, "amount is required"],
         min : 0
      },
      note: {
         type: String
      },
      status_recipe: {
         type: String,
         enum : ['outOfStock','available']
      }
   }],
   order_status: {
      type: String,
      enum: ['success', 'failed']
   },
   order_date: {
      type: Date
   },
   status: {
      type: String,
      enum: ['active', 'deleted'],
      required: [true, "status is required"]
   },
   deletedAt: {
      type: Date
   }
}, {
   timestamps: true
})
const userModel = mongoose.model(CollectionName, userSchema, CollectionName)

module.exports = userModel