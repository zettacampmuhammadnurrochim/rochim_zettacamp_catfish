const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const mongoose = require('../../services/services.js')

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

module.exports = {getAllBooks_raw,getAllBooks_,getAllBooks_credit}