const exp = require('express')
const app = exp()
const jwt = require('jsonwebtoken')
app.use(exp.json())

const mongoose = require('mongoose')

const db = "library";
const port = 5000;

mongoose.connect(`mongodb://localhost:27017/${db}`);


const BookSchema = {
    _id: String,
    image: String,
    title: String,
    author: String,
    price: String,
    original_url: String,
    url: String,
}

const collectionBooks = mongoose.model('collectionBooks', BookSchema);


app.get('/show', (req, res) => {
    collectionBooks.find({}, function (err, bookList) {
        res.send({
            databuku: bookList
        });
    });
})

app.post('/login', (req, res) => {
    let {email,password} = req.body;
    
    var token = jwt.sign({
        foo: 'bar'
    }, email);

    if (email == "muhammad.0206@students.amikom.ac.id" && password == "12345678") {
        res.send({
            "token": token
        });


    } else {
        res.send("you are not authorized to access this page");
    }
});

app.listen(port)