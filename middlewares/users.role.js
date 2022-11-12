const { ApolloError } = require('apollo-server-express');
const userModel = require('../graphql/users/users.model')
const mongoose = require('./../services/services')
const {rule,and} = require('graphql-shield')

const isLogin = rule()(async (root, arggs, context, info) => {
  return !!context.req.headers.userid
})

const isAdmin = rule()(async (root, arggs, context, info) => {
    const admin = await userModel.collection.findOne({_id : mongoose.Types.ObjectId(context.req.headers.userid)})
    return admin.entity === 'admin'
})

const isUser = rule()(async (root, arggs, context, info) => {
    const admin = await userModel.collection.findOne({_id : mongoose.Types.ObjectId(context.req.headers.userid)})
    return admin.entity === 'user' 
})
 
module.exports = {
    Query: {
        GetAllUsers : and(isLogin, isAdmin),
        GetOneUser : isLogin
    },
    Mutation: {}
};