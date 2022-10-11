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
  
const second_promise = await bookPurchasing(10, 9, 'The River of Silver');

}
  
async_function(); 