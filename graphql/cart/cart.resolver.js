const recipesModel = require('./../recipes/recipes.model')
const transactionsModel = require('./../transactions/transaction.model')
const mongoose = require('../../services/services')
const { validatePublished, validateStockIngredient, reduceIngredientStock } = require('./../transactions/transaction.utility')
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
    const checkAvailable = await transactionsModel.aggregate([
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
    if (!checkAvailable.length) {
    // 2. jika belum ada cart buat baru di colection transactions
        let getPrice = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(id) }, { price: 1 })
        let priceAfterDisc = 0
        getPrice.disc > 0 && getPrice.disc != 'undefined' ? priceAfterDisc = getPrice.price - (getPrice.price * (getPrice.disc / 100)) : priceAfterDisc = getPrice.price
        const price = (priceAfterDisc * amount)
        let values = {
            "user_id": mongoose.Types.ObjectId(userid),
            "menu": [{
                "recipe_id": mongoose.Types.ObjectId(id),
                "amount": amount,
                "note": note,
                "_id": mongoose.Types.ObjectId(),
            }],
            "total_price": price,
            "order_status": "pending",
            "status": "active",
            "createdAt": new Date()
        }
        result = await transactionsModel.collection.insertOne(values)
        if (result.acknowledged) {
            result = values
        } else {
            return new ctx.error("cant add cart")
        }
    }
    else {
        let totalHarga = checkAvailable[0].total_price
        let getPrice = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(id) }, { price: 1 })
        let priceAfterDisc = 0
        getPrice.disc > 0 && getPrice.disc != 'undefined' ? priceAfterDisc = getPrice.price - (getPrice.price * (getPrice.disc / 100)) : priceAfterDisc = getPrice.price
        const price = totalHarga + (priceAfterDisc * amount)
        
        for (const items of checkAvailable[0].menu){
            if (items.note == note && items.recipe_id == mongoose.Types.ObjectId(id)) {
                idToUpdate = items._id
                result = await transactionsModel.findOneAndUpdate(
                    {
                        user_id: mongoose.Types.ObjectId(userid), "order_status": "pending", "menu._id" : idToUpdate
                    },
                    {
                        $set: {
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

    const checkAvailable = await transactionsModel.findOne({
        "user_id": mongoose.Types.ObjectId(userid),
        "order_status": "pending",
    })

    let result = {}
    if (checkAvailable.menu.length <= 1) {
        result = await transactionsModel.findOneAndDelete({ user_id: mongoose.Types.ObjectId(userid), "order_status": "pending" })
    } else {
        const cekRow = await transactionsModel.findOne({
            "user_id": mongoose.Types.ObjectId(userid),
            "order_status": "pending",
            "menu._id": mongoose.Types.ObjectId(id)
        })
        let idRecipe = ""
        let getAmountAdded = 0
        for (const item of cekRow.menu) {
            if (item._id.toString() == id) {
                idRecipe = item.recipe_id
                getAmountAdded = item.amount
            }
        }

        let getPrice = await recipesModel.findOne({ _id: idRecipe }, { price: 1 })
        let priceAfterDisc = 0
        getPrice.disc > 0 && getPrice.disc != 'undefined' ? priceAfterDisc = getPrice.price - (getPrice.price * (getPrice.disc / 100)) : priceAfterDisc = getPrice.price
        const price = priceAfterDisc * getAmountAdded

        
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


    return result
}

const updateCartMain = async function (parent, { id, data }, ctx) {
    let { menu } = data
    let menuMap = menu.map((e) => {
        return {
            "recipe_id": mongoose.Types.ObjectId(e.recipe_id),
            "amount": e.amount,
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

    const userid = ctx.req.headers.userid
    const getTotalHarga = await transactionsModel.findOne({ "user_id": mongoose.Types.ObjectId(userid), "order_status": "pending" })

    let { recipe_id, amountDeclared } = await (async function (data) {
        for (const cartItem of data) {
            if (cartItem._id.toString() == id) {
                return { recipe_id: cartItem.recipe_id, amountDeclared: cartItem.amount }
            }
        }
    })(getTotalHarga.menu)
    
    let totalHarga = getTotalHarga.total_price
    let getPrice = await recipesModel.findOne({ _id: recipe_id }, { price: 1 })
    let price = 0
    if (amountDeclared > amount) {
        price = totalHarga - (getPrice.price * (amountDeclared - amount))
    } else if (amountDeclared < amount) {
        price = totalHarga + (getPrice.price * (amount - amountDeclared))
    } else {
        price = totalHarga
    }

    result = await transactionsModel.findOneAndUpdate(
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

const checkCart = async function (parent, { id }, ctx) {
    try {
        const userid = ctx.req.headers.userid
        let result = await transactionsModel.find({ user_id: mongoose.Types.ObjectId(userid), "menu.recipe_id": mongoose.Types.ObjectId(id)})
        if (result) {

        }
    } catch (error) {
        
    }
}

const order = async function (parent, { id }, ctx) {
    let cart = await transactionsModel.collection.findOne({ _id: mongoose.Types.ObjectId(id) })
    await validatePublished(cart.menu)
    let newMenu = []

    for(const menu of cart.menu){
        let dataMenu = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(menu.recipe_id) })
        let pcs = dataMenu.price
        let total = pcs * menu.amount
        newMenu.push({
            ...menu,
            price: {
                pcs: pcs,
                total: total
            }
        })
    }

    cart.menu = newMenu

    let checkAvailable = await validateStockIngredient(cart.menu)

    for (const [ind, val] of checkAvailable.entries()) {
        val ? cart.menu[ind].status_recipe = 'outOfStock' : cart.menu[ind].status_recipe = 'available'
    }
    checkAvailable = checkAvailable.includes(true) // if result true mean that all recipe is not able to create
    let order_status = ''

    checkAvailable ? order_status = 'failed' : order_status = 'success'
    order_status == 'success' ? reduce = await reduceIngredientStock(cart.menu) : null

    const result = await transactionsModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(id) }, {
        $set: {
            ...cart,
            order_status,
            order_date: new Date()
        }
    },
    {
        new: true,
    })

    reduce = {}
    return result
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