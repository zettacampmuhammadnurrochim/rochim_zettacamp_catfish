// require memungkinkan mengimport file js , dapat dipanggil didalam fungsi (CJS), merupakan standar javascript, (beberapa browser tidak support)
// sedangkan import adalah sintaks untuk masadepan, di jalankan di awal (hoisting)
const express = require('express')

const app = express()
require('dotenv').config()
const port = process.env.PORT;
app.use(express.json()) //parse all request in with jsoon format    

// routes
const bookRoutes = require('./routes/bookRoute.js')
const songRoute = require('./routes/songRoute')
const userRoutes = require('./routes/userRoute.js')

// middleware
const {bookMiddleware} = require('./app/middleware/booksMiddleware.js')
const {songMiddleware} = require('./app/middleware/songMiddleware')
const {userMiddleware} = require('./app/middleware/userMiddleware.js')
// book route
app.use('/books', bookMiddleware)
app.use('/books', bookRoutes)
// user route
app.use('/', userMiddleware)
app.use('/', userRoutes)
// songs route
app.use('/songs', songMiddleware); //no problem
app.use('/songs', songRoute);

app.use('/', (req,res)=>{res.status(404).send({status : 404, message : 'route not found'})})
// define server runing on
app.listen(port, () => console.log(`Example app listening on port ${port}!`))