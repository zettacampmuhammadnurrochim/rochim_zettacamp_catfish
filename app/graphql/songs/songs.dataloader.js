const DataLoader = require('dataloader');
const songModel = require('../../models/songModel')
const { keyBy } = require('lodash')

const batchSongs = async function (songsId) {
    const song = await songModel.find({
        _id: {
            $in: songsId //array
        }
    });

    const userByIds = keyBy(song, '_id')
    result = songsId.map(ownerId => userByIds[ownerId]);
    return result
}

const songLoader = new DataLoader(batchSongs);
module.exports = songLoader