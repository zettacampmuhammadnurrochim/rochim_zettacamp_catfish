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
            recipeNameUnpublish.push(recipe.recipe_name)
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
    let menuAbleToMake = []
    let menuDisableToMakeName = []
    let menuWithIngredients = []
    for (const menu of menuOrdered) {
        let inggredientInsufficent = []
        let isIngredientSufficent = []
        let ingredients = menu.ingredients
        for (const ingredient of ingredients) {
            let amount = menu.amount
            for (const [index, uingredient] of uniqueIngredients.entries()) {
                if (ingredient.ingredient_id.toString() == uingredient._id.toString()) {
                    if (uingredient.stock >= ingredient.stock_used * amount) {
                        //fungsi yang sangat penting
                        uniqueIngredients[index].stock = uniqueIngredients[index].stock - (ingredient.stock_used * amount)
                        isIngredientSufficent.push(true)
                    } else {
                        isIngredientSufficent.push(false)
                        inggredientInsufficent.push(uingredient.name)
                    }
                }
            }
        }
        menuWithIngredients.push({ [menu.recipe_name]: isIngredientSufficent })
        !isIngredientSufficent.includes(false) ? null : menuDisableToMakeName.push(menu.recipe_name)
        !isIngredientSufficent.includes(false) ? menuAbleToMake.push(true) : menuAbleToMake.push(false)
    }
    return { menuWithIngredients, menuAbleToMake, menuDisableToMakeName }
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
    let { menuWithIngredients, menuAbleToMake, menuDisableToMakeName } = validateIngredients(uniqueIngredients,menuOrdered)

    if (recipeNameUnpublish.length) {
        console.log(recipeNameUnpublish);
        throw new ApolloError(`${recipeNameUnpublish} unpublished `)
    }
    if (ingredientsNameUnpublish.length) {
        throw new ApolloError(`ingredients to make recipe are unpublish ${ingredientsNameUnpublish}`)
    }
    if (menuAbleToMake.includes(false)) {
        throw new ApolloError(`ingredients insufficent or orders over availability to make "${menuDisableToMakeName}"`)
    }

    ableToMakeMerged = isPublishedMenu.concat(isPublished, menuAbleToMake); 
    return { isCanContinue: !ableToMakeMerged.includes(false), menuAbleToMake : menuAbleToMake }
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