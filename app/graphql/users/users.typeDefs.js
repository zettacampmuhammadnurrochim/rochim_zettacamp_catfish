const {gql} = require('apollo-server-express')

const usersTypeDefs = gql`
    scalar JSON
    scalar Date

    type default{
        result : JSON    
    }

    type resultUser_detail{
        name : String!
        email : String!
        date : String
        address : String
        token : String
    }

    type resultUser{
        status : String
        input : resultUser_detail
        result : JSON
    }
    type resultUserLogin{
        status : String
        email : String
        token : String!
    }

    input userInput {
        name : String!
        email : String!
        password : String!
        date : String
        address : String
    }

    type user {
        _id : ID!
        name : String!
        email : String!
        password : String!
        date : String
        address : String
        token : String
        result : JSON
    }


    #queries 
    type Query {
        getAllUsers: [user]
        loginUser(email : String, password : String) : resultUserLogin
    }
    
    type Mutation {
        createUser(data : userInput) : resultUser
    }
`
module.exports = usersTypeDefs