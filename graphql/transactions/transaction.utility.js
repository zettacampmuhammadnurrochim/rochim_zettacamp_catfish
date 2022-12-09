const { ApolloError } = require('apollo-server-express')
const ingredientsModel = require('../ingredients/ingredients.model')
const receipesModel = require('../recipes/recipes.model')
const usersModel = require('../users/users.model')
const mongoose = require('../../services/services')
const transactionsModel = require('./transaction.model')


const checkMenuPublish = (Recipes) =>{
    let isPublished = []
    let recipeNameUnpublish = []
    for(const recipe of Recipes){
        if (recipe.status == "publish") {
            isPublished.push(true) 
        }else{
            isPublished.push(false) 
            recipeNameUnpublish.push(recipe.name)
        }
    }
    return {recipeNameUnpublish, isPublished}
}

const validatePublishedIngredients = (ingredients) =>{
    let isPublished = []
    let ingredientsNameUnpublish = []
    for(const ingredient of ingredients){
        if (ingredient.status == "active") {
            isPublished.push(true) 
        }else{
            isPublished.push(false) 
            ingredientsNameUnpublish.push(ingredient.name)
        }
    }
    return {ingredientsNameUnpublish, isPublished}
}

const validateIngredients = (uniqueIngredients,menuOrdered) =>{
    let ableToMake = []
    let inggredientInsufficent = []
    for (const menu of menuOrdered) {
        let ingredients = menu.ingredients
        for (const ingredient of ingredients) {
            let amount = menu.amount
            for (const [index, uingredient] of uniqueIngredients.entries()) {
                if (ingredient.ingredient_id.toString() == uingredient._id.toString()) {
                    if (uingredient.stock >= ingredient.stock_used * amount) {
                        //fungsi yang sangat penting
                        uniqueIngredients[index].stock = uniqueIngredients[index].stock - (ingredient.stock_used * amount)
                        ableToMake.push(true)
                    } else {
                        ableToMake.push(false)
                        inggredientInsufficent.push(uingredient.name)
                    }
                }
            }
        }
    }

    return { inggredientInsufficent, ableToMake }
}

const mainValidate = async (Recipes) => {
    // handle if ingredient out of stock/ingredients status is not active, status un publish
    let menuOrdered = [] //detail of Recipes
    let uniqueIngredients = await (async function (Recipes) {
        let allIngredients = []
        for (const recipe of Recipes) {
            let menu = await receipesModel.collection.findOne({ _id: recipe.recipe_id })
            menuOrdered.push({...menu, amount : recipe.amount})
            for (const recipeIng of menu.ingredients) {
                const ingredient = await ingredientsModel.findOne({ _id: mongoose.Types.ObjectId(recipeIng.ingredient_id) }).select(['stock', 'name','status'])
                allIngredients.push(ingredient)
            }
        }
        return [...new Set(allIngredients.map(JSON.stringify))].map(JSON.parse)
    })(Recipes)
    // oke sekarang sudah punya ingredient + stock secara unique
    let { recipeNameUnpublish, isPublished: isPublishedMenu  } = checkMenuPublish(menuOrdered)
    let { ingredientsNameUnpublish, isPublished } = validatePublishedIngredients(uniqueIngredients)
    let { inggredientInsufficent, ableToMake } = validateIngredients(uniqueIngredients,menuOrdered)

    if (recipeNameUnpublish.length) {
        throw new ApolloError(`recipes name are unpublish ${recipeNameUnpublish}`)
    }
    if (ingredientsNameUnpublish.length) {
        throw new ApolloError(`ingredients to make recipe are unpublish ${ingredientsNameUnpublish}`)
    }
    if (inggredientInsufficent.length) {
        throw new ApolloError(`ingredients to make recipe are insufficent ${inggredientInsufficent}`)
    }

    ableToMakeMerged = isPublishedMenu.concat(isPublished, ableToMake); 
    return { ableToMake: !ableToMakeMerged.includes(false), ingredientSufficent : ableToMake }
}

const reduceIngredientStock = async (Recipes) => {
    for(const recipe of Recipes){
        const recipe_ = await receipesModel.collection.findOne({_id : recipe.recipe_id})
        const amount = recipe.amount
        const ingredients = recipe_.ingredients
        for(const recipeIng of ingredients)
        {
            let reduce = await ingredientsModel.updateOne({_id : mongoose.Types.ObjectId(recipeIng.ingredient_id),status : 'active'},{
                $inc : {
                    stock : - (amount * recipeIng.stock_used)
                }
            })
        }
    }
    return true 
}

const validateCredit = async (userid, total_price) => {
    const dataUser = await usersModel.collection.findOne({_id: mongoose.Types.ObjectId(userid)})
    credit = dataUser.credit
    if (credit >= total_price) {
        return true
    }else{
        throw new ApolloError("your credit is insufficient")
    }
}

module.exports = { mainValidate, reduceIngredientStock, validateCredit}