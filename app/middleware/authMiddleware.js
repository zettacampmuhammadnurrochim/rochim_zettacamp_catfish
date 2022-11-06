const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path');
const { ApolloError } = require('apollo-server-express');
let private = fs.readFileSync(path.join(__dirname, '../../private.key'))

const userAuth = async (resolve, root, args, context, info) => {
    let token = context.req.headers.authorization
    if (typeof token !== 'undefined') {
        token = token.replace('Bearer ', '');
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
        getBookbyId : userAuth,
        getBooks : userAuth,
        getAllBooks_ : userAuth,
        bookPurchase : userAuth,
        getBooksPaginate : userAuth,
        bookshelf : userAuth
    },
    Mutation: {
        createBook: userAuth,
        updateBook: userAuth,
        deleteBook: userAuth,
    }
};