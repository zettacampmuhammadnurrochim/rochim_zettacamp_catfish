const {gql} = require('apollo-server-express')

const categoriesTypeDefs = gql`

    type category {
        name : String
        description : String
    }

    input categoryInput {
        name : String
        description : String
    }

    #queries 
    type Query {
        GetAllCategories(paginator : paginator, match : ingredientsInput) : [category]
    }
    
    #mutation
    type Mutation {
        createCategories(data : categoryInput) : category
        updateCategories(id : ID, data : categoryInput) : JSON
        deleteCategories(id : ID) : JSON
    }
`
module.exports = categoriesTypeDefs