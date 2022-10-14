// define module 
import express from "express";
import mongoose, {
    get
} from "mongoose";
import ejs from "ejs";
import jwt from "jsonwebtoken";
import bodyParser from "body-parser";


const db = "library";
const port = 3000;

const app = express();
app.set("view engine", "ejs");

mongoose.connect(`mongodb://localhost:27017/${db}`);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(bodyParser.urlencoded({
    extended: true
}));

const BookSchema = {
    _id: Number,
    image: String,
    title: String,
    author: String,
    price: String,
    original_url: String,
    url: String,
}

const bookList = mongoose.model('collectionBooks', BookSchema);

app.get('/', (req, res) => {
    bookList.find({}, function (err, bookList) {
        res.send({
            databuku: bookList
        });
    });
});

app.post('/login', (req, res) => {
    res.send(req.body);
    var token = jwt.sign({
        foo: 'bar'
    }, 'shhhhh');
    let {email,pw} = req.body;
    if (email == "muhammad.0206@students.amikom.ac.id" && pw == "12345678") {
        res.send({
            "token": token
        });
    } else {
        res.send("you are not authorized to access this page");
    }
});

app.get('/search/:query', (req, res) => {
    res.send('GET request to the homepage')
});

app.get('/search/category/:query', (req, res) => {
    res.send('GET request to the homepage')
});

app.listen(port, function () {
    console.log('server is running');
})