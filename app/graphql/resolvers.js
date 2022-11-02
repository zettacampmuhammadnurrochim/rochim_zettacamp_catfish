const jwt = require('jsonwebtoken')
const fs = require('fs');
const path = require('path')
const userModel = require('../models/userModel.js')
const bookModel = require('../models/bookModel')
const mongoose = require('../../services/services.js')
const {GraphQLScalarType} = require('graphql')
const bcrypt = require("bcrypt");
let public = fs.readFileSync(path.join(__dirname, '../../public.key'))

const { GraphQLJSON  } = require('graphql-type-json')
let formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
});

function calculateDiscount_Tax(books) {
    let result = [];
    books.forEach(h => {
        let harga = h.price;
        let rawHarga = harga.replaceAll(/[^0-9.-]+/g, "");

        let hargaInt = parseFloat(rawHarga.replaceAll('.', '')).toFixed(2);

        let discount = (hargaInt * h.dis) / 100;
        let rawAfterDisc = hargaInt - discount;
        let afterDisc = formatter.format(rawAfterDisc);

        // //////////////////////////////////////

        let taxing = (rawAfterDisc * h.tax) / 100;
        let afterTax = formatter.format(rawAfterDisc + taxing);

        let hasil = {
            ...h, //using spread operator
            total_disc: formatter.format(discount),
            price_AfterDisc: `${afterDisc}`,
            total_tax: formatter.format(taxing),
            price_afterTax: `${afterTax}`
        };

        result.push(hasil);
    });

    return result;
}
function comparePassword(plaintextPassword,hash) {
    const result = bcrypt.compare(plaintextPassword, hash);
    return result;
}
const resolvers = {
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
    Query : {
        async getAllUsers(){
            const result = await userModel.collection.find().toArray()
            return result
        },
        async getBookbyId(parent, arggs){
            let id = arggs.id
            dataBuku = await bookModel.collection.findOne({_id : mongoose.Types.ObjectId(id)})
            return dataBuku
        },
        async getBooks(){
            dataBuku = await bookModel.collection.find().toArray()
            return dataBuku
        },
        async getAllBooks_(){
            dataBuku = await this.getBooks()
            dataBuku = calculateDiscount_Tax(dataBuku)
            if (typeof res !== 'undefined') {
                res.send({
                    data: dataBuku
                })
            }
            return dataBuku
        }
    },
    
    Mutation : {
        async createUser(parent, arggs) {
            let token = jwt.sign({
                owner: 'rochim'
            }, public,{expiresIn: '1h'})

            let inputUser = {
                name : arggs.data.name,
                email: arggs.data.email,
                password : await bcrypt.hash(arggs.data.password, 10),
                date : arggs.data.date,
                address  : arggs.data.address,
                token : token 
            }
            console.log(arggs.data.password);
            const result = await userModel.collection.insertOne(inputUser);
            inputUser.result = result
            return inputUser       
            },
        async loginUser(parent, arggs){
            const email = arggs.email
            const password = arggs.password
            const exist = await userModel.exists({email : email})
            let Object_id = mongoose.Types.ObjectId(exist._id)
            const {password : hash} = await userModel.collection.findOne({_id: Object_id}, 'password')

            if (exist !== null && password !== null) {
                const result = await comparePassword(password,hash)
                if (result) {
                    return result    
                }
            }
        }
    }
}

module.exports = {resolvers}