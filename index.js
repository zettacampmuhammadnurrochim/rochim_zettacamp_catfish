const exp = require('express')
const app = exp()
const jwt = require('jsonwebtoken')
app.use(exp.json())

let dataBooks = require('./data.json')

const {mongoose, Schema} = require('mongoose')

const db = "library";
const port = 8000;

mongoose.connect(`mongodb://127.0.0.0:27017/${db}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=> {
    console.log('connected');
}).catch(e=>{
    console.log(e.message);
});


let BookSchema = new Schema ({
    image: String,
    title: String,
    author: String,
    price: String,
    original_url: String,
    url: String,
    slug : String
})

let collectionBooks = mongoose.model('buku', BookSchema);
const key = "rochim"

app.get('/show', async (req, res) => {
    const {authorization} = req.headers

    const decode = await jwt.decode(authorization.replace('Bearer ', ''), key)


    if (authorization !== null) {
        if (decode !== null) {
            
            // let resData = await collectionBooks.find({});
            // console.log(resData);
            res.json(dataBooks);
        
            // res.send({'data_decode' :  resData})
        }else{
            res.send('token is invalid')
        }
    }else{
        res.send('authorization is null')        
    }
})

app.post('/login', (req, res) => {
    let {email,password} = req.body;
    
    var token = jwt.sign({
        "email": email
    }, key)

    if (email == "muhammad.0206@students.amikom.ac.id" && password == "12345678") {
        res.send({
            "token": token
        });


    } else {
        res.send("you are not authorized to access this page");
    }
});

app.use('/', (req, res)=>{
    res.status(404).send({
        status : 404,
        description : "route not found"
    });
})

app.listen(port)