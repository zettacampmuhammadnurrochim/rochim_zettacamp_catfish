const express = require('express')
const {ApolloServer , ApolloError} = require('apollo-server-express')
const {mergeTypeDefs,mergeResolvers} = require('@graphql-tools/merge')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const booksLoaders = require('./app/graphql/books/books.dataloader')
const songsLoaders = require('./app/graphql/songs/songs.dataloader')
const app = express()
require('dotenv').config()
const port = process.env.PORT;
app.use(express.json())

const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
let private = fs.readFileSync(path.join(__dirname, 'private.key'))

const bookRoutes = require('./routes/bookRoute')
const songRoute = require('./routes/songRoute')
const userRoutes = require('./routes/userRoute')
const session = require('express-session')
app.use(session({
    secret:'its secret key',
    name:'uniqueSessionID',
    cookie: { maxAge: (1000 * 60 * 100) },
    resave: true,
    saveUninitialized: true
}))
// middleware
const {bookMiddleware} = require('./app/middleware/booksMiddleware')
const {songMiddleware} = require('./app/middleware/songMiddleware')
const {userMiddleware} = require('./app/middleware/userMiddleware')
const auth_middleware = require('./app/middleware/authMiddleware')
// book route
app.use('/books', bookMiddleware)
app.use('/books', bookRoutes)
// user route
app.use('/', userMiddleware)
app.use('/', userRoutes)
// songs route
app.use('/songs', songMiddleware); //no problem
app.use('/songs', songRoute);

// graphql day 1
async function startApolloServer(typeDefs, resolvers){
    const schema = makeExecutableSchema({
        typeDefs, 
        resolvers
    })
    const middleware = [auth_middleware]
    schemaWithMiddleware = applyMiddleware(schema, ...middleware)

    const server = new ApolloServer({
        schema : schemaWithMiddleware,
        context : ({req}) => {
            return {req : req, error: ApolloError, booksLoaders, songsLoaders }
        }
    })
    await server.start()
    server.applyMiddleware({app})
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}
// TYPE DEFS 
const booksTypeDefs = require('./app/graphql/books/books.typeDefs') 
const usersTypeDefs = require('./app/graphql/users/users.typeDefs')
const songsTypeDefs = require('./app/graphql/songs/songs.typeDefs')

// RESOLVERS
const booksResolvers = require('./app/graphql/books/books.resolvers')
const usersResolvers = require('./app/graphql/users/users.resolvers')
const songsResolvers = require('./app/graphql/songs/songs.resolvers')



const { applyMiddleware } = require('graphql-middleware')
const bookModel = require('./app/models/bookModel')

// MERGEING 
typeDefs = mergeTypeDefs([booksTypeDefs,usersTypeDefs,songsTypeDefs])
resolvers = mergeResolvers([booksResolvers,usersResolvers,songsResolvers])

startApolloServer(typeDefs, resolvers);
// app.use('/', (req,res)=>{res.status(404).send({status : 404, message : 'route not found'})})