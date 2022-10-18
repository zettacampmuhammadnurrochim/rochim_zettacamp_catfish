const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
const userModel = require('../models/userModel')
const mongoose = require('../../services/services.js')
const bcrypt = require("bcrypt");
const { isSet } = require('util/types');

let privatekey = fs.readFileSync(path.join(__dirname, '../../private.key'))

const register = async (req, res) => {
    const {name,email,password,date,address} = req.body

    let token = jwt.sign({
        foo: 'bar'
    }, privatekey)

    const result = await userModel.collection.insertOne({
        name : name,
        email: email,
        password : await bcrypt.hash(password, 10),
        date : date,
        address  : address,
        token : token 
    });

    res.send({token , result})
}

const getAllUsers = async (req,res) => {
    const result = await userModel.collection.find()
    .toArray(function(err, results){
    res.send(results)
});
}

const getUserById = async (req,res) => {
    let Object_id = mongoose.Types.ObjectId(req.params.id)
    console.log(Object_id)
    const result = await userModel.collection.findOne({_id : Object_id },function(err, results){
    res.send(results)
})
}

const UpdateOne = async (req,res) => {
    let Object_id = mongoose.Types.ObjectId(req.params.id)
    const result = await userModel.collection.findOneAndUpdate({
            _id : Object_id
        },
        {
            $set : {
                    name : "fadila nurul mustaqimah",
                    email: "fadila@gmail.com",
                    password : "12345678",
                    date : "01-01-1999",
                    address  : "balong ngemplak"
                    }
        })
        res.send({result : result})
}

function comparePassword(plaintextPassword,hash) {
    const result = bcrypt.compare(plaintextPassword, hash);
    return result;
}

const loginView = (req, res) => {
    
}

const login = async (req, res) => {
    const {email, password} = req.body
    const exist = await userModel.exists({email : email})
    let Object_id = mongoose.Types.ObjectId(exist._id)
    const {password : hash} = await userModel.collection.findOne({_id: Object_id}, 'password')
    if (exist !== null && password !== null) {
        const result = await comparePassword(password,hash);
        if (result) {
            res.send({status : result, isExist : exist , hash : hash},{message : "welcome, you are logged in"})
        }
    }

}

const getToken = (req, res) => {
    res.send("updated")
}

const getRefreshToken = (req, res) => {
    let token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + (60 * 60),
        data: 'foobar'
    }, privatekey)

    res.send(`token : ${token}`)
}

const logout = (req, res) => {
    res.send("deleted")
}

// tugas day 7

const getFile = () => {
     return new Promise((resolve, reject) => {
                try {
                    privatekeys = fs.readFileSync(path.join(__dirname, '../../server.js')) 
                    if(privatekeys !== null) {
                        resolve({privatekeys : privatekeys.toString()})
                    } else {
                        reject({errors : 'PUBLIC KEY NOT SET'})
                    }
                } catch (error) {
                    
                    reject({errors : error})
                }          
            
})
}

    
const readFile = (req, res) => {
    getFile()
    .then( result => {
        console.log({status: 'ok', result : result});
        res.status(200).send({
            status : 'ok',
            code : 200,
            data : {
                key : 'RSA',
                content : result
            }
        })
    })
    .catch((err) => {
        res.status(500).send({
            status : 'server error',
            code : 500,
            data : {
                content : err
            }
        })
    }).finally(()=> {
        console.log('promise finihed and returning value');
    })
}

const readFileAwait = async(req, res) => {
    
    try {
        const result = await getFile();
        console.log({status: 'ok', result : result});
        res.status(200).send({
                status : 'ok',
                code : 200,
                data : {
                    key : 'RSA',
                    content : result
                }
            })
    } catch (error) {
        console.log({status: 'error', result : error});
    }

}

let events = require('events');
let eventEmitter = new events.EventEmitter();

const eventEm = (name) => {
      console.log(`my name is ${name}`);    
}

const editFile = () =>{
    var rs = fs.createReadStream(path.join(__dirname, '../../readme.txt'));
    // let myFile = fs.writeFileSync("path.join(__dirname, '../../readme.txt')")    
    let editFile = fs.createWriteStream(path.join(__dirname, '../../readme.txt'))    
    
    for (let index = 0; index < 1e3; index++) {
        editFile.write(`rochim is so handsome\n`)
    }

    rs.on('open', function () {
        console.log('The file is open');
    });

    rs.emit('open')
}
editFile()

eventEmitter.on('showName', eventEm);
eventEmitter.emit('showName', 'rochim');
// instead of
// eventEm('rochim')

module.exports.userController = {register,getAllUsers,getUserById,UpdateOne,login,loginView,getToken,getRefreshToken,logout,readFile,readFileAwait}