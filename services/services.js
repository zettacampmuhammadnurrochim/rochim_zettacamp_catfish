require('dotenv').config()
const mongoose = require('mongoose')
// mongoose.connect(`mongodb://localhost:27017/${process.env.DB_NAME}`)
mongoose.connect(`mongodb+srv://rochim:Zettaku123@cluster0.2wqi467.mongodb.net/${process.env.DB_NAME}`)
.then(res => res? console.log(`success connecting to database ${process.env.DB_NAME}`) : console.log(`failed to connecting`))
.catch(err => console.log(err.message))

module.exports = mongoose