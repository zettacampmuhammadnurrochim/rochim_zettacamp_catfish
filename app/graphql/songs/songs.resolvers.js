const songModel = require('../../models/songModel')
const songListModel = require('../../models/songListModel')
const mongoose = require('../../../services/services')
const moment = require('moment')
// const format = require('moment-duration-format')
const {
    parse
} = require('dotenv')
const {
    GraphQLScalarType,
    Kind
} = require('graphql')
const {
    GraphQLJSON
} = require('graphql-type-json');

/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

const getSongsLoader = async function (parent, arggs, ctx) {
    // console.log(parent._id); //default name from field 
    if (parent) {
        const result = await ctx.songsLoaders.load(parent)
        return result;
    }
}
/////////////////////////////////////////////////////query function////////////////////////////////////////////////////

const getAll_songs = async function (parent, arggs, ctx) {
    try {
        const result = await songModel.collection.find().toArray();
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const get_song = async function (parent, arggs, ctx) {
    try {
        const result = await songModel.collection.findOne({
            _id: mongoose.Types.ObjectId(arggs.id)
        })
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const get_songAggregate = async function (parent, arggs, ctx) {
    try {
        let aggregate = []
        if (typeof arggs.data.match != 'undefined') {
            if (arggs.data.match.length != 0) {
                let pushIndex = aggregate.push({
                    $match: {
                        $and: []
                    }
                }) - 1

                for (const value of arggs.data.match) {
                    aggregate[pushIndex].$match.$and.push(value)
                }
            } else {
                return new ctx.error("match must an array")
            }
        }

        if (typeof arggs.data.paginate != 'undefined') {
            let {
                page,
                limit
            } = arggs.data.paginate
            aggregate.push({
                $skip: limit * page
            }, {
                $limit: limit
            })
        }

        if (typeof arggs.data.sort != 'undefined') {
            let valdur = 0
            let durationSort = false
            for (const [index, value] of arggs.data.sort.entries()) {
                if (Object.keys(value)[index] == 'duration') {
                    aggregate.push({
                        $addFields: {
                            durationInt: {
                                $function: {
                                    body: function (duration) {
                                        let [hours, minutes, seconds] = duration.split(':')
                                        hours = parseInt(hours) / 3600
                                        minutes = parseInt(minutes) / 60
                                        seconds = parseInt(seconds)
                                        return hours + minutes + seconds
                                    },
                                    args: ["$duration"],
                                    lang: "js"
                                }
                            }
                        }
                    })
                    valdur = value
                    durationSort = true
                }

            }
            let pushIndex = aggregate.push({
                $sort: {}
            }) - 1
            if (durationSort) {
                aggregate[pushIndex].$sort.durationInt = valdur.duration
            }
        }

        let result = await songModel.aggregate(aggregate)
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const get_songPaginate = async function (parent, {limit,page}, ctx) {
    try {
        let aggregate = []
        aggregate.push({
            $skip: limit * page
        }, {
            $limit: limit
        })

        let result = await songModel.aggregate(aggregate)
        
        let total_songs = await songModel.count()
        let total_page = Math.ceil(total_songs/limit)
        let potition = `${page+1}/${Math.ceil(total_songs/limit)}`

        result = result.map((song) => {
            return {
                ...song,
                total_genre : song.genre.length
            }
        })
        result = {total_songs:total_songs,total_page:total_page,potition:potition, result : result}
        console.log(result);
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}


const getSonglist = async function (parent, arggs, ctx) {
    try {
        let result = await songListModel.collection.find().toArray()
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const addPlaylist = async function (parent, arggs, ctx, info) {
    try {
        const songData = await all()
        let playlist = []
        let index = []

        let totalMinutes = moment.duration()
        let remainMinutes = moment.duration()
        remainMinutes.add('01:00:00')
        songData.forEach((e, i) => {
            let currentDuration = moment.duration(e.duration);
            if (currentDuration < remainMinutes) {
                remainMinutes.subtract(currentDuration)
                totalMinutes.add(currentDuration)
                playlist.push(e)
                index.push(i)
            }
        });
        let total_minutes = `${totalMinutes.hours()}:${totalMinutes.minutes()}:${totalMinutes.seconds()}`
        playlist

        for (const items of playlist) {
            idsongs.push(items._id)
        }

        let insert = new songListModel({
            name: arggs.data.name,
            songs: idsongs,
            total_duration: total_minutes //format (hour:minutes:seconds)
        })
        let result = await insert.save()
        result.status = "success"
        return result

    } catch (error) {
        return new ctx.error(error)
    }
}

const addPlaylist_manual = async function (parent, arggs, ctx, info) {
    try {
        if (typeof arggs.data.songs != 'undefined') {
            let total_duration = moment.duration()

            for (const items of arggs.data.songs) {
                let song = await songModel.collection.findOne({
                    _id: mongoose.Types.ObjectId(items)
                })
                total_duration.add(song.duration)
            }

            let songs = arggs.data.songs
            total_duration = `${total_duration.hours()}:${total_duration.minutes()}:${total_duration.seconds()}`
            let insert = new songListModel({
                name: arggs.data.name,
                songs: songs,
                total_duration: total_duration
            })

            let result = await insert.save()
            result.status = "success"
            return result
        } else {
            return new ctx.error("songs not defined or not defined as array")
        }

    } catch (error) {
        return new ctx.error(error)
    }
}

const remSongList = async function (parent, arggs, ctx, info) {
    try {
        if (typeof arggs.data.songs != 'undefined') {
            let total_duration = moment.duration()
            for (const items of arggs.data.songs) {
                let song = await songModel.collection.findOne({
                    _id: mongoose.Types.ObjectId(items)
                })
                total_duration.add(song.duration)
            }

            let songs = arggs.data.songs.map((e) => mongoose.Types.ObjectId(e))

            let duration_saved = await songListModel.findOne({
                _id: mongoose.Types.ObjectId(arggs.data.id)
            }).select({
                "total_duration": 1
            })

            total_duration = `${total_duration.hours()}:${total_duration.minutes()}:${total_duration.seconds()}`

            if (duration_saved != null) {
                let duration = moment.duration(duration_saved.total_duration).subtract(total_duration)
                duration = `${duration.hours()}:${duration.minutes()}:${duration.seconds()}`
                let set = {
                    "total_duration": duration
                }

                if (typeof arggs.data.name != 'undefined' && arggs.data.name != null) {
                    set.name = arggs.data.name
                }

                // songs.forEach((element)=>{
                //     let isMatch =  
                // });

                // if (condition) { //if in the songlist has match value to remove
                //     // buat nya lama ga usah lah yaaa
                // }

                let result = await songListModel.collection.updateOne({
                    _id: mongoose.Types.ObjectId(arggs.data.id),
                    deleted_at: {
                        $exists: false
                    } //just update on document active
                }, {
                    $pull: {
                        songs: {
                            $in: songs
                        }
                    },
                    $set: set
                });

                return {
                    status: "success",
                    result: result
                }
            } else {
                return new ctx.error("playlist not found")
            }
        } else {
            return new ctx.error("songs not define or not defined as array")
        }
    } catch (error) {
        return new ctx.error(error)
    }
}

const updSongList = async function (parent, arggs, ctx, info) {
    try {
        if (typeof arggs.data.songs != 'undefined') {
            let total_duration = moment.duration()
            for (const items of arggs.data.songs) {
                let song = await songModel.collection.findOne({
                    _id: mongoose.Types.ObjectId(items)
                })
                total_duration.add(song.duration)
            }

            let songs = arggs.data.songs.map((e) => mongoose.Types.ObjectId(e))
            let duration_saved = await songListModel.findOne({
                _id: mongoose.Types.ObjectId(arggs.data.id)
            }).select({
                "total_duration": 1
            })

            total_duration = `${total_duration.hours()}:${total_duration.minutes()}:${total_duration.seconds()}`
            if (duration_saved != null) {
                let duration = moment.duration(duration_saved.total_duration).add(total_duration)
                duration = `${duration.hours()}:${duration.minutes()}:${duration.seconds()}`
                let set = {
                    "total_duration": duration
                }

                if (typeof arggs.data.name != 'undefined' && arggs.data.name != null) {
                    set.name = arggs.data.name
                }

                let result = await songListModel.collection.updateOne({
                    _id: mongoose.Types.ObjectId(arggs.data.id),
                    deleted_at: {
                        $exists: false
                    } //just update on document active
                }, {
                    $push: {
                        songs: {
                            $each: songs
                        }

                    },
                    $set: set
                });
                return {
                    status: "success",
                    result: result
                }
            } else {
                return new ctx.error("playlist not found")
            }
        } else {
            return new ctx.error("songs not define or not defined as array")
        }
    } catch (error) {
        return new ctx.error(error)
    }
}

const dellSongList = async function (parent, arggs, ctx, info) {
    try {
        let result = await songListModel.collection.updateOne({
            _id: mongoose.Types.ObjectId(arggs.id),
            deleted_at: {
                $exists: false
            } //just update on document active
        }, {
            $set: {
                deleted_at: new Date()
            }
        });
        return {
            status: "success",
            result: result
        }
    } catch (error) {
        return new ctx.error(error)
    }
}

const forceDellSongList = async function (parent, arggs, ctx, info) {
    try {
        let result = await songListModel.deleteOne({
            _id: mongoose.Types.ObjectId(arggs.id)
        });
        return {
            status: "success",
            result: result
        }
    } catch (error) {
        return new ctx.error(error)
    }
}


const songsResolver = {
    JSON: GraphQLJSON,
    Date: new GraphQLScalarType({
        name: 'Date',
        description: 'Date custom scalar type',
        parseValue(value) {
            return new Date(value); // value from the client
        },
        serialize(value) {
            return value.getTime(); // value sent to the client
        },
        parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
                return parseInt(ast.value, 10); // ast value is always in string format
            }
            return null;
        },
    }),

    Query: {
        getAll_songs,
        get_song,
        get_songAggregate,
        getSonglist,
        get_songPaginate
    },

    Mutation: {
        addPlaylist,
        addPlaylist_manual,
        remSongList,
        updSongList,
        dellSongList,
        forceDellSongList
    },

    song_detail: {
        song_id: getSongsLoader
    }
}

module.exports = songsResolver