const {gql} = require('apollo-server-express')

const booksTypeDefs = gql`
    scalar JSON
    scalar Date
    
    enum mode{
        push
        pull
        update
    }

    enum status{
        active
        deleted
    }

    input paginator {
        limit : Int
        page : Int
    }

    input match {
        name : String
    }

    type recipe_ingridient {
        ingredient_id : ingredients
        stock_used : Int
    }

    input recipe_ingridientInput {
        ingredient_id : ID
        stock_used : Int
        mode : mode
    }

    type recipe{
        _id : ID
        recipe_name : String
        ingredients : [recipe_ingridient]
        status : status
        deletedAt : Date
        createdAt : Date
        updatedAt : Date
    }

    input recipeInput{
        recipe_name : String
        ingredients : [recipe_ingridientInput]
    }

    #queries 
    type Query {
        getAllRecipes(paginator : paginator, match : match) : [recipe]
        getOneRecipe(id : ID) : recipe
    }
    
    #mutation
    type Mutation {
        createRecipe(data : recipeInput) : recipe
        updateRecipe(id : ID, data : recipeInput) : JSON
        deleteRecipe(id : ID) : JSON
    }
`
module.exports = booksTypeDefs