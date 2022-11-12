const express = require('express')
const {ApolloServer , ApolloError} = require('apollo-server-express')
const {mergeTypeDefs,mergeResolvers} = require('@graphql-tools/merge')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const app = express()
const { applyMiddleware } = require('graphql-middleware')
const {shield} = require('graphql-shield')
require('dotenv').config()

// dataLoader
let inggridientsLoader = require('./graphql/ingredients/ingredients.dataloader')
let recipesLoader = require('./graphql/recipes/recipes.dataloader')
let usersLoader = require('./graphql/users/users.dataloader')
// middleware
const auth_middleware = require('./middlewares/auth')
const userRole_middleware = require('./middlewares/users.role')
// TYPE DEFS 
const usersTypeDefs = require('./graphql/users/users.typeDefs.js')
const ingredientsTypeDefs = require('./graphql/ingredients/ingredients.typeDefs.js') 
const recipesTypeDefs = require('./graphql/recipes/recipes.typeDefs.js')
const transactionsTypeDefs = require('./graphql/transactions/transactions.typeDefs.js')

// RESOLVERS
const usersResolvers = require('./graphql/users/users.resolvers.js')
const ingredientsResolvers = require('./graphql/ingredients/ingredients.resolvers.js') 
const recipesResolvers = require('./graphql/recipes/recipes.resolvers.js')
const transactionsResolvers = require('./graphql/transactions/transactions.resolvers.js')

// MERGEING 
typeDefs = mergeTypeDefs([usersTypeDefs,ingredientsTypeDefs,recipesTypeDefs,transactionsTypeDefs])
resolvers = mergeResolvers([usersResolvers,ingredientsResolvers,recipesResolvers,transactionsResolvers])

async function startApolloServer(typeDefs, resolvers){
    const schema = makeExecutableSchema({
        typeDefs, 
        resolvers
    })
    const middlewares = [auth_middleware, shield(userRole_middleware)]

    schemaWithMiddleware = applyMiddleware(schema, ...middlewares)

    const server = new ApolloServer({
        schema : schemaWithMiddleware,
        context : ({req}) => {
            return {req : req, error: ApolloError, inggridientsLoader, recipesLoader, usersLoader}
        }
    })
    await server.start()
    server.applyMiddleware({app})
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

startApolloServer(typeDefs, resolvers)

const port = process.env.PORT;