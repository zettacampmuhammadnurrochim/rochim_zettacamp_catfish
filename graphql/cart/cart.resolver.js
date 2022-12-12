const recipesModel = require('./../recipes/recipes.model')
const transactionsModel = require('./../transactions/transaction.model')
const usersModel = require('./../users/users.model')
const mongoose = require('../../services/services')
const { mainValidate, reduceIngredientStock, validateCredit } = require('./../transactions/transaction.utility')
const { recipe } = require('../recipes/recipes.resolvers')
const { result } = require('lodash')
// ///////////////////////////////////////////////////////Cart////////////////////////////////////////////////////////
const getCart = async function (parent, arggs, ctx) {
    const userid = ctx.req.headers.userid
    let result = await transactionsModel.findOne({ user_id: mongoose.Types.ObjectId(userid), order_status: "pending" })
    return result
}

const addToCart = async function (parent, { id, amount, note }, ctx) {
    if (amount == 0 || amount == undefined) {
        return ctx.error("amount of menu must filled")
    }
    note = note || null
    const userid = ctx.req.headers.userid
    // 1. cek jika sudah ada cart
    const ingredientSufficent = await transactionsModel.aggregate([
        {
            $match: {
                $and: [
                    {
                        "user_id": mongoose.Types.ObjectId(userid)
                    },
                    {
                        "order_status": "pending"
                    }
                ]
            }
        }
    ])

    let result = {}
    if (!ingredientSufficent.length) {
    // 2. jika belum ada cart buat baru di colection transactions
        let getPrice = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(id) }, { price: 1, disc : 1 })
        let priceAfterDisc = 0
        let hasDisc = 0
        let realPrice = getPrice.price
        if (getPrice.disc > 0 && typeof getPrice.disc != 'undefined') {
            hasDisc = getPrice.disc
            priceAfterDisc = getPrice.price - (getPrice.price * (getPrice.disc / 100))
        }else{
            priceAfterDisc = getPrice.price
        }
        const price = (priceAfterDisc * amount)
        let values = {
            "user_id": mongoose.Types.ObjectId(userid),
            "menu": [{
                "recipe_id": mongoose.Types.ObjectId(id),
                "amount": amount,
                "note": note,
                "status_recipe" : "pending",
                "_id": mongoose.Types.ObjectId(),
                "price": {
                    "hasDisc": hasDisc,
                    "realPrice": realPrice,
                    "pcs": priceAfterDisc,
                    "total": price
                }
            }],
            "total_price": price,
            "order_status": "pending",
            "status": "active",
            "createdAt": new Date()
        }
        result = await transactionsModel.collection.insertOne(values)
        if (result) {
            console.log(result);
            result = values
        } else {
            return new ctx.error("cant add cart")
        }
    }
    else {
        let totalHarga = ingredientSufficent[0].total_price
        let getPrice = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(id) }, { price: 1, disc : 1})
        let priceAfterDisc = 0
        let hasDisc = 0
        let realPrice = getPrice.price
        if (getPrice.disc > 0 && typeof getPrice.disc != 'undefined') {
            hasDisc = getPrice.disc
            priceAfterDisc = getPrice.price - (getPrice.price * (getPrice.disc / 100))
        } else {
            priceAfterDisc = getPrice.price
        }
        
        let PriceOneMenu = priceAfterDisc * amount
        const price = totalHarga + PriceOneMenu
        for (const items of ingredientSufficent[0].menu){
            if (items.recipe_id.toString() == id) {
                idToUpdate = items._id
                result = await transactionsModel.findOneAndUpdate(
                    {
                        user_id: mongoose.Types.ObjectId(userid), "order_status": "pending", "menu._id" : idToUpdate
                    },
                    {
                        $set: {
                            "menu.$.price.hasDisc": hasDisc,
                            "menu.$.price.realPrice": realPrice,
                            "menu.$.price.pcs": priceAfterDisc,
                            "menu.$.price.total": PriceOneMenu,

                            "menu.$.status_recipe": "pending",
                            
                            "menu.$.amount": items.amount + amount,
                            "menu.$.note": note,
                            "total_price": price
                        }                    },
                    {
                        new : true
                    }
                )
                return result
            }
        }

        result = await transactionsModel.findOneAndUpdate(
            { user_id: mongoose.Types.ObjectId(userid), "order_status": "pending" },
            {
                $push: {
                    "menu": {
                        "recipe_id": mongoose.Types.ObjectId(id),
                        "status_recipe": "pending",
                        "price" : {
                            "hasDisc": hasDisc,
                            "realPrice": realPrice,
                            "pcs" : priceAfterDisc,
                            "total" : PriceOneMenu
                        },
                        "amount": amount,
                        "note": note
                    }
                },
                $set: {
                    total_price: price
                }
            }
            ,
            {
                new: true,
            }
        )
    }
    return result
}

const reduceCart = async function (parent, { id }, ctx) {
    // id yang dipakai untuk reduce adalah id unik di setiap menu
    const userid = ctx.req.headers.userid

    const ingredientSufficent = await transactionsModel.findOne({
        "user_id": mongoose.Types.ObjectId(userid),
        "order_status": "pending",
    })

    let result = {}
    if (ingredientSufficent.menu.length <= 1) {
        result = await transactionsModel.findOneAndDelete({ user_id: mongoose.Types.ObjectId(userid), "order_status": "pending" })
    } else {
        const cekRow = await transactionsModel.findOne({
            "user_id": mongoose.Types.ObjectId(userid),
            "order_status": "pending",
            "menu._id": mongoose.Types.ObjectId(id)
        })
         
        for (const item of cekRow.menu) {
            if (item._id.toString() == id) {
                getAmountAdded = item.amount
                const price = item.price.pcs * item.amount

                    result = await transactionsModel.findOneAndUpdate(
                        { user_id: mongoose.Types.ObjectId(userid), "order_status": "pending" },
                        {
                            $pull: {
                                "menu": { "_id": mongoose.Types.ObjectId(id) }
                            },
                            $inc: {
                                "total_price": - price
                            }
                        }
                        ,
                        {
                            new: true,
                        }
                    )
            }
        }
    }


    return result
}

const updateCartMain = async function (parent, { id, data }, ctx) {
    let { menu } = data
    let menuMap = menu.map((e) => {
        return {
            "recipe_id": mongoose.Types.ObjectId(e.recipe_id),
            "amount": e.amount,
            "price" : {
                "pcs" : e.price.pcs,
                "total": e.price.total
            },
            "note": e.note,
            "_id": mongoose.Types.ObjectId()
        }
    })


    let price = 0
    for (const item of menu) {
        let getRecipe = await recipesModel.collection.findOne({ _id: mongoose.Types.ObjectId(item.recipe_id) })
        price = price + (getRecipe.price * item.amount)
    }

    let values = {
        "menu": menuMap,
        "total_price": price,
        "order_status": "pending"
    }

    const result = await transactionsModel.updateOne({ _id: mongoose.Types.ObjectId(id) }, values)
    return result
}

const clearCart = async function (parent, arggs, ctx) {
    let result = transactionsModel.deleteOne({ user_id: mongoose.Types.ObjectId(id), status: "pending" })
    return result
}

const editCart = async function (parent, { id, amount, note }, ctx) {
// pada edit card data harga tetap mengikuti apa adanya di cart belum sinkronisasi dengan collection recipes
    let userid = ctx.req.headers.userid
    let getTotalHarga = await transactionsModel.findOne({ "user_id": mongoose.Types.ObjectId(userid), "order_status": "pending" })

    let { recipe_id, amountDeclared, priceDeclare } = await (async function (data) {
        for (let cartItem of data) {
            if (cartItem._id.toString() == id) {
                return { recipe_id: cartItem.recipe_id, amountDeclared: cartItem.amount, priceDeclare : cartItem.price }
            }
        }
    })(getTotalHarga.menu)
    
    let totalHarga = getTotalHarga.total_price
    // let getPrice = await recipesModel.findOne({ _id: recipe_id }, { price: 1 , disc : 1})

    let price = 0
    if (amountDeclared > amount) {
        price = totalHarga - (priceDeclare.pcs * (amountDeclared - amount))
    } else if (amountDeclared < amount) {
        price = totalHarga + (priceDeclare.pcs * (amount - amountDeclared))
    } else {
        price = totalHarga
    }
    
    let result = await transactionsModel.findOneAndUpdate(
        { "user_id": mongoose.Types.ObjectId(userid), "order_status": "pending", "menu._id": mongoose.Types.ObjectId(id) },
        {
            $set: {
                "menu.$.amount": amount,
                "menu.$.note": note,
                "total_price": price
            }
        }
        ,
        {
            new: true,
        }
    )
    return result
}

const order = async function (parent, { id }, ctx) {
    // dalam fungsi ini terdapat beberapa validasi terlebih dahulu seperti : validasi perubahan harga,stock/ingredient,credit
    let cart = await transactionsModel.collection.findOne({ _id: mongoose.Types.ObjectId(id) })
    let totalAll = cart.total_price
    let { hasUpdatedMenu,newMenu} = await(async (menus)=> {
        let hasUpdatedMenu = []
        let newMenu = []
        for (const menu of menus) {
            let dataMenu = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(menu.recipe_id) })
            let menuPrice = 0
            // jika admin mengubah harga atau diskon maka akan terdeteksi sebalum cekout
            // jika data menu terbaru memiliki discount maka menuPrice telah disesuaikan
            dataMenu.disc != 0 && typeof dataMenu.disc != 'undefined' ? menuPrice = dataMenu.price - (dataMenu.price * dataMenu.disc) / 100 : menuPrice = dataMenu.price
            // jika harga pada Cart tidak sama dengan harga sekarang (validasi harga)
            if (menuPrice != menu.price.pcs) {
                // sekali memasuki kondisi ini maka order akan digagalkan
                let total = menuPrice * menu.amount
                totalAll = totalAll - menu.price.total
                totalAll = totalAll + total
                
                // terdapat kesalahan untuk pengambilan harga seharusnya mengguanakan konsep seperti data loader jauh lebih cepat
                // tapi kelibihannya dengan ini user bisa tau kalau ada perubahan harga dengan notifikasi
                hasUpdatedMenu.push({
                    _id: menu._id,
                    price: {
                        pcs: menuPrice,
                        total: total
                    }
                })
            } else {
                let total = menuPrice * menu.amount
                newMenu.push({
                    ...menu,
                    price: {
                        pcs: menuPrice,
                        total: total
                    }
                })
            }
        }
        return {hasUpdatedMenu,newMenu}
    })(cart.menu)
    
    if (hasUpdatedMenu.length) {
        // bisa juga menggunakan array fileter sebetulnya
        for (const dataUpdate of hasUpdatedMenu){
            let idToUpdate = dataUpdate._id
            let pcs = dataUpdate.price.pcs
            let total = dataUpdate.price.total
            
            await transactionsModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(id), "menu._id": idToUpdate }, {
                $set: {
                    "menu.$.price.pcs": pcs,
                    "menu.$.price.total": total,
                    "total_price" : totalAll
                }
            },
            {
                new: true,
            })
            
        }
        return new ctx.error("menu price was updated by admin, please check your order again")
    }

    cart.menu = newMenu
    await validateCredit(ctx.req.headers.userid, totalAll)
    let { isCanContinue, menuAbleToMake} = await mainValidate(cart.menu)
    // write status_recipe in transaction , compare by index
    
    if (isCanContinue) {
        
        for (const [ind, val] of menuAbleToMake.entries()) {
            val ? cart.menu[ind].status_recipe = 'available' : cart.menu[ind].status_recipe = 'outOfStock'
        }

        menuAbleToMake = menuAbleToMake.includes(false)
        let order_status = ''
        menuAbleToMake ? order_status = 'failed' : order_status = 'success'
        order_status == 'success' ? reduce = await reduceIngredientStock(cart.menu) : null

        let Payment = await usersModel.collection.updateOne({ _id: mongoose.Types.ObjectId(ctx.req.headers.userid) },
            {
                $inc: {
                    "credit": - cart.total_price
                }
            })

        const result = await transactionsModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(id) }, {
            $set: {
                order_status,
                order_date: new Date()
            }
        },
            {
                new: true,
            })
        return result
    }else{
        return new ctx.error("cant make checkout")
    }
}

const RecipesResolvers = {
    Query: {
        getCart
    },

    Mutation: {
        addToCart,
        reduceCart,
        updateCartMain,
        clearCart,
        order,
        editCart
    }
}

module.exports = RecipesResolvers