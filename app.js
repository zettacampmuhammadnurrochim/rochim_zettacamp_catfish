// import fetch from "node-fetch";
let dataSong = require('./public/songs.json');
let moment = require('moment');


function artistGrouped(artisName) {
    return dataSong.filter(({
        singer
        // }) => singer == artisName);
    }) => singer.toLowerCase().includes(artisName.toLowerCase()));
}

function genreGrouped(genreName) {
    return dataSong.filter(({
        genre
    }) => {
        for (const m of genre) {
            if (m == genreName) {
                return genre
            }
        }
    });
}

// function showPlaylist

function lessOneOur() {
    let songsIndex = 0;
    let totalDuration = '';
    const result = moment.duration();
    dataSong.forEach((e) => {
        result.add(moment.duration(e.duration));
        if (result.hours() == 0) {
            songsIndex = songsIndex + 1;
            totalDuration = `${result.hours()}:${result.minutes()}:${result.seconds()}`;
        }
    });

    console.log(`songs playlist under 1 hour duration\n`);

    dataSong.filter((song, index) => {
        if (index < songsIndex) {
            console.log(song);
        }
    });

    return `all songs duration is ${result.hours()}:${result.minutes()}:${result.seconds()} \ntotal songs in playlist :  ${songsIndex} where total duration is : ${totalDuration}`;


}

console.log(
    artistGrouped("sulis")
);

console.log(
    genreGrouped("religi")
);

console.log(
    lessOneOur()
);