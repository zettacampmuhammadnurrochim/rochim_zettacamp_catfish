const {gql} = require('apollo-server-express')

const booksTypeDefs = gql`

    type ingredients{
        _id : ID
        name : String
        stock : Int
        status : status
        deletedAt : Date
        createdAt : Date
        updatedAt : Date
        isUsed : Boolean
        menuUsing : String
    }

    type ingredientsGetAll {
        data : [ingredients]
        paginator : paginatorOutput
    }

    input paginator {
        limit : Int
        page : Int
    }

    input ingredientsInput{
        id : ID
        name : String
        status : status
        stock : Int
    }

    #queries 
    type Query {
        GetAllIngredients(paginator : paginator, match : ingredientsInput) : ingredientsGetAll
        GetOneIngredient(id : ID) : ingredients
    }
    
    #mutation
    type Mutation {
        createIngredient(data : ingredientsInput) : ingredients
        updateIngredient(data : ingredientsInput) : JSON
        deleteIngredient(id: ID) : JSON
    }
`
module.exports = booksTypeDefs