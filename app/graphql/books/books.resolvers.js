const bookModel = require('../../models/bookModel')
const mongoose = require('../../../services/services')
const {GraphQLScalarType, Kind} = require('graphql')
const { GraphQLJSON  } = require('graphql-type-json');
const { bookshelf } = require('../../controllers/bookController');

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

function bookCheckOut(dataBuku,dataPembelian, period) {
    try {
        let found = []
        let map_SpCart = new Map();
        for (let index = 0; index < dataBuku.length; index++) {
            dataPembelian.forEach((e, mainIndex) => {
                let {amountPurchased,bookId} = e;
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

        console.log(shopping_cart);
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
        return error
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


const booksResolvers = {
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
        async getBookbyId(parent, arggs, ctx){
            try {
                let id = arggs.id
                dataBuku = await bookModel.collection.findOne({_id : mongoose.Types.ObjectId(id)})
                return dataBuku
            } catch (error) {
                return new ctx.error(error)
            }
        },
        async getBooks(parent, arggs, ctx){
            try {
                dataBuku = await bookModel.collection.find().toArray()
                return dataBuku
            } catch (error) {
                return new ctx.error(error)
            }
        },
        async getAllBooks_(parent, arggs, ctx){
            try {
                dataBuku = await this.getBooks()
                dataBuku = calculateDiscount_Tax(dataBuku)
                return dataBuku
            } catch (error) {
                return new ctx.error(error)
            }
        },
        async bookPurchase(parent, arggs, ctx){
            try {
                const {period,booksPurchase} = arggs.data
                const dataBuku = await this.getAllBooks_()
                const result = await bookCheckOut(dataBuku,booksPurchase,period)
                return result
            } catch (error) {
                return new ctx.error(error)
            }
        },
        async getBooksPaginate(parent, arggs, ctx){
            try {
                console.log("each");
                const aggregate = []

                aggregate.push({
                    $match : {
                        $and : [{"title" : {$ne : ""}}]
                    }
                })
                
                if (typeof arggs.paginate != 'undefined') {
                    const {limit,page} = arggs.paginate
                    if (typeof limit != 'undefined' && typeof page != 'undefined') {
                        aggregate.push(
                            {$skip : limit * page},
                            {$limit : limit}
                        )
                    }
                }
                let result = await bookModel.aggregate(aggregate)
                return result
            } catch (error) {
                return new ctx.error(error)
            }
        },
        async bookshelf(parent, arggs, ctx){
            try {
                console.log(ctx.dataloader);
                result = await bookshelfModel.collection.find({}).toArray()
                if (result.length == 0) {
                    return result
                } else {
                    ctx.error({message : "data is null"})
                }
            } catch (error) {
                ctx.error(error)
            }
        }
    },
    
    Mutation : {
        async createBook(parent, arggs, ctx){
            try {
                const {image,title,author,price,original_url,url,slug,stock,dis,tax,} = arggs.data
                var book = new bookModel({
                    image: image,
                    title: title,
                    author: author,
                    price: price,
                    original_url: original_url,
                    url: url,
                    slug: slug,
                    stock: stock,
                    dis: dis,
                    tax: tax
                });
                const result = book.save()
                return {status : "success", input : book, result : result}
            } catch (error) {
                return new ctx.error(error)
            }
        },
        async updateBook(parent, arggs, ctx){
            try {
                let Object_id = mongoose.Types.ObjectId(arggs.data.id)
                const book = {
                    image: arggs.data.image,
                    title: arggs.data.title,
                    author: arggs.data.author,
                    price: arggs.data.price,
                    original_url: arggs.data.original_url,
                    url: arggs.data.url,
                    slug: arggs.data.slug,
                    stock: arggs.data.stock            
                }
                let result = await bookModel.updateOne({_id: Object_id},{$set: book},{runValidators: true})
                return {status : "success", input : book, result : result}
            } catch (error) {
                return new ctx.error(error)
            }
        },
        async deleteBook(parent, arggs, ctx){
            try {
                let Object_id = mongoose.Types.ObjectId(arggs.id)
                let result = await bookModel.deleteOne({_id: Object_id})
                return {status : "success", input : {id : arggs.id}, result : result}
            } catch (error) {
                return new ctx.error(error)
            }
        }
    }
}

module.exports = booksResolvers

