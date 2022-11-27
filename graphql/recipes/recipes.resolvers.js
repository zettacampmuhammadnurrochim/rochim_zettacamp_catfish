const recipesModel = require('./recipes.model')
const transactionsModel = require('./../transactions/transaction.model')
const mongoose = require('../../services/services')
const {getAvailable} = require('./recipes.utility')
const { result } = require('lodash')
const { Mongoose } = require('../../services/services')
const { sendMessages } = require('./../../firebase/firebase.utility')

const recipesAvailable = async function (parent, arggs, ctx) {
    if (parent.ingredients.length) {
        const result = getAvailable(parent.ingredients)
        return result;
    }
}

/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

const getIngredientsLoader = async function (parent, arggs, ctx) {
    if (parent.ingredient_id) {
        const result = await ctx.ingredientsLoader.load(parent.ingredient_id)
        return result;
    }
}
const recipeCategories = async function (parent, arggs, ctx) {
    if (parent.categories) {
        const result = await ctx.categoriesLoader.load(parent.categories)
        return result;
    }
}
/////////////////////////////////////////////////////query function////////////////////////////////////////////////////
// done
const getAllRecipes = async function (parent, arggs, ctx) {

        let aggregateQuery = []
        let indexMatch = aggregateQuery.push({$match : {$and : [{status : {$ne : "deleted"}}]} }) - 1
        if (arggs.match) {
            if (arggs.match.name) {
                const search = new RegExp(arggs.match.name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'recipe_name' : search
                })
            }
            
            if (arggs.match.status) {
                const search = arggs.match.status
                aggregateQuery[indexMatch].$match.$and.push({
                    'status' : search
                })
            }
        }
        
        if (arggs.paginator) {
            let total_items = 0
            if (arggs.match) { 
                total_items = await recipesModel.aggregate(aggregateQuery) 
                total_items = total_items.length
            }else{
                total_items = await recipesModel.count() 
            }
            const {limit, page} = arggs.paginator
            const skip = limit * page
            aggregateQuery.push({
                $skip : skip
            },
            {
                $limit : limit
            })

            let showing = `Showing ${skip+1} to ${Math.min(total_items , skip+limit)} from ${total_items} entries`
            let total_page = Math.ceil(total_items/limit)
            let position = `${page+1}/${total_page}`
           
            paginator = {
                total_items : total_items,
                showing : showing,
                total_page : total_page,
                position : position,
            }
        }
        
        let result = []
        
        arggs.match || arggs.paginator ? result = await recipesModel.aggregate(aggregateQuery) : result = await recipesModel.collection.find().toArray()

        return {data : result, paginator : paginator}
  
}
// done
const getOneRecipe = async function (parent, arggs, ctx) {
    try {
        const result = await recipesModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id)})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////
// done
const createRecipe = async function (parent, arggs, ctx) {
    try {
        const {recipe_name, ingredients, price, description, image} = arggs.data
        let inputRecipe = new recipesModel({
            recipe_name : recipe_name, 
            ingredients : ingredients,
            price : price,
            description : description,
            image : image,
            status : "unpublish"
        })
        
        let validator = await inputRecipe.validate()
        let result = {}
        !validator ? result = await inputRecipe.save() : result = {}
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateStatusRecipe = async function (parent, {id,status}, ctx) {
    try {
        let result = recipesModel.updateOne({_id : mongoose.Types.ObjectId(id)},{
            status : status
        })
        return result   
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateHighlightRecipe = async function (parent, {id,highlight,disc}, ctx) {
    try {
        if (!highlight) {
            disc = 0
        }
        let result = await recipesModel.findOneAndUpdate({_id : mongoose.Types.ObjectId(id)},{
            highlight : highlight,
            disc : disc 
        },{
            new : true
        })
        let isSent = null

        if (highlight) {
            isSent = sendMessages(result)
        }

        return { ...result, sentReport : isSent }   
        
    } catch (error) {
        return new ctx.error(error)
    }
}

// done
const updateRecipe = async function (parent, {id,data}, ctx) {
    try {
        let query = []
        let arrayFiltersQuery = []
        if (data.recipe_name) {
            let {recipe_name} = data
            query.push([
                '$set' , {
                    'recipe_name' : recipe_name
                }
            ])
        }

        let push = [] 
        let pull = []
        let update = []
        if (data.ingredients) {
            let {ingredients} = data
            
            for(const [index,value] of ingredients.entries()){
                if (value.mode == "push") {
                    delete value.mode
                    push.push(value)
                }
                else if(value.mode == "pull") {
                    delete value.mode
                    pull.push(value.ingredient_id)
                }else {
                    delete value.mode
                    update.push(value)
                }
            }
            
            if (pull.length) {
                query.push([
                    '$pull' , {'ingredients' : {
                        'ingredient_id' : pull.map(e => mongoose.Types.ObjectId(e)) 
                        } 
                    }
                ])
            }

            if (push.length) {
                query.push([
                    '$push' , {'ingredients' : {'$each' : push}}
                ])
            }

            if (update.length) {
                let set = []
                let arrayFilters = []
                
                for(const [ind,val] of update.entries()){
                    set.push([
                        `ingredients.$[var${ind}].stock_used` , val.stock_used
                    ])

                    arrayFilters.push([
                        `var${ind}.ingredient_id` , mongoose.Types.ObjectId(val.ingredient_id)
                    ])
                }

                query.push([
                    '$set' , Object.fromEntries(set)
                ])

                arrayFilters = Object.fromEntries(arrayFilters)
                Object.entries(arrayFilters).forEach(entry => {
                    const [key, value] = entry;
                    arrayFiltersQuery.push({[key] : value})
                });
        
            }
        }
        
        let newArrayFiltersQuery = []
        newArrayFiltersQuery.push([
            'arrayFilters' , arrayFiltersQuery 
        ])

        query = Object.fromEntries(query)
        arFilt = Object.fromEntries(newArrayFiltersQuery)
        query = [ query , arFilt]
        let result = await recipesModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},...query)
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateRecipePull = async function(parent, {id,data}, ctx){
    const result = recipesModel.aggregate([
        {        
            $pull : { 
                "ingredients.ingredient_id" : mongoose.Types.ObjectId(data.ingredient_id) 
            }
        }
    ])
    return result
}

const updateRecipePush = async function(parent, {id,data}, ctx){
    const result = recipesModel.aggregate([
        {        
            $push : { 
                "ingredients" : data  
            }
        }
    ])
    return result
}

const updateRecipeMain = async function(parent, {id,data}, ctx){
    try {
        let {recipe_name, ingredients, price, description, image, status} = data
        ingredients = ingredients.map(e => {
            return {ingredient_id : mongoose.Types.ObjectId(e.ingredient_id), stock_used : e.stock_used}
        })
        let inputRecipe = {
            recipe_name : recipe_name, 
            ingredients : ingredients,
            price : price,
            description : description,
            image : image,
            status : status
        }

        const result = await recipesModel.updateOne({_id : mongoose.Types.ObjectId(id)},{
            $set : inputRecipe
        })

        return result
    } catch (error) {
         return new ctx.error(error)
    }
}
// done
const deleteRecipe = async function (parent, {id}, ctx) {
    try {
        let result = await recipesModel.updateOne({_id : mongoose.Types.ObjectId(id)},{
            $set : {
                deletedAt : new Date(),
                status : "deleted"
            }
        })
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

// ///////////////////////////////////////////////////////Cart////////////////////////////////////////////////////////
const addToCart = async function (parent, {id,amount}, ctx) {
    const userid = ctx.req.headers.userid
    const checkAvailable =  await transactionsModel.aggregate([
        {
            $match : {
                $and : [
                    {
                        "user_id" : mongoose.Types.ObjectId(userid)
                    },
                    {
                        "order_status" : "pending"
                    }
                ]
            }
        }
    ])

    
    let result = []
    if (!checkAvailable.length) {
        let getPrice = await recipesModel.findOne({_id : mongoose.Types.ObjectId(id)}, {price : 1})
        const price = getPrice.price * amount
        let values = {
            "user_id" : mongoose.Types.ObjectId(userid),
            "menu" : [{
                "recipe_id" : mongoose.Types.ObjectId(id),
                "amount" : amount,
                "_id" : mongoose.Types.ObjectId()
            }],
            "price" : price,
            "order_status" : "pending",
            "status" : "active",
            "createdAt" : new Date()
        }
        result = await transactionsModel.collection.insertOne(values)
        if (result.acknowledged) {
            result = values
        }else{
            return new ctx.error("cant add cart")
        }
    }
    else
    {
        let totalHarga = checkAvailable[0].price
        let getPrice = await recipesModel.findOne({_id : mongoose.Types.ObjectId(id)}, {price : 1})
        const price = totalHarga + (getPrice.price * amount)
            result = await transactionsModel.findOneAndUpdate(
            {user_id : mongoose.Types.ObjectId(userid), "order_status" : "pending"},
            {
                $push : {
                    "menu" : {
                        "recipe_id" : mongoose.Types.ObjectId(id),
                        "amount" : amount
                    }
                },
                $set : {
                    price : price
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

const reduceCart = async function (parent, {id}, ctx) {
    // id yang dipakai untuk reduce adalah id unik di setiap menu
    const userid = ctx.req.headers.userid
    
    const checkAvailable =  await transactionsModel.findOne({
        "user_id" : mongoose.Types.ObjectId(userid),
        "order_status" : "pending",
    })
    let result = {}
    if (checkAvailable.menu.length <= 1) {
        result = await transactionsModel.findOneAndDelete({user_id : mongoose.Types.ObjectId(userid), "order_status" : "pending"})
    }else{
        const cekRow =  await transactionsModel.findOne({
            "user_id" : mongoose.Types.ObjectId(userid),
            "order_status" : "pending",
            "menu._id" : mongoose.Types.ObjectId(id)
        })
        let idRecipe = ""
        let getAmountAdded = 0
        for(const item of cekRow.menu){
            if (item._id.toString() == id) {
                idRecipe = item.recipe_id
                getAmountAdded = item.amount
            }
        }

        let getPrice = await recipesModel.findOne({_id : idRecipe},{price : 1})
        const price = getPrice.price * getAmountAdded

        result = await transactionsModel.findOneAndUpdate(
            {user_id : mongoose.Types.ObjectId(userid), "order_status" : "pending"},
            {
                $pull : {
                    "menu" : {"_id" : mongoose.Types.ObjectId(id)}
                },
                $inc : {
                    "price" : - price
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

const updateCartMain = async function(parent, {id, data}, ctx) {
    let {menu} = data
    let menuMap = menu.map((e) => {
        return {
            "recipe_id" : mongoose.Types.ObjectId(e.recipe_id),
            "amount" : e.amount,
            "note" : e.note,
            "_id" : mongoose.Types.ObjectId()
        }
    })


    let price = 0 
    for(const item of menu){
        let getRecipe = await recipesModel.collection.findOne({_id : mongoose.Types.ObjectId(item.recipe_id)})
        price = price + (getRecipe.price * item.amount) 
    }

    let values = {
       "menu" : menuMap,
        "price" : price,
        "order_status" : "pending"
    }

    const result = await transactionsModel.updateOne({_id : mongoose.Types.ObjectId(id)},values)
    return result
}

const editCart = async function(parent, {id}, ctx) {
    let 
}

const RecipesResolvers = {
    Query: {
        getAllRecipes,
        getOneRecipe
    },
    
    Mutation: {
        createRecipe,
        updateStatusRecipe,
        updateRecipe,
        updateRecipeMain,
        deleteRecipe,
        updateHighlightRecipe
    },

    recipe_ingridient : {
        ingredient_id : getIngredientsLoader
    },
    // fireup the dataloader funcntion
    recipe : {
        available : recipesAvailable,
        categories : recipeCategories
    },

}

module.exports = RecipesResolvers