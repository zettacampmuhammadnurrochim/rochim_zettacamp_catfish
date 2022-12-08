const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
let public = fs.readFileSync(path.join(__dirname, '../../public.key'))
const bcrypt = require("bcrypt");

const generateToken = (expires)=> {
    let expiresIn = expires || '1h'
    let token = jwt.sign({foo: 'rochim'}, public, 
    {expiresIn: expiresIn})
    // let token = jwt.sign({foo: 'rochim'}, public)
    return token;
}

const remember_me = (length)=> {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const comparePassword = (plaintextPassword, hash) => {
    const result = bcrypt.compareSync(plaintextPassword, hash);
    return result;
}

module.exports = {generateToken, remember_me, comparePassword}