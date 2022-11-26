const {gql} = require('apollo-server-express')

const cartTypeDefs = gql`
    #queries 
    type Query {
        getCart : transaction
    }
    
    #mutation
    type Mutation {
        addToCart(id : ID, amount : Int, note : String) : transaction
        reduceCart(id : ID) : transaction
        updateCartMain(id : ID ,data : transactionInput) : JSON
        clearCart(id : ID) :JSON
        order(id : ID) : transaction
        editCart(id : ID, amount : Int, note : String) : JSON
    }
`
module.exports = cartTypeDefs