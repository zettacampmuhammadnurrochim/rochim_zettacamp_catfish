const userModel = require('../graphql/users/users.model')
const mongoose = require('./../services/services')
const {rule,and,or} = require('graphql-shield')

const isLogin = rule()(async (root, arggs, context, info) => {
  return !!context.req.headers.userid
})

const isAdmin = rule()(async (root, arggs, context, info) => {
    const admin = await userModel.aggregate([
        {
            $match : {
                _id : mongoose.Types.ObjectId(context.req.headers.userid),
            }
        },
        {    
            $lookup : {
                from: "userTypes",
                localField: "type",
                foreignField: "_id",
                as: "userType"
            }
        },
        {
            $unwind: '$userType'
        }
    ])
    return admin[0].userType.role === 'Admin' //true / false
})

const isUser = rule()(async (root, arggs, context, info) => {
    const user = await userModel.aggregate([
        {
            $match : {
                _id : mongoose.Types.ObjectId(context.req.headers.userid),
            }
        },
        {    
            $lookup : {
                from: "userTypes",
                localField: "type",
                foreignField: "_id",
                as: "userType"
            }
        },
        {
            $unwind: '$userType'
        }
    ])
    
    return user[0].userType.role === 'User' //true / false
})
 
module.exports = {
    Query: {
        getAllUsersType : and(isLogin, isAdmin),
        
        GetAllUsers : and(isLogin, isAdmin),
        GetOneUser : and(isLogin, isAdmin),
        
        GetAllIngredients : and(isLogin, isAdmin),
    
        GetAllCategories : and(isLogin, isAdmin),
        getCart : and(isLogin, or(isAdmin, isUser)),
        
        getAllTransactions : and(isLogin, isAdmin),
        getOneTransaction : and(isLogin, or(isAdmin, isUser)),
        getUserTransactionHistory : and(isLogin, or(isAdmin, isUser))

    },
    Mutation: {
        deleteUserType : and(isLogin, isAdmin),
        createAllUsersType : and(isLogin, isAdmin),
        createIngredient : and(isLogin, isAdmin),
        updateIngredient : and(isLogin, isAdmin),
        deleteIngredient : and(isLogin, isAdmin),

        updateUser : and(isLogin, or(isAdmin, isUser)),
        deleteUser : and(isLogin, isAdmin),
        createIngredient : and(isLogin, isAdmin),
        updateIngredient : and(isLogin, isAdmin),
        deleteIngredient : and(isLogin, isAdmin),
        createRecipe : and(isLogin, isAdmin),
        updateStatusRecipe : and(isLogin, isAdmin),
        updateRecipe : and(isLogin, isAdmin),
        updateRecipeMain : and(isLogin, isAdmin),
        deleteRecipe : and(isLogin, isAdmin),
        createTransaction : and(isLogin, isAdmin),
        updateTransaction : and(isLogin, isAdmin),
        deleteTransaction : and(isLogin, isAdmin),
        createAllUsersType : and(isLogin, isAdmin),
        deleteUserType : and(isLogin, isAdmin),
        createCategories : and(isLogin, isAdmin),
        updateCategories : and(isLogin, isAdmin),
        deleteCategories : and(isLogin, isAdmin),

        addToCart : and(isLogin, or(isAdmin, isUser)),
        reduceCart : and(isLogin, or(isAdmin, isUser)),
        updateCartMain : and(isLogin, or(isAdmin, isUser)),
        clearCart : and(isLogin, or(isAdmin, isUser)),
        order : and(isLogin, or(isAdmin, isUser))
    },
},{
  debug: true
};