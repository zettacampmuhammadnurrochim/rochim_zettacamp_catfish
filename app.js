import axios from "axios";

let url = "https://laravel-books-db.herokuapp.com/api/categories/science-fiction-fantasy/books?language=en&page=1";
const token = '176|qB7NXdru9zibaEwM2406GRlsa0RQBKANBktNsvNz';

let dataBuku = [];
async function getBooks(url) {
    await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    }).then(e => {
        dataBuku = e.data;
    });
}

function formatNumber(num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.')
}

function calculateDiscount(dis, data) {
    let result = [];
    data.map(h => {
        let harga = h.price;
        let rawHarga = harga.replace(/[^0-9.-]+/g, "");

        let hargaInt = parseInt(rawHarga.replace('.', ''));

        let discount = (hargaInt * dis) / 100;
        let afterDisc = formatNumber(hargaInt - discount);

        let hasil = {
            ...h, //using spread operator
            disc: `${dis} %`,
            total_disc: discount,
            price_AfterDisc: `Rp ${afterDisc}`
        };
        result.push(hasil);
    });

    calculateTax(2.5, result);
}

function calculateTax(tax, data) {

    let result = [];
    data.map(h => {
        let harga = h.price_AfterDisc;
        let rawHarga = harga.replace(/[^0-9.-]+/g, "");

        let hargaInt = parseInt(rawHarga.replace('.', ''));

        let taxing = (hargaInt * tax) / 100;
        let afterTax = formatNumber(hargaInt + taxing);

        let hasil = {
            ...h, //using spread operator
            tax: `${tax} %`,
            total_tax: taxing,
            price_afterTax: `Rp ${afterTax}`
        };

        result.push(hasil);
    });
    dataBuku = result;
}

getBooks(url).then(e => {
    const pureData = dataBuku.books;
    calculateDiscount(10, pureData);
});


var checkBooksData = function() {
return new Promise(resolve => {
    setTimeout(function() {
        if ( dataBuku.length != 0) {
            resolve('books data filled');
        }
    }, 2000);
});
};

var bookPurchasing = function(amountStock, amountPurchased, bookTitle) {
return new Promise(resolve => {
    setTimeout(function() {
        
        let indexke = 0 // posisi buku
        let found = false // posisi buku

        for (let index = 0; index < dataBuku.length; index++) {
            if (amountStock > amountPurchased) {
                if (dataBuku[index].title == bookTitle) {
                    indexke = index;
                    let recentAmountBooks = amountStock - amountPurchased;
                    console.log(`book found in order ${indexke+1} amount of books now : ${recentAmountBooks}`);
                    recentAmountBooks > 0 ? console.log(`you can make purchase again`) : console.log(`you can't make purchase again`);
                    found = true;
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
        }else if(!found && amountStock < amountPurchased){
            console.log(`and the book you were looking for was not found`);
        }
    }, 0);
});
};
  
var async_function = async function() {
  
const first_promise = await checkBooksData();
console.log(first_promise);
  
const second_promise = await bookPurchasing(5, 1, 'The River of Silver');

}
  
async_function(); 