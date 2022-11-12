const {gql} = require('apollo-server-express')

const booksTypeDefs = gql`
    scalar JSON
    scalar Date
    
    enum status{
        active
        deleted
    }

    enum userRole{
        admin
        user
    }

    input paginator {
        limit : Int
        page : Int
    }

    input match {
        email : String
        first_name : String
        last_name : String
    }

    type user{
        _id : ID
        first_name: String
        last_name: String
        email: String
        entity : userRole
        #password : String
        status: status
        remember_me : String
        deletedAt : Date
        createdAt : Date
        updatedAt : Date
    }

    input userInput{
        first_name: String
        last_name: String
        email: String
        entity : userRole
        password : String
        remember_me : Boolean
    }

    #queries 
    type Query {
        GetAllUsers(paginator : paginator, match : match) : [user]
        GetOneUser(id : ID) : user
    }
    
    #mutation
    type Mutation {
        loginUser(email : String, password : String) : JSON
        createUser(data : userInput) : user
        updateUser(id: ID, data : userInput) : JSON
        deleteUser(id: ID) : JSON
    }
`
module.exports = booksTypeDefs