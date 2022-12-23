const express = require('express')
const {ApolloServer , ApolloError} = require('apollo-server-express')
const {mergeTypeDefs,mergeResolvers} = require('@graphql-tools/merge')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const app = express()
const { applyMiddleware } = require('graphql-middleware')
const {shield} = require('graphql-shield')
require('dotenv').config()
const { sendMessages } = require('./firebase/firebase.utility')

// dataLoader
let ingredientsLoader = require('./graphql/ingredients/ingredients.dataloader')
let recipesLoader = require('./graphql/recipes/recipes.dataloader')
let usersLoader = require('./graphql/users/users.dataloader')
let userTypesLoader = require('./graphql/userTypes/userType.dataloader')
let categoriesLoader = require('./graphql/categories/categories.dataloader')
// middleware
const auth_middleware = require('./middlewares/auth')
const userRole_middleware = require('./middlewares/users.role')
// TYPE DEFS 
const usersTypeDefs = require('./graphql/users/users.typeDefs')
const ingredientsTypeDefs = require('./graphql/ingredients/ingredients.typeDefs') 
const recipesTypeDefs = require('./graphql/recipes/recipes.typeDefs')
const transactionsTypeDefs = require('./graphql/transactions/transactions.typeDefs')
const userTypeTypeDefs = require('./graphql/userTypes/usersType.typeDefs')
const categoriesTypeTypeDefs = require('./graphql/categories/categories.typeDefs')
const cartTypeTypeDefs = require('./graphql/cart/cart.typedefs')

// RESOLVERS
const usersResolvers = require('./graphql/users/users.resolvers')
const ingredientsResolvers = require('./graphql/ingredients/ingredients.resolvers') 
const recipesResolvers = require('./graphql/recipes/recipes.resolvers')
const transactionsResolvers = require('./graphql/transactions/transactions.resolvers')
const userTypeResolvers = require('./graphql/userTypes/usersType.resolvers')
const categoriesTypeResolvers = require('./graphql/categories/categories.resolver')
const cartTypeResolvers = require('./graphql/cart/cart.resolver')

// MERGEING 
typeDefs = mergeTypeDefs([usersTypeDefs,ingredientsTypeDefs,recipesTypeDefs,transactionsTypeDefs,userTypeTypeDefs,categoriesTypeTypeDefs,cartTypeTypeDefs])
resolvers = mergeResolvers([usersResolvers,ingredientsResolvers,recipesResolvers,transactionsResolvers,userTypeResolvers,categoriesTypeResolvers,cartTypeResolvers])

async function startApolloServer(typeDefs, resolvers){
    const schema = makeExecutableSchema({
        typeDefs, 
        resolvers
    })
    // const middlewares = [auth_middleware, shield(userRole_middleware)]
    const middlewares = [auth_middleware]

    schemaWithMiddleware = applyMiddleware(schema, ...middlewares)

    const server = new ApolloServer({
        schema : schemaWithMiddleware,
        context : ({req}) => {
            return {req : req, error: ApolloError, ingredientsLoader, recipesLoader, usersLoader, userTypesLoader, categoriesLoader}
        }
    })
    await server.start()
    server.applyMiddleware({app})
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

startApolloServer(typeDefs, resolvers)

const port = process.env.PORT;