const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
const userModel = require('../../models/userModel')
const mongoose = require('../../../services/services')
const {GraphQLScalarType,Kind} = require('graphql')
const bcrypt = require("bcrypt");
let public = fs.readFileSync(path.join(__dirname, '../../../public.key'))

const {
    GraphQLJSON
} = require('graphql-type-json')

function comparePassword(plaintextPassword, hash) {
    const result = bcrypt.compare(plaintextPassword, hash);
    return result;
}
////
const getAllUsers = async function (parent, arggs, ctx) {
    try {
        const result = await userModel.collection.find().toArray()
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}
////
const createUser = async function (parent, arggs, ctx) {
    try {
        let token = jwt.sign({
            owner: 'rochim'
        }, public, {
            expiresIn: '1h'
        })

        let inputUser = {
            name: arggs.data.name,
            email: arggs.data.email,
            password: await bcrypt.hash(arggs.data.password, 10),
            date: arggs.data.date,
            address: arggs.data.address,
            token: token
        }
        const result = await userModel.collection.insertOne(inputUser);
        return {
            status: "success",
            input: inputUser,
            result: result
        }
    } catch (error) {
        return new ctx.error(error)
    }
}
const loginUser = async function (parent, arggs, ctx) {
    try {
        const email = arggs.email
        const password = arggs.password
        const exist = await userModel.exists({
            email: email
        })
        let Object_id = mongoose.Types.ObjectId(exist._id)
        const {
            password: hash
        } = await userModel.collection.findOne({
            _id: Object_id
        }, 'password')

        if (exist !== null && password !== null) {
            const result = await comparePassword(password, hash)
            if (result) {
                return {
                    status: "success",
                    input: {
                        email
                    },
                    result: "your logged in"
                }
            }
        }
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
        getAllUsers
    },

    Mutation: {
        createUser,
        loginUser
    }
}

module.exports = usersResolvers