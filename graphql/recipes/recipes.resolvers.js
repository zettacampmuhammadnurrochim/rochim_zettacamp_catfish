
const recipesModel = require('./recipes.model')
const mongoose = require('../../services/services')
const {getAvailable} = require('./recipes.utility')
const { result } = require('lodash')
/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////
const getIngredientsLoader = async function (parent, arggs, ctx) {
    if (parent.ingredient_id) {
        const result = await ctx.ingredientsLoader.load(parent.ingredient_id)
        return result;
    }
}
const recipesAvailable = async function (parent, arggs, ctx) {
    if (parent.ingredients.length) {
        // const result = await ctx.recipesAvailable.load(parent.ingredients)
        const result = getAvailable(parent.ingredients)
        return result;
    }
}
/////////////////////////////////////////////////////query function////////////////////////////////////////////////////
// done
const getAllRecipes = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []
        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : []} }) - 1
            if (arggs.match.name) {
                const search = new RegExp(arggs.match.name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'recipe_name' : search
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
    } catch (error) {
        return new ctx.error(error)
    }
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
        const {recipe_name, ingredients, price} = arggs.data
        let inputRecipe = new recipesModel({
            recipe_name : recipe_name, 
            ingredients : ingredients,
            price : price,
            status : "active"
        })
        
        let validator = await inputRecipe.validate()
        let result = {}
        !validator ? result = await inputRecipe.save() : result = {}
        return result
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
// done
const deleteRecipe = async function (parent, {id}, ctx) {
    try {
        let result = await recipesModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
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
        updateRecipe,
        deleteRecipe
    },

    recipe_ingridient : {
        ingredient_id : getIngredientsLoader
    },
    // fireup the dataloader funcntion
    recipe : {
        available : recipesAvailable
    }
}
module.exports = RecipesResolvers