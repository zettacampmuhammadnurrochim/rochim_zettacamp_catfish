const recipesModel = require('./recipes.model')
const transactionsModel = require('./../transactions/transaction.model')
const mongoose = require('../../services/services')
const { getAvailable, cekDuplicateIngredients } = require('./recipes.utility')
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

const getAllRecipes = async function (parent, arggs, ctx) {
        let aggregateQuery = []
        let querySort = {$sort : {}}
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
            }else {
                delete arggs.match.status
            }

            if (arggs.match.highlight) {
                const search = arggs.match.highlight
                aggregateQuery[indexMatch].$match.$and.push({
                    'highlight': search
                })
            }
            
            if (arggs.match.specialOver) {
                const search = arggs.match.specialOver
                aggregateQuery[indexMatch].$match.$and.push({
                    'specialOver': search
                })

                querySort.$sort.disc = -1
            }

            if (arggs.match.categories) {
                const search = arggs.match.categories
                aggregateQuery[indexMatch].$match.$and.push({
                    'categories': search
                })
            }

            if (!aggregateQuery[indexMatch].$match.$and.length) {
                aggregateQuery.splice(indexMatch, 1)
            }
        }

        if (!aggregateQuery.length) {
            arggs.match = false
        }
        // tambahan

        // end of tambhan
        querySort.$sort.createdAt = -1
        aggregateQuery.push(querySort)
        if (arggs.paginator) {
            let total_items = 0
            if (arggs.match && aggregateQuery.length) {  
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
    arggs.match || arggs.paginator ? result = await recipesModel.aggregate(aggregateQuery) : result = await recipesModel.find().sort({ createdAt: -1 })

        return {data : result, paginator : paginator}
  
}

const getOneRecipe = async function (parent, arggs, ctx) {
    try {
        const result = await recipesModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id)})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const createRecipe = async function (parent, arggs, ctx) {
    try {
        const {recipe_name, ingredients, price, description, image, categories} = arggs.data
        let ingredient_id = []
        for(const ingredient of ingredients){
            ingredient_id.push(ingredient.ingredient_id)
        }

        uniqueIngredients = new Set(ingredient_id)
        if (ingredient_id.length !== uniqueIngredients.size) {
            let duplicates = ingredient_id.filter((e, i, a) => a.indexOf(e) !== i)
            return new ctx.error('contain duplicate ingredients', duplicates)
        }

        let inputRecipe = new recipesModel({
            recipe_name: recipe_name.toLowerCase(), 
            ingredients : ingredients,
            price : price,
            categories: categories,
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
        // check if recipe is highlighted menu ?
        let check = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(id) }).select({highlight : 1})
        if (!check.highlight) {
            let result = await recipesModel.updateOne({_id : mongoose.Types.ObjectId(id)},{
                status : status
            })
            return result   
        }else{
            return new ctx.error("cant make unpublish cause is highlighted menu")
        }
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateSpecialOver = async function (parent, {id,specialOver,disc}, ctx) {
    try {
        // just allow 3 special over
        let checklength = await recipesModel.find({ specialOver: true }).sort({ "updatedAt": 1})
        let ids = []
        for(const menu of checklength){
            ids.push(menu._id.toString())
            if (menu._id.toString() == id && disc == 0) {
                await recipesModel.updateOne({ _id: mongoose.Types.ObjectId(id) }, {
                    specialOver: false,
                    disc: 0
                })
                return new ctx.error('removed')
            }
        }

        let includes = ids.includes(id)

        let ingredients = await recipesModel.findOne({ _id: mongoose.Types.ObjectId(id) }).select(["ingredients"])
        let available = await getAvailable(ingredients.ingredients);
        if (!available) {return new ctx.error("menu ingredients insufficient")}

        if (checklength.length > 2 && !includes) {
            for (let index = 0; index < checklength.length - 2; index++) {
                updateTofalse = await recipesModel.updateOne({ _id: checklength[index]._id }, {
                    specialOver: false,
                    disc: 0
                })
            }
        }
        
        !specialOver ? disc = 0 : ''
        disc == 0 ? specialOver = false : specialOver = true 
        let result = await recipesModel.findOneAndUpdate({_id : mongoose.Types.ObjectId(id)},{
            specialOver : specialOver,
            disc : disc 
        },{
            new : true
        })
        let isSent = ""

        if (specialOver) {
            isSent = await sendMessages(result)
        }

        return { ...result._doc, sentReport : isSent }        
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateHighlightRecipe = async function (parent, {id,highlight}, ctx) {
    try {
        let checklength = await recipesModel.find({ highlight: true }).sort({ "updatedAt": 1 })
        
        if (checklength.length) {
            for (let index = 0; index < checklength.length; index++) {
                if (id != checklength[index]._id.toString()) {   
                    updateTofalse = await recipesModel.updateOne({ _id: checklength[index]._id }, {
                        highlight: false
                    })
                }
            }
        }

        if (checklength.length >= 1 && highlight == false) {
            return new ctx.error('cant remove highlight')
        }else{
            let result = await recipesModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(id) }, {
                highlight: true
            }, {
                new: true
            })

            return result
        }
        
    } catch (error) {
        return new ctx.error(error)
    }
}

// can handle 3 type of update, but not relevan, not used in application
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

const updateRecipeMain = async function(parent, {id,data}, ctx){
    try {
        let {recipe_name, ingredients, price, description, image, status} = data
        await cekDuplicateIngredients(ingredients)
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
        updateSpecialOver,
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