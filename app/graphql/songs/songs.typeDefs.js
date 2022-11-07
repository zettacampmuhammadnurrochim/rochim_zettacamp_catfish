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

    type resultPlaylist{
        status : String
        id : ID
        name : String
        songs : [ID]
        total_duration : String
        createdAt : Date
        updatedAt : Date
    }

    #queries 
    type Query {
        getAll_songs : [song]
        get_song(id : String) : song
        get_songAggregate : [song]
    }
    
    #mutation
    type Mutation {
        addPlaylist : resultPlaylist
        addPlaylist_manual : resultPlaylist
        remSongList : resultSong
        updSongList : resultSong
        dellSongList : resultSong
        forceDellSongList : resultSong
    }
`
module.exports = booksTypeDefs