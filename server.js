const express = require('express')

const app = express()
require('dotenv').config()
const port = process.env.PORT;
app.use(express.json())
// routes
const songRoute = require('./routes/songRoute')
const session = require('express-session')


app.use(session({
    secret:'its secret key',
    name:'uniqueSessionID',
    cookie: { maxAge: (1000 * 60 * 100) },
    resave: true,
    saveUninitialized: true
}))
// middleware
const {songMiddleware} = require('./app/middleware/songMiddleware')
// songs route
app.use('/songs', songMiddleware); //no problem
app.use('/songs', songRoute);

app.use('/', (req,res)=>{res.status(404).send({status : 404, message : 'route not found'})})
// define server runing on
app.listen(port, () => console.log(`Example app listening on port ${port}!`))