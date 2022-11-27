const userModel = require('./users.model')
const messagingTokenModel = require('./messagingToken.model')
const mongoose = require('../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const bcrypt = require("bcrypt");

const {generateToken, remember_me, comparePassword} = require('./users.utility.js')
const {GraphQLJSON} = require('graphql-type-json')

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
            let total_items = 0
            if (arggs.match) { 
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
const loginUser = async function (parent, {email, password}, ctx, info) {
    try {
        const exist = await userModel.exists({email: email, status : 'active'})
        if (!exist) return new ctx.error("your email or password didnt match with all data")
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
        if (!logedin) return new ctx.error("your email or password didnt match with all data")
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

const saveTokenFCM = async function (parent, {token}, ctx) {
    try {
        const ua = ctx.req.headers['user-agent']
        const result = messagingTokenModel.insertOne({
            "userAgent" : ua,
            token : token
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