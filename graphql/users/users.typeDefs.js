const {gql} = require('apollo-server-express')

const userTypeDefs = gql`
    scalar JSON
    scalar Date
    
    enum user_type{
        Admin
        User
    }

    enum status{
        active
        deleted
    }

    input paginator {
        limit : Int
        page : Int
    }

    type paginatorOutput {
        total_items : Int
        showing : String
        total_page : Int
        position : String
    }

    input match {
        email : String
        first_name : String
        last_name : String
    }

    type userPermission {
        page : String
        view : Boolean
    }

    type userPermission {
        _id : ID
        role : user_type
        permission : [userPermission]
    }

    type user{
        _id : ID
        token : String
        tokenFP : String
        first_name: String
        last_name: String
        email: String
        credit: Int
        type : ID
        #password : String
        status: status
        userType : userPermission
        remember_me : String
        deletedAt : Date
        createdAt : Date
        updatedAt : Date
    }

    input userInput{
        first_name: String
        last_name: String
        email: String
        credit: Int
        type : ID
        password : String
        remember_me : Boolean
    }

    type usersGetAll {
        data : [user]
        paginator : paginatorOutput
    }

    #queries 
    type Query {
        GetAllUsers(paginator : paginator, match : match) : usersGetAll
        GetOneUser(id : ID) : user
        getBalanceCredit : JSON
        cekUserToken(token : String) : Boolean
    }
    
    #mutation
    type Mutation {
        loginUser(email : String, password : String) : user
        createUser(data : userInput) : user
        updateUser(id: ID, data : userInput) : JSON
        deleteUser(id: ID) : JSON
        saveTokenFCM(token : String) : JSON
        reqForgetPassword(email : String) : JSON
        updatePassword(token : String, pass : String) : JSON
    }
`
module.exports = userTypeDefs