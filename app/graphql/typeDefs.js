const {gql} = require('apollo-server-express')

const typeDefs = gql`
    scalar JSON
    scalar Date
    type default{
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

    type book  {
        image : String
        title : String
        author : String
        price : String
        original_url : String
        url : String
        slug : String
        stock : Int
        dis : Float
        tax : Float
        result : JSON
        createdAt : Date
        updatedAt : Date
    }


    #queries 
    type Query {
        getAllUsers: [user]
        getBookbyId(id : ID) : book
        getBooks : [book]
        getAllBooks_ : [book]
    }
    
    type Mutation {
        createUser(data : userInput) : user!
        loginUser(email : String, password : String) : default
    }
`

module.exports  = {typeDefs}