const songModel = require('../models/songModel')
const mongoose = require('../../services/services.js')
const moment = require('moment')
const format = require('moment-duration-format')


const all = async (req, res) => {
    const songs = await songModel.collection.find().toArray();
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
    
    if (playlist.length !== 0) {
        res.send({
            status : 'success',
            index : index,
            remaining_minutes : remainMinutes.format('hh:mm:ss'),
            total_minutes : totalMinutes.format('hh:mm:ss'),
            playlist : playlist,
        })
    }else{
        res.send({data : 'playlist is empty'})
    }
    } catch (error) {
        res.send({status : 'error', code : 500 , error : error})
    }
}

module.exports.songController = {all,songlist}