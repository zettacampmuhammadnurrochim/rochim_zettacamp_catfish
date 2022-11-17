const {gql} = require('apollo-server-express')

const booksTypeDefs = gql`
    
    enum mode{
        push
        pull
        update
    }

    enum status_recipe {
        outOfStock
        available
    }

    input paginator {
        limit : Int
        page : Int
    }

    input matchTransaction {
        last_name_user : String
        recipe_name : String
        order_status : String
        order_date  : Date
    }

    type transaction_menus{
        recipe_id : recipe
        amount : Int
        note : String
        status_recipe : status_recipe
    }

    enum order_status{
        success
        failed
    }

    type transaction{
        _id : ID
        user_id : user_detail
        admin_id : admin_detail
        menu : [transaction_menus]
        order_status : order_status
        order_date : Date
        status : status
        user_name : String
        user_first_name : String
        user_last_name : String
        recipe_name : [String]
        deletedAt : Date
        createdAt : Date
        updatedAt : Date
    }

    input transactionInput{
        recipe_id : ID
        amount : Int
        note : String
    }

    input type {
        user_id : ID
        admin_id : ID
    }

    type user_detail {
        detail_user : user
    }

    type admin_detail {
        detail_admin : user
    }

    type transactionsGetAll {
        data : [transaction]
        paginator : paginatorOutput
    }

    #queries 
    type Query {
        getAllTransactions(paginator : paginator, match : matchTransaction) : transactionsGetAll
        getOneTransaction(id : ID) : recipe
    }
    
    #mutation
    type Mutation {
        createTransaction(type : type, data : [transactionInput]) : transaction
        updateTransaction(id : ID, data : transactionInput) : JSON
        deleteTransaction(id : ID) : JSON
    }
`
module.exports = booksTypeDefs