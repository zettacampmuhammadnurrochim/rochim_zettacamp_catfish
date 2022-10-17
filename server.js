// require memungkinkan mengimport file js , dapat dipanggil didalam fungsi (CJS), merupakan standar javascript, (beberapa browser tidak support)
// sedangkan import adalah sintaks untuk masadepan, di jalankan di awal (hoisting)
const express = require('express')

const app = express()
require('dotenv').config()
const port = process.env.PORT;
app.use(express.json()) //parse all request in with jsoon format    

// routes
const bookRoutes = require('./routes/bookRoute.js')
const userRoutes = require('./routes/userRoute.js')

// middleware
const {getToken} = require('./app/middleware/booksMiddleware.js')
app.use('/books', getToken);
app.use('/books', bookRoutes);
app.use('/', userRoutes)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))