const bookshelfModel = require('../models/bookshelfModel')
const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const companyModel = require('../models/companyModel')
const mongoose = require('../../services/services.js')
const moment = require('moment')
const Decimal = require('decimal.js');

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

const getAllBooks_raw = async (req, res) => {
    dataBuku = await bookModel.collection.find().toArray()
    if (typeof res !== 'undefined') {
        res.send(dataBuku)
    }
    return dataBuku
}

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

const getAllBooks_ = async (req, res) => {
    dataBuku = await getAllBooks_raw()
    dataBuku = calculateDiscount_Tax(dataBuku)
    if (typeof res !== 'undefined') {
        res.send({
            data: dataBuku
        })
    }
    return dataBuku
}

function bookCheckOut(dataPembelian, period) {
    try {
        let found = []
        let map_SpCart = new Map();
        for (let index = 0; index < dataBuku.length; index++) {
            dataPembelian.forEach((e, mainIndex) => {
                let {
                    amountPurchased,
                    bookId
                } = e;
                if (dataBuku[index]._id.toString() == bookId) {
                    if (dataBuku[index].stock > amountPurchased) {
                        found.push(mainIndex)
                        let shpChrtIndx = shopping_cart.push(dataBuku[index]) - 1;
                        shopping_cart[shpChrtIndx].location = index + 1;
                        calculateCredit(period, shpChrtIndx)
                    }
                }
                map_SpCart.set(mainIndex, {
                    ...e,
                    location: index + 1
                });
            });
        }
        found.forEach((val, index) => {
            map_SpCart.delete(val)
        })

        map_SpCart.forEach((element, key) => {
            shopping_cart.push({
                _id: element.bookId,
                status: 'not found'
            })
        });

        return shopping_cart
    } catch (error) {
        return {
            error: error
        }
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

        let starting_price = parseFloat(shopping_cart[indexOfcart].price_afterTax.replaceAll('Rp', "").replaceAll('.', '')).toFixed(2);
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
        return shopping_cart = []
    }
}

const getAllBooks_credit = async (req, res) => {
    const bookPurcase = req.body.data;
    const period = req.body.period

    await getAllBooks_()
    const result = await bookCheckOut(bookPurcase,
        period);

    res.send({
        data: result
    })
}

const saveBook = async (req, res) => {
    var book1 = new bookModel({
        image: req.body.image,
        title: req.body.title,
        author: req.body.author,
        price: req.body.price,
        original_url: req.body.original_url,
        url: req.body.url,
        slug: req.body.slug,
        stock: req.body.stock
    });

    // save model to database
    try {
        let err = book1.validateSync() //sync validate
        if (!err) {
            book1.save(function (err, book) {
                if (err) {
                    res.status(500).send({
                        status: 'error',
                        code: 500,
                        data: {
                            title: book.title,
                            message: err
                        }
                    });
                } else {
                    res.status(200).send({
                        status: 'success',
                        code: 200,
                        data: {
                            title: book.title,
                            message: err
                        }
                    });
                }
            })
        } else {
            res.status(500).send({
                status: 'error',
                data: err
            })
        }

    } catch (error) {
        res.status(500).send({
            status: 'error',
            data: error
        })
    }

}

const saveMany = async (req, res) => {}

const updateBook = async (req, res) => {
    let Object_id = mongoose.Types.ObjectId(req.body.id)

    try {
        let updated = await bookModel.updateOne({
            _id: Object_id
        }, {
            $set: {
                image: req.body.image,
                title: req.body.title,
                author: req.body.author,
                price: req.body.price,
                original_url: req.body.original_url,
                url: req.body.url,
                slug: req.body.slug,
                stock: req.body.stock
            }
        }, {
            runValidators: true
        })

        res.status(200).send({
            status: 'success',
            code: 200,
            data: {
                message: updated
            }
        });
    } catch (error) {
        res.status(200).send({
            status: 'error',
            code: 500,
            data: {
                message: error
            }
        });
    }
}

const deleteBook = async (req, res) => {
    let Object_id = mongoose.Types.ObjectId(req.body.id)

    try {
        let deleted = await bookModel.deleteOne({
            _id: Object_id
        })

        res.status(200).send({
            status: 'success',
            code: 200,
            data: {
                message: deleted
            }
        });
    } catch (error) {
        res.status(200).send({
            status: 'error',
            code: 500,
            data: {
                message: error
            }
        });
    }
}

const bookshelf = async (req, res) => {
    result = await bookshelfModel.collection.find({}).toArray()
    if (result.length == 0) {
        res.status(200).send({
            status: 'success',
            data: "bookshelf is empty"
        })
    } else {
        res.status(200).send(result)
    }
}
// console.log(typeof moment().format());
const bookshelf_add = async (req, res) => {
    // just make one
    try {
        data = await bookModel.collection.find({
            _id: mongoose.Types.ObjectId(req.body.book_id)
        }).toArray()
        let find = calculateDiscount_Tax(data)
        let price = find[0].price_afterTax;
        let rawPrice = price.replaceAll("Rp", "");
        let priceInt = parseFloat(rawPrice.replaceAll('.', '').replaceAll(',', '.')).toFixed(2);
        total_price = formatter.format(req.body.quantity * priceInt)
        let paid_off = false 
            if ((req.body.paid - (req.body.quantity * priceInt)) >= 0) {
                paid_off = true
            }
        const result = await bookshelfModel.collection.insertOne({
            admin: mongoose.Types.ObjectId(req.body.admin),
            user: mongoose.Types.ObjectId(req.body.user),
            books: [{
                book_id: mongoose.Types.ObjectId(req.body.book_id),
                added: {
                    full_date: moment().format(),
                    date: moment().format("D/M/YYYY"),
                    day: moment().format("dddd"),
                    month: moment().format("MMMM"),
                    year: moment().format("YYYY"),
                    hours: moment().format("HH"),
                    minutes: moment().format("mm"),
                    seconds: moment().format("ss")
                },
                quantity: req.body.quantity,
                total_disc: find[0].total_disc,
                price_AfterDisc: find[0].price_AfterDisc,
                total_tax: find[0].total_tax,
                price_afterTax: find[0].price_afterTax,
                total_price: total_price
            }],
            total: formatter.format(req.body.quantity * priceInt),
            paid: formatter.format(req.body.paid),
            change: formatter.format(req.body.paid - (req.body.quantity * priceInt)),
            date: moment().format(),
            description: req.body.description,
            paid_off: paid_off,
        });
        res.status(200).send({
            status: 'success',
            data: result
        })
    } catch (error) {
        res.status(500).send({
            status: 'error',
            data: error
        })
    }
}
//if type not array
const bookshelf_addMany = async (req, res) => {
    // create many , tadi nyoba pakai push, pakai addtoset pada update, tapi ternyata dilangsung pada pertamakali insert bisa
    try {
        if (typeof req.body.books !== "string") {
            let books = []
            let total = 0
            for (const m of req.body.books) {
                data = await bookModel.collection.find({
                    _id: mongoose.Types.ObjectId(m.book_id)
                }).toArray()

                let find = calculateDiscount_Tax(data)
                let price = find[0].price_afterTax;
                let rawPrice = price.replaceAll("Rp", "");
                let priceInt = parseFloat(rawPrice.replaceAll('.', '').replaceAll(',', '.')).toFixed(2);
                total_price = formatter.format(m.quantity * priceInt)
                total = total + (m.quantity * priceInt)
                books.push({
                    book_id: mongoose.Types.ObjectId(m.book_id),
                    added: {
                        full_date: moment().format(),
                        date: moment().format("D/M/YYYY"),
                        day: moment().format("dddd"),
                        month: moment().format("MMMM"),
                        year: moment().format("YYYY"),
                        hours: moment().format("HH"),
                        minutes: moment().format("mm"),
                        seconds: moment().format("ss")
                    },
                    quantity: m.quantity,
                    total_disc: find[0].total_disc,
                    price_AfterDisc: find[0].price_AfterDisc,
                    total_tax: find[0].total_tax,
                    price_afterTax: find[0].price_afterTax,
                    total_price: total_price
                })

                // stock buku pada collection berkurang seharusnya 


            }

            let paid_off = false 
            if ((req.body.paid - total) >= 0) {
                paid_off = true
            }
            let result = await bookshelfModel.collection.insertOne({
                admin:  mongoose.Types.ObjectId(req.body.admin),
                user: mongoose.Types.ObjectId(req.body.user),
                books: books,
                total: formatter.format(total),
                paid: formatter.format(req.body.paid),
                change: formatter.format(req.body.paid - total),
                date: moment().format(),
                description: req.body.description,
                paid_off: paid_off,
            })
            res.status(200).send({
                status: 'success',
                data: result
            })
        } else {
            res.status(500).send({
                status: "error",
                data: {
                    message: "data must an array"
                }
            })
        }
    } catch (error) {
        res.status(500).send({
            status: 'error',
            data: error
        })
    }
}

const bookshelf_find_pull = async (req, res) => {
    let book_id = mongoose.Types.ObjectId(req.body.id_book)
    let result = await bookshelfModel.collection.update({
        _id: mongoose.Types.ObjectId(req.body.id)
    }, {
        $pull: {
            books: {
                book_id: book_id
            }
        }
    })
    res.status(200).send({
        status: 'success',
        data: result
    })
}

const bookshelf_find_eq = async (req, res) => {
    try {
        let result = await bookshelfModel.find({
            _id: {
                $eq: mongoose.Types.ObjectId(req.body.id)
            }
        })
        res.status(200).send({
            status: 'success',
            data: result
        })
    } catch (error) {
        res.status(500).send({
            status: 'error',
            data: error
        })
    }
}

const bookshelf_find_match = async (req, res) => {
    // filter data inside array using elemMatch 
    // elemMatch just running on array of object
    // cara ngakali nya ditambahi $in
    let book_id = mongoose.Types.ObjectId(req.body.id_book)
    let result = await bookshelfModel.find({
        "books": {
            $elemMatch: {
                book_id: book_id
            }
        }
    })
    res.status(200).send({
        status: 'success',
        data: result
    })
}

const bookshelf_find_ne = async (req, res) => {
    let book_id = mongoose.Types.ObjectId(req.body.id_book)
    let result = await bookshelfModel.find({
        "books": {
            $elemMatch: {
                book_id: {
                    $ne: book_id
                }
            }
        }
    })
    res.status(200).send({
        status: 'success',
        data: result
    })
}

const bookshelf_find_update_add = async (req, res) => {
    // pertanyaan, karena disini aku memerlukan value dari data yang sudah tersimpan maka aku find dulu baru update
    // so , peretanyaannya apakah ada cara lebih mudah untuk mengambil value yang sudah ada saat akan upadte
    let data = await bookModel.collection.find({_id: mongoose.Types.ObjectId(req.body.book_id)}).toArray()
    let result = await bookshelfModel.collection.findOne({_id: mongoose.Types.ObjectId(req.body.id)})
   
    let total = result.total.replaceAll("Rp", "").replaceAll('.', '').replaceAll(',', '.')
    total = parseFloat(total).toFixed(2)

    let paid = result.paid.replaceAll("Rp", "").replaceAll('.', '').replaceAll(',', '.')
    paid = parseFloat(paid).toFixed(2)

    let find = calculateDiscount_Tax(data)
    let price = find[0].price_afterTax;
    let rawPrice = price.replaceAll("Rp", "");
    let priceInt = parseFloat(rawPrice.replaceAll('.', '').replaceAll(',', '.')).toFixed(2);
    total_price = formatter.format(req.body.quantity * priceInt)
    let paid_off = false 
    if (Decimal.sub((Decimal.add(paid , req.body.paid)) , (Decimal.add(total , (req.body.quantity * priceInt)))) >= 0) {
        paid_off = true
    }

    let books = {
                "book_id": mongoose.Types.ObjectId(req.body.book_id),
                "added": {
                    "full_date": moment().format(),
                    "date": moment().format("D/M/YYYY"),
                    "day": moment().format("dddd"),
                    "month": moment().format("MMMM"),
                    "year": moment().format("YYYY"),
                    "hours": moment().format("HH"),
                    "minutes": moment().format("mm"),
                    "seconds": moment().format("ss")
                },
                "quantity": req.body.quantity,
                "total_disc": find[0].total_disc,
                "price_AfterDisc": find[0].price_AfterDisc,
                "total_tax": find[0].total_tax,
                "price_afterTax": find[0].price_afterTax,
                "total_price": total_price
            }
            
            result = await bookshelfModel.collection.updateOne({_id: mongoose.Types.ObjectId(req.body.id)},{
                $push : {
                    books : books
                },
                $set : {
                    total        : formatter.format(Decimal.add(total, (req.body.quantity * priceInt))),
                    paid         : formatter.format(Decimal.add(paid ,req.body.paid)),
                    change       : formatter.format(Decimal.sub((Decimal.add(paid , req.body.paid)) , (Decimal.add(total , (req.body.quantity * priceInt))))),
                    description  : req.body.description,
                    paid_off     : paid_off
                }
            })
    
    res.status(200).send({
        status: 'success',
        data: result
    })

}

const bookshelf_find_updateMany = async (req, res) => {
    if (typeof req.body.id_book !== "string") {
        let result = await bookshelfModel.updateOne({
            _id: mongoose.Types.ObjectId(req.body.id)
        }, {
            $push: {
                "book_id": req.body.id_book.map(e => mongoose.Types.ObjectId(e))
            }
        })
        res.status(200).send({
            status: 'success',
            data: result
        })
    } else {
        res.status(500).send({
            status: "error",
            data: {
                message: "data must an array"
            }
        })
    }
}

const bookshelf_find_updateFillter = async (req, res) => {
    let result = await bookshelfModel.collection.updateMany({}, {
        $set: {
            "books.$[element]": {
                "stock": 20,
                "book_id": "element.book_id"
            }
        }
    }, {
        arrayFilters: [{
            "element.book_id": mongoose.Types.ObjectId(req.body.id_book)
        }]
    })
    res.status(200).send({
        status: 'success',
        data: result
    })
}
// mongo_day4
const aggregateFunc = async (req,res) => {
    let result = await bookshelfModel.aggregate([
    {
        $unwind: "$books"
    },
    {
        $lookup: {
           from: "admin",
           localField: "admin",
           foreignField: "_id",
           as: "admin_field"
         }
    },
    {
        $lookup: {
           from: "collectionBooks",
           localField: "books.book_id",
           foreignField: "_id",
           as: "detail_book"
         }
    },
    {
        $unwind: {
            path: "$admin_field",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $addFields: { 
            admin_name : "$admin_field.name"
        }
    },
    {
        $group: {
            _id: "$_id",
            books: {
                $push: {
                   book_id: "$books.book_id",
                    added: {
                        full_date: "$books.added.full_date" ,
                        date: "$books.added.date" ,
                        day: "$books.added.day" ,
                        month: "$books.added.month" ,
                        year: "$books.added.year" ,
                        hours: "$books.added.hours" ,
                        minutes: "$books.added.minutes" ,
                        seconds: "$books.added.seconds" 
                    },
                    detail_book: "$detail_book",
                    quantity: "$books.quantity" ,
                    total_disc: "$books.total_disc" ,
                    price_AfterDisc: "$books.price_AfterDisc" ,
                    total_tax: "$books.total_tax" ,
                    price_afterTax: "$books.price_afterTax" ,
                    total_price: "$books.total_price"  
                }
            },
            admin_name : {$first : "$admin_name"},
            total : {$first : "$total"},
            paid : {$first : "$paid"},
            change : {$first : "$change"},
            date : {$first : "$date"},
            description : {$first : "$description"},
            paid_off : {$first : "$paid_off"}
        }
    },
    {
        $project : {
            "admin_field" : 0,
            "admin" : 0,
            "detail_book" : 0
        }
    }
    ])

    res.send({status : "success", data : result})
}

const aggregateCountDistance = async (req,res) => {
    // get data company 
    let nama = req.body.name
    let company = await companyModel.collection.findOne({})
    let result = await bookshelfModel.aggregate([
    {
        $lookup: {
           from: "admin",
           localField: "admin",
           foreignField: "_id",
           as: "admin_field"
         }
    },
    {
        $lookup: {
           from: "users",
           localField: "user",
           foreignField: "_id",
           as: "detail_user"
         }
    },
    {
        $match : {
            "detail_user.name" : nama
        }
    },
    {
        $unwind: {
            path: "$admin_field",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $unwind: {
            path: "$detail_user",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        // haversine formula to calculate distance √ ((x2-x1)² + (y2-y1)²)
        $addFields : {
            'distance': {
                '$sqrt': {
                    '$add': [
                    {
                    '$pow': [{
                        '$subtract': [{'$round' : [{'$arrayElemAt': [company.location.coordinates, 0]},0]}, 
                        {'$round' : [{'$arrayElemAt': ['$detail_user.location.coordinates', 0]},0]}]}, 2]
                    }, 
                    {
                    '$pow': [{
                        '$subtract': [{'$round' : [{'$arrayElemAt': [company.location.coordinates, 1]},0]}, 
                        {'$round' : [{'$arrayElemAt': ['$detail_user.location.coordinates', 1]},0]}]}, 2]
                    }]
                }
            },
            "long1" : {'$round' : [{'$arrayElemAt': [company.location.coordinates, 0]},0]},
            "lat1" : {'$round' : [{'$arrayElemAt': ['$detail_user.location.coordinates', 0]},0]},
            "long2" : {'$round' : [{'$arrayElemAt': [company.location.coordinates, 1]},0]},
            "lat2" : {'$round' : [{'$arrayElemAt': ['$detail_user.location.coordinates', 1]},0]},
            'admin_name' : "$admin_field.name",
            "company_location" : company.location.coordinates,
            "user_location" : '$detail_user.location.coordinates'
        }
    },
    {
        $project : {
            "admin_field" : 0
        }
    }
    ])

    res.send({status : "success", data : result})
}

const DistanceNear = async (req,res) => {
    let company = await companyModel.collection.findOne({})
    let result = await bookshelfModel.aggregate([
    {
        // haversine formula to calculate distance √ ((x2-x1)² + (y2-y1)²)
       "$geoNear": {
            "near": {
                "type": "Point",
                "coordinates": [ -81.093699, 32.074673 ]
            },
            "distanceField": "distance",
        }

    },
    {
        $lookup: {
           from: "admin",
           localField: "admin",
           foreignField: "_id",
           as: "admin_field"
         }
    },
    {
        $lookup: {
           from: "users",
           localField: "user",
           foreignField: "_id",
           as: "detail_user"
         }
    },
    {
        $unwind: {
            path: "$admin_field",
            preserveNullAndEmptyArrays: true
        }
    },
    {
        $unwind: {
            path: "$detail_user",
            preserveNullAndEmptyArrays: true
        }
    },
    
    {
        $project : {
            "admin_field" : 0
        }
    }
    ])

    res.send({status : "success", data : result})
}

const orederByprice = async (req,res) => {
    try {
        const result = await bookModel.aggregate([
            {
                $addFields : {
                    priceInt : {
                        $replaceAll : {input: "$price", find: "Rp ", replacement: ""}
                    }
                }
            },
            {
                $set : {
                    priceInt : {$replaceAll : {input: "$priceInt", find: ".", replacement: ""}}
                }
            },
            {
                $set : {
                    priceInt : {
                        $toInt : {
                            $replaceAll : {input: "$priceInt", find: ",", replacement: "."}
                        }
                    }
                }
            },
            {
                $sort : {
                    priceInt : 1
                }
            }
        ])
        res.status(200).send({
            status: 'success',
            data: result
        })
    } catch (error) {
        res.status(500).send({
            status: 'error',
            data: error
        })
    }
}

const showBetween = async (req,res) => {
    try {
        let lower = req.body.lower 
        let higher = req.body.higher
        const result = await bookModel.aggregate([
            {
                $addFields : {
                    priceInt : {
                        $replaceAll : {input: "$price", find: "Rp ", replacement: ""}
                    },
                    concating : {
                        $concat : ["buku ini ","berjudul ","$title"]
                    }
                }
            },
            {
                $set : {
                    priceInt : {$replaceAll : {input: "$priceInt", find: ".", replacement: ""}}
                }
            },
            {
                $set : {
                    priceInt : {
                        $toInt : {
                            $replaceAll : {input: "$priceInt", find: ",", replacement: "."}
                        }
                    }
                }
            },
            {
                $match : {
                    priceInt : {
                        $gte : lower,
                        $lte : higher
                    }
                }
            }
        ])
        res.status(200).send({
            status: 'success',
            data: result
        })
    } catch (error) {
        res.status(500).send({
            status: 'error',
            data: error
        })
    }
}

const arrayFilter = async (req,res) => {
    // try {
        let query = {$and : [],$or : []}
        // if (typeof req.body.title != 'undefined' ) {
            query.$and.push({
                "title" : "tes"
            })
        // }

        // if (typeof req.body.price != 'undefined' ) {
        //     if (req.body.price != 0  ) {
                lower = 9
                higher = 8
                query.$and.push({
                    priceInt : {
                            $gte : lower,
                            $lte : higher
                        }
                })
        //     }
        // }
        
        // if (typeof req.body.stock != 'undefined' ) {
            // if (req.body.stock != 0  ) {
                lower = 10
                higher = 1
                query.$or.push({
                    stock : {
                            $gte : lower,
                            $lte : higher
                        }
                })
            // }
        // }
        console.log(query);
        return 0
        // query = {
        //     $or : query
        // }

        const result = await bookModel.aggregate([
            {
                $addFields : {
                    priceInt : {
                        $replaceAll : {input: "$price", find: "Rp ", replacement: ""}
                    },
                    concating : {
                        $concat : ["buku ini ","berjudul ","$title"]
                    }
                }
            },
            {
                $set : {
                    priceInt : {$replaceAll : {input: "$priceInt", find: ".", replacement: ""}}
                }
            },
            {
                $set : {
                    priceInt : {
                        $toInt : {
                            $replaceAll : {input: "$priceInt", find: ",", replacement: "."}
                        }
                    }
                }
            },
            {
                $match : query
            }
        ])
        res.status(200).send({
            status: 'success',
            data: result
        })
    // } catch (error) {
    //     res.status(500).send({
    //         status: 'error',
    //         data: error
    //     })
    // }
}

const pagination = async (req,res)=>{
    let page = req.body.page //(1 --) 
    let limit = req.body.limit
    let result = await bookModel.aggregate([
        {
            $skip : limit * (page - 1)
        },
        {
            $limit : limit
        }
    ])

    res.status(200).send({status : 'success', data : result, limit : limit, skip : skip})
}

const facetPrice = async (req,res)=>{
    let result = await bookModel.aggregate([
        { $match: { price: { $exists: 1 } } },
        {
                $addFields : {
                    priceInt : {
                        $replaceAll : {input: "$price", find: "Rp ", replacement: ""}
                    },
                    concating : {
                        $concat : ["buku ini ","berjudul ","$title"]
                    }
                }
            },
            {
                $set : {
                    priceInt : {$replaceAll : {input: "$priceInt", find: ".", replacement: ""}}
                }
            },
            {
                $set : {
                    priceInt : {
                        $toInt : {
                            $replaceAll : {input: "$priceInt", find: ",", replacement: "."}
                        }
                    }
                }
            },
            {
            $facet : {
                "allPrice" : [
                    {
                        $bucket: {
                            groupBy: "$priceInt",
                            boundaries: [149000,180000],
                            default: "Other",
                            output: {
                            "count": { $sum: 1 },
                            "total": { $sum: "$priceInt" },
                            "titles": { $push: "$title" }
                            }
                        } 
                    }
                ]
            }
        }
    ])

    res.status(200).send({status : 'success', data : result})
}

const facetGroup = async (req,res)=>{
    let result = await bookModel.aggregate([
        { $match: { price: { $exists: 1 } } },
        {
                $addFields : {
                    priceInt : {
                        $replaceAll : {input: "$price", find: "Rp ", replacement: ""}
                    },
                    concating : {
                        $concat : ["buku ini ","berjudul ","$title"]
                    }
                }
            },
            {
                $set : {
                    priceInt : {$replaceAll : {input: "$priceInt", find: ".", replacement: ""}}
                }
            },
            {
                $set : {
                    priceInt : {
                        $toInt : {
                            $replaceAll : {input: "$priceInt", find: ",", replacement: "."}
                        }
                    }
                }
            },
            {
            $facet : {
                "allPrice" : [
                    {
                        $group : {
                            _id: "$priceInt",
                            total : {$sum : 1 }
                        }
                    }
                ]
            }
        },
            {
                $addFields : {
                    total : {$size : "$allPrice"}
                }
            }
    ])

    res.status(200).send({status : 'success', data : result})
}

module.exports = {
    getAllBooks_raw,
    getAllBooks_,
    getAllBooks_credit,
    saveBook,
    updateBook,
    deleteBook,
    bookshelf,
    bookshelf_add,
    bookshelf_find_pull,
    bookshelf_addMany,
    bookshelf_find_eq,
    bookshelf_find_ne,
    bookshelf_find_ne,
    bookshelf_find_update_add,
    bookshelf_find_updateMany,
    bookshelf_find_match,
    bookshelf_find_updateFillter,
    aggregateFunc,
    aggregateCountDistance,
    DistanceNear,
    orederByprice,
    showBetween,
    arrayFilter,
    pagination,
    facetPrice,
    facetGroup
}