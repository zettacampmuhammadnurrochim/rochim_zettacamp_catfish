const {gql} = require('apollo-server-express')

const bocategorieypeDefs = gql`

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
        GetAllcategories(paginator : paginator, match : ingredientsInput) : [category]
    }
    
    #mutation
    type Mutation {
        createcategories(data : categoryInput) : category
        deletecategories
    }
`
module.exports = categoriesTypeDefs