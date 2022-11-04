const {gql} = require('apollo-server-express')

const booksTypeDefs = gql`
    scalar JSON
    scalar Date

    type default{
        result : JSON    
    }

    type resultBook_detail{
        image : String!
        title : String!
        author : String!
        price : String!
        original_url : String
        url : String
        slug : String
        stock : Int
        dis : Float
        tax : Float
    }

    type resultBook{
        status : String
        input : resultBook_detail
        result : JSON
    }

    input bookInput  {
        id : String
        image : String
        title : String
        author : String
        price : String
        original_url : String
        url : String
        slug : String
        stock : Int
        dis : Float
        tax : Float
    }

    type book  {
        _id : ID
        image : String!
        title : String!
        author : String!
        price : String!
        original_url : String
        url : String
        slug : String
        stock : Int!
        dis : Float!
        tax : Float!
        createdAt : Date
        updatedAt : Date
    }

    input bookPurchase_detail{
        amountPurchased : Int
        bookId : String
    }

    input bookPurchaseInput {
        period : Int
        booksPurchase : [bookPurchase_detail]
    }

    type bookPurchase {
        _id : ID
        image : String
        title : String
        author : String
        price : String
        original_url : String
        url : String
        slug : String
        stock : Int
        dis : Float
        tax : Float
        total_disc : String
        price_AfterDisc : String
        total_tax : String
        price_afterTax : String
        location : Int
        paymentTerm : String
        startDate : String
        endDate : String
        creditPrice : [String]
        subtotal : String
    }

    input paginateInput{
        limit : Int
        page : Int
    }
    
    type added_detail {
        full_date : String
        date : String
        day : String
        month : String
        year : String
        hours : String
        minutes : String
        seconds : String
    }

    type bookshelf_detail{
        book_id : ID
        added : [added_detail]
        quantity : Int
        total_disc : String
        price_AfterDisc : String
        total_tax : String
        price_afterTax : String
        total_price : String
        book_info : [book]
    }

    type bookShelf {
        _id : ID
        admin : String
        user : ID
        books : [bookshelf_detail]
        total : String
        paid : String
        change : String
        date : Date
        description : String
        paid_off : Boolean
    }

    #queries 
    type Query {
        getBookbyId(id : ID) : book
        getBooks : [book]
        getBooksPaginate(paginate : paginateInput) : [book]
        getAllBooks_ : [book]
        bookPurchase(data : bookPurchaseInput) : [bookPurchase]
        bookshelf : bookShelf
    }
    
    #mutation
    type Mutation {
        createBook(data : bookInput) : resultBook
        updateBook(data : bookInput) : resultBook
        deleteBook(data : bookInput) : resultBook
    }
`
module.exports = booksTypeDefs