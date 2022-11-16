const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path');
const { ApolloError } = require('apollo-server-express');
let private = fs.readFileSync(path.join(__dirname, '../private.key'))

const userAuth = async (resolve, root, args, context, info) => {
    let token = context.req.headers.authorization || false
    if (token !== null) {
        token = token.replace('Bearer ', '').replace(' ', '')
        let decode = jwt.decode(token, private);
        decode != null ? context.isAuth = true : context.isAuth = false
        if (context.isAuth) {
            const result = await resolve(root, args, context, info)
            return result
        }else{
            return new ApolloError("your not authorize")
        }
    }else{
        return new ApolloError("token is null")
    }
}

// define resolver where is apply user auth middleware 
module.exports = {
    Query: {
        GetAllUsers : userAuth,
        GetOneUser : userAuth,
        GetAllIngredients : userAuth,
        getAllRecipes : userAuth
    }
};