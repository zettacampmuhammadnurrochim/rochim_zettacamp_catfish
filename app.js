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

function calculateDiscount_Tax(dis,tax, books) {
    let result = [];
    books.forEach(h => {
        let harga = h.price;
        let rawHarga = harga.replace(/[^0-9.-]+/g, "");

        let hargaInt = parseInt(rawHarga.replace('.', ''));

        let discount = (hargaInt * dis) / 100;
        let rawAfterDisc = hargaInt - discount;
        let afterDisc = formatNumber(rawAfterDisc);

        // //////////////////////////////////////

        let taxing = (rawAfterDisc * tax) / 100;
        let afterTax = formatNumber(rawAfterDisc + taxing);

        let hasil = {
            ...h, //using spread operator
            disc: `${dis} %`,
            total_disc: discount,
            price_AfterDisc: `Rp ${afterDisc}`,
            tax: `${tax} %`,
            total_tax: taxing,
            price_afterTax: `Rp ${afterTax}`
            };

        result.push(hasil);
    });

    console.log(result);
    return result;
}


getBooks(url).then(e => {
    const pureData = dataBuku.books;
    calculateDiscount_Tax(10,2.5, pureData);
});


var checkBooksData = function () {
    return new Promise(resolve => {
        setTimeout(function () {
            if (dataBuku.length != 0) {
                resolve('books data filled');
            }
        }, 2000);
    });
};


var  = async function () {
    const first_promise = await checkBooksData().then(



    );
}

// async_function();