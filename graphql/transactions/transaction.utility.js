const { ApolloError } = require('apollo-server-express')
const ingredientsModel = require('../ingredients/ingredients.model')
const receipesModel = require('../recipes/recipes.model')
const usersModel = require('../users/users.model')
const mongoose = require('../../services/services')

const validatePublished = async (Recipes) => {
    let result = []
    let detailRecipe = new Map()

    let recipeNameUnpublish = []
    let isPublished = []
    for (const recipe of Recipes) {
        const recipe_ = await receipesModel.collection.findOne({ _id: recipe.recipe_id },{recipe_name :1 , status : 1})
        const status = recipe_.status
        if (status == "publish") {
            isPublished.push(true)
        }else{
            recipeNameUnpublish.push(recipe_.recipe_name)
            isPublished.push(false)
        }
        
        detailRecipe.set(recipe_.recipe_name, status)
        result.push(isPublished.includes(false))
    }
    // const detailResult = Object.fromEntries(detailRecipe)
    ///////////////////////
    if (isPublished.length) {
        if (isPublished.includes(false)) {
            throw new ApolloError(`menu ${recipeNameUnpublish} is unpublish`);
        }
    }
    return 0
}

const validateStockIngredient = async (Recipes) => {
    let result = []
    let detailIngredient = new Map()
    let detailRecipe = new Map()
    for(const recipe of Recipes){
        
        const recipe_ = await receipesModel.collection.findOne({_id : recipe.recipe_id})
        const amount = recipe.amount
        const ingredients = recipe_.ingredients
        // check ingredients if sufficient
        let ableToMake = []
        for(const recipeIng of ingredients)
        {
            const ingredient = await ingredientsModel.findOne({_id : mongoose.Types.ObjectId(recipeIng.ingredient_id)}).select(['stock','name'])
            if (ingredient.stock >= recipeIng.stock_used * amount) {
                ableToMake.push(true)
                detailIngredient.set(`${ingredient.name}`, true)
            }else{
                ableToMake.push(false)
                detailIngredient.set(`${ingredient.name}`, false)
            }
        }
        detailRecipe.set(recipe_.recipe_name , Object.fromEntries(detailIngredient))
        result.push(ableToMake.includes(false))
    }

    const detailResult = JSON.stringify(Object.fromEntries(detailRecipe))
    return result 
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
    console.log(userid);
    console.log(dataUser);
    credit = dataUser.credit
    if (credit >= total_price) {
        return true
    }else{
        return false
    }
}

module.exports = { validateStockIngredient, reduceIngredientStock, validatePublished, validateCredit}