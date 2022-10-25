const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
let private = fs.readFileSync(path.join(__dirname, '../../private.key'))

exports.bookMiddleware = (req, res, next) => {
    console.log(req.session.loggedIn);
    let token = req.headers.authorization;
    if (typeof token !== 'undefined') {
        token = token.replace('Bearer ', '');
        let result = jwt.decode(token, private);
        result!==null ? next() : res.send('your not authorized')
    }else{
        res.status(500).send('token is null')
    }
}