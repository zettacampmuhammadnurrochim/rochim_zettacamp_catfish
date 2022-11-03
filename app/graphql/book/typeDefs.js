const {gql} = require('apollo-server-express')

const typeDefs = gql`
    scalar JSON
    scalar Date

    type default{
        result : JSON    
    }

    type resultBook_detail{
        image : String!
        title : String!
        author : String!
        price : String!
        original_url : String
        url : String
        slug : String
        stock : Int!
        dis : Float!
        tax : Float!
    }

    type resultBook{
        status : String
        input : resultBook_detail
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

    input bookInput  {
        id : String
        image : String!
        title : String!
        author : String!
        price : String!
        original_url : String
        url : String
        slug : String
        stock : Int!
        dis : Float!
        tax : Float!
    }

    type book  {
        image : String!
        title : String!
        author : String!
        price : String!
        original_url : String
        url : String
        slug : String
        stock : Int!
        dis : Float!
        tax : Float!
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
        createUser(data : userInput) : resultUser
        loginUser(email : String, password : String) : resultUser
        createBook(data : bookInput) : resultBook
        updateBook(data : bookInput) : resultBook
        deleteBook(data : bookInput) : resultBook
    }
`

module.exports  = {typeDefs}