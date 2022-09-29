const {MongoClient, ObjectId} = require('mongodb');
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
const dbName = 'zettacamp';

client.connect((error, client) =>{
    if (error) {
        return console.log('koneksi gagal');
    }
        return console.log('koneksi berhasil');
})

const db = client.db(dbName);