const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')

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
        res.send(res)
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
    console.log(dataBuku);
    dataBuku = calculateDiscount_Tax(10,2.5,dataBuku)
    console.log(dataBuku);
    if (typeof res !== 'undefined') {
        res.send({data : dataBuku })
    }
    return dataBuku
}

function bookCheckOut(dataPembelian, period) {
    let found = []
    for (let index = 0; index < dataBuku.length; index++) {
            dataPembelian.forEach( (e, mainIndex) => {
                let {amountStock,amountPurchased,bookTitle} = e;
            
                let indexke = 0
                if (dataBuku[index].title == bookTitle) {
                    if (amountStock > amountPurchased) {
                        indexke = index;
                        found.push(mainIndex)

                        let shpChrtIndx = shopping_cart.push(dataBuku[index]).length - 1;
                        shopping_cart[shpChrtIndx] =  shopping_cart.push(dataBuku[index]);

                        shopping_cart[shpChrtIndx].location = indexke + 1;
                    }
                }
            });
    }
    
        dataPembelian.forEach((element,key) => {
            
            found.forEach((val,index)=>{
                calculateCredit(period, val);

                shopping_cart.push({
                    title : element.bookTitle,
                    status : 'not found'
                })

                dataPembelian.splice(val,1);
            })
        })

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

        shopping_cart[indexOfcart].creditPrice = priceafterinterest;
        shopping_cart[indexOfcart].subtotal = formatter.format(RAWpriceafterinterest.reduce((a, b) => parseFloat(a) + parseFloat(b)));
        return shopping_cart;

    } else {
        return shopping_cart= []
    }
}

const getAllBooks_credit = async (req,res) => {
    const period = req.params.period
    await getAllBooks_()
    const result = await bookCheckOut([
        {amountStock: 10,amountPurchased: 5,bookTitle: 'Razzmatazz'}, 
        {amountStock: 10,amountPurchased: 3,bookTitle: 'Master of Furies'}], 
        period);

    res.send({data : shopping_cart})
}

module.exports = {getAllBooks_raw,getAllBooks_,getAllBooks_credit}