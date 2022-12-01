const ingredientsModel = require('./ingredients.model')
const mongoose = require('../../services/services')
const {checkIngredient} = require('./ingredients.utility')
const { toInteger } = require('lodash')
/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////

const GetAllIngredients = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []
        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : []} }) - 1

            if (arggs.match.name) {
                const search = new RegExp(arggs.match.name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'name' : search
                })
            }

            if (arggs.match.status) {
                const search = new RegExp(arggs.match.status, 'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'status': search
                })
            } else {
                delete arggs.match.status
            }

            if (arggs.match.stock) {
                const search = arggs.match.stock
                aggregateQuery[indexMatch].$match.$and.push({
                    'stock' : search
                })
            }
        
            if (!aggregateQuery[indexMatch].$match.$and.length) {
                aggregateQuery.splice(indexMatch, 1)
            }
        }

        if (!aggregateQuery.length) {
            arggs.match = false
        }
        // paginator adalah hal wajib yang selalu diletakkan di akhir aggregatequeryPush
        let paginator = {}
        if (arggs.paginator) {
            let total_items = 0
            if (arggs.match && aggregateQuery.length) { 
                total_items = await ingredientsModel.aggregate(aggregateQuery) 
                total_items = total_items.length
            }else{
                total_items = await ingredientsModel.count() 
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
        arggs.match || arggs.paginator ? result = await ingredientsModel.aggregate(aggregateQuery) : result = await ingredientsModel.collection.find().toArray()
        return {data : result, paginator : paginator}
    } catch (error) {
        return new ctx.error(error)
    }
}

const GetOneIngredient = async function (parent, arggs, ctx) {
    try {
        const result = await ingredientsModel.collection.findOne({_id : mongoose.Types.ObjectId(arggs.id), status : 'active'})
        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

///////////////////////////////////// mutation resolver ////////////////////////////////

const createIngredient = async function (parent, arggs, ctx) {
    try {
        let inputIngredients = new ingredientsModel({
            name: arggs.data.name.toLowerCase(),
            stock : arggs.data.stock,
            status : "active"
        })
        let validator = await inputIngredients.validate()
        let result = {}
        !validator ? result = await inputIngredients.save() : result = {}

        return result
    } catch (error) {
        return new ctx.error(error)
    }
}

const updateIngredient = async function (parent, arggs, ctx) {
    try {
        const {id,name,stock} = arggs.data
        let result = await ingredientsModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
            name : name,
            stock : stock,
        })
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const deleteIngredient = async function (parent, {id}, ctx) {
    try {
        let result = {}
        let checkRelations = await checkIngredient(id)
        let recipeName = []
        if (!checkRelations.length) {
            result = await ingredientsModel.updateOne({_id : mongoose.Types.ObjectId(id), status : 'active'},{
                status : "deleted"
            })
        }else{
            for(const val of checkRelations){
                recipeName.push(val.recipe_name)
            }
            return new ctx.error('cant delete the ingredients has relation to recipe',{ recipe : recipeName})
        }
        
        return {result : result}
    } catch (error) {
        return new ctx.error(error)
    }
}

const ingredientssResolvers = {
    Query: {
        GetAllIngredients,
        GetOneIngredient
    },
    
    Mutation: {
        createIngredient,
        updateIngredient,
        deleteIngredient
    }
}

module.exports = ingredientssResolvers