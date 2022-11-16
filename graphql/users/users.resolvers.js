const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
const userModel = require('./users.model')
const mongoose = require('../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const bcrypt = require("bcrypt");
let public = fs.readFileSync(path.join(__dirname, '../../public.key'))

const {GraphQLJSON} = require('graphql-type-json')

function generateToken(expires) {
    let expiresIn = expires || '1h'
    let token = jwt.sign({foo: 'rochim'}, public, 
    {expiresIn: expiresIn})
    return token;
}

function remember_me(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function comparePassword(plaintextPassword, hash) {
    const result = bcrypt.compare(plaintextPassword, hash);
    return result;
}
/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////
// done
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
            const {limit, page} = arggs.paginator
            aggregateQuery.push({
                $skip : limit * page
            },
            {
                $limit : limit
            })
        }
        
        let result = []
        arggs.match || arggs.paginator ? result = await userModel.aggregate(aggregateQuery) : result = await userModel.collection.find().toArray()
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
const GetOneUser = async function (parent, arggs, ctx) {
    try {
        const result = await userModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id)})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////
// done
const createUser = async function (parent, arggs, ctx) {
    try {
        let remember_token = ""
        arggs.data.remember_me ? remember_token = remember_me(30) : remember_token = ""
        
        let inputUser = new userModel({
            first_name : arggs.data.first_name,
            last_name : arggs.data.last_name,
            email : arggs.data.email,
            type : mongoose.Types.ObjectId(arggs.data.type),
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
// done
const loginUser = async function (parent, {email, password}, ctx) {
    try {
        const exist = await userModel.exists({email: email, status : 'active'})
        if (!exist) return new ctx.error("your account isnt match with all data")
        let Object_id = mongoose.Types.ObjectId(exist._id)
        
        const findUser = await userModel.aggregate([
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
        if (!logedin) return {result : "login failed"}
    } catch (error) {
        return new ctx.error(error)
    }
}
// done
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
// done
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
        GetOneUser
    },
    
    Mutation: {
        loginUser,
        createUser,
        updateUser,
        deleteUser
    }
}

module.exports = usersResolvers