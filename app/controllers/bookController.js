const bookshelfModel = require('../models/bookshelfModel')
const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const mongoose = require('../../services/services.js')
const moment = require('moment')
let dataBuku = [];
let shopping_cart = [];
let periodOfcredit = [{
        jangka: 3,
        bunga: 0.10
    },
    {
        jangka: 6,
        bunga: 0.05
    },
    {
        jangka: 12,
        bunga: 0.025
    },
];

const d = new Date();

let formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
});

const getAllBooks_raw = async (req,res) => {
    dataBuku = await bookModel.collection.find().toArray()
    if (typeof res !== 'undefined') {
        res.send(dataBuku)
    }
    return dataBuku
}

function calculateDiscount_Tax(dis, tax, books) {
    let result = [];
    books.forEach(h => {
        let harga = h.price;
        let rawHarga = harga.replace(/[^0-9.-]+/g, "");

        let hargaInt = parseFloat(rawHarga.replace('.', '')).toFixed(2);

        let discount = (hargaInt * dis) / 100;
        let rawAfterDisc = hargaInt - discount;
        let afterDisc = formatter.format(rawAfterDisc);

        // //////////////////////////////////////

        let taxing = (rawAfterDisc * tax) / 100;
        let afterTax = formatter.format(rawAfterDisc + taxing);

        let hasil = {
            ...h, //using spread operator
            disc: `${dis} %`,
            total_disc: formatter.format(discount),
            price_AfterDisc: `${afterDisc}`,
            tax: `${tax} %`,
            total_tax: formatter.format(taxing),
            price_afterTax: `${afterTax}`
        };

        result.push(hasil);
    });

    return result;
}

const getAllBooks_ = async (req,res) => {
    dataBuku = await getAllBooks_raw()
    dataBuku = calculateDiscount_Tax(10,2.5,dataBuku)
    if (typeof res !== 'undefined') {
        res.send({data : dataBuku })
    }
    return dataBuku
}

function bookCheckOut(dataPembelian, period) {
    try {
        let found = []
        let map_SpCart = new Map();
        for (let index = 0; index < dataBuku.length; index++) {
                dataPembelian.forEach( (e, mainIndex) => {
                    let {amountPurchased,bookId} = e;
                    if (dataBuku[index]._id.toString() == bookId) {
                        if (dataBuku[index].stock > amountPurchased) {
                            found.push(mainIndex)
                            let shpChrtIndx = shopping_cart.push(dataBuku[index]) - 1;
                            shopping_cart[shpChrtIndx].location = index + 1;
                            calculateCredit(period,shpChrtIndx)
                        }
                    }
                    map_SpCart.set(mainIndex,{...e, location : index+1});
                });
        }
        found.forEach((val,index)=>{
                map_SpCart.delete(val)
        })
            
        map_SpCart.forEach((element,key) => {
            shopping_cart.push({
                    _id : element.bookId,
                    status : 'not found'
                })    
        });

            return shopping_cart
    } 
    catch (error) 
    {
        return {error : error}
    }
}

function calculateCredit(jangkawaktu, indexOfcart) {
    let CreditTerms = 0;
    let available = false;
    let bunga = 0;
    periodOfcredit.forEach((e, index) => {
        if (e.jangka == jangkawaktu) {
            CreditTerms = index;
            available = true;
            bunga = e.bunga;
        }
    })

    if (available) {

        shopping_cart[indexOfcart].paymentTerm = 'Credit Type ' + CreditTerms + 1 + ', ' + periodOfcredit[CreditTerms].jangka + ' months payment';
        const tglMulai = d.toLocaleDateString();

        d.setMonth(d.getMonth() + jangkawaktu);

        const tglSelesai = d.toLocaleDateString();
        shopping_cart[indexOfcart].startDate = tglMulai;
        shopping_cart[indexOfcart].endDate = tglSelesai;

        let starting_price = parseFloat(shopping_cart[indexOfcart].price_afterTax.replace('Rp', "").replace('.', '')).toFixed(2);
        let startmonthlyPayment = starting_price / jangkawaktu;

        let monthlyPayment = starting_price / jangkawaktu;
        let RAWpriceafterinterest = [];
        let priceafterinterest = [];

        for (let index = 0; index < jangkawaktu; index++) {
            priceafterinterest[index] = startmonthlyPayment + (monthlyPayment * bunga);
            startmonthlyPayment = priceafterinterest[index];

            RAWpriceafterinterest[index] = parseFloat(priceafterinterest[index]).toFixed(2);
            priceafterinterest[index] = formatter.format(priceafterinterest[index]);
        }

        get_month = []
        for (let monthIndex = 1; monthIndex <= jangkawaktu; monthIndex++) {
            
        }
        // console.log(get_month);
        let Credit_set = new Set()
        priceafterinterest.forEach(element => {  
            Credit_set.add(element)
        });
        

        shopping_cart[indexOfcart].creditPrice = [...Credit_set];
        shopping_cart[indexOfcart].subtotal = formatter.format(RAWpriceafterinterest.reduce((a, b) => parseFloat(a) + parseFloat(b)));
        return shopping_cart;

    } else {
        return shopping_cart= []
    }
}

const editBookStock = (req,res)=> {
    bookModel.collection.updateMany({}, {
        $set: {"stock" : 14}
    })
}

const getAllBooks_credit = async (req,res) => {
    const period = req.body.period
    length = req.body.data.length

    const bookPurcase  = req.body.data;



    await getAllBooks_()
    const result = await bookCheckOut(bookPurcase, 
        period);

    res.send({data : result})
}

const saveBook = async (req,res) => {
    var book1 = new bookModel({    
                image : req.body.image ,
                title : req.body.title ,
                author : req.body.author ,
                price:  req.body.price,
                original_url : req.body.original_url ,
                url : req.body.url,
                slug : req.body.slug,
                stock : req.body.stock
            });
 
    // save model to database
    try {
        let err = book1.validateSync() //sync validate
        if (!err) {
            book1.save(function (err, book) {
            if (err) {
                res.status(500).send({
                    status : 'error',
                    code : 500,
                    data : {
                        title : book.title,
                        message : err
                    }
                });
            }else{
                res.status(200).send({
                    status : 'success',
                    code : 200,
                    data : {
                        title : book.title,
                        message : err
                    }
                });
                }
            })
        }else{
            res.status(500).send({
            status : 'error',
            data : err
         })
        }
        
    } catch (error) {
        res.status(500).send({
            status : 'error',
            data : error
        })
    }
    
}

const saveMany = async (req,res) => {}

const updateBook = async (req,res) => {
    let Object_id = mongoose.Types.ObjectId(req.body.id)

    try {
        let updated = await bookModel.updateOne({_id : Object_id}, {$set: {    
                    image : req.body.image ,
                    title : req.body.title ,
                    author : req.body.author ,
                    price:  req.body.price,
                    original_url : req.body.original_url ,
                    url : req.body.url,
                    slug : req.body.slug,
                    stock : req.body.stock
                }
            },{ runValidators: true })
            
             res.status(200).send({
                    status : 'success',
                    code : 200,
                    data : {
                        message : updated
                    }
                });
    } catch (error){
        res.status(200).send({
                    status : 'error',
                    code : 500,
                    data : {
                        message : error
                    }
                });
    }
}

const deleteBook = async (req,res) => {
    let Object_id = mongoose.Types.ObjectId(req.body.id)

    try {
        let deleted = await bookModel.deleteOne({_id : Object_id})
            
             res.status(200).send({
                    status : 'success',
                    code : 200,
                    data : {
                        message : deleted
                    }
                });
    } catch (error){
        res.status(200).send({
                    status : 'error',
                    code : 500,
                    data : {
                        message : error
                    }
                });
    }
}

const bookshelf = async (req,res) => {
    result = await bookshelfModel.collection.find({}).toArray()
    if (result.length == 0) {
        res.status(200).send({status : 'success', data : "bookshelf is empty"})
    }else{
        res.status(200).send(result)
    }
}
// console.log(typeof moment().format());
const bookshelf_add = async (req,res) => {
// just make one
    try {
        const result = await bookshelfModel.collection.insertOne({
            shelf_name : req.body.shelf_name,
            books : [{
                book_id : mongoose.Types.ObjectId(req.body.id_book),
                added : {
                full_date : moment().format(),
                date : moment().format("D/M/YYYY"), 
                day : moment().format("dddd"), 
                month : moment().format("MMMM"),
                year : moment().format("YYYY"),
                hours : moment().format("HH"),
                minutes : moment().format("mm"), 
                seconds : moment().format("ss")
                },
                stock : req.body.stock
            }],
            theme : req.body.theme,
            type : 
            {
                price : req.body.price,
                level : req.body.level
            }
        });
        res.status(200).send({status : 'success', data : result})
    } catch (error) {
        res.status(500).send({status : 'error', data : error})
    }
}
//if type not array
const bookshelf_addMany = async (req,res) => {
// create many , tadi nyoba pakai push, pakai addtoset pada update, tapi ternyata dilangsung pada pertamakali insert bisa
    try {    
        if (typeof req.body.books !== "string") {
            let books = []
            for(const m of req.body.books)
            {
                    books.push({
                        book_id : mongoose.Types.ObjectId(m.book_id),
                        added : {
                        full_date : moment().format(),
                        date : moment().format("D/M/YYYY"), 
                        day : moment().format("dddd"), 
                        month : moment().format("MMMM"),
                        year : moment().format("YYYY"),
                        hours : moment().format("HH"),
                        minutes : moment().format("mm"), 
                        seconds : moment().format("ss")
                        },
                        stock : m.stock
                    })
            }

            let result = await bookshelfModel.collection.insertOne({
                shelf_name : req.body.shelf_name,
                books : books,
                theme : req.body.theme,
                type : 
                    {
                        price : req.body.price,
                        level : req.body.level
                    }
                })
            res.status(200).send({status : 'success', data : result})
        }else{
            res.status(500).send({status : "error", data : {message : "data must an array"}})
        }
        
    } catch (error) {
        res.status(500).send({status : 'error', data : error})
    }
}

const bookshelf_find_pull = async (req,res) => {
    let book_id =  mongoose.Types.ObjectId(req.body.id_book)
       let result = await bookshelfModel.collection.updateOne({_id :  mongoose.Types.ObjectId(req.body.id)},
       {
                $pull : { books : {$in : [{book_id : {$eq : book_id}}]}}
       })            
        res.status(200).send({status : 'success', data : result})   
}

const bookshelf_find_eq = async (req,res) => {
    try {
        let result = await bookshelfModel.find({
            _id : {$eq : mongoose.Types.ObjectId(req.body.id)}
        })
        res.status(200).send({status : 'success', data : result})
    } catch (error) {
        res.status(500).send({status : 'error', data : error})
    }
}

const bookshelf_find_match = async (req,res) => {
    // filter data inside array using elemMatch 
    // elemMatch just running on array of object
    // cara ngakali nya ditambahi $in
    let book_id =  mongoose.Types.ObjectId(req.body.id_book)
        let result = await bookshelfModel.find({
            "books" : { $elemMatch : {book_id : book_id}}
        })
        res.status(200).send({status : 'success', data : result})
}


const bookshelf_find_ne = async (req,res) => {
    let book_id =  mongoose.Types.ObjectId(req.body.id_book)
    let result = await bookshelfModel.find({
        "books" : { $elemMatch : {book_id : {$ne : book_id}}}
    })
    res.status(200).send({status : 'success', data : result})
}

const bookshelf_find_update_add = async (req,res) => {
        let result = await bookshelfModel.collection.updateOne({_id : mongoose.Types.ObjectId(req.body.id)},
                {$push : {
                    books : {
                        book_id : mongoose.Types.ObjectId(req.body.book_id),
                        added : {
                        full_date : moment().format(),
                        date : moment().format("D/M/YYYY"), 
                        day : moment().format("dddd"), 
                        month : moment().format("MMMM"),
                        year : moment().format("YYYY"),
                        hours : moment().format("HH"),
                        minutes : moment().format("mm"), 
                        seconds : moment().format("ss")
                        },
                        stock : req.body.stock
                    }
                    }
                })
        // await result.save()
        res.status(200).send({status : 'success', data : result})
   
}

const bookshelf_find_updateMany = async (req,res) => {   
    if (typeof req.body.id_book !== "string") {
        console.log(req.body.id_book.map(e => mongoose.Types.ObjectId(e)));
        let result = await bookshelfModel.updateOne({_id : mongoose.Types.ObjectId(req.body.id)},
        {
            $push : {"book_id" : req.body.id_book.map(e => mongoose.Types.ObjectId(e))}
        })
        res.status(200).send({status : 'success', data : result})
    }else{
        res.status(500).send({status : "error", data : {message : "data must an array"}})
    }
}

const bookshelf_find_updateFillter = async (req,res) => {   
        let result = await bookshelfModel.collection.updateMany({},
        { $set: { 
            "books.$[element]" : {
                    "stock" : 20,
                    "book_id" : "element.book_id"
                }
            } 
        },
        { arrayFilters: [
            {
                "element.book_id" : mongoose.Types.ObjectId(req.body.id_book)
            }
        ]}
        )
        res.status(200).send({status : 'success', data : result})
}

module.exports = {
    getAllBooks_raw,getAllBooks_,getAllBooks_credit,saveBook,updateBook,deleteBook,
    bookshelf,bookshelf_add,bookshelf_find_pull,bookshelf_addMany,bookshelf_find_eq,
    bookshelf_find_ne,bookshelf_find_ne,bookshelf_find_update_add,bookshelf_find_updateMany,
    bookshelf_find_match,bookshelf_find_updateFillter
}