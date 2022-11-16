const {gql} = require('apollo-server-express')

const userTypeTypeDefs = gql`
    
    type permission {
        page : String
        view : Boolean
    }

    type userType {
        userType : String
        permission : permission
    }

    input permissionInput {
        page : String
        view : Boolean
    }

    input userTypeInput {
        userType : String
        permission : [permissionInput]
    }

    #queries 
    type Query {
        getAllUsersType : [userType]
    }
    
    #mutation
    type Mutation {
        createAllUsersType(data : userTypeInput) : userType
        deleteUserType(id : ID) : JSON
    }
`
module.exports = userTypeTypeDefs