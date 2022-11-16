const userModel = require('../graphql/users/users.model')
const mongoose = require('./../services/services')
const {rule,and} = require('graphql-shield')

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
    return admin[0].userType.userType === 'Admin' //true / false
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
    
    return user[0].userType.userType === 'User' //true / false
})
 
module.exports = {
    Query: {
        getAllUsersType : and(isLogin, isAdmin),
        GetAllUsers : and(isLogin, isAdmin),
        GetOneUser : and(isLogin, isAdmin),
        GetAllIngredients : and(isLogin, isAdmin),
        getAllRecipes : and(isLogin, isAdmin)
    },
    Mutation: {
        deleteUserType : and(isLogin, isAdmin),
        createAllUsersType : and(isLogin, isAdmin)
    },
},{
  debug: true
};