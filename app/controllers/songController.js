const songModel = require('../models/songModel')
const songListModel = require('../models/songListModel')
const mongoose = require('../../services/services.js')
const moment = require('moment')
const format = require('moment-duration-format')
const { parse } = require('dotenv')


const all = async (req, res) => {
    const songs =  await songModel.collection.find().toArray();
    if (typeof res !== 'undefined') {
        res.status(200).send({
        status: 'success',
        data: songs
        })
    }
    return songs
}

const songlist = async (req, res) => {
    try {
    const songData = await all()
    let playlist = []
    let index = []

    let totalMinutes = moment.duration()
    let remainMinutes = moment.duration()
    remainMinutes.add('01:00:00')
    songData.forEach((e,i) => {
        let currentDuration = moment.duration(e.duration);
        if (currentDuration < remainMinutes) {
            remainMinutes.subtract(currentDuration)
            totalMinutes.add(currentDuration)
            playlist.push(e)
            index.push(i)
        }
    });
    let total_minutes = `${totalMinutes.hours()}:${totalMinutes.minutes()}:${totalMinutes.seconds()}`
    if (playlist.length !== 0) {
        if (typeof req != 'undefined') {   
            res.status(200).send({
                status : 'success',
                index : index,
                remaining_minutes : remainMinutes.format('hh:mm:ss'),
                total_minutes : total_minutes,
                playlist : playlist,
            })
        }else{
            return {playlist : playlist,total_minutes : total_minutes }
        }
    }else{
        if (typeof req != 'undefined') {  
        res.status(200).send({data : 'playlist is empty'})
        } else {
        return {data : 'playlist is empty'}
        }
    }
    } catch (error) {
        if (typeof req != 'undefined') {  
            res.status(500).send({status : 'error', code : 500 , data : error})
        } else {
        return {data : error}
        }
    }
}

const addOneHourSongList = async (req,res) => {
    try {
        let {playlist, total_minutes} = await songlist()
        let idsongs = []
        for(const items of playlist){idsongs.push(items._id)}
        
        let insert = new songListModel({
            name : req.body.name,
            songs : idsongs,
            total_duration : total_minutes //format (hour:minutes:seconds)
        })
        insert = await insert.save()
        res.status(200).send({status : "success",data : insert})        
    } catch (error) {
        res.status(500).send({status : "error",data : error})        
    }
}

const addSongList = async (req,res) => {
    try {
        if (typeof req.body.songs != 'undefined') {
            let total_duration = moment.duration()
            for(const items of req.body.songs){
                let song  = await songModel.collection.findOne({_id : mongoose.Types.ObjectId(items)})
                total_duration.add(song.duration)
            }
            let songs = req.body.songs
            total_duration = `${total_duration.hours()}:${total_duration.minutes()}:${total_duration.seconds()}`
            let insert = new songListModel({
                name : req.body.name,
                songs : songs,
                total_duration : total_duration
            })
            insert = await insert.save()
            res.status(200).send({status : "success", data : insert})
        }else{
            res.status(500).send({status : "success", data : "songs must an array"})
        } 
    } catch (error) {
        res.status(500).send({status : "error",data : error})        
    }
}

const remSongList = async (req,res) => {
    try {
        if (typeof req.body.songs != 'undefined') {
            let total_duration = moment.duration()
            for(const items of req.body.songs){
                let song  = await songModel.collection.findOne({_id : mongoose.Types.ObjectId(items)})
                total_duration.add(song.duration)
            }
            let songs = req.body.songs.map((e) =>mongoose.Types.ObjectId(e))
            // let data = []
            // let tes = await songListModel.aggregate([
            //     {
            //         $match : {
            //             _id : mongoose.Types.ObjectId(req.body.id)
            //         }
            //     },
            //     {
            //         $set : { "songs": "$songs".map((e)=>{
            //             for(const idsongs of songs)
            //             {
            //                 if(e != mongoose.Types.ObjectId(idsongs)){
                                
            //                 }
            //             }
            //             return data
            //         })}
            //     },
            //     {
            //         $set : {
            //             duration : moment.duration("$duration").subtract(total_duration)
            //         }
            //     }
            // ])
            // console.log(tes);
            // return 0
            let duration_saved = await songListModel.findOne({_id : mongoose.Types.ObjectId(req.body.id)}).select({"total_duration" : 1}) 
            total_duration = `${total_duration.hours()}:${total_duration.minutes()}:${total_duration.seconds()}`
            if (duration_saved != null) {
                let duration = moment.duration(duration_saved.total_duration).subtract(total_duration)
                duration = `${duration.hours()}:${duration.minutes()}:${duration.seconds()}`
                let set = {"total_duration" : duration}
                if (typeof req.body.name != 'undefined' && req.body.name != null) {
                    set.name = req.body.name
                }
                // if (condition) { //if in the songlist has match value to remove
                //     // buat nya lama ga usah lah yaaa
                // }
                let update = await songListModel.collection.updateOne(
                {
                    _id : mongoose.Types.ObjectId(req.body.id),
                    deleted_at : { $exists: false } //just update on document active
                },
                {
                    $pull: { songs: { $in: songs }},
                    $set : set
                });
                res.status(200).send({status : "success", data : update})
            }
            else{
                res.status(500).send({status : "error", data : {message : 'playlist not found'}})

            }
        }else{
            res.status(500).send({status : "success", data : "songs must an array"})
        } 
    } catch (error) {
        res.status(500).send({status : "error",data : error})        
    }
}

const updSongList = async (req,res) => {
    try {
        if (typeof req.body.songs != 'undefined') {
            let total_duration = moment.duration()
            for(const items of req.body.songs){
                let song  = await songModel.collection.findOne({_id : mongoose.Types.ObjectId(items)})
                total_duration.add(song.duration)
            }
            let songs = req.body.songs.map((e) =>mongoose.Types.ObjectId(e))
            let duration_saved = await songListModel.findOne({_id : mongoose.Types.ObjectId(req.body.id)}).select({"total_duration" : 1}) 
            total_duration = `${total_duration.hours()}:${total_duration.minutes()}:${total_duration.seconds()}`
            if (duration_saved != null) {
                let duration = moment.duration(duration_saved.total_duration).add(total_duration)
                duration = `${duration.hours()}:${duration.minutes()}:${duration.seconds()}`
                let set = {"total_duration" : duration}
                if (typeof req.body.name != 'undefined' && req.body.name != null) {
                    set.name = req.body.name
                }
                // if (condition) { //if in the songlist has not match value to remove
                //     // buat nya lama ga usah lah yaaa
                // }
                let update = await songListModel.collection.updateOne(
                {
                    _id : mongoose.Types.ObjectId(req.body.id),
                    deleted_at : { $exists: false } //just update on document active
                },
                {
                    $push: { songs: { $in: songs }},
                    $set : set
                });
                res.status(200).send({status : "success", data : update})
            }
            else{
                res.status(500).send({status : "error", data : {message : 'playlist not found'}})

            }
        }else{
            res.status(500).send({status : "success", data : "songs must an array"})
        } 
    } catch (error) {
        res.status(500).send({status : "error",data : error})        
    }
}

const dellSongList = async (req,res) => {
    try {
        let update = await songListModel.collection.updateOne(
                {
                    _id : mongoose.Types.ObjectId(req.body.id),
                    deleted_at : { $exists: false } //just update on document active
                },
                {
                    $set : {
                        deleted_at : new Date()
                    }
                });
        res.status(200).send({status : "success", data : update})
    } catch (error) {
        res.status(500).send({status : "error",data : error})     
    }
}

const forceDellSongList = async (req,res) => {
    try {
        let deleted = await songListModel.deleteOne(
                {
                    _id : mongoose.Types.ObjectId(req.body.id)
                });
        res.status(200).send({status : "success", data : deleted})
    } catch (error) {
        res.status(500).send({status : "error",data : error})     
    }
}

const findDetailAll = async (req,res) => {
    try {
        // palkai $first biar output sesuai sama bentuk sebelumnya 
        let result = await songListModel.aggregate([
            {
                $unwind : "$songs"
            },
            {
                $lookup: {
                    from: "songs",
                    localField: "songs",
                    foreignField: "_id",
                    as: "detail_songs"
                }
            },
            {
                $group : {
                    _id : "$_id",
                    name : {$first :"$name"},
                    total_duration : {$first :"$total_duration"},
                    songs : {
                        $push: {
                            song_id: {$first : "$detail_songs._id"},
                            detail: {
                                title : {$first : "$detail_songs.title"},
                                album : {$first : "$detail_songs.album"},
                                vol : {$first : "$detail_songs.vol"},
                                tahun : {$first : "$detail_songs.tahun"},
                                singer : {$first : "$detail_songs.singer"},
                                genre : {$first : "$detail_songs.genre"},
                                duration : {$first : "$detail_songs.d}uration"}
                            }
                        }
                    },
                    created_at : {$first :"$createdAt"},
                    updated_at : {$first :"$updatedAt"}
                }
            }
        ])
        res.status(200).send({status : "success", data : result})
    } catch (error) {
        res.status(500).send({status : "error",data : error}) 
    }
}

const findDetail = async (req,res) => {
    try {
        if (typeof req.body.id != 'undefined') {
            let result = await songListModel.aggregate([
                {
                    $match : {
                        _id : mongoose.Types.ObjectId(req.body.id)
                    }
                },
                {
                    $unwind : "$songs"
                },
                {
                    $lookup: {
                        from: "songs",
                        localField: "songs",
                        foreignField: "_id",
                        as: "detail_songs"
                    }
                },
                {
                $group : {
                    _id : "$_id",
                    name : {$first :"$name"},
                    total_duration : {$first :"$total_duration"},
                    songs : {
                        $push: {
                            song_id: {$first : "$detail_songs._id"},
                            detail: {
                                title : {$first : "$detail_songs.title"},
                                album : {$first : "$detail_songs.album"},
                                vol : {$first : "$detail_songs.vol"},
                                tahun : {$first : "$detail_songs.tahun"},
                                singer : {$first : "$detail_songs.singer"},
                                genre : {$first : "$detail_songs.genre"},
                                duration : {$first : "$detail_songs.d}uration"}
                            }
                        }
                    },
                    created_at : {$first :"$createdAt"},
                    updated_at : {$first :"$updatedAt"}
                }
                }
            ])
        
            res.status(200).send({status : "success", data : result})
        }else{
            res.status(500).send({status : "error", data : "id undefined"})
        }
    } catch (error) {
        res.status(500).send({status : "error",data : error}) 
    }
}

const matchSong = async (req,res) => {
    // try {
        let aggregate = []
        if (typeof req.body.match != 'undefined') {
            if (req.body.match.length != 0) {
                let pushIndex = aggregate.push({
                    $match : {
                        $and : []
                    }
                }
                ) - 1
                
                for(const  value of req.body.match)
                {
                    aggregate[pushIndex].$match.$and.push(value)
                }
            }else{
                res.status(500).send({status : "error",data : "pagiante must an array"}) 
            }
        }
        
        if (typeof req.body.paginate != 'undefined') {
            if (req.body.paginate.length != 0) {
                let [page,limit] = req.body.paginate
                aggregate.push(
                    {$skip : limit * page},
                    {$limit : limit}
                )
            }else{
                res.status(500).send({status : "error",data : "pagiante must an array"}) 
            }
        }

        if (typeof req.body.sort != 'undefined') {
        
                let valdur = 0
                let durationSort = false
                for(const [index,value] of req.body.sort.entries())
                {
                    if (Object.keys(value)[index] == 'duration') {
                        aggregate.push({
                            $addFields : {
                                durationInt :{ 
                                    $function:{
                                        body: function(duration) {
                                            let [hours,minutes,seconds] = duration.split(':')
                                            hours = parseInt(hours) / 3600
                                            minutes = parseInt(minutes) / 60
                                            seconds = parseInt(seconds)
                                            return hours+minutes+seconds
                                        },
                                        args: [ "$duration"],
                                        lang: "js"
                                    }
                                } 
                            }
                        })
                        valdur = value
                        durationSort = true
                    }
                    
                }
                let pushIndex = aggregate.push({$sort : {}}) - 1
                if (durationSort) {
                    aggregate[pushIndex].$sort.durationInt = valdur.duration
                }
        }

    //    res.status(200).send({status : "success", data : aggregate})
    //     return 0
        
        
        let result = await songModel.aggregate(aggregate)
        res.status(200).send({status : "success", query: aggregate ,data : result})
    // } catch (error) {
    //     res.status(500).send({status : "error",data : error}) 
    // }
}
module.exports.songController = {all,songlist,addOneHourSongList,addSongList,remSongList,updSongList,dellSongList,forceDellSongList,findDetailAll,findDetail,matchSong}