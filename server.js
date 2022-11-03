const express = require('express')
const {ApolloServer , ApolloError} = require('apollo-server-express')

const app = express()
require('dotenv').config()
const port = process.env.PORT;
app.use(express.json())

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
const {graphqlMiddleware} = require('./app/middleware/graphqlMiddleware')
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

// app.use('/graphql', graphqlMiddleware)
async function startApolloServer(typeDefs, resolvers){
    
    const server = new ApolloServer({
        typeDefs, 
        resolvers,
        context : ({req}) => {
            return {req : req, error: ApolloError}
        }
    })
    await server.start()
    server.applyMiddleware({app})
    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}

const {typeDefs} = require('./app/graphql/book/typeDefs.js') 
// Provide resolver functions for your schema fields
const {resolvers} = require('./app/graphql/book/resolvers.js')

startApolloServer(typeDefs, resolvers);
// app.use('/', (req,res)=>{res.status(404).send({status : 404, message : 'route not found'})})