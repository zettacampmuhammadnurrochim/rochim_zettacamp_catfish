const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
let private = fs.readFileSync(path.join(__dirname, '../../private.key'))


const userModel = require('./users.model')
const messagingTokenModel = require('./messagingToken.model')
const mongoose = require('../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const bcrypt = require("bcrypt");
const {generateToken, remember_me, comparePassword} = require('./users.utility.js')
const nodemailer = require('nodemailer');
const {GraphQLJSON} = require('graphql-type-json')
require('dotenv').config()

/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////

const GetAllUsers = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []
        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : []} }) - 1
            if (arggs.match.email) {
                const search = new RegExp(arggs.match.email,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'email' : search
                })
            }

            if (arggs.match.first_name) {
                const search = new RegExp(arggs.match.first_name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'first_name' : search
                })
            }

            if (arggs.match.last_name) {
                const search = new RegExp(arggs.match.last_name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'last_name' : search
                })
            }
        }
        
        if (arggs.paginator) {
            let total_items = 0
            if (arggs.match && aggregateQuery.length) {  
                total_items = await userModel.aggregate(aggregateQuery) 
                total_items = total_items.length
            }else{
                total_items = await userModel.count() 
            }
            const {limit, page} = arggs.paginator
            const skip = limit * page
            aggregateQuery.push({
                $skip : skip
            },
            {
                $limit : limit
            })

            let showing = `Showing ${skip+1} to ${Math.min(total_items , skip+limit)} from ${total_items} entries`
            let total_page = Math.ceil(total_items/limit)
            let position = `${page+1}/${total_page}`
           
            paginator = {
                total_items : total_items,
                showing : showing,
                total_page : total_page,
                position : position,
            }
        }
        
        let result = []
        arggs.match || arggs.paginator ? result = await userModel.aggregate(aggregateQuery) : result = await userModel.collection.find().toArray()
        return {data : result, paginator : paginator}
    } catch (error) {
        return new ctx.error(error)
    }
}

const GetOneUser = async function (parent, arggs, ctx) {
    try {
        const result = await userModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id)})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const createUser = async function (parent, arggs, ctx) {
    try {
        let remember_token = ""
        arggs.data.remember_me ? remember_token = remember_me(30) : remember_token = ""
        
        let inputUser = new userModel({
            first_name : arggs.data.first_name,
            last_name : arggs.data.last_name,
            email : arggs.data.email,
            credit : 200000,
            type: arggs.data.type ? mongoose.Types.ObjectId(arggs.data.type) : mongoose.Types.ObjectId("6371dac209cbcd48c33d4936"),
            password : await bcrypt.hash(arggs.data.password, 10),
            remember_me : remember_token,
            status : "active"
        })
        
        let validator = await inputUser.validate()
        let result = {}
        !validator ? result = await inputUser.save() : result = {}
        
        delete result.password
        delete result.remember_me

        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const loginUser = async function (parent, {email, password}, ctx, info) {
    try {
        const exist = await userModel.findOne({email: email, status : 'active'})
        if (!exist) return new ctx.error("your email or password didnt match with all data")
        
        let Object_id = mongoose.Types.ObjectId(exist._id)
        let findUser = await userModel.aggregate([
        {
            $match : {
                _id : mongoose.Types.ObjectId(Object_id),
            }
        },
        {    
            $lookup : {
                from: "userTypes",
                localField: "type",
                foreignField: "_id",
                as: "userType"
            }
        },
        {
            $unwind: '$userType'
        }
           
        ])
        const hashed = findUser[0].password

        let logedin = true
        if (exist) {
            const result = await comparePassword(password, hashed)
            if (result) {
                let token = generateToken('1h')
                return {
                    token : token , 
                    ...findUser[0]
                }
            }
            else logedin = false
        }
        else logedin = false
        if (!logedin) return new ctx.error("your email or password didnt match with all data")
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateUser = async function (parent, {id,data}, ctx) {
    try {
        let {email, type, last_name, first_name, password} = data
        let result = await userModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
            $set : {
                email : email,
                type : type,
                last_name : last_name,
                first_name : first_name,
                password : password
            }
        })
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const deleteUser = async function (parent, {id}, ctx) {
    try {
        let result = await userModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
            $set : {
                deletedAt : new Date(),
                status : "deleted"
            }
        })
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const saveTokenFCM = async function (parent, {token}, ctx) {
    try {
        const ua = ctx.req.headers['user-agent']
        const checkIfExist = await messagingTokenModel.findOne({token : token})
        const result = {}
        if (!checkIfExist || checkIfExist == null) {
            result = await messagingTokenModel.create({
                "userAgent" : ua,
                token : token
            })
        }
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }

}

const getBalanceCredit = async function (parent, arggs, ctx) {
    let result = userModel.findOne({
        _id: mongoose.Types.ObjectId(ctx.req.headers.userid)
    }).select(['credit'])
    return result
}

const reqForgetPassword = async function (parent, {email}, ctx) {
    let address = ""
    let find = await userModel.collection.findOne({email : email})
    if (!find) {return new ctx.error('email not registered before')}
    else{
        let token = generateToken("30m")
        let update = await userModel.updateOne({email : email},{
            tokenFP : token
        })
        address = `http://${process.env.DOMAIN}/PasswordReset/${token}`
    }

    // let transporter = nodemailer.createTransport({
    //     host: 'mail.donormerahyogyakarta.com',
    //     port: 465,
    //     secure: true, 
    //     auth: {
    //         user: process.env.EMAIL,
    //         pass: process.env.PASS
    //     }
    // });

    let transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: "mamadanjar@gmail.com",
            pass: "fruvulchguatdzgi "
        }
    });

    let mailOptions = {
        from: '"mbak atik resto - forgot password" <' + process.env.EMAIL +'>', 
        to: email, 
        subject: "email confirmation to reset password",  
        html: "<p>click this link to reset passworrd</p><a href='"+address+"'>click</a>", 
    };  

    let info = await transporter.sendMail(mailOptions, (error,result) => {
        if (error) {
            return new ctx.error("failed to send email confirmation")
        }else{
            return {messageSent : result}
        }
    });

}

const cekUserToken = async function (parent, {token}, ctx) {
    token = token.replace('Bearer ', '').replace(' ', '')
    let decode = jwt.decode(token, private);
    if (decode) {
        result = await userModel.count({ tokenFP : token})
        return result
    }else{
        return new ctx.error("link expired")
    }
}

const updatePassword = async function (parent, {token,pass}, ctx) {
    result = await userModel.updateOne({ tokenFP : token},{
        password: await bcrypt.hash(pass, 10),
    })
    return result
}

const usersResolvers = {
    JSON: GraphQLJSON,
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return parseInt(ast.value, 10); // ast value is always in string format
            }
            return null;
        },
    }),
    Query: {
        GetAllUsers,
        GetOneUser,
        getBalanceCredit,
        cekUserToken
    },
    
    Mutation: {
        loginUser,
        createUser,
        updateUser,
        deleteUser,
        saveTokenFCM,
        reqForgetPassword,
        updatePassword
    }
}

module.exports = usersResolvers