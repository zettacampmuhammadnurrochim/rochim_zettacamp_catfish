const ingredientsModel = require('./ingredients.model')
const mongoose = require('../../services/services')
const {checkIngredient} = require('./ingredients.utility')
/////////////////////////////////////////////////////loader function////////////////////////////////////////////////////

/////////////////////////////////////////////////////query function////////////////////////////////////////////////////

const GetAllIngredients = async function (parent, arggs, ctx) {
    try {
        let aggregateQuery = []

        if (arggs.match) {
            let indexMatch = aggregateQuery.push({$match : {$and : [{status : {$ne : 'deleted'}}]} }) - 1
            if (arggs.match.name) {
                const search = new RegExp(arggs.match.name,'i');
                aggregateQuery[indexMatch].$match.$and.push({
                    'name' : search
                })
            }

            if (arggs.match.stock) {
                const search = arggs.match.stock
                aggregateQuery[indexMatch].$match.$and.push({
                    'stock' : search
                })
            }
        }
        
        if (arggs.paginator) {
            const {limit, page} = arggs.paginator
            aggregateQuery.push({
                $skip : limit * page
            },
            {
                $limit : limit
            })
        }
        let result = []
        arggs.match || arggs.paginator ? result = await ingredientsModel.aggregate(aggregateQuery) : result = await ingredientsModel.collection.find().toArray()
        return result
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
            name : arggs.data.name,
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