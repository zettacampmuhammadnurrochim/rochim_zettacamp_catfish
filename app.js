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

    calculateTax(2.5,result);
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

    console.log(result);

}



getBooks(url).then(e => {
    const pureData = dataBuku.books;
    calculateDiscount(10, pureData);
});