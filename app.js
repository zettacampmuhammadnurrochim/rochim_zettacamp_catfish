import axios from "axios";

let url = "https://laravel-books-db.herokuapp.com/api/categories/science-fiction-fantasy/books?language=en&page=1";
const token = '176|qB7NXdru9zibaEwM2406GRlsa0RQBKANBktNsvNz';
let dataBuku = [];
let shopping_cart = [];

// membuat promise - suatu janji yang akan dikabari nanti #untuk menunggu data buku terisi
function get_books() {
    return new Promise(resolve => {
        // setTimeout(function () {
            axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }).then(e => {
                resolve(e)
            })
        // }, 2000);
    })
}

// fungsi untuk memformat currency
var formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
});

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

const d = new Date();

function bookCheckOut(dataPembelian, waktu, callback) {
    dataPembelian.forEach((e, mainIndex) => {
        let {amountStock} = dataPembelian[mainIndex];
        let {
            amountPurchased
        } = dataPembelian[mainIndex];
        let {
            bookTitle
        } = dataPembelian[mainIndex];
        let indexke = 0 // posisi buku

        let found = false // posisi buku
        for (let index = 0; index < dataBuku.length; index++) {
            if (amountStock > amountPurchased) {
                if (dataBuku[index].title == bookTitle) {
                    indexke = index;
                    let recentAmountBooks = amountStock - amountPurchased;

                    // aku copy , bener2 kopi bukan reference , aku ubah ke array dulu 
                    let copy = [
                        {},{}
                    ];
                    
                    let shpChrtIndx = shopping_cart.push(...Array(dataBuku[index])) - 1;

                    // aku ubah ke objek lagi biar ga masalah wkwk
                    shopping_cart[shpChrtIndx] = Object.assign({}, shopping_cart[shpChrtIndx]);

                    shopping_cart[shpChrtIndx].location = indexke + 1;

                    // indexke+1;

                    console.log(`book found in order ${indexke+1} amount of books now : ${recentAmountBooks}`);
                    recentAmountBooks > 0 ? console.log(`you can make purchase again`) : console.log(`you can't make purchase again`);
                    found = true;
                    callback(waktu, indexke, shpChrtIndx);
                    break;
                } else {
                    // console.log('tidak ketemu');
                }
            } else {
                console.log(`out of stock, ${amountStock} books left`);
                break;
            }
        }

        if (!found && amountStock > amountPurchased) {
            console.log(`the book you were looking for was not found`);
        } else if (!found && amountStock < amountPurchased) {
            console.log(`and the book you were looking for was not found`);
        }
    });
}

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

function calculateCredit(jangkawaktu, indexOfbooks, indexOfcart) {
    // console.log('jangka waktu :  '+jangkawaktu, indexOfbooks);

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

        // perhitungan biaya

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

        // total payment

        shopping_cart[indexOfcart].subtotal = formatter.format(RAWpriceafterinterest.reduce((a, b) => parseFloat(a) + parseFloat(b)));

        console.log(shopping_cart);
    } else {
        let available_period = [];
        periodOfcredit.forEach(e => {
            available_period.push(`${e.jangka} month`);
        });

        console.log(`the period entered does not match what is available ${available_period}`);
        console.log('you cannot continue credit purchases');
    }
}

var mainFunction = async function (credit) {
    const waitForbooksFilled = await get_books().then(e => {
        dataBuku = e.data.books
    });

    let result = calculateDiscount_Tax(10, 2.5, dataBuku);
    dataBuku = [...result];

    // bookCheckOut(10, 5, 'Razzmatazz', credit, calculateCredit);


    bookCheckOut([{
        amountStock: 10,
        amountPurchased: 5,
        bookTitle: 'Razzmatazz'
    }, {
        amountStock: 10,
        amountPurchased: 3,
        bookTitle: 'Master of Furies'
    }], credit, calculateCredit);

    // console.log(dataBuku);

}

mainFunction(3);