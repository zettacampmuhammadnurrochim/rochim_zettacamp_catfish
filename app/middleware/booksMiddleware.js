const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
let publickKey = fs.readFileSync(path.join(__dirname, '../../public.key'))

exports.bookMiddleware = (req, res, next) => {
    let token = req.headers.authorization.replace('Bearer ', '');
    let result = jwt.decode(token, publickKey);
    
    result!==null ? next() : res.send('your not authorized')
}