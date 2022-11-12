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
        _id : ID
        title : String
        album : String
        vol : Int
        tahun : Int
        singer : String
        genre : [String]
        duration : String
    }

    input songSortInput  {
        title : Int
        album : Int
        vol : Int
        tahun : Int
        singer : Int
        genre : Int
        duration : Int
    }

    input songPaginateInput  {
        limit : Int
        page : Int
    }

    type song  {
        _id : ID
        title : String
        album : String
        vol : Int
        tahun : Int 
        singer : String
        total_genre : Int
        genre : [String]
        duration : String
        createdAt : Date
        updatedAt : Date
    }

    input paginateInput{
        page : Int
        limit : Int
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

    input inputSongAggregate { 
        match : [songInput]
        paginate : songPaginateInput
        sort : [songSortInput]
    }

    input playlistInput {
        id : ID
        name : String
        songs : [ID]
    }

    type song_detail {
        song_id : song
    } 
    
    type playlistDataloader {
        _id : ID
        name : String
        songs : [song_detail]
        total_duration : String
        createdAt : Date
        updatedAt : Date
    }

    type paginateSongs{
        total_songs : Int
        total_page : Int
        potition : String
        result : [song]
    }

    #queries 
    type Query {
        getAll_songs : [song]
        get_song(id : String) : song
        get_songAggregate(data : inputSongAggregate) : [song]
        getSonglist : [playlistDataloader]
        get_songPaginate(limit : Int , page : Int) : paginateSongs
    }
    
    #mutation
    type Mutation {
        addPlaylist : resultPlaylist
        addPlaylist_manual(data : playlistInput) : resultPlaylist
        remSongList(data : playlistInput) : resultSong
        updSongList(data : playlistInput) : resultSong
        dellSongList(id : String) : resultSong
        forceDellSongList(id : String) : resultSong
    }
`
module.exports = booksTypeDefs