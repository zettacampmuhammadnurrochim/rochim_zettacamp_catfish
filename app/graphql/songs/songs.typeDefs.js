const {gql} = require('apollo-server-express')

const booksTypeDefs = gql`
    scalar JSON
    scalar Date

    type default{
        result : JSON    
    }

    type resultSong{
        status : String
        result : JSON
    }

    input songInput  {
        title : String
        album : String
        vol : Int
        tahun : Int
        singer : String
        genre : [String]
        duration : String
    }

    type song  {
        _id : ID
        title : String
        album : String
        vol : Int
        tahun : Int 
        singer : String
        genre : [String]
        duration : String
        createdAt : Date
        updatedAt : Date
    }

    input paginateInput{
        limit : Int
        page : Int
    }

    type bookshelf_detail{
        book_id : book
        added : [added_detail]
        quantity : Int
        total_disc : String
        price_AfterDisc : String
        total_tax : String
        price_afterTax : String
        total_price : String
    }

    type bookShelf {
        _id : ID
        admin : ID
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
        bookshelf : [bookShelf]
    }
    
    #mutation
    type Mutation {
        addPlaylist : []
        addPlaylist_manual
        remSongList
        updSongList
        dellSongList
        forceDellSongList

        createBook(data : bookInput) : resultBook
        updateBook(data : bookInput) : resultBook
        deleteBook(data : bookInput) : resultBook
    }
`
module.exports = booksTypeDefs