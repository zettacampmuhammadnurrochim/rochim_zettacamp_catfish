const {gql} = require('apollo-server-express')

const booksTypeDefs = gql`
    scalar JSON
    scalar Date
    
    enum mode{
        push
        pull
        update
    }

    enum statusRecipe{
        unpublish
        publish
        deleted
    }

    input paginator {
        limit : Int
        page : Int
    }

    input match {
        name : String
        status : statusRecipe
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
    
    type detailCategories{
        name : String
        description : String    
    }

    type recipe{
        _id : ID
        recipe_name : String
        ingredients : [recipe_ingridient]
        available : Int
        highlight : Boolean
        price : Int
        description : String
        image : String
        status : statusRecipe
        categories : detailCategories
        deletedAt : Date
        createdAt : Date
        updatedAt : Date
    }

    input recipeInput{
        recipe_name : String
        price : Int
        highlight : Boolean
        ingredients : [recipe_ingridientInput]
        description : String
        image : String
        status : statusRecipe
    }

    type recipesGetAll {
        data : [recipe]
        paginator : paginatorOutput
    }

    #queries 
    type Query {
        getAllRecipes(paginator : paginator, match : match) : recipesGetAll
        getOneRecipe(id : ID) : recipe
    }
    
    #mutation
    type Mutation {
        createRecipe(data : recipeInput) : recipe
        updateStatusRecipe(id : ID, status : statusRecipe) : JSON,
        updateRecipeMain(id : ID, data : recipeInput) : JSON
        updateRecipe(id : ID, data : recipeInput) : JSON
        updateHighlightRecipe(id : ID, data : recipeInput) : JSON
        deleteRecipe(id : ID) : JSON
    }
`
module.exports = booksTypeDefs