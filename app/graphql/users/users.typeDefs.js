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
    }
    
    type Mutation {
        createUser(data : userInput) : resultUser
        loginUser(email : String, password : String) : resultUser
    }
`
module.exports = usersTypeDefs