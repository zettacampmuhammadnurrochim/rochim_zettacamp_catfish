const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
const userModel = require('../models/userModel')
const mongoose = require('../../services/services.js')
const bcrypt = require("bcrypt");
const { isSet } = require('util/types');

let publickKey = fs.readFileSync(path.join(__dirname, '../../secret.key'))

const register = async (req, res) => {
    const {name,email,password,date,address} = req.body

    let token = jwt.sign({
        foo: 'bar'
    }, publickKey)

    const result = await userModel.collection.insertOne({
        name : name,
        email: email,
        password : await bcrypt.hash(password, 10),
        date : date,
        address  : address
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
            res.send({status : result, isExist : exist , hash : hash})
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
    }, publickKey)

    res.send(`token : ${token}`)
}

const logout = (req, res) => {
    res.send("deleted")
}

module.exports.userController = {register,getAllUsers,getUserById,UpdateOne,login,loginView,getToken,getRefreshToken,logout}